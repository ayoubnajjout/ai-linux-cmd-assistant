import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LinuxAssistantLanding() {
  const [isVisible, setIsVisible] = useState(false);
  const [demoQuestion, setDemoQuestion] = useState('');
  const [typedText, setTypedText] = useState('');
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('linuxAssistantDarkMode') === 'true' || false
  );
  const navigate = useNavigate();
  
  const demoQuestions = [
    "How do I find all files larger than 100MB?",
    "What's the command to check disk space?",
    "How to create a backup script?",
    "Show me how to use grep with regex",
    "How to monitor system processes?"
  ];

  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('linuxAssistantDarkMode', darkMode);
  }, [darkMode]);

  // Typewriter effect for hero text
  useEffect(() => {
    setIsVisible(true);
    const text = "AI Linux Cmd assistant";
    let index = 0;
    const timer = setInterval(() => {
      if (index < text.length) {
        setTypedText(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
      }
    }, 80);
    
    return () => clearInterval(timer);
  }, []);

  // When toggling dark mode, update localStorage and fire a custom event
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('linuxAssistantDarkMode', newMode);
    window.dispatchEvent(new Event('dark-mode-changed'));
  };

  const handleDemoRequest = () => {
    if (demoQuestion.trim()) {
      navigate('/chat', { 
        state: { 
          demoQuestion,
          darkModePreference: darkMode
        } 
      });
    }
  };

  const selectDemoQuestion = (question) => {
    setDemoQuestion(question);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleDemoRequest();
    }
  };

  return (
    <div className={`min-h-screen overflow-hidden ${darkMode 
      ? 'dark bg-gray-900 text-white' 
      : 'bg-gray-50 text-gray-800'}`}> {/* Changed light mode background and text */}
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className={`absolute w-1 h-1 ${darkMode ? 'bg-blue-400' : 'bg-blue-500'} rounded-full animate-pulse`} // Adjusted particle color for light mode
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className={`relative z-10 p-6 ${darkMode ? 'border-gray-800' : ''}`}>
        <nav className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`${darkMode ? 'text-white' : 'text-white'}`}> {/* Icon color on gradient is fine */}
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <path d="M2 12h20" />
                <path d="M2 16h20" />
                <path d="M2 20h20" />
              </svg>
            </div>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Linux Assistant</h1>
              <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI-Powered Command Expert</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Dark/Light Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-yellow-400' : 'hover:bg-gray-200 text-gray-600'}`} // Adjusted toggle colors
              aria-label="Toggle dark mode"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Moon icon for dark mode */}
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {/* Sun icon for light mode */}
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
            </button>            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>Features</a>
              <a href="#demo" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>Demo</a>
              <a href="#about" className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-blue-600'} transition-colors`}>About</a>
              <button 
                onClick={() => navigate('/login', { state: { darkModePreference: darkMode } })}
                className="bg-gradient-to-r from-blue-600 to-cyan-600 px-4 py-2 rounded-lg text-white hover:from-blue-700 hover:to-cyan-700 transition-colors"
              >
                Login / Register
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10">
        <div className={`max-w-6xl mx-auto px-6 pt-12 pb-20 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="text-center mb-16">
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <path d="M2 12h20" />
                  <path d="M2 16h20" />
                  <path d="M2 20h20" />
                </svg>
              </div>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-600 bg-clip-text text-transparent">
              {typedText}
              <span className="animate-blink">|</span>
            </h1>
            
            <p className={`text-xl md:text-2xl ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-8 max-w-3xl mx-auto leading-relaxed`}>
              Master Linux commands and shell scripting with our advanced AI assistant. 
              Get instant help, learn best practices, and automate your workflow.
            </p>            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-lg text-white hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg" // text-white is good for this button
                onClick={() => navigate('/login', { state: { darkModePreference: darkMode } })}
              >
                Get Started
              </button>
              <button className={`px-8 py-4 border-2 rounded-xl font-semibold text-lg transition-all duration-200 ${darkMode ? 'border-blue-500 text-white hover:bg-blue-500 hover:bg-opacity-20' : 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'}`}>
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>1000+</div>
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Linux Commands</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-cyan-400' : 'text-cyan-600'} mb-2`}>24/7</div>
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>AI Assistance</div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'} mb-2`}>99.9%</div>
                <div className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className={`py-20 ${darkMode ? 'bg-black bg-opacity-30' : 'bg-gray-100'}`}>
          <div className="max-w-6xl mx-auto px-6">
            <h2 className={`text-4xl font-bold text-center mb-16 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Powerful Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className={`${darkMode ? 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70' : 'bg-white shadow-lg hover:shadow-xl'} rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105`}>
                <div className={`w-12 h-12 ${darkMode ? 'bg-blue-500' : 'bg-blue-500'} rounded-xl flex items-center justify-center mb-6 text-white`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1" />
                    <path d="M3 10v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Command Validation</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Get safe, tested commands with explanations and best practices.</p>
              </div>
              
              <div className={`${darkMode ? 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70' : 'bg-white shadow-lg hover:shadow-xl'} rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105`}>
                <div className={`w-12 h-12 ${darkMode ? 'bg-cyan-500' : 'bg-cyan-500'} rounded-xl flex items-center justify-center mb-6 text-white`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Script Generation</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Create custom shell scripts for automation and complex tasks.</p>
              </div>
              
              <div className={`${darkMode ? 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70' : 'bg-white shadow-lg hover:shadow-xl'} rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105`}>
                <div className={`w-12 h-12 ${darkMode ? 'bg-purple-500' : 'bg-purple-500'} rounded-xl flex items-center justify-center mb-6 text-white`}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className={`text-xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Learning Assistant</h3>
                <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Learn Linux concepts with step-by-step explanations and examples.</p>
              </div>
            </div>
          </div>
        </section>        {/* Demo Section */}
        <section id="demo" className={`py-20 ${darkMode ? '' : 'bg-gray-50'}`}> {/* Match main bg or slightly different */}
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className={`text-4xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>Example Questions</h2>
              <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Our AI can answer all these questions and more</p>
            </div>
              <div className={`${darkMode ? 'bg-gray-800 bg-opacity-50' : 'bg-white shadow-xl'} rounded-2xl p-8 backdrop-blur-sm`}>
              <div className="mb-6">
                <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                  Common Linux commands our AI can help with:
                </label>
                <div className="relative">
                  <div className={`w-full px-4 py-4 border rounded-xl text-lg ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-300 text-gray-800'}`}>
                    How do I find all files larger than 100MB?
                  </div>
                  <button
                    onClick={() => navigate('/login', { state: { darkModePreference: darkMode } })}
                    className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all duration-200"
                  >
                    Sign In
                  </button>
                </div>
              </div>
              
              <div className="mb-4">
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-3`}>Popular Linux command questions:</p>
                <div className="flex flex-wrap gap-2">
                  {demoQuestions.map((question, index) => (
                    <div
                      key={index}
                      className={`px-4 py-2 rounded-lg text-sm transition-colors duration-200 ${darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
                <div className={`${darkMode ? 'border-gray-600' : 'border-gray-300'} border-t pt-6`}>
                <div className={`flex items-center justify-center space-x-4 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Always Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Expert Knowledge</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Safe Commands</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className={`py-20 ${darkMode ? 'bg-black bg-opacity-30' : 'bg-gray-100'}`}>
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className={`text-4xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-900'}`}>About Our AI Model</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Trained on Linux Expertise</h3>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-6 leading-relaxed`}>
                  Our AI model has been specifically trained on thousands of Linux commands, 
                  shell scripting patterns, and system administration best practices. 
                  It understands context, provides safe recommendations, and explains 
                  complex concepts in simple terms.
                </p>
                <ul className={`space-y-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Comprehensive command database</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    <span>Context-aware responses</span>
                  </li>
                  <li className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span>Safety-first approach</span>
                  </li>
                </ul>
              </div>
              <div className="relative">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-1">
                  <div className={`${darkMode ? 'bg-gray-900' : 'bg-white border border-gray-200'} rounded-xl p-6`}>
                    <div className={`${darkMode ? 'text-green-400' : 'text-green-600'} font-mono text-sm mb-4`}>
                      $ ./linux_assistant --help
                    </div>
                    <div className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} text-sm space-y-2`}>
                      <div>Linux Assistant v2.0</div>
                      <div className={`${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>✓ GPT-2 Based Architecture</div>
                      <div className={`${darkMode ? 'text-cyan-400' : 'text-cyan-600'}`}>✓ 1000+ Commands Trained</div>
                      <div className={`${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>✓ Real-time Processing</div>
                      <div className={`${darkMode ? 'text-green-400' : 'text-green-600'}`}>✓ Safety Validated</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-black bg-opacity-50' : 'bg-gray-200'} py-12`}>
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white"> {/* Icon on gradient is fine */}
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <path d="M2 12h20" />
                  <path d="M2 16h20" />
                  <path d="M2 20h20" />
                </svg>
              </div>
              <div>
                <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Linux Assistant</div>
                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI-Powered Command Expert</div>
              </div>
            </div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} text-sm`}>
              © 2024 Linux Assistant. Powered by advanced AI technology.
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        .animate-blink {
          animation: blink 1s infinite;
        }
      `}</style>
    </div>
  );
}
