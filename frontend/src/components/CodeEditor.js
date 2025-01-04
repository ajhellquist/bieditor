import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

export default function CodeEditor({ code, setCode, variables, selectedPID }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);

  // NEW: track multiple selected suggestions by their _id
  const [multiSelected, setMultiSelected] = useState([]);

  const editorRef = useRef(null);
  const cursorRangeRef = useRef(null); // For restoring cursor on click

  // Helper function to get color based on variable type
  const getVariableColor = (type) => {
    switch (type) {
      case 'Metric':
        return '#4CAF50'; // green
      case 'Attribute':
        return '#9C27B0'; // purple
      case 'Attribute Value':
        return '#FF9800'; // orange
      default:
        return 'black';
    }
  };

  // Debug logging for selectedPID
  useEffect(() => {
    console.log('Selected PID:', selectedPID);
  }, [selectedPID]);

  // Add debugging for selectedPID
  useEffect(() => {
    console.log('CodeEditor received selectedPID:', selectedPID);
  }, [selectedPID]);

  const getVariableReference = (variable) => {
    if (!selectedPID) {
      console.warn('No PID selected');
      return '';
    }
    
    // Debug the incoming data
    console.log('Creating reference with:', {
      variable,
      selectedPID,
      pidId: selectedPID.pidId || selectedPID.pid,
      variableValue: variable.value
    });
    
    // Get the PID identifier
    const pidIdentifier = selectedPID.pidId || selectedPID.pid;
    if (!pidIdentifier) {
      console.error('No valid PID identifier found');
      return '';
    }

    // Build the reference string
    let reference;
    if (variable.type === 'Attribute Value') {
      reference = `[/gdc/md/${pidIdentifier}/obj/${variable.value}/elements?id=${variable.elementId}]`;
    } else {
      reference = `[/gdc/md/${pidIdentifier}/obj/${variable.value}]`;
    }

    console.log('Generated reference:', reference);
    return reference;
  };

  // PARTIAL MATCH + ALPHABETICAL SORT
  useEffect(() => {
    // If currentWord is empty, we may choose to hide suggestions or show all. 
    // But from your existing logic, we show "No matches" when currentWord is empty, 
    // so let's do it that way:
    if (!currentWord) {
      setFilteredSuggestions([]);
      return;
    }

    const filtered = variables
      .filter((v) => 
        v.name.toLowerCase().includes(currentWord.toLowerCase())
      )
      .sort((a, b) => a.name.localeCompare(b.name));

    setFilteredSuggestions(filtered);
    setSelectedIndex(0);
  }, [currentWord, variables]);

  // Force typed text color to black, track typed word
  const handleInputChange = (e) => {
    editorRef.current.style.color = 'black';
    setCode(editorRef.current.innerHTML);

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    // Save the current range so we can restore it on suggestion click
    cursorRangeRef.current = range.cloneRange();

    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent;
      const cursorPos = range.startOffset;
      
      // Find the word being typed
      const beforeCursor = text.substring(0, cursorPos);
      const wordMatch = beforeCursor.match(/\S+$/);
      const currentTypedWord = wordMatch ? wordMatch[0] : '';

      console.log('Typing word:', currentTypedWord);
      setCurrentWord(currentTypedWord);
      setShowSuggestions(currentTypedWord.length > 0);
      setCursorPosition(cursorPos);
    } else {
      // If not a text node, we might want to set currentWord = ''
      // so suggestions don't show up in weird spots
      setCurrentWord('');
      setShowSuggestions(false);
    }
  };

  // Insert a single variable at the current cursor position
  const insertSuggestion = (variable, addLeadingComma = false) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

    if (textNode.nodeType === Node.TEXT_NODE) {
      const text = textNode.textContent;
      const cursorPos = range.startOffset;
      const beforeCursor = text.substring(0, cursorPos);
      const afterCursor = text.substring(cursorPos);
      const wordMatch = beforeCursor.match(/\S+$/);

      // If we requested a leading comma (for multi-insert)
      let insertionPrefix = '';
      if (addLeadingComma) {
        // We'll do ", " before the variable
        insertionPrefix = ', ';
      }

      if (wordMatch) {
        // Calculate where this word starts
        const wordStart = cursorPos - wordMatch[0].length;
        const beforeWord = text.substring(0, wordStart);

        // Create text nodes for before and after
        const beforeTextNode = document.createTextNode(beforeWord + insertionPrefix);
        const afterTextNode = document.createTextNode(' ' + afterCursor);

        // Create the variable span
        const variableSpan = document.createElement('span');
        variableSpan.className = 'variable-reference';
        variableSpan.style.color = getVariableColor(variable.type);
        variableSpan.contentEditable = 'false';
        variableSpan.setAttribute('data-reference', getVariableReference(variable));
        variableSpan.textContent = variable.name;

        // Replace the content
        const parentNode = textNode.parentNode;
        parentNode.replaceChild(afterTextNode, textNode);
        parentNode.insertBefore(variableSpan, afterTextNode);
        parentNode.insertBefore(beforeTextNode, variableSpan);

        // Move cursor to the end of the newly inserted text
        const newRange = document.createRange();
        newRange.setStartAfter(afterTextNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        setCode(editorRef.current.innerHTML);
      }
    }
  };

  // SINGLE CLICK: if Alt is not pressed, insert immediately
  // if Alt is pressed, toggle the selection in `multiSelected`
  const handleSuggestionClick = (e, variable) => {
    e.preventDefault();
    // If Alt is pressed, toggle multi-select
    if (e.altKey) {
      toggleMultiSelect(variable);
      return;
    }

    // If no Alt, normal single insert
    // focus + restore cursor
    editorRef.current.focus();
    const savedRange = cursorRangeRef.current;
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
    insertSuggestion(variable);
    // Clear multiSelect in case it had something
    setMultiSelected([]);
    // Hide suggestions
    setShowSuggestions(false);
    setCurrentWord('');
  };

  // ALT + CLICK toggles the multiSelected array
  const toggleMultiSelect = (variable) => {
    if (multiSelected.find((v) => v._id === variable._id)) {
      // If already selected, unselect
      const newSelected = multiSelected.filter((v) => v._id !== variable._id);
      setMultiSelected(newSelected);
    } else {
      // If not selected, add
      setMultiSelected((prev) => [...prev, variable]);
    }
  };

  // Insert multiple suggestions in one shot, comma separated
  const insertMultipleSuggestions = () => {
    // Sort them by name just in case we want them in alphabetical order 
    // (or we can preserve the order in which the user clicked them)
    const sortedMulti = [...multiSelected].sort((a, b) => a.name.localeCompare(b.name));

    // We call insertSuggestion repeatedly
    // but each time we do it, we restore the cursor at the end
    // and provide addLeadingComma = true after the first one
    sortedMulti.forEach((variable, idx) => {
      // restore cursor
      restoreCursorRange();
      insertSuggestion(variable, idx > 0); // addLeadingComma = true if not the first
    });

    // Clear them out
    setMultiSelected([]);
    // hide suggestions
    setShowSuggestions(false);
    setCurrentWord('');
  };

  // Helper to restore cursor
  const restoreCursorRange = () => {
    editorRef.current.focus();
    const savedRange = cursorRangeRef.current;
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  };

  // The big copy function
  const handleCopyCode = async () => {
    if (!editorRef.current) return;
    
    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = editorRef.current.innerHTML;

      const walker = document.createTreeWalker(
        tempDiv,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (
              node.nodeType === Node.TEXT_NODE &&
              (!node.parentElement || !node.parentElement.classList.contains('variable-reference'))
            ) {
              return NodeFilter.FILTER_ACCEPT;
            }
            if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('variable-reference')) {
              return NodeFilter.FILTER_ACCEPT;
            }
            return NodeFilter.FILTER_SKIP;
          }
        }
      );

      let finalText = '';
      let node;

      while ((node = walker.nextNode())) {
        if (
          node.nodeType === Node.TEXT_NODE &&
          (!node.parentElement || !node.parentElement.classList.contains('variable-reference'))
        ) {
          const text = node.textContent.trim();
          if (text) {
            finalText += text + ' ';
          }
        } else if (node.classList.contains('variable-reference')) {
          const reference = node.getAttribute('data-reference');
          if (reference) {
            finalText += reference + ' ';
          }
        }
      }

      // Clean up
      finalText = finalText.replace(/\s+/g, ' ').trim();
      
      console.log('Final text to copy:', finalText);

      await navigator.clipboard.writeText(finalText);
      await handleCopy();
      
      setCopySuccess(true);
      
      setTimeout(() => {
        setCopySuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error in handleCopyCode:', error);
    }
  };

  const handleCopy = async () => {
    try {
      console.log('Making metrics request...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await axios.post('http://localhost:4000/metrics', {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Metric recorded successfully:', response.data);
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  };

  // Keydown to handle arrow navigation, tab/enter insertion, backspace logic
  const handleKeyDown = (e) => {
    // If we have suggestions open, handle arrow up/down, tab/enter
    if (showSuggestions && filteredSuggestions.length) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < filteredSuggestions.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case 'Tab':
        case 'Enter':
          e.preventDefault();
          // If we have multiSelected items, insert them all
          if (multiSelected.length > 0) {
            restoreCursorRange();
            insertMultipleSuggestions();
          } else {
            // Single suggestion insertion
            if (filteredSuggestions[selectedIndex]) {
              restoreCursorRange();
              insertSuggestion(filteredSuggestions[selectedIndex]);
              setShowSuggestions(false);
              setCurrentWord('');
            }
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
        default:
          break;
      }
      return;
    }

    // Handle backspace on variable references
    if (e.key === 'Backspace') {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;

      const range = selection.getRangeAt(0);
      const node = range.startContainer;
      
      // Check if we're at the start of a text node that comes right after a variable span
      if (node.nodeType === Node.TEXT_NODE && range.startOffset === 0) {
        const previousSibling = node.previousSibling;
        if (previousSibling && previousSibling.classList?.contains('variable-reference')) {
          e.preventDefault();
          previousSibling.remove();
          setCode(editorRef.current.innerHTML);
          return;
        }
      }
      
      // Check if we're inside or right after a variable span
      let parentSpan = node.parentElement;
      if (parentSpan && parentSpan.classList?.contains('variable-reference')) {
        e.preventDefault();
        parentSpan.remove();
        setCode(editorRef.current.innerHTML);
        return;
      }
    }
  };

  const handleClearCode = () => {
    setCode('');
    editorRef.current.innerHTML = '';
    setMultiSelected([]);
    setShowSuggestions(false);
    setCurrentWord('');
  };

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      gap: '20px',
      margin: '25px'
    }}>
      {/* Suggestions Panel */}
      <div style={{
        width: '15%',
        border: '1px solid black',
        borderRadius: '4px',
        backgroundColor: 'white',
        height: '400px',
        overflowY: 'auto'
      }}>
        {showSuggestions && filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((variable, index) => {
            // check if this variable is multi-selected
            const isMultiSelected = multiSelected.some((v) => v._id === variable._id);

            return (
              <div
                key={variable._id}
                onMouseDown={(e) => handleSuggestionClick(e, variable)} 
                style={{
                  padding: '8px 10px',
                  cursor: 'pointer',
                  backgroundColor: 
                    // If it's the "arrow-selected" item, highlight in #f0f0f0
                    // If it's also multi-selected, maybe highlight in a different color
                    index === selectedIndex
                      ? '#f0f0f0'
                      : (isMultiSelected ? '#b3e5fc' : 'white'), 
                  color: getVariableColor(variable.type),
                  borderBottom: '1px solid #eee'
                }}
              >
                {variable.name}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '8px 10px', color: '#666' }}>
            {currentWord ? 'No matches found' : 'Start typing to see suggestions'}
          </div>
        )}
      </div>

      {/* Main Editor Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div 
          ref={editorRef}
          contentEditable={true}
          onInput={handleInputChange}
          onKeyDown={handleKeyDown}
          style={{
            border: '1px solid black',
            borderRadius: '4px',
            height: '400px',
            overflowY: 'auto',
            padding: '10px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'Times New Roman',
            backgroundColor: 'white',
            marginBottom: '10px',
            color: 'black',
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start',
          gap: '10px'
        }}>
          <button 
            onClick={handleCopyCode}
            style={{
              padding: '6px 12px',
              backgroundColor: copySuccess ? '#28A745' : '#cccccc',
              color: 'black',
              border: '3px solid black',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {copySuccess ? 'Copied!' : 'Copy Code'}
          </button>
          <button 
            onClick={handleClearCode}
            style={{
              padding: '6px 12px',
              backgroundColor: '#FD495F',
              color: 'black',
              border: '3px solid black',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Clear Code
          </button>
        </div>
      </div>
    </div>
  );
}
