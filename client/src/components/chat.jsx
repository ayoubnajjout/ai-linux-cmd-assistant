import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

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
const AiMessage = ({ message, isDarkMode }) => {
  const formattedDate = new Date(message.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
 
  return (
    <div className="flex items-start mb-4">
      <div className="flex-shrink-0 mr-3 mt-1">
        <div className="bg-blue-500 rounded-full p-2 text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 8V4H8" />
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <path d="M2 12h20" />
            <path d="M2 16h20" />
            <path d="M2 20h20" />
          </svg>
        </div>
      </div>
      <div className="flex-1">
        <div className={`${isDarkMode ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'} rounded-lg px-4 py-3 max-w-full`}>
          <div className="whitespace-pre-wrap">
            {message.content}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 ml-1">{formattedDate}</div>
      </div>
    </div>
  );
};

// User Message Component
const UserMessage = ({ message }) => {
  const formattedDate = new Date(message.timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
 
  return (
    <div className="flex items-start mb-4 justify-end">
      <div className="flex-1 text-right">
        <div className="bg-blue-600 rounded-lg px-4 py-3 inline-block text-left max-w-full ml-12">
          <div className="whitespace-pre-wrap text-white">
            {message.content}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 mr-1">{formattedDate}</div>
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
        ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        : isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
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
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('linuxAssistantDarkMode') === 'true' || false
  );
  const [isConnected, setIsConnected] = useState(false);
  const [apiUrl, setApiUrl] = useState(
    localStorage.getItem('linuxAssistantApiUrl') || 'http://localhost:8000'
  );
  const [initializing, setInitializing] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [serverCheckAttempts, setServerCheckAttempts] = useState(0);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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

  // Load user information and previous conversations
  useEffect(() => {
    const storedUserInfo = localStorage.getItem('linuxAssistantUser');
    if (!storedUserInfo) {
      navigate('/login');
      return;
    }
   
    const userInfo = JSON.parse(storedUserInfo);
    setUserInfo(userInfo);
    
    const loadPreviousConversations = async () => {
      try {
        const userId = userInfo.id;
        console.log("Loading conversations for user:", userId);
       
        // Check server health first
        try {
          await checkServerHealthWithRetry(1, 3000);
          setIsConnected(true);
        } catch (error) {
          console.warn("Health check failed while loading conversations:", error);
          setIsConnected(false);
        }
       
        // Load conversations
        const response = await fetch(`${apiUrl}/conversations/${userId}`, {
          signal: AbortSignal.timeout(10000) // 10 second timeout
        });
       
        if (response.ok) {
          const data = await response.json();
          const userConversations = data || [];
          setConversations(userConversations);
          console.log("Loaded previous conversations:", userConversations);
          
          if (userConversations.length > 0) {
            // Sort conversations by most recent first
            const sortedConversations = [...userConversations].sort((a, b) => {
              if (a.timestamp && b.timestamp) {
                return new Date(b.timestamp) - new Date(a.timestamp);
              }
              return 0;
            });
           
            // Map all previous conversations to messages
            const allMessages = [];
            
            sortedConversations.forEach((conversation, index) => {
              // Add user question
              allMessages.push({
                id: `user_${conversation.id}_${index}`,
                sender: 'user',
                content: conversation.question,
                timestamp: conversation.timestamp,
                conversationId: conversation.id
              });
              
              // Add AI response
              allMessages.push({
                id: `ai_${conversation.id}_${index}`,
                sender: 'ai',
                content: conversation.answer,
                timestamp: conversation.timestamp,
                conversationId: conversation.id
              });
            });
           
            setMessages(allMessages);
            console.log("Formatted and set all messages:", allMessages);
            
            // Set the most recent conversation as current
            setCurrentConversationId(sortedConversations[0].id);
          } else {
            console.log("No previous conversations found - showing welcome message");
            // First time user - show welcome message
            setMessages(getInitialMessages(true));
          }
        } else {
          console.error("Failed to load conversations:", response.status);
          setIsConnected(false);
          // Show welcome message if API fails
          setMessages(getInitialMessages(true));
        }
      } catch (error) {
        console.error("Failed to load previous conversations:", error);
        setIsConnected(false);
        // Show welcome message if loading fails
        setMessages(getInitialMessages(true));
      }
    };
   
    loadPreviousConversations();
  }, [apiUrl, navigate]);

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
  const callFastAPI = async (question) => {
    let userId;
   
    try {
      // Get authenticated user ID
      const storedUserInfo = localStorage.getItem('linuxAssistantUser');
      if (storedUserInfo) {
        const parsedUserInfo = JSON.parse(storedUserInfo);
        if (parsedUserInfo && parsedUserInfo.id) {
          userId = parsedUserInfo.id;
          console.log(`Using authenticated user ID: ${userId}`);
        } else {
          throw new Error("No valid user ID found in stored user info");
        }
      } else {
        throw new Error("No user authentication found. Please log in again.");
      }

      console.log(`Sending request to ${apiUrl}/ask with question: ${question} and user_id: ${userId}`);
     
      // Make the actual API request with extended timeout
      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: question,
          user_id: userId
        }),
        signal: AbortSignal.timeout(30000) // 30 second timeout for main request
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
   
    try {
      console.log("Calling API with question:", question);
      const response = await callFastAPI(question);
      console.log("Received API response:", response);
     
      const newAiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: response.answer,
        timestamp: new Date().toISOString(),
        conversationId: response.conversationId
      };
     
      setMessages(prev => [...prev, newAiMessage]);
     
      if (response.conversationId) {
        setCurrentConversationId(response.conversationId);
        
        // Refresh conversations list
        try {
          const userId = userInfo?.id;
          if (userId) {
            const convsResponse = await fetch(`${apiUrl}/conversations/${userId}`, {
              signal: AbortSignal.timeout(10000)
            });
            if (convsResponse.ok) {
              const data = await convsResponse.json();
              setConversations(data || []);
            }
          }
        } catch (refreshError) {
          console.error("Failed to refresh conversations:", refreshError);
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
      timestamp: new Date().toISOString()
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

  return (
    <div className={`${darkMode ? 'dark bg-gray-900' : 'bg-gray-50'} flex flex-col h-screen`}>
      {/* Header */}
      <header className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} shadow px-4 py-3 flex items-center justify-between border-b`}>
        <div className="flex items-center space-x-3">
          <div className="bg-blue-500 rounded-full p-2 text-white cursor-pointer" onClick={() => navigate('/')}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </div>
          <div className="flex items-center">
            <div>
              <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Linux Command Assistant</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Powered by AI</p>
            </div>
            
          </div>
        </div>
          
        <div className="flex items-center space-x-3">
          {userInfo && (
            <div className="flex items-center mr-2">
              <span className={`text-sm hidden sm:inline ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {userInfo.username}
              </span>
            </div>
          )}
         
          <ConnectionStatus
            isConnected={isConnected}
            isDarkMode={darkMode}
            onRetryConnection={() => checkServerHealthWithRetry(3, 8000)}
          />
         
          {/* Dark/Light Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2" />
                <path d="M12 21v2" />
                <path d="M4.22 4.22l1.42 1.42" />
                <path d="M18.36 18.36l1.42 1.42" />
                <path d="M1 12h2" />
                <path d="M21 12h2" />
                <path d="M4.22 19.78l1.42-1.42" />
                <path d="M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            )}
          </button>
         
          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Logout"
            title="Logout"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
         
          {/* Refresh connection button */}
          <button
            onClick={checkServerHealth}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Check server connection"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M8 16H3v5" />
            </svg>
          </button>
         
          {/* API URL configuration button */}
          <button
            onClick={changeApiUrl}
            className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-100 text-gray-600'}`}
            aria-label="Configure API URL"
            title="Configure API URL"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"></path>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
          </button>
        </div>
      </header>
        
      {/* Offline warning banner */}
      {!isConnected && (
        <div className={`px-4 py-3 ${darkMode ? 'bg-yellow-900 border-yellow-800 text-yellow-200' : 'bg-yellow-100 border-yellow-300 text-yellow-800'} border-b`}>
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <div>
                <p className="font-medium">Server connection issue</p>
                <p className="text-sm">
                  The FastAPI server at {apiUrl} is not responding. Ensure the server is running.
                </p>
              </div>
            </div>
            <button
              onClick={() => checkServerHealthWithRetry(3, 8000)}
              className={`px-3 py-1 rounded-md text-sm ${darkMode ? 'bg-yellow-800 hover:bg-yellow-700' : 'bg-yellow-200 hover:bg-yellow-300'}`}
            >
              Reconnect
            </button>
          </div>
        </div>
      )}
     
      {/* Main chat area */}
      <div className={`flex-1 overflow-y-auto p-4 pb-4 ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="max-w-3xl mx-auto">
          {messages.map(message => {
            if (message.sender === 'ai') {
              return <AiMessage key={message.id} message={message} isDarkMode={darkMode} />;
            } else if (message.sender === 'user') {
              return <UserMessage key={message.id} message={message} />;
            } else if (message.sender === 'error') {
              return (
                <ErrorMessage
                  key={message.id}
                  message={message.content}
                  isDarkMode={darkMode}
                  onRetry={() => handleRetryMessage(message.originalQuestion)}
                />
              );
            }
            return null;
          })}
         
          {isLoading && (
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 mr-3 mt-1">
                <div className="bg-blue-500 rounded-full p-2 text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <div className={`${darkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'} rounded-lg px-4 py-3 inline-block`}>
                  <div className="flex items-center space-x-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    <span>AI is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
         
          <div ref={messagesEndRef} />
        </div>
      </div>
     
      {/* Input area */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-t p-4`}>
        <div className="max-w-3xl mx-auto relative">
          <div className={`flex items-end rounded-lg border ${darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-white'} focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500`}>
            <textarea
              className={`flex-1 py-3 px-4 bg-transparent resize-none focus:outline-none ${darkMode ? 'text-white placeholder-gray-400' : 'text-gray-800 placeholder-gray-500'} max-h-32`}
              placeholder={isConnected
                ? "Ask me about Linux commands..."
                : serverCheckAttempts > 2
                  ? `Server at ${apiUrl} seems offline. Click "Configure API URL" to change it.`
                  : "Server disconnected. Please check connection or click Reconnect."
              }
              rows="1"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading || !isConnected}
            />
            <div className="flex px-3 py-2 space-x-2">
              <button
                className={`rounded-full p-1 ${
                  inputValue.trim() && isConnected && !isLoading
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || !isConnected}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-2 text-center">
            {isConnected
              ? "Linux Command Assistant powered by AI. Verify commands before executing."
              : (
                <span>
                  Server: {apiUrl} •
                  {serverCheckAttempts > 3
                    ? <button
                        onClick={changeApiUrl}
                        className="underline ml-1 hover:text-blue-500"
                      >
                        Change API URL
                      </button>
                    : <button
                        onClick={() => checkServerHealthWithRetry(2, 8000)}
                        className="underline ml-1 hover:text-blue-500"
                      >
                        Retry connection
                      </button>
                  }
                </span>
              )
            }
          </p>
        </div>
      </div>
    </div>
  );
}