import React, { useState, useEffect } from 'react';
import './App.css';
import Sidebar from './components/Sidebar';
import NoteDialog from './components/NoteDialog';
import NoteDetailDialog from './components/NoteDetailDialog';
import Graph from './Graph';
import { FaCopy, FaCheck } from 'react-icons/fa';

function App() {
    const [activeTab, setActiveTab] = useState('notes');
    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState([]);
    const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
    const [notes, setNotes] = useState([]);
    const [selectedNote, setSelectedNote] = useState(null);
    const [links, setLinks] = useState([]);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [previousNote, setPreviousNote] = useState(null);
    const [draftNote, setDraftNote] = useState(null);
    const [activeMessageIndex, setActiveMessageIndex] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copiedMessageId, setCopiedMessageId] = useState(null);

    // Load notes and links from localStorage on initial render
    useEffect(() => {
        const savedNotes = localStorage.getItem('notes');
        const savedLinks = localStorage.getItem('links');
        const savedComments = localStorage.getItem('comments');
        
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
        
        if (savedLinks) {
            setLinks(JSON.parse(savedLinks));
        }

        if (savedComments) {
            const commentsMap = JSON.parse(savedComments);
            Object.keys(commentsMap).forEach(noteId => {
                const note = notes.find(n => n.id === noteId);
                if (note) {
                    note.initialComments = commentsMap[noteId];
                }
            });
        }
    }, []);

    // Save notes and links to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('notes', JSON.stringify(notes));
        localStorage.setItem('links', JSON.stringify(links));
        
        // Save comments separately
        const commentsMap = {};
        notes.forEach(note => {
            if (note.initialComments) {
                commentsMap[note.id] = note.initialComments;
            }
        });
        localStorage.setItem('comments', JSON.stringify(commentsMap));
    }, [notes, links]);

    const handleSendMessage = async () => {
        if (chatInput.trim()) {
            setChatMessages([...chatMessages, { text: chatInput, sender: 'user' }]);
            setIsLoading(true);
            
            try {
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: chatInput, notes })
                });

                const data = await response.json();
                
                // Add message with typing effect
                setChatMessages(prev => [...prev, { 
                    text: data.response, 
                    sender: 'ai',
                    isTyping: true 
                }]);
            } catch (error) {
                console.error('Error:', error);
            } finally {
                setIsLoading(false);
            }
            setChatInput('');
        }
    };

    const parseNoteContent = (content) => {
        const linkRegex = /\[\[(.*?)\]\]/g;
        const matches = [...content.matchAll(linkRegex)];
        return matches.map(match => match[1]); // Returns array of linked note titles
    };

    const handleNoteCreate = (noteData) => {
        const newNote = {
            ...noteData,
            id: Date.now().toString(),
            dateCreated: new Date().toLocaleString(),
            comments: 0,
            initialComments: [],
            links: 0
        };

        // Parse content for links
        const linkedTitles = parseNoteContent(noteData.content);
        
        // Create bidirectional links
        const newLinks = [];
        linkedTitles.forEach(title => {
            const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
            if (targetNote) {
                newLinks.push({
                    sourceId: newNote.id,
                    targetId: targetNote.id,
                    value: 1
                });
                newLinks.push({
                    sourceId: targetNote.id,
                    targetId: newNote.id,
                    value: 1
                });
            }
        });

        newNote.links = newLinks.length / 2;

        setNotes(prev => [...prev, newNote]);
        setLinks(prev => [...prev, ...newLinks]);

        // Update chat message if it was created from chat
        if (activeMessageIndex !== null) {
            setChatMessages(prevMessages =>
                prevMessages.map((msg, i) =>
                    i === activeMessageIndex ? { ...msg, noteCreated: true } : msg
                )
            );
            setActiveMessageIndex(null);
        }
    };

    const processText = async (text) => {
        const response = await fetch('/api/process-text', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text })
        });
        return response.json();
    };

