import React, { useState, useEffect } from 'react';

function NoteDialog({ open, onClose, onSubmit, note, existingNotes, draftNote }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(null);

  useEffect(() => {
    if (draftNote) {
      setTitle(draftNote.title);
      setContent(draftNote.content);
    }
  }, [draftNote]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ title, content });
    setTitle('');
    setContent('');
    onClose();
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setContent(newContent);

    // Check for [[ pattern
    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newContent.slice(0, cursorPos);
    const match = textBeforeCursor.match(/\[\[([^\]]*)$/);

    if (match) {
      const searchTerm = match[1].toLowerCase();
      const filtered = existingNotes
        .filter(note => note.title.toLowerCase().includes(searchTerm))
        .map(note => note.title);
      setSuggestions(filtered);
      setCursorPosition(cursorPos);
      updateSuggestionPosition(e.target);
    } else {
      setSuggestions([]);
      setCursorPosition(null);
    }
  };

  const updateSuggestionPosition = () => {
    // No need to calculate position as it's now handled by CSS
    return;
  };

  const handleSuggestionClick = (title) => {
    const beforeLink = content.slice(0, cursorPosition - 2); // Remove [[
    const afterLink = content.slice(cursorPosition);
    setContent(`${beforeLink}[[${title}]]${afterLink}`);
    setSuggestions([]);
  };

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <h2>Create New Note</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note Title"
            required
          />
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Note Content"
            required
          />
          {suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map(title => (
                <div 
                  key={title} 
                  onClick={() => handleSuggestionClick(title)}
                  className="suggestion-item"
                >
                  {title}
                </div>
              ))}
            </div>
          )}
          <div className="dialog-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoteDialog;
