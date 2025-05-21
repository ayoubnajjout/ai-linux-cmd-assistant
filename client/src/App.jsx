import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LinuxAssistantLanding from './components/LinuxAssistantLanding';
import ChatApp from './components/chat';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LinuxAssistantLanding />} />
        <Route path="/chat" element={<ChatApp />} />
      </Routes>
    </Router>
  );
}

export { App };