import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, onSelectTab, onCreateNote }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-tabs">
        <button 
          className={`tab ${activeTab === 'notes' ? 'active' : ''}`} 
          onClick={() => onSelectTab('notes')}
        >
          Notes
        </button>
        <button 
          className={`tab ${activeTab === 'graph' ? 'active' : ''}`} 
          onClick={() => onSelectTab('graph')}
        >
          Graph
        </button>
        <button 
          className={`tab ${activeTab === 'chat' ? 'active' : ''}`} 
          onClick={() => onSelectTab('chat')}
        >
          AI Chat
        </button>
      </div>
      <button className="create-note-button" onClick={onCreateNote}>
        Create New Note
      </button>
    </div>
  );
};

export default Sidebar;