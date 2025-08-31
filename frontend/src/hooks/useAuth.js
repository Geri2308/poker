import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAdmin, setIsAdmin] = useState(null); // null = not logged in, true = admin, false = viewer
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user has existing session
    const savedAuth = localStorage.getItem('poker-auth');
    const savedTime = localStorage.getItem('poker-auth-time');
    
    if (savedAuth && savedTime) {
      const authTime = parseInt(savedTime);
      const currentTime = Date.now();
      const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours
      
      // Check if session is still valid
      if (currentTime - authTime < sessionDuration) {
        setIsAdmin(savedAuth === 'admin');
      } else {
        // Session expired, clear storage
        localStorage.removeItem('poker-auth');
        localStorage.removeItem('poker-auth-time');
      }
    }
    
    setIsLoading(false);
  }, []);

  const loginAsAdmin = () => {
    setIsAdmin(true);
    localStorage.setItem('poker-auth', 'admin');
    localStorage.setItem('poker-auth-time', Date.now().toString());
  };

  const loginAsViewer = () => {
    setIsAdmin(false);
    localStorage.setItem('poker-auth', 'viewer');
    localStorage.setItem('poker-auth-time', Date.now().toString());
  };

  const logout = () => {
    setIsAdmin(null);
    localStorage.removeItem('poker-auth');
    localStorage.removeItem('poker-auth-time');
  };

  const extendSession = () => {
    if (isAdmin !== null) {
      localStorage.setItem('poker-auth-time', Date.now().toString());
    }
  };

  return {
    isAdmin,
    isLoading,
    loginAsAdmin,
    loginAsViewer,
    logout,
    extendSession
  };
};