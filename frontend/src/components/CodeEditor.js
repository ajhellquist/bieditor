import React, { useState, useEffect } from 'react';

export default function CodeEditor({ code, setCode, variables }) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);

  useEffect(() => {
    const filtered = variables.filter(v => 
      v.name.toLowerCase().includes(currentWord.toLowerCase())
    );
    setFilteredSuggestions(filtered);
    setSelectedIndex(0);
  }, [currentWord, variables]);

  const handleInputChange = (e) => {
    setCode(e.target.value);
    const position = e.target.selectionStart;
    setCursorPosition(position);

    const textBeforeCursor = e.target.value.substring(0, position);
    const wordMatch = textBeforeCursor.match(/\S+$/);
    const currentTypedWord = wordMatch ? wordMatch[0] : '';
    setCurrentWord(currentTypedWord);
    setShowSuggestions(currentTypedWord.length > 0);
  };

  const insertSuggestion = (variableName) => {
    const textBeforeCursor = code.substring(0, cursorPosition);
    const wordMatch = textBeforeCursor.match(/\S+$/);
    const startPos = wordMatch ? cursorPosition - wordMatch[0].length : cursorPosition;
    
    const newCode = code.substring(0, startPos) + 
                    variableName + 
                    code.substring(cursorPosition);
    setCode(newCode);
    setShowSuggestions(false);
  };

  const insertTab = (e) => {
    e.preventDefault();
    const curPos = e.target.selectionStart;
    const textBeforeCursor = code.substring(0, curPos);
    const textAfterCursor = code.substring(curPos);
    setCode(textBeforeCursor + '\t' + textAfterCursor);
    
    // Set cursor position after the tab
    setTimeout(() => {
      e.target.setSelectionRange(curPos + 1, curPos + 1);
    }, 0);
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && filteredSuggestions.length > 0) {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredSuggestions.length - 1
          );
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredSuggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'Enter':
          if (showSuggestions) {
            e.preventDefault();
            insertSuggestion(filteredSuggestions[selectedIndex].name);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          break;
        case 'Tab':
          if (showSuggestions) {
            e.preventDefault();
            insertSuggestion(filteredSuggestions[selectedIndex].name);
          } else {
            insertTab(e);
          }
          break;
        default:
          break;
      }
    } else if (e.key === 'Tab') {
      insertTab(e);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <textarea
        value={code}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          height: '80vh',
          padding: '10px',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          resize: 'none'
        }}
      />
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          backgroundColor: 'white',
          border: '1px solid #ccc',
          borderRadius: '4px',
          maxHeight: '200px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {filteredSuggestions.map((variable, index) => (
            <div
              key={variable._id}
              onClick={() => insertSuggestion(variable.name)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: index === selectedIndex ? '#e6f3ff' : 'white',
                '&:hover': {
                  backgroundColor: '#f0f0f0'
                }
              }}
            >
              {variable.name} ({variable.type}: {variable.value})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
