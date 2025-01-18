import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

// Advanced code editor component that provides variable suggestion and insertion functionality
// Supports both single and multi-variable selection with specialized formatting
export default function CodeEditor({ code, setCode, variables, selectedPID }) {
  // State management for suggestion system
  const [showSuggestions, setShowSuggestions] = useState(false);  // Controls suggestion panel visibility
  const [cursorPosition, setCursorPosition] = useState(0);        // Tracks cursor position for suggestion insertion
  const [currentWord, setCurrentWord] = useState('');             // Current word being typed
  const [selectedIndex, setSelectedIndex] = useState(0);          // Currently selected suggestion index
  const [filteredSuggestions, setFilteredSuggestions] = useState([]); // Filtered list of matching suggestions
  const [copySuccess, setCopySuccess] = useState(false);          // Controls copy feedback UI

  // Tracks multiple selected variables for batch insertion
  const [multiSelected, setMultiSelected] = useState([]);

  // References for DOM manipulation
  const editorRef = useRef(null);           // Reference to main editor element
  const cursorRangeRef = useRef(null);      // Stores cursor position for accurate suggestion insertion

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

  // Generates the proper reference format for variables based on their type and PID
  const getVariableReference = (variable) => {
    if (!selectedPID) {
      console.warn('No PID selected');
      return '';
    }
    
    const pidIdentifier = selectedPID.pidId || selectedPID.pid;
    if (!pidIdentifier) {
      console.error('No valid PID identifier found');
      return '';
    }

    if (variable.type === 'Attribute Value') {
      return `[/gdc/md/${pidIdentifier}/obj/${variable.value}/elements?id=${variable.elementId}]`;
    } 
    return `[/gdc/md/${pidIdentifier}/obj/${variable.value}]`;
  };

  // Filters and sorts suggestions based on partial matches with current input
  useEffect(() => {
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

  // Handles real-time input changes and cursor position tracking
  const handleInputChange = () => {
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

      setCurrentWord(currentTypedWord);
      setShowSuggestions(currentTypedWord.length > 0);
      setCursorPosition(cursorPos);
    } else {
      setCurrentWord('');
      setShowSuggestions(false);
    }
  };

  // Inserts a single variable at the current cursor position with proper formatting
  const insertSingleSuggestion = (variable) => {
    // We restore the cursor first if needed
    restoreCursorRange();

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

      if (wordMatch) {
        // Calculate where this word starts
        const wordStart = cursorPos - wordMatch[0].length;
        const beforeWord = text.substring(0, wordStart);

        // Create text nodes for before and after
        const beforeTextNode = document.createTextNode(beforeWord);
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

        // Move cursor to the end
        const newRange = document.createRange();
        newRange.setStartAfter(afterTextNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        setCode(editorRef.current.innerHTML);
      }
    }
  };

  // Batch inserts multiple selected variables as a comma-separated list
  const insertMultipleSuggestions = () => {
    restoreCursorRange();

    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;
    if (textNode.nodeType !== Node.TEXT_NODE) {
      setMultiSelected([]);
      setShowSuggestions(false);
      setCurrentWord('');
      return;
    }

    const text = textNode.textContent;
    const cursorPos = range.startOffset;
    const beforeCursor = text.substring(0, cursorPos);
    const afterCursor = text.substring(cursorPos);
    const wordMatch = beforeCursor.match(/\S+$/);
    if (!wordMatch) {
      setMultiSelected([]);
      setShowSuggestions(false);
      setCurrentWord('');
      return;
    }

    const wordStart = cursorPos - wordMatch[0].length;
    const beforeWord = text.substring(0, wordStart);

    // Create a fragment to hold everything
    const fragment = document.createDocumentFragment();

    // First, add the text node for beforeWord
    fragment.appendChild(document.createTextNode(beforeWord));

    // Sort them (just to keep a consistent order)
    const sortedVars = [...multiSelected].sort((a, b) => a.name.localeCompare(b.name));

    sortedVars.forEach((variable, idx) => {
      // Insert comma before all except the first
      if (idx > 0) {
        fragment.appendChild(document.createTextNode(', '));
      }
      // Now, create the variable span
      const variableSpan = document.createElement('span');
      variableSpan.className = 'variable-reference';
      variableSpan.style.color = getVariableColor(variable.type);
      variableSpan.contentEditable = 'false';
      variableSpan.setAttribute('data-reference', getVariableReference(variable));
      variableSpan.textContent = variable.name;
      fragment.appendChild(variableSpan);
    });

    // Finally, add a space plus the text afterCursor
    fragment.appendChild(document.createTextNode(' ' + afterCursor));

    // Replace the original textNode with our fragment
    const parentNode = textNode.parentNode;
    parentNode.replaceChild(fragment, textNode);

    // Move cursor to the end of what we inserted
    const newRange = document.createRange();
    newRange.setStartAfter(parentNode.lastChild);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);

    setCode(editorRef.current.innerHTML);

    // Clean up
    setMultiSelected([]);
    setShowSuggestions(false);
    setCurrentWord('');
  };

  // Restores cursor position after DOM modifications
  const restoreCursorRange = () => {
    editorRef.current.focus();
    const savedRange = cursorRangeRef.current;
    if (savedRange) {
      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(savedRange);
    }
  };

  // Handles suggestion clicks with Alt-key support for multi-select
  const handleSuggestionClick = (e, variable) => {
    e.preventDefault();
    if (e.altKey) {
      toggleMultiSelect(variable);
      return;
    }

    insertSingleSuggestion(variable);
    setMultiSelected([]);
    setShowSuggestions(false);
    setCurrentWord('');
  };

  // Toggles variables in multi-select collection
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

  // Processes editor content for copying, converting variables to their reference format
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

  // Records metrics when code is copied
  const handleCopy = async () => {
    try {
      console.log('Making metrics request...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await axios.post(`${process.env.REACT_APP_API_URL}/metrics`, {}, {
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

  // Manages keyboard navigation and special key handling
  // Supports: Arrow keys for navigation, Tab for insertion, Backspace for deletion
  const handleKeyDown = (e) => {
    // If we have suggestions open, handle arrow up/down, tab. 
    // We'll IGNORE Enter for insertion now.
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
          e.preventDefault();
          // If we have multiSelected items, insert them all at once
          if (multiSelected.length > 0) {
            insertMultipleSuggestions();
          } else {
            // Single suggestion insertion
            if (filteredSuggestions[selectedIndex]) {
              insertSingleSuggestion(filteredSuggestions[selectedIndex]);
              setShowSuggestions(false);
              setCurrentWord('');
            }
          }
          break;
        case 'Enter':
          // Just ignore, let it pass so we can do a line break
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

  // Resets editor state and clears content
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
        width: '20%',
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
                    // If it's also multi-selected, highlight in #b3e5fc
                    index === selectedIndex
                      ? '#f0f0f0'
                      : (isMultiSelected ? '#b3e5fc' : 'white'),
                  color: getVariableColor(variable.type),
                  borderBottom: '1px solid #eee',
                  fontSize: '14px'
                }}
              >
                {variable.name}
              </div>
            );
          })
        ) : (
          <div style={{ padding: '8px 10px', color: '#666', fontSize: '14px' }}>
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
