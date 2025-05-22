import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import LinuxAssistantLanding from './components/LinuxAssistantLanding';
import ChatApp from './components/chat';
import Auth from './components/Auth';

function App() {
  const [darkMode, setDarkMode] = useState(
    localStorage.getItem('linuxAssistantDarkMode') === 'true' || false
  );
  const [isAuthenticated, setIsAuthenticated] = useState(false);
    // Separate useEffect for authentication check
  useEffect(() => {
    // Check if user is authenticated by checking localStorage
    const userInfo = localStorage.getItem('linuxAssistantUser');
    console.log('App: Checking authentication state:', userInfo ? 'authenticated' : 'not authenticated');
    setIsAuthenticated(!!userInfo);
    
    // Add an event listener for storage changes to detect login/logout
    const handleStorageChange = (e) => {
      if (e.key === 'linuxAssistantUser') {
        console.log('App: localStorage changed for user info, new state:', e.newValue ? 'authenticated' : 'not authenticated');
        setIsAuthenticated(!!e.newValue);
      }
    };
    
    // Handle custom auth-changed event
    const handleAuthChanged = () => {
      const currentUserInfo = localStorage.getItem('linuxAssistantUser');
      console.log('App: Received auth-changed event, state:', currentUserInfo ? 'authenticated' : 'not authenticated');
      setIsAuthenticated(!!currentUserInfo);
    };
    
    // Listen for localStorage and custom events
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleAuthChanged);
    
    // Also set up a periodic check
    const authCheckInterval = setInterval(() => {
      const currentUserInfo = localStorage.getItem('linuxAssistantUser');
      const newState = !!currentUserInfo;
      if (isAuthenticated !== newState) {
        console.log('App: Auth state changed during interval check:', newState ? 'authenticated' : 'not authenticated');
        setIsAuthenticated(newState);
      }
    }, 500); // Check more frequently
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleAuthChanged);
      clearInterval(authCheckInterval);
    };
  }, []);
  
  // Separate useEffect for dark mode
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('linuxAssistantDarkMode', darkMode);
  }, [darkMode]);
  // Convert boolean to string for any props that might cause issues
  const darkModeString = darkMode ? "true" : "false";
  
  // Add some debug logging for authentication state
  console.log('App render - Authentication state:', isAuthenticated ? 'authenticated' : 'not authenticated');
  console.log('localStorage user data:', localStorage.getItem('linuxAssistantUser'));
  
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LinuxAssistantLanding />} />
        <Route 
          path="/chat" 
          element={
            isAuthenticated ? 
            <ChatApp /> : 
            <Navigate to="/login" replace={true} />
          } 
        />
        <Route path="/login" element={<Auth darkMode={darkMode} darkModeString={darkModeString} />} />
      </Routes>
    </Router>
  );
}

export { App };