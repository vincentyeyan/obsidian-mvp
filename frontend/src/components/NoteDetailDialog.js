import React, { useState, useEffect } from 'react';
import './NoteDetailDialog.css';
import { FaTimes } from 'react-icons/fa';

function NoteDetailDialog({ open, onClose, note, onCommentAdded, onNoteUpdate, existingNotes, onNoteClick, previousNote }) {
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState([]);
  const [editableContent, setEditableContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [cursorPosition, setCursorPosition] = useState(null);

  useEffect(() => {
    if (note) {
      setComments(note.initialComments || []);
    }
  }, [note]);

  useEffect(() => {
    if (note) {
      setEditableContent(note.content);
    }
  }, [note]);

  const handleAddComment = () => {
    if (!note || !comment.trim()) {
      return;
    }

    const newComment = {
      text: comment,
      createdBy: 'user@example.com',
      dateCreated: new Date().toISOString()
    };

    setComments([...comments, newComment]);
    setComment('');
    onCommentAdded(note.id, comment);
  };

  const handleContentSave = () => {
    onNoteUpdate(note.id, {
      ...note,
      content: editableContent
    });
    setIsEditing(false);
  };

  const renderContentWithLinks = (content) => {
    const parts = content.split(/(\[\[.*?\]\])/g);
    return parts.map((part, index) => {
      if (part.match(/^\[\[(.*?)\]\]$/)) {
        const noteTitle = part.slice(2, -2);
        const linkedNote = existingNotes.find(n => n.title === noteTitle);
        return linkedNote ? (
          <span 
            key={index}
            className="note-link"
            onClick={(e) => {
              e.stopPropagation();
              onNoteClick(linkedNote);
            }}
          >
            {noteTitle}
          </span>
        ) : <span key={index}>{part}</span>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleContentChange = (e) => {
    const newContent = e.target.value;
    setEditableContent(newContent);

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

  const updateSuggestionPosition = (textarea) => {
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);
    
    const mirror = document.createElement('div');
    mirror.style.cssText = window.getComputedStyle(textarea).cssText;
    mirror.style.height = 'auto';
    mirror.style.position = 'absolute';
    mirror.style.visibility = 'hidden';
    mirror.style.whiteSpace = 'pre-wrap';
    mirror.textContent = textBeforeCursor;
    
    document.body.appendChild(mirror);
    
    const span = document.createElement('span');
    span.textContent = '.';
    mirror.appendChild(span);
    
    const coords = span.getBoundingClientRect();
    document.body.removeChild(mirror);
    
    const suggestionBox = document.querySelector('.suggestions');
    if (suggestionBox) {
      suggestionBox.style.left = `${coords.left}px`;
      suggestionBox.style.top = `${coords.top + 20}px`; // 20px below cursor
    }
  };

  const handleSuggestionClick = (title) => {
    const beforeLink = editableContent.slice(0, cursorPosition - 2);
    const afterLink = editableContent.slice(cursorPosition);
    setEditableContent(`${beforeLink}[[${title}]]${afterLink}`);
    setSuggestions([]);
  };

  const renderBacklinks = () => {
    if (!note) return null;
    
    // Find all notes that link to this note
    const backlinks = existingNotes.filter(otherNote => {
      return otherNote.content.includes(`[[${note.title}]]`);
    });

    if (backlinks.length === 0) return null;

    return (
      <div className="backlinks-section">
        <div className="backlinks-title">Linked from:</div>
        <div className="backlinks-list">
          {backlinks.map(linkedNote => (
            <span 
              key={linkedNote.id}
              className="backlink"
              onClick={() => onNoteClick(linkedNote)}
            >
              {linkedNote.id === previousNote?.id ? '<<' : ''}
              {linkedNote.title}
            </span>
          ))}
        </div>
      </div>
    );
  };

  if (!open || !note) return null;

  return (
    <div className="dialog-overlay">
      <div className="dialog">
        <div className="dialog-header">
          <h2>{note.title}</h2>
          <div className="note-meta">
            <small>Created By: {note.createdBy || 'placeholder@example.com'}</small>
            <small>Date Created: {note.dateCreated}</small>
            <small>Links: {note.links || 0}</small>
          </div>
          <FaTimes className="close-icon" onClick={onClose} />
        </div>
        {renderBacklinks()}
        {isEditing ? (
          <div className="edit-content">
            <textarea
              value={editableContent}
              onChange={handleContentChange}
              className="content-textarea"
            />
            {suggestions.length > 0 && (
              <div className="suggestions">
                {suggestions.map(title => (
                  <div 
                    key={title} 
                    className="suggestion-item"
                    onClick={() => handleSuggestionClick(title)}
                  >
                    {title}
                  </div>
                ))}
              </div>
            )}
            <div className="edit-actions">
              <button onClick={handleContentSave}>Save</button>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
            </div>
          </div>
        ) : (
          <div className="content-display">
            <div className="note-content">
              {renderContentWithLinks(note.content)}
            </div>
            <button onClick={() => setIsEditing(true)}>Edit</button>
          </div>
        )}
        <div className="dialog-comments">
          <h4>Comments</h4>
          {comments.map((c, index) => (
            <div key={index} className="comment">
              <p>{c.text}</p>
              <small>By: {c.createdBy} on {new Date(c.dateCreated).toLocaleString()}</small>
            </div>
          ))}
          <input 
            type="text" 
            value={comment} 
            onChange={(e) => setComment(e.target.value)} 
            onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
            placeholder="Write a comment..."
          />
          <button className="add-comment-button" onClick={handleAddComment}>Add Comment</button>
        </div>
      </div>
    </div>
  );
}

export default NoteDetailDialog;
