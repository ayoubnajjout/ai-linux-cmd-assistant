import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Auth({ darkMode, darkModeString }) {
  // Always use localStorage for dark mode, and listen for changes
  const getDarkMode = () => localStorage.getItem('linuxAssistantDarkMode') === 'true';
  const [isDarkMode, setIsDarkMode] = useState(getDarkMode());

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'linuxAssistantDarkMode') {
        setIsDarkMode(getDarkMode());
      }
    };
    window.addEventListener('storage', handleStorage);
    // Also listen for custom event in case of same-tab toggling
    const handleCustom = () => setIsDarkMode(getDarkMode());
    window.addEventListener('dark-mode-changed', handleCustom);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('dark-mode-changed', handleCustom);
    };
  }, []);

  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Get API URL from localStorage if available, otherwise use default
  const apiUrl = localStorage.getItem('linuxAssistantApiUrl') || 'http://localhost:8000';

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleToggle = () => {
    setIsLogin(!isLogin);
    setError('');
  };

  const validateForm = () => {
    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        return false;
      }
    } else {
      if (!formData.username || !formData.email || !formData.password) {
        setError('All fields are required');
        return false;
      }
      
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setError('Please enter a valid email address');
        return false;
      }
      
      // Password length check
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    return true;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      console.log(`Submitting ${isLogin ? 'login' : 'registration'} request to ${apiUrl}${isLogin ? '/login' : '/register'}`);
      
      const endpoint = isLogin ? '/login' : '/register';
      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      // Log raw response for debugging
      console.log('Authentication response status:', response.status);
      
      // Get response data
      let data;
      try {
        const responseText = await response.text();
        console.log('Response text:', responseText);
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid server response format');
      }
      
      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }
      
      console.log('Authentication successful:', data);
      
      if (!data.user_id) {
        console.error('Server response missing user_id:', data);
        throw new Error('Invalid server response: missing user ID');
      }
      
      // Save user info in localStorage
      const userInfo = {
        id: data.user_id,
        username: isLogin ? data.username : formData.username
      };
      
      console.log('Saving user info to localStorage:', userInfo);
      localStorage.setItem('linuxAssistantUser', JSON.stringify(userInfo));
      
      // Dispatch a custom event to signal authentication change
      window.dispatchEvent(new Event('auth-changed'));
      
      // Small delay to ensure localStorage is updated before navigation
      setTimeout(() => {
        // Navigate to chat with auth state
        navigate('/chat', { 
          state: { 
            authenticated: true,
            darkModePreference: darkMode,
            userId: data.user_id,
            username: isLogin ? data.username : formData.username
          } 
        });
      }, 100);
      
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className={`min-h-screen flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`max-w-md w-full mx-auto rounded-2xl overflow-hidden shadow-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-center mt-6">
          <div className="bg-blue-500 rounded-full p-3 text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 8V4H8" />
              <rect x="2" y="2" width="20" height="8" rx="2" />
              <path d="M2 12h20" />
              <path d="M2 16h20" />
              <path d="M2 20h20" />
            </svg>
          </div>
        </div>
        <div className={`p-8 ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
          <h2 className="text-2xl font-bold mb-6 text-center">
            {isLogin ? 'Sign In to Linux Assistant' : 'Create Your Account'}
          </h2>
          {error && (
            <div className={`mb-4 p-3 rounded ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>{error}</div>
          )}
          <form onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter your username"
                />
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter your email"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 rounded-lg ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-500'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 flex justify-center items-center"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              )}
            </button>
          </form>
          <div className="text-center mt-6">
            <button
              onClick={handleToggle}
              className={`text-blue-500 hover:underline font-medium ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={loading}
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
          <div className={`text-center mt-8 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Linux Command Assistant helps you learn and use Linux commands with AI assistance
          </div>
        </div>
        <div className={`py-4 text-center ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-50 text-gray-600'}`}>
          <button
            onClick={() => navigate('/')}
            className="text-sm flex items-center justify-center space-x-1 mx-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span>Back to home</span>
          </button>
        </div>
      </div>
    </div>
  );
}