import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import LoadingScreen from './LoadingScreen';
import Sidebar from './Sidebar';

// Sample initial chat data - only shown for first-time users
const getInitialMessages = (isFirstTime = true) => {
  if (isFirstTime) {
    return [
      {
        id: 1,
        sender: 'ai',
        content: 'Hello! I\'m your Linux command assistant. Ask me anything about Linux commands and I\'ll help you out!',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
      }
    ];
  }
  return [];
};

// AI Message Component
const AiMessage = ({ message, isDarkMode, isLoading }) => {
  const formattedDate = new Date(message.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex items-start mb-4 justify-start">
      <div className="flex-shrink-0 mr-3 mt-1">
        <div className="bg-blue-600 dark:bg-blue-800 rounded-full p-2 text-white">
          {/* AI Icon, kept blue */}
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <path d="M2 12h20" />
            <path d="M2 16h20" />
            <path d="M2 20h20" />
          </svg>
        </div>
      </div>
      <div className="flex-1 max-w-[80%]">
        <div className={`${isDarkMode ? 'bg-gray-800 text-blue-100' : 'bg-blue-100 text-blue-900'} rounded-lg px-4 py-3 relative`}>
          <div className="whitespace-pre-wrap">
            {message.content}
            {isLoading && (
              <span className="ml-2 align-middle flex items-center">
                <span className="relative flex h-5 w-5 mr-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-blue-500"></span>
                </span>
                <span className="ml-1 text-blue-400">AI is thinking...</span>
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-blue-400 mt-1 ml-1">{formattedDate}</div>
      </div>
    </div>
  );
};

// User Message Component
const UserMessage = ({ message, alignRight, isDarkMode }) => {
  const formattedDate = new Date(message.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="flex items-start mb-4 justify-end">
      <div className="flex-1 flex justify-end max-w-[80%]">
        <div className={`${isDarkMode ? 'bg-blue-700 text-blue-100' : 'bg-blue-400 text-white'} rounded-lg px-4 py-3 inline-block text-left ml-12`}>
          <div className="whitespace-pre-wrap">{message.content}</div>
          <div className="text-xs text-white-400 mt-1 ml-1">{formattedDate}</div>
          {/* Date under the user message bubble, left-aligned */}
        </div>
      </div>
      <div className="flex-shrink-0 ml-3 mt-1">
        <div className="bg-gray-300 dark:bg-gray-700 rounded-full p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-700 dark:text-white">
            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Error Message Component
const ErrorMessage = ({ message, isDarkMode, onRetry }) => {
  const isServerError = message.includes('offline') ||
                        message.includes('timed out') ||
                        message.includes('check if the FastAPI server is running');
 
  return (
    <div className="flex items-start mb-4">
      <div className="flex-shrink-0 mr-3 mt-1">
        <div className="bg-red-500 rounded-full p-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <div className={`${isDarkMode ? 'bg-red-900 text-red-200 border-red-700' : 'bg-red-50 text-red-800 border-red-200'} rounded-lg px-4 py-3 max-w-full border`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">
                {isServerError ? 'Server Connection Error' : 'Error'}
              </div>
              <div className="text-sm mt-1">{message}</div>
             
              {isServerError && (
                <div className={`mt-2 p-2 rounded text-xs ${isDarkMode ? 'bg-red-800' : 'bg-red-100'}`}>
                  <p className="font-medium">Troubleshooting steps:</p>
                  <ol className="list-decimal ml-4 mt-1 space-y-1">
                    <li>Make sure the FastAPI server is running</li>
                    <li>Check that the server URL is correct (currently: http://localhost:8000)</li>
                    <li>Ensure MongoDB is running if your server uses it</li>
                    <li>Check for any firewall or network issues</li>
                  </ol>
                </div>
              )}
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className={`ml-3 px-3 py-1 text-xs rounded ${isDarkMode ? 'bg-red-800 hover:bg-red-700 text-red-200' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Connection status indicator with reconnect button
const ConnectionStatus = ({ isConnected, isDarkMode, onRetryConnection }) => {
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
      isConnected
        ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-700'
        : isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-700'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
      {!isConnected && (
        <button
          onClick={onRetryConnection}
          className="ml-1 hover:text-white"
          title="Try reconnecting"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
        </button>
      )}
    </div>
  );
};

// Main ChatApp Component
export default function ChatApp() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  // Always use localStorage for dark mode, and listen for changes
  const getDarkMode = () => localStorage.getItem('linuxAssistantDarkMode') === 'true';
  const [darkMode, setDarkMode] = useState(getDarkMode());

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'linuxAssistantDarkMode') {
        setDarkMode(getDarkMode());
      }
    };
    window.addEventListener('storage', handleStorage);
    // Also listen for custom event in case of same-tab toggling
    const handleCustom = () => setDarkMode(getDarkMode());
    window.addEventListener('dark-mode-changed', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dark-mode-changed', handleCustom);
    };
  }, []);

  const [isConnected, setIsConnected] = useState(false);
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('linuxAssistantApiUrl') || 'http://localhost:8000'
  );
  const [initializing, setInitializing] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [serverCheckAttempts, setServerCheckAttempts] = useState(0);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  const loadConversationMessages = useCallback(async (conversationId) => {
    if (!userInfo?.id || !conversationId) {
      if (!conversationId) {
        setMessages(getInitialMessages(conversations.length === 0));
      }
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${apiUrl}/conversations/${conversationId}/details/${userInfo.id}`, {
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.messages && data.messages.length > 0) {
          const formattedMessages = data.messages.map(msg => ({
            id: msg.id,
            sender: msg.sender,
            content: msg.content,
            timestamp: msg.timestamp,
            conversationId: conversationId 
          }));
          setMessages(formattedMessages);
        } else {
          // No messages for this conversation, show personalized AI welcome message
          setMessages([
            {
              id: 'ai-welcome',
              sender: 'ai',
              content: `Hi ${userInfo?.username || 'there'}, I'm here to assist you with Linux commands! Ask me anything.`,
              timestamp: new Date().toISOString(),
              conversationId: conversationId
            }
          ]);
        }
      } else {
        console.error("Failed to load conversation messages:", response.statusText);
        setMessages([{
          id: 'error-load-' + Date.now(),
          sender: 'error',
          content: `Failed to load messages. Status: ${response.statusText}`,
          timestamp: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      setMessages([{
        id: 'error-load-catch-' + Date.now(),
        sender: 'error',
        content: `Error loading messages: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [apiUrl, userInfo, setMessages, conversations]); // Added conversations dependency

  // Update localStorage when dark mode changes
  useEffect(() => {
    localStorage.setItem('linuxAssistantDarkMode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user information
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('linuxAssistantUser');
    if (!storedUserInfo) {
      navigate('/login');
    } else {
      setUserInfo(JSON.parse(storedUserInfo));
    }
  }, [navigate]);

  // Load previous conversations once user info is available
  useEffect(() => {
    if (!userInfo?.id) {
      return;
    }

    const loadPreviousConversations = async () => {
      // setIsLoading(true); // Optional: indicate loading for initial conversations
      try {
        await checkServerHealthWithRetry(1, 3000); // Ensure server is reachable
        setIsConnected(true);
       
        const response = await fetch(`${apiUrl}/conversations/${userInfo.id}`, {
          signal: AbortSignal.timeout(10000)
        });
       
        if (response.ok) {
          const data = await response.json();
          const userConversations = data || [];
          setConversations(userConversations);
          
          if (userConversations.length > 0) {
            const sortedConversations = [...userConversations].sort((a, b) => {
              const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
              const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
              return dateB - dateA;
            });
            if (sortedConversations.length > 0 && sortedConversations[0].id) {
                 setCurrentConversationId(sortedConversations[0].id);
                 // Messages will be loaded by the useEffect hook dependent on currentConversationId
            } else {
                 setCurrentConversationId(null);
                 setMessages(getInitialMessages(true)); // Should not happen if userConversations.length > 0
            }
          } else {
            // No conversations exist for the user
            setCurrentConversationId(null);
            setMessages(getInitialMessages(true));
          }
        } else {
          console.error("Failed to load conversations:", response.status);
          setIsConnected(false);
          setCurrentConversationId(null);
          setMessages(getInitialMessages(true));
        }
      } catch (error) {
        console.error("Failed to load previous conversations:", error);
        setIsConnected(false);
        setCurrentConversationId(null);
        setMessages(getInitialMessages(true));
      } finally {
        // setIsLoading(false); // Optional: stop indication for initial conversations
        setInitializing(false); // Ensure initializing is false after attempting to load user data
      }
    };
   
    loadPreviousConversations();
  }, [apiUrl, userInfo]); // Removed navigate, checkServerHealthWithRetry can be defined outside or memoized if needed as dependency

  // Effect to load conversation messages when currentConversationId changes
  useEffect(() => {
    if (currentConversationId && userInfo?.id) {
      loadConversationMessages(currentConversationId);
    } else if (!currentConversationId) {
      // If no current conversation is selected
      if (conversations.length === 0) {
        setMessages(getInitialMessages(true)); // "First time" style welcome
      } else {
        setMessages(getInitialMessages(false)); // "Select a conversation" style
      }
    }
  }, [currentConversationId, userInfo, loadConversationMessages, conversations]);
  
  // Handle the initial question if provided through navigation state
  useEffect(() => {
    const demoQuestion = location.state?.demoQuestion;
   
    if (location.state?.darkModePreference !== undefined) {
      setDarkMode(location.state.darkModePreference);
    }
   
    if (demoQuestion) {
      const timer = setTimeout(() => {
        const userMessage = {
          id: Date.now(),
          sender: 'user',
          content: demoQuestion,
          timestamp: new Date().toISOString()
        };
       
        setMessages(prev => [...prev, userMessage]);
        setInitializing(false);
        processQuestion(demoQuestion);
      }, 2000);
     
      return () => clearTimeout(timer);
    } else {
      setInitializing(false);
    }
  }, [location.state]);

  // Check server health on component mount
  useEffect(() => {
    checkServerHealthWithRetry(2, 5000)
      .then(success => {
        if (success) {
          console.log("Server health check successful");
          setIsConnected(true);
        }
      })
      .catch(error => {
        console.error("Initial server health check failed:", error);
        setIsConnected(false);
        setServerCheckAttempts(prev => prev + 1);
      });
   
    const handleOnlineStatus = () => {
      console.log("Browser online status changed:", navigator.onLine);
      if (navigator.onLine) {
        checkServerHealthWithRetry(1, 5000).catch(() => {});
      } else {
        setIsConnected(false);
      }
    };
   
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
   
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, [apiUrl]);
 
  // Function to change API URL and save to localStorage
  const changeApiUrl = () => {
    const currentUrl = apiUrl;
    let newUrl = prompt("Enter the API server URL:", currentUrl);
   
    if (newUrl && newUrl !== currentUrl) {
      localStorage.setItem('linuxAssistantApiUrl', newUrl);
      setApiUrl(newUrl);
      setIsConnected(false);
      setServerCheckAttempts(0);
     
      const statusMsg = {
        id: Date.now(),
        sender: 'ai',
        content: `API URL changed to ${newUrl}. Testing connection...`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, statusMsg]);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('linuxAssistantUser');
    navigate('/login');
  };

  const checkServerHealth = async () => {
    try {
      console.log(`Checking server health at: ${apiUrl}/health`);
      const response = await fetch(`${apiUrl}/health`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
     
      if (response.ok) {
        console.log('Server health check successful');
        setIsConnected(true);
        return true;
      } else {
        console.error(`Health check failed with status: ${response.status}`);
        setIsConnected(false);
        return false;
      }
    } catch (error) {
      console.error('Server health check error:', error);
      setIsConnected(false);
      return false;
    }
  };

  // Improved server health check with retry mechanism
  const checkServerHealthWithRetry = async (maxRetries = 2, timeout = 5000) => {
    let lastError = null;
   
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Health check attempt ${attempt + 1}/${maxRetries + 1} with timeout ${timeout}ms`);
       
        const response = await fetch(`${apiUrl}/health`, {
          signal: AbortSignal.timeout(timeout)
        });
       
        if (response.ok) {
          console.log("Server health check successful");
          setIsConnected(true);
          return true;
        } else {
          console.warn(`Health check failed with status: ${response.status}`);
          lastError = new Error(`Health check failed with status: ${response.status}`);
        }
      } catch (err) {
        console.warn(`Health check attempt ${attempt + 1} failed:`, err);
        lastError = err;
       
        if (err.name !== 'TimeoutError' && err.name !== 'AbortError') {
          break;
        }
      }
     
      if (attempt < maxRetries) {
        console.log(`Waiting ${attempt + 1}s before next health check attempt...`);
        await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
      }
    }
   
    setIsConnected(false);
    throw lastError || new Error("Server health check failed after multiple attempts");
  };

  // FIXED callFastAPI function with better timeout handling
  const callFastAPI = async (question, conversationId = null) => {
    let userId;
   
    try {
      const storedUserInfo = localStorage.getItem('linuxAssistantUser');
      if (storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        if (parsedUserInfo && parsedUserInfo.id) {
          userId = parsedUserInfo.id;
        } else {
          throw new Error("No valid user ID found in stored user info");
        }
      } else {
        navigate('/login'); // Redirect to login if no user info
        throw new Error("No user authentication found. Please log in again.");
      }

      const payload = {
        question: question,
        user_id: userId,
      };

      if (conversationId) {
        payload.conversation_id = conversationId;
      }

      console.log(`Sending request to ${apiUrl}/ask with payload:`, payload);
     
      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(30000) 
      });
       
      // Handle server errors
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server response ${response.status}:`, errorText);
       
        try {
          const errorJson = JSON.parse(errorText);
           
          if (response.status === 404 && errorJson.detail === "User not found") {
            console.log("User not found, redirecting to login");
            localStorage.removeItem('linuxAssistantUser');
            navigate('/login');
            throw new Error("User session expired. Please log in again.");
          }
           
          throw new Error(`Server error (${response.status}): ${errorJson.detail || 'Unknown error'}`);
        } catch (e) {
          if (e.message.includes('User session expired')) {
            throw e;
          }
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText.substring(0, 100)}`);
        }
      }
       
      // Set connection status to true after successful request
      setIsConnected(true);
        
      // Parse successful response
      try {
        const responseText = await response.text();
        const data = JSON.parse(responseText);
        setIsConnected(true);
       
        console.log("Server response:", data);
       
        if (!data.answer || !data.conversation_id) {
          console.warn("Server response missing expected fields:", data);
          throw new Error("Invalid server response format");
        }
       
        return {
          answer: data.answer,
          conversationId: data.conversation_id
        };
      } catch (parseError) {
        console.error("Failed to parse server response:", parseError);
        throw new Error("Failed to parse server response. The API may have returned an invalid format.");
      }
    } catch (error) {
      console.error('Error calling FastAPI:', error);
     
      // Handle timeout specifically
      if (error.name === 'TimeoutError' || error.name === 'AbortError') {
        setIsConnected(false);
        throw new Error("Request timed out. The server might be busy or unavailable. Try again in a moment.");
      }
      
      // Handle network errors
      if (error.message.includes('fetch')) {
        setIsConnected(false);
        throw new Error("Network error. Please check your internet connection and server availability.");
      }
     
      throw error;
    }
  };

  const processQuestion = async (question) => {
    setIsLoading(true);
    let userId = userInfo?.id;

    if (!userId) {
        console.error("User ID not available in processQuestion. User might be logged out.");
        setMessages(prev => [...prev, {
            id: Date.now() +1, sender: 'error', content: 'User information is missing. Please log in again.', timestamp: new Date().toISOString()
        }]);
        setIsLoading(false);
        navigate('/login');
        return;
    }
   
    try {
      console.log("Calling API with question:", question, "for conversation:", currentConversationId);
      const apiResponse = await callFastAPI(question, currentConversationId); // Pass currentConversationId
      console.log("Received API response:", apiResponse);
     
      const newAiMessage = {
        id: Date.now() + 1, 
        sender: 'ai',
        content: apiResponse.answer,
        timestamp: new Date().toISOString(),
        conversationId: apiResponse.conversationId 
      };
     
      setMessages(prev => [...prev, newAiMessage]);
     
      if (apiResponse.conversationId) {
        if (currentConversationId !== apiResponse.conversationId) {
            setCurrentConversationId(apiResponse.conversationId);
        }
        
        // Refresh conversations list
        try {
          const convResponse = await fetch(`${apiUrl}/conversations/${userId}`);
          if (convResponse.ok) {
            const data = await convResponse.json();
            setConversations(data || []);
          } else {
             console.error("Failed to refresh conversations list after sending message.");
          }
        } catch (refreshError) {
          console.error("Error refreshing conversations list:", refreshError);
        }
      }
    } catch (error) {
      console.error("Error in processQuestion:", error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'error',
        content: `Failed to get response from server: ${error.message}`,
        timestamp: new Date().toISOString(),
        originalQuestion: question
      };
     
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
   
    const userQuestion = inputValue.trim();
   
    const newUserMessage = {
      id: Date.now(),
      sender: 'user',
      content: userQuestion,
      timestamp: new Date().toISOString(),
      conversationId: currentConversationId // Associate with current conversation
    };
   
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
   
    await processQuestion(userQuestion);
  };

  const handleRetryMessage = async (originalQuestion) => {
    setIsLoading(true);
   
    try {
      const response = await callFastAPI(originalQuestion);
     
      const newAiMessage = {
        id: Date.now(),
        sender: 'ai',
        content: response.answer,
        timestamp: new Date().toISOString(),
        conversationId: response.conversationId
      };
     
      setMessages(prev => {
        const newMessages = [...prev];
        const errorIndex = newMessages.findIndex(msg =>
          msg.sender === 'error' && msg.originalQuestion === originalQuestion
        );
        if (errorIndex !== -1) {
          newMessages[errorIndex] = newAiMessage;
        }
        return newMessages;
      });
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // If initializing with a demo question, show loading screen
  if (initializing) {
    return <LoadingScreen demoQuestion={location.state?.demoQuestion} />;
  }

  // Function to create a new conversation
  const createNewConversation = async () => {
    if (!userInfo?.id) {
      console.error("Cannot create new conversation: User ID is missing.");
      // Optionally, show a message to the user or redirect to login
      alert("User information is missing. Please log in again.");
      navigate('/login');
      return;
    }

    if (!isConnected) {
      alert("Cannot create new conversation: Server is not connected. Please check your connection.");
      return;
    }

    setIsLoading(true); // Indicate loading state
    try {
      const response = await fetch(`${apiUrl}/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userInfo.id,
          // title: "New Conversation" // Title can be set by the backend or edited later
        }),
        signal: AbortSignal.timeout(10000) // 10-second timeout
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Failed to create new conversation:", response.status, errorData);
        alert(`Failed to create new conversation. Server responded with: ${response.status} - ${errorData.substring(0,100)}`);
        throw new Error(`Failed to create new conversation. Status: ${response.status}`);
      }

      const newConversation = await response.json();
      console.log("Created new conversation:", newConversation);

      // Add the new conversation to the list and set it as current
      setConversations(prev => [newConversation, ...prev]); // Add to the beginning
      setCurrentConversationId(newConversation.id);
      // Messages for the new conversation (usually an initial AI welcome) will be loaded by the useEffect hook
      // that depends on currentConversationId

    } catch (error) {
      console.error("Error creating new conversation:", error);
      if (error.name === 'TimeoutError') {
        alert("Creating new conversation timed out. Please try again.");
      } else if (!error.message.includes("Status:")){ // Avoid double alerting for failed responses
        alert("An error occurred while creating the new conversation. Please check the console for details.");
      }
    } finally {
      setIsLoading(false); // Stop loading indication
    }
  };

  // Function to delete a conversation
  const handleDeleteConversation = async (conversationIdToDelete) => {
    if (!userInfo?.id || !conversationIdToDelete) {
      console.error("User info or conversation ID missing for delete operation.");
      setMessages(prev => [...prev, {
        id: 'error-delete-' + Date.now(),
        sender: 'error',
        content: 'Could not delete conversation: User or Conversation ID missing.',
        timestamp: new Date().toISOString()
      }]);
      return;
    }

    // Optimistically remove the conversation from the UI
    const previousConversations = conversations;
    const updatedConversations = conversations.filter(conv => conv.id !== conversationIdToDelete);
    setConversations(updatedConversations);

    if (currentConversationId === conversationIdToDelete) {
      if (updatedConversations.length > 0) {
        // Select the most recent conversation
        const sortedConversations = [...updatedConversations].sort((a, b) => {
            const dateA = a.timestamp ? new Date(a.timestamp) : new Date(0);
            const dateB = b.timestamp ? new Date(b.timestamp) : new Date(0);
            return dateB - dateA;
        });
        setCurrentConversationId(sortedConversations[0].id);
      } else {
        setCurrentConversationId(null);
        setMessages(getInitialMessages(true)); // Show initial welcome if no conversations left
      }
    }

    try {
      const response = await fetch(`${apiUrl}/conversations/${conversationIdToDelete}/${userInfo.id}`, { // Corrected URL
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000) 
        // No body needed as user_id is in the path
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to delete conversation on server.' }));
        console.error("Failed to delete conversation on server:", response.status, errorData.detail);
        // Revert optimistic update
        setConversations(previousConversations);
        if (currentConversationId === conversationIdToDelete || !currentConversationId && previousConversations.length > 0) {
            setCurrentConversationId(conversationIdToDelete); // Or select another appropriate one
        }
        
        setMessages(prev => [...prev, {
          id: 'error-delete-server-' + Date.now(),
          sender: 'error',
          content: `Server error deleting conversation: ${errorData.detail || response.statusText}`,
          timestamp: new Date().toISOString()
        }]);
      } else {
        console.log(`Conversation ${conversationIdToDelete} deleted successfully.`);
        // If the deleted conversation was the current one, and no other conversation was selected,
        // ensure messages are cleared or set to initial state.
        if (currentConversationId === null && updatedConversations.length === 0) {
            setMessages(getInitialMessages(true));
        }
        // Optionally, trigger a re-fetch of conversations if IDs/order might change significantly
        // or rely on the optimistic update.
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
      // Revert optimistic update
      setConversations(previousConversations);
      if (currentConversationId === conversationIdToDelete || !currentConversationId && previousConversations.length > 0) {
        setCurrentConversationId(conversationIdToDelete);
      }

      setMessages(prev => [...prev, {
        id: 'error-delete-catch-' + Date.now(),
        sender: 'error',
        content: `Client error deleting conversation: ${error.message}`,
        timestamp: new Date().toISOString()
      }]);
    }
  };

  // If initializing with a demo question, show loading screen
  if (initializing) {
    return <LoadingScreen demoQuestion={location.state?.demoQuestion} />;
  }

  return (
    <div className={`flex h-screen antialiased ${darkMode ? 'bg-[#181c24] text-blue-100' : 'bg-blue-50 text-blue-900'} print:bg-white`}>
      <Sidebar
        darkMode={darkMode}
        conversations={conversations}
        currentConversationId={currentConversationId}
        setCurrentConversationId={setCurrentConversationId}
        createNewConversation={createNewConversation}
        onDeleteConversation={handleDeleteConversation}
        apiUrl={apiUrl}
        userId={userInfo?.id} // Pass the actual user ID
        userInfo={userInfo}
        setConversations={setConversations}
        isVisible={sidebarVisible}
        toggleSidebar={toggleSidebar}
      />
      <div className={`flex-1 flex flex-col ${darkMode ? 'bg-[#181c24]' : 'bg-blue-50'} print:bg-white`}>
        {/* Header */}
        <header className={`h-20 p-4 border-b ${darkMode ? 'border-gray-700 bg-gray-950' : 'border-gray-300 bg-blue-50'} flex justify-between items-center print:hidden`}>
          <div className="flex items-center">
            <button onClick={toggleSidebar} className={`mr-3 md:hidden p-1 rounded-md ${darkMode ? 'hover:bg-blue-900' : 'hover:bg-blue-100'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
            </button>
            <h1 className={`text-xl font-semibold ${darkMode ? 'text-blue-300' : (currentConversationId && conversations.find(c => c.id === currentConversationId && c.title === 'New Conversation') ? 'text-blue-900' : 'text-pink-700')}`}>
              {currentConversationId && conversations.find(c => c.id === currentConversationId)
                ? conversations.find(c => c.id === currentConversationId).title
                : "Linux Command Assistant"}
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <ConnectionStatus isConnected={isConnected} isDarkMode={darkMode} onRetryConnection={() => checkServerHealthWithRetry(0, 2000)} />            <button 
              onClick={toggleDarkMode} 
              className={`p-2 rounded-full focus:outline-none transition-colors duration-200 ${darkMode ? 'hover:bg-blue-900 text-yellow-400' : 'hover:bg-blue-100'}`}
              title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4"/>
                  <path d="M12 2v2"/>
                  <path d="M12 20v2"/>
                  <path d="m4.93 4.93 1.41 1.41"/>
                  <path d="m17.66 17.66 1.41 1.41"/>
                  <path d="M2 12h2"/>
                  <path d="M20 12h2"/>
                  <path d="m6.34 17.66-1.41 1.41"/>
                  <path d="m19.07 4.93-1.41 1.41"/>
                </svg>
              )}
            </button>
            <button onClick={changeApiUrl} className={`p-2 rounded-full focus:outline-none transition-colors duration-200 ${darkMode ? 'hover:bg-blue-900 text-blue-200' : 'hover:bg-blue-100 text-blue-700'}`} title="Change API URL">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.62 2.514a1 1 0 0 1 1.242.21l3.015 3.015a1 1 0 0 1 .21 1.242L9.01 19.018a1 1 0 0 1-1.112.39L2.514 17.38a1 1 0 0 1-.616-1.112l3.015-10.74a1 1 0 0 1 .39-.616zM13.5 6.5l4 4M2.5 21.5l4-4"/><path d="m19 5-9 9"/></svg>
            </button>
            <button onClick={handleLogout} className={`p-2 rounded-full focus:outline-none transition-colors duration-200 ${darkMode ? 'hover:bg-red-800 text-red-400' : 'hover:bg-red-100 text-red-600'}`} title="Logout">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="w-full max-w-3xl mx-auto">
            {messages.map((msg, index) => {
              if (msg.sender === 'ai' || msg.sender === 'bot') {
                return <AiMessage key={msg.id || index} message={msg} isDarkMode={darkMode} isLoading={isLoading && index === messages.length - 1 && msg.sender === 'ai'} />;
              } else if (msg.sender === 'user') {
                return <UserMessage key={msg.id || index} message={msg} alignRight isDarkMode={darkMode} />;
              } else if (msg.sender === 'error') {
                return <ErrorMessage 
                          key={msg.id || index} 
                          message={msg.content} 
                          isDarkMode={darkMode} 
                          onRetry={msg.originalQuestion ? () => handleRetryMessage(msg.originalQuestion) : null} 
                       />;
              }
              return null;
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`chat-input-area p-4 border-t ${darkMode ? 'border-gray-700 bg-gray-900' : 'border-gray-300 bg-gray-100'}`}>
          <div className="flex items-center">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your command or question..."
              className={`flex-1 p-3 rounded-lg resize-none focus:outline-none focus:ring-2 ${darkMode ? 'bg-gray-800 text-blue-100 placeholder-gray-400 focus:ring-gray-500' : 'bg-white text-blue-900 placeholder-gray-500 focus:ring-gray-400'}`}
              rows="1"
              style={{ minHeight: '48px', maxHeight: '150px' }}
            />
            <button
              onClick={handleSendMessage}
              disabled={isLoading || !isConnected}
              className={`ml-3 px-5 py-3 rounded-lg font-semibold text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
                ${isLoading || !isConnected 
                  ? (darkMode ? 'bg-gray-700 cursor-not-allowed' : 'bg-gray-300 cursor-not-allowed')
                  : (darkMode ? 'bg-gray-700 hover:bg-gray-600 focus:ring-gray-500 focus:ring-offset-gray-900' : 'bg-gray-700 hover:bg-gray-800 focus:ring-gray-400 focus:ring-offset-gray-100')
                }`}
            >
              {isLoading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}