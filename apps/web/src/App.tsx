import { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // This runs once when the app starts. It checks for the token!
  useEffect(() => {
    const token = localStorage.getItem('snipq_token');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // The Traffic Cop: If true, show Dashboard. If false, show Login.
  return (
    isAuthenticated ? <Dashboard /> : <Auth />
  )
}

export default App;