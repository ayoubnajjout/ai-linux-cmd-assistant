import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LoadingScreen from './LoadingScreen';

// Sample initial chat data
const initialMessages = [
  { 
    id: 1, 
    sender: 'ai', 
    content: 'Hello! I\'m your Linux command assistant. Ask me anything about Linux commands and I\'ll help you out!',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString()
  }
];

// AI Message Component
const AiMessage = ({ message, isDarkMode }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
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
        <div className="text-xs text-gray-500 mt-1 ml-1">{formattedTime}</div>
      </div>
    </div>
  );
};

// User Message Component
const UserMessage = ({ message }) => {
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  return (
    <div className="flex items-start mb-4 justify-end">
      <div className="flex-1 text-right">
        <div className="bg-blue-600 rounded-lg px-4 py-3 inline-block text-left max-w-full ml-12">
          <div className="whitespace-pre-wrap text-white">
            {message.content}
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 mr-1">{formattedTime}</div>
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
              <div className="font-medium text-sm">Connection Error</div>
              <div className="text-sm mt-1">{message}</div>
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

// Connection status indicator
const ConnectionStatus = ({ isConnected, isDarkMode }) => {
  return (
    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
      isConnected 
        ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
        : isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
      <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
};

// Main ChatApp Component
export default function ChatApp() {
  const [messages, setMessages] = useState(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('linuxAssistantDarkMode') === 'true' || false
  );
  const [isConnected, setIsConnected] = useState(true);
  const [apiUrl, setApiUrl] = useState('http://localhost:8000'); // FastAPI server URL
  const [initializing, setInitializing] = useState(true);
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

  // Handle the initial question if provided through navigation state
  useEffect(() => {
    const demoQuestion = location.state?.demoQuestion;
    
    // Check if dark mode preference was passed
    if (location.state?.darkModePreference !== undefined) {
      setDarkMode(location.state.darkModePreference);
    }
    
    // If a question was passed via navigation
    if (demoQuestion) {
      // Set a timeout to simulate loading
      const timer = setTimeout(() => {
        // Add user message
        const userMessage = {
          id: Date.now(),
          sender: 'user',
          content: demoQuestion,
          timestamp: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInitializing(false);
        
        // Process the question
        processQuestion(demoQuestion);
      }, 2000); // 2 second loading display
      
      return () => clearTimeout(timer);
    } else {
      setInitializing(false);
    }
  }, [location.state]);

  // Check server health on component mount
  useEffect(() => {
    checkServerHealth();
  }, []);

  const checkServerHealth = async () => {
    try {
      const response = await fetch(`${apiUrl}/health`);
      if (response.ok) {
        setIsConnected(true);
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      setIsConnected(false);
    }
  };

  const callFastAPI = async (question) => {
    try {
      const response = await fetch(`${apiUrl}/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setIsConnected(true);
      return data.answer;
    } catch (error) {
      setIsConnected(false);
      console.error('Error calling FastAPI:', error);
      throw error;
    }
  };

  const processQuestion = async (question) => {
    setIsLoading(true);
    
    try {
      // Call FastAPI backend
      const aiResponse = await callFastAPI(question);
      
      const newAiMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, newAiMessage]);
    } catch (error) {
      // Add error message
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'error',
        content: `Failed to get response from server. Please check if the FastAPI server is running on ${apiUrl}`,
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
    
    // Add user message
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
      const aiResponse = await callFastAPI(originalQuestion);
      
      const newAiMessage = {
        id: Date.now(),
        sender: 'ai',
        content: aiResponse,
        timestamp: new Date().toISOString()
      };
      
      // Replace the error message with the successful response
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
          <div>
            <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Linux Command Assistant</h1>
            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Powered by AI</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <ConnectionStatus isConnected={isConnected} isDarkMode={darkMode} />
          
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
        </div>
      </header>
      
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
              placeholder={isConnected ? "Ask me about Linux commands..." : "Server disconnected. Please check connection."}
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
              : `Server: ${apiUrl} • Check if FastAPI server is running`
            }
          </p>
        </div>
      </div>
    </div>
  );
}