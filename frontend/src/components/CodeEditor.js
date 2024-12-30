import React, { useState, useEffect, useRef } from 'react';

export default function CodeEditor({ code, setCode, variables, selectedPID }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [copySuccess, setCopySuccess] = useState(false);
  const editorRef = useRef(null);

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

  useEffect(() => {
    const filtered = variables.filter(v => 
      v.name.toLowerCase().includes(currentWord.toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setSelectedIndex(0);
  }, [currentWord, variables]);

  const handleInputChange = (e) => {
    // Store the HTML content
    setCode(editorRef.current.innerHTML);

    // Get the current text and cursor position
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    const textNode = range.startContainer;

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
    }
  };

  const insertSuggestion = (variable) => {
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
        const wordStart = cursorPos - wordMatch[0].length;
        const beforeWord = text.substring(0, wordStart);

        // Create text nodes for before and after
        const beforeTextNode = document.createTextNode(beforeWord);
        const afterTextNode = document.createTextNode(' ' + afterCursor);

        // Create the variable span
        const variableSpan = document.createElement('span');
        variableSpan.className = 'variable-reference';
        variableSpan.style.color = getVariableColor(variable.type);
        variableSpan.setAttribute('data-reference', getVariableReference(variable));
        variableSpan.textContent = variable.name;

        // Replace the content
        const parentNode = textNode.parentNode;
        parentNode.replaceChild(afterTextNode, textNode);
        parentNode.insertBefore(variableSpan, afterTextNode);
        parentNode.insertBefore(beforeTextNode, variableSpan);

        // Set cursor position after the span
        const newRange = document.createRange();
        newRange.setStartAfter(afterTextNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);

        setCode(editorRef.current.innerHTML);
      }
    }
    setShowSuggestions(false);
  };

  const handleCopyCode = () => {
    if (!editorRef.current) return;
    console.log('Starting copy operation...');

    // Create a temporary div
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = editorRef.current.innerHTML;

    // Get all nodes in order (text nodes and variable spans)
    const walker = document.createTreeWalker(
      tempDiv,
      NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
      {
        acceptNode: (node) => {
          if (node.nodeType === Node.TEXT_NODE && 
              (!node.parentElement || !node.parentElement.classList.contains('variable-reference'))) {
            // Only accept text nodes that aren't inside variable spans
            return NodeFilter.FILTER_ACCEPT;
          }
          if (node.nodeType === Node.ELEMENT_NODE && 
              node.classList.contains('variable-reference')) {
            return NodeFilter.FILTER_ACCEPT;
          }
          return NodeFilter.FILTER_SKIP;
        }
      }
    );

    let finalText = '';
    let node;

    while (node = walker.nextNode()) {
      if (node.nodeType === Node.TEXT_NODE && 
          (!node.parentElement || !node.parentElement.classList.contains('variable-reference'))) {
        // Only process text nodes that aren't inside variable spans
        const text = node.textContent.trim();
        if (text) {
          finalText += text + ' ';
        }
      } else if (node.classList.contains('variable-reference')) {
        // For variable spans, only add their reference
        const reference = node.getAttribute('data-reference');
        if (reference) {
          finalText += reference + ' ';
        }
      }
    }

    // Clean up any extra spaces and trim
    finalText = finalText.replace(/\s+/g, ' ').trim();
    
    console.log('Final text to copy:', finalText);

    navigator.clipboard.writeText(finalText).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || !filteredSuggestions.length) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
        break;
      case 'Tab':
      case 'Enter':
        e.preventDefault();
        if (filteredSuggestions[selectedIndex]) {
          insertSuggestion(filteredSuggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div style={{ 
      position: 'relative',
      display: 'flex',
      gap: '20px',
      margin: '25px'
    }}>
      {/* Suggestions Panel - Always visible */}
      <div style={{
        width: '15%',
        border: '1px solid #ccc',
        borderRadius: '4px',
        backgroundColor: 'white',
        height: '400px',
        overflowY: 'auto'
      }}>
        {showSuggestions && filteredSuggestions.length > 0 ? (
          filteredSuggestions.map((variable, index) => (
            <div
              key={variable._id}
              onClick={() => insertSuggestion(variable)}
              style={{
                padding: '8px 10px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#f0f0f0' : 'white',
                color: getVariableColor(variable.type),
                borderBottom: '1px solid #eee'
              }}
            >
              {variable.name}
            </div>
          ))
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
            border: '1px solid #ccc',
            borderRadius: '4px',
            height: '400px',
            overflowY: 'auto',
            padding: '10px',
            whiteSpace: 'pre-wrap',
            fontFamily: 'monospace',
            backgroundColor: 'white',
            marginBottom: '10px'
          }}
        />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-start'
        }}>
          <button 
            onClick={handleCopyCode}
            style={{
              padding: '6px 12px',
              backgroundColor: copySuccess ? '#4CAF50' : '#4444ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {copySuccess ? 'Copied!' : 'Copy Code'}
          </button>
        </div>
      </div>
    </div>
  );
}
