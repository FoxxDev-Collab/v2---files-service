import React, { useState, useEffect } from 'react';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    setDarkMode(isDarkMode);
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode.toString());
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
      <div className="mb-4">
        <label htmlFor="darkMode" className="flex items-center cursor-pointer">
          <div className="relative">
            <input type="checkbox" id="darkMode" className="sr-only" checked={darkMode} onChange={toggleDarkMode} />
            <div className="block bg-gray-600 w-14 h-8 rounded-full"></div>
            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition ${darkMode ? 'transform translate-x-full bg-blue-400' : ''}`}></div>
          </div>
          <div className="ml-3 text-gray-700 font-medium">
            Dark Mode
          </div>
        </label>
      </div>
      {/* Add more settings as needed */}
    </div>
  );
};

export default Settings;