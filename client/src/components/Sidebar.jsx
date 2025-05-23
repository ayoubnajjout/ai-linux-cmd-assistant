import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ 
  darkMode, 
  conversations = [], 
  currentConversationId,
  setCurrentConversationId,
  createNewConversation,
  onDeleteConversation,
  apiUrl,
  userId,
  userInfo, // Add userInfo prop explicitly
  setConversations, // Pass setConversations to update list after edit
  isVisible = true, // <-- Add this default prop
  toggleSidebar // <-- Add this prop
}) => {
  const navigate = useNavigate();
  const [editingConversationId, setEditingConversationId] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const editInputRef = useRef(null);

  // Function to handle clicking a conversation
  const handleConversationClick = async (id) => {
    setCurrentConversationId(id);
  };

  // Format timestamp to readable date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // If today, show time only
    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
    
    // If this year, show month and day
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
    
    // Otherwise show month, day and year
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Truncate text if it's too long
  const truncateText = (text, maxLength = 30) => {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  const handleEdit = (conversation) => {
    setEditingConversationId(conversation.id);
    setNewTitle(conversation.title);
  };

  const handleCancelEdit = () => {
    setEditingConversationId(null);
    setNewTitle('');
  };

  const handleSaveTitle = async (conversationId) => {
    if (!newTitle.trim() || !userId) {
      handleCancelEdit();
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/conversations/${conversationId}/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (response.ok) {
        const updatedConversationFromServer = await response.json(); // Server returns { id, title, created_at, updated_at }
        setConversations(prev => 
          prev.map(conv => 
            conv.id === conversationId 
              ? { 
                  // Explicitly use all fields from server response
                  id: updatedConversationFromServer.id, 
                  title: updatedConversationFromServer.title, 
                  created_at: updatedConversationFromServer.created_at,
                  updated_at: updatedConversationFromServer.updated_at,
                  // Preserve fields not in the PUT response from the existing client-side object
                  message_count: conv.message_count 
                } 
              : conv
          )
        );
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to update title on server.'}));
        console.error("Failed to update conversation title:", response.status, errorData.detail);
        alert(`Error updating title: ${errorData.detail || response.statusText}`);
      }
    } catch (error) {
      console.error("Error updating conversation title:", error);
      alert(`Client-side error updating title: ${error.message}`);
    } finally {
      handleCancelEdit();
    }
  };

  useEffect(() => {
    if (editingConversationId && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingConversationId]);

  const sortedConversations = [...conversations].sort((a, b) => {
    const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0; // Use updated_at for sorting
    const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0; // Use updated_at for sorting
    return dateB - dateA;
  });

  return (
    <div className={`fixed inset-y-0 left-0 z-30 w-64 min-w-64 max-w-64 ${darkMode ? 'bg-gray-950' : 'bg-blue-50'} border-r ${darkMode ? 'border-gray-700' : 'border-gray-300'} transform ${isVisible ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out flex flex-col print:hidden`}> 
      <div className={`h-20 p-4 flex justify-between items-center border-b ${darkMode ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-blue-50'}`}> 
        <h2 className={`text-lg font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>AI Linux Cmd assistant</h2>
        <button onClick={toggleSidebar} className={`md:hidden p-1 rounded-md ${darkMode ? 'hover:bg-blue-900' : 'hover:bg-blue-100'}`}> 
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>
      <div className="p-2">
        <button
          onClick={createNewConversation}
          className={`w-full flex items-center justify-center px-4 py-2.5 text-sm font-medium rounded-md transition-colors duration-150
            ${darkMode 
              ? 'bg-blue-700 hover:bg-blue-800 text-blue-100' 
              : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}
            focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'focus:ring-blue-500 focus:ring-offset-gray-900' : 'focus:ring-blue-400 focus:ring-offset-white'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          New Conversation
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto space-y-1 p-2">
        {sortedConversations.map(conversation => (
          <div 
            key={conversation.id} 
            className={`group relative p-2.5 rounded-lg cursor-pointer transition-colors duration-150 flex flex-col min-h-[64px] max-h-[64px] justify-center
              ${currentConversationId === conversation.id 
                ? (darkMode ? 'bg-gray-800 text-blue-100 border border-gray-700' : 'bg-gray-200 text-black border border-gray-300') 
                : (darkMode ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-200 text-gray-700')}
            `}
            style={{ minHeight: 64, maxHeight: 64 }}
          >
            {editingConversationId === conversation.id ? (
              <div className="flex flex-col">
                <input 
                  ref={editInputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveTitle(conversation.id);
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className={`w-full p-1.5 text-sm rounded-md border ${darkMode ? 'bg-gray-700 border-blue-700 text-blue-100' : 'bg-white border-blue-400 text-gray-900'} focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
                />
                <div className="mt-2 flex justify-end space-x-2">
                  <button 
                    onClick={() => handleSaveTitle(conversation.id)} 
                    className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-green-700 hover:bg-green-800 text-white' : 'bg-green-200 hover:bg-green-300 text-green-900'}`}
                  >
                    Save
                  </button>
                  <button 
                    onClick={handleCancelEdit} 
                    className={`px-2 py-1 text-xs rounded ${darkMode ? 'bg-gray-600 hover:bg-gray-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div onClick={() => setCurrentConversationId(conversation.id)} className="flex flex-col h-full justify-center">
                <div className="flex justify-between items-center w-full">
                  <span className={`font-semibold text-base truncate pr-10 ${currentConversationId === conversation.id && !darkMode ? 'text-blue-800' : (darkMode ? 'text-blue-200' : 'text-gray-900')}`} title={conversation.title}>
                    {conversation.title || 'New Conversation'}
                  </span>
                  <div className="absolute top-2 right-2 flex opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(conversation); }}
                      className={`p-1.5 rounded ${darkMode ? 'hover:bg-blue-800 text-blue-400 hover:text-blue-200' : 'hover:bg-blue-200 text-blue-600 hover:text-blue-700'}`}
                      title="Edit title"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteConversation(conversation.id); }}
                      className={`p-1.5 rounded ${darkMode ? 'hover:bg-red-800 text-red-400 hover:text-red-200' : 'hover:bg-red-200 text-red-600 hover:text-red-700'}`}
                      title="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                    </button>
                  </div>
                </div>
                <div className={`text-xs mt-1 ${currentConversationId === conversation.id && !darkMode ? 'text-black' : (darkMode ? 'text-blue-200' : 'text-gray-500')}`}> 
                  {conversation.message_count > 0 ? 
                    `${conversation.message_count} message${conversation.message_count > 1 ? 's' : ''}` : 'Empty'}
                  {conversation.updated_at && ( // Use updated_at for display
                    <span title={new Date(conversation.updated_at).toLocaleString()}> • {formatDate(conversation.updated_at)}</span> // Use updated_at for display
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>
      {/* Footer */}
      <div className={`p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-blue-50'}`}> 
        {userInfo && (
          <div className={`mb-3 p-2 rounded-lg ${darkMode ? 'bg-gray-800' : 'bg-gray-200'}`}>
            <div className="flex items-center space-x-3">
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${darkMode ? 'bg-gray-700' : 'bg-gray-300'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold truncate ${darkMode ? 'text-white' : 'text-gray-800'}`} title={userInfo.username}>
                  {userInfo.username}
                </p>
                <p className={`text-xs truncate ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  Connected
                </p>
              </div>
            </div>
          </div>
        )}
        <div className="flex flex-col items-center">
          <button
            onClick={async () => {
              console.log('Clear button clicked');
              // Use userId (ObjectId) for the new /conversations/all/{user_id} endpoint
              let effectiveUserId = userId;
              
              // Try to get from userInfo prop if available
              if (!effectiveUserId && userInfo && userInfo.id) {
                console.log('Using userInfo.id:', userInfo.id);
                effectiveUserId = userInfo.id;
              }
              
              // Try to get from localStorage
              if (!effectiveUserId) {
                try {
                  const storedUser = localStorage.getItem('linuxAssistantUser');
                  if (storedUser) {
                    const parsed = JSON.parse(storedUser);
                    if (parsed && parsed.id) {
                      console.log('Using localStorage user.id:', parsed.id);
                      effectiveUserId = parsed.id;
                    }
                  }
                } catch (e) {
                  console.error('[ERROR] Failed to parse user from localStorage:', e);
                }
              }              console.log('Effective user ID:', effectiveUserId);
              if (effectiveUserId && apiUrl) {
                try {
                  // Use the new backend API endpoint for clearing all conversations
                  const url = `${apiUrl}/users/${effectiveUserId}/conversations/clear`;
                  console.log('Calling DELETE endpoint:', url);
                  const response = await fetch(url, { method: 'DELETE' });
                  console.log('DELETE response status:', response.status);
                  
                  if (response.ok) {
                    // Refresh conversations
                    const refreshed = await fetch(`${apiUrl}/conversations/${effectiveUserId}`);
                    if (refreshed.ok) {
                      const data = await refreshed.json();
                      setConversations(data || []);
                    } else {
                      setConversations([]);
                    }
                    setCurrentConversationId(null);
                  } else {
                    const errorText = await response.text();
                    console.error('Server error:', errorText);
                    alert(`Failed to clear conversations. Server responded with: ${response.status} - ${errorText}`);
                  }
                } catch (err) {
                  console.error('Error clearing conversations:', err);
                  alert('Failed to clear conversations due to a network or unexpected error. Check console for details.');
                }
              } else {
                alert('Cannot clear conversations: User ID or API URL is missing or invalid.');
              }
            }}
            className={`w-full px-4 py-2 rounded-md font-semibold text-sm transition-colors duration-150 ${darkMode ? 'bg-red-800 text-red-200 hover:bg-red-700' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
          >
            Clear Conversations
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