// Add this function to manage comments for notes
const handleCommentAdded = (noteId, commentText) => {
    setNotes(notes.map(note => 
        note.id === noteId 
            ? { 
                ...note, 
                comments: (note.comments || 0) + 1,
                initialComments: [...(note.initialComments || []), {
                    text: commentText,
                    createdBy: 'user@example.com',
                    dateCreated: new Date().toISOString()
                }]
            }
            : note
    ));
};

    const handleNodeClick = (note) => {
        setPreviousNote(selectedNote);
        setSelectedNote(note);
        setIsDetailDialogOpen(true);
    };

    const handleNoteUpdate = (noteId, updatedNote) => {
        // Parse content for new links
        const linkedTitles = parseNoteContent(updatedNote.content);

        // Remove old links for this note
        const filteredLinks = links.filter(link => 
            link.sourceId !== noteId && link.targetId !== noteId
        );

        // Create new bidirectional links
        const newLinks = [];
        linkedTitles.forEach(title => {
            const targetNote = notes.find(n => n.title.toLowerCase() === title.toLowerCase());
            if (targetNote) {
                // Forward link
                newLinks.push({
                    sourceId: noteId,
                    targetId: targetNote.id,
                    value: 1
                });
                // Back link
                newLinks.push({
                    sourceId: targetNote.id,
                    targetId: noteId,
                    value: 1
                });
            }
        });

        // Update links count
        updatedNote.links = newLinks.length / 2; // Each link is bidirectional

        setNotes(notes.map(note => 
            note.id === noteId ? updatedNote : note
        ));
        setLinks([...filteredLinks, ...newLinks]);
    };

    const handleCreateNote = () => {
        setIsCreateDialogOpen(true);
    };

    const handleNoteClick = (note) => {
        setPreviousNote(selectedNote);
        setSelectedNote(note);
        setIsDetailDialogOpen(true);
    };

    const createNoteFromChat = async (message, index) => {
        try {
            // Generate title using AI
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    message: `Generate a concise title (max 5 words) for this content: ${message.text}`,
                    notes: [] 
                })
            });

            const data = await response.json();
            const generatedTitle = data.response.replace(/["']/g, '').trim();

            const noteData = {
                title: generatedTitle,
                content: message.text,
                dateCreated: new Date().toLocaleString(),
                comments: 0,
                initialComments: [],
                links: 0
            };

            // Open note dialog with pre-filled content
            setDraftNote(noteData);
            setIsCreateDialogOpen(true);
            
            // Store the message index to update its state after creation
            setActiveMessageIndex(index);
        } catch (error) {
            console.error('Error generating title:', error);
        }
    };

    const handleCopy = async (text, index) => {
        try {
            await navigator.clipboard.writeText(text);
            // Show copy feedback
            setChatMessages(messages => 
                messages.map((msg, i) => 
                    i === index ? { ...msg, copied: true } : msg
                )
            );
            // Reset copy feedback after 2 seconds
            setTimeout(() => {
                setChatMessages(messages =>
                    messages.map((msg, i) =>
                        i === index ? { ...msg, copied: false } : msg
                    )
                );
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const renderMessageContent = (msg, index) => {
        const renderContentWithLinks = (content) => {
            const parts = content.split(/(\[\[.*?\]\])/g);
            return parts.map((part, i) => {
                if (part.match(/^\[\[(.*?)\]\]$/)) {
                    const noteTitle = part.slice(2, -2);
                    const linkedNote = notes.find(n => n.title.toLowerCase() === noteTitle.toLowerCase());
                    return linkedNote ? (
                        <span 
                            key={i}
                            className="note-link"
                            onClick={() => handleNoteClick(linkedNote)}
                        >
                            {noteTitle}
                            <small className="note-stats">
                                ({linkedNote.comments || 0} comments, {linkedNote.links || 0} links)
                            </small>
                        </span>
                    ) : <span key={i}>{part}</span>;
                }
                return <span key={i}>{part}</span>;
            });
        };

        return (
            <div className="message-content">
                <div className="message-text">
                    {renderContentWithLinks(msg.text)}
                </div>
                {msg.sender === 'ai' && (
                    <div className="message-actions">
                        <button 
                            className={`ai-button create ${msg.noteCreated ? 'created' : ''}`}
                            onClick={() => !msg.noteCreated && createNoteFromChat(msg, index)}
                        >
                            {msg.noteCreated ? 'Note Created ✓' : 'Create Note'}
                        </button>
                        <button 
                            className="ai-button copy"
                            onClick={() => handleCopy(msg.text, index)}
                        >
                            {msg.copied ? <FaCheck size={14} /> : <FaCopy size={14} />}
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'notes':
                return (
                    <div className="main-content">
                        <div className="notes-list">
                            {[...notes].reverse().map((note, index) => (
                                <div 
                                    key={note.id}
                                    className="note-card"
                                    onClick={() => {
                                        setSelectedNote(note);
                                        setIsDetailDialogOpen(true);
                                    }}
                                >
                                    <div className="note-header">
                                        <h3>{note.title}</h3>
                                        <span className="note-user">{note.createdBy || 'placeholder@example.com'}</span>
                                    </div>
                                    <div className="note-footer">
                                        <small>{note.dateCreated}</small>
                                        <div className="note-links">
                                            <span>{note.comments} {note.comments === 1 ? 'Comment' : 'Comments'}</span>
                                            <span>{note.links || 0} Links</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'graph':
                return (
                    <div className="main-content">
                        <div className="graph-container">
                            <Graph 
                                notes={notes} 
                                links={links} 
                                onNodeClick={handleNodeClick} 
                                activeTab={activeTab}
                            />
                        </div>
                    </div>
                );
            case 'chat':
                return (
                    <div className="chat-interface">
                        <div className="chat-messages">
                            {chatMessages.map((msg, index) => (
                                <div key={index} className={`message ${msg.sender}`}>
                                    {renderMessageContent(msg, index)}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="typing-animation">
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                    <div className="typing-dot"></div>
                                </div>
                            )}
                        </div>
                        <div className="chat-input-container">
                            <input
                                type="text"
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                            />
                            <button onClick={handleSendMessage}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                                </svg>
                                Send
                            </button>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="app-container">
            <Sidebar 
                activeTab={activeTab} 
                onSelectTab={setActiveTab}
                onCreateNote={handleCreateNote}
            />
            <div className="main-content">
                {renderContent()}
            </div>
            <NoteDialog
                open={isCreateDialogOpen}
                onClose={() => {
                    setIsCreateDialogOpen(false);
                    setDraftNote(null);
                }}
                onSubmit={handleNoteCreate}
                existingNotes={notes}
                draftNote={draftNote}
            />
            <NoteDetailDialog
                open={isDetailDialogOpen}
                onClose={() => setIsDetailDialogOpen(false)}
                note={selectedNote}
                onCommentAdded={handleCommentAdded}
                onNoteUpdate={handleNoteUpdate}
                existingNotes={notes}
                onNoteClick={handleNodeClick}
                previousNote={previousNote}
            />
        </div>
    );
}

export default App;
