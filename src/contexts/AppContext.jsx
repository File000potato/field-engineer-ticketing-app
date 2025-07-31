import React, { createContext, useContext, useState } from 'react';

// Default context value
const defaultAppContext = {
  sidebarOpen: false,
  toggleSidebar: () => {},
};

const AppContext = createContext(defaultAppContext);

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  return (
    <AppContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};