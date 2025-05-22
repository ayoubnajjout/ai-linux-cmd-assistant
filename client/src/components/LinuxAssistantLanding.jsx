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

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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
      : 'bg-gradient-to-br from-gray-900 via-blue-900 to-black text-white'}`}>
      
      {/* Animated background particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-blue-400 rounded-full animate-pulse"
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
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="8" rx="2" />
                <path d="M2 12h20" />
                <path d="M2 16h20" />
                <path d="M2 20h20" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Linux Assistant</h1>
              <p className="text-xs text-gray-400">AI-Powered Command Expert</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Dark/Light Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className={`p-2 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-800 text-gray-300'}`}
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
            </button>            <div className="hidden md:flex items-center space-x-6">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#demo" className="text-gray-300 hover:text-white transition-colors">Demo</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
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
            
            <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Master Linux commands and shell scripting with our advanced AI assistant. 
              Get instant help, learn best practices, and automate your workflow.
            </p>            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-cyan-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                onClick={() => navigate('/login', { state: { darkModePreference: darkMode } })}
              >
                Get Started
              </button>
              <button className="px-8 py-4 border-2 border-blue-500 rounded-xl font-semibold text-lg hover:bg-blue-500 hover:bg-opacity-20 transition-all duration-200">
                Learn More
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">1000+</div>
                <div className="text-gray-400">Linux Commands</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400 mb-2">24/7</div>
                <div className="text-gray-400">AI Assistance</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
                <div className="text-gray-400">Accuracy Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <section id="features" className="py-20 bg-black bg-opacity-30">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-4xl font-bold text-center mb-16">Powerful Features</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-8 hover:bg-opacity-70 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 12l2 2 4-4" />
                    <path d="M21 12c.552 0 1-.448 1-1V5c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v6c0 .552.448 1 1 1" />
                    <path d="M3 10v6c0 .552.448 1 1 1h16c.552 0 1-.448 1-1v-6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Command Validation</h3>
                <p className="text-gray-400">Get safe, tested commands with explanations and best practices.</p>
              </div>
              
              <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-8 hover:bg-opacity-70 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-cyan-500 rounded-xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <polyline points="10,9 9,9 8,9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Script Generation</h3>
                <p className="text-gray-400">Create custom shell scripts for automation and complex tasks.</p>
              </div>
              
              <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-8 hover:bg-opacity-70 transition-all duration-300 hover:transform hover:scale-105">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-4">Learning Assistant</h3>
                <p className="text-gray-400">Learn Linux concepts with step-by-step explanations and examples.</p>
              </div>
            </div>
          </div>
        </section>        {/* Demo Section */}
        <section id="demo" className="py-20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-6">Example Questions</h2>
              <p className="text-xl text-gray-300">Our AI can answer all these questions and more</p>
            </div>
              <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-8 backdrop-blur-sm">
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Common Linux commands our AI can help with:
                </label>
                <div className="relative">
                  <div className="w-full px-4 py-4 bg-gray-700 border border-gray-600 rounded-xl text-white text-lg">
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
                <p className="text-sm text-gray-400 mb-3">Popular Linux command questions:</p>
                <div className="flex flex-wrap gap-2">
                  {demoQuestions.map((question, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 bg-gray-700 rounded-lg text-sm text-gray-300 transition-colors duration-200"
                    >
                      {question}
                    </div>
                  ))}
                </div>
              </div>
                <div className="border-t border-gray-600 pt-6">
                <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
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
        <section id="about" className="py-20 bg-black bg-opacity-30">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <h2 className="text-4xl font-bold mb-8">About Our AI Model</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div className="text-left">
                <h3 className="text-2xl font-bold mb-4 text-blue-400">Trained on Linux Expertise</h3>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Our AI model has been specifically trained on thousands of Linux commands, 
                  shell scripting patterns, and system administration best practices. 
                  It understands context, provides safe recommendations, and explains 
                  complex concepts in simple terms.
                </p>
                <ul className="space-y-3 text-gray-300">
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
                  <div className="bg-gray-900 rounded-xl p-6">
                    <div className="text-green-400 font-mono text-sm mb-4">
                      $ ./linux_assistant --help
                    </div>
                    <div className="text-gray-300 text-sm space-y-2">
                      <div>Linux Assistant v2.0</div>
                      <div className="text-blue-400">✓ GPT-2 Based Architecture</div>
                      <div className="text-cyan-400">✓ 1000+ Commands Trained</div>
                      <div className="text-purple-400">✓ Real-time Processing</div>
                      <div className="text-green-400">✓ Safety Validated</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-black bg-opacity-50 py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" />
                  <path d="M2 12h20" />
                  <path d="M2 16h20" />
                  <path d="M2 20h20" />
                </svg>
              </div>
              <div>
                <div className="font-bold">Linux Assistant</div>
                <div className="text-xs text-gray-400">AI-Powered Command Expert</div>
              </div>
            </div>
            <div className="text-gray-400 text-sm">
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
