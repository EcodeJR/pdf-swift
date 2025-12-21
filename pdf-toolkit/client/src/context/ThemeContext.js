import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // Force Light Mode for MVP
    const [theme] = useState('light');

    useEffect(() => {
        const root = window.document.documentElement;
        root.classList.remove('dark');
        root.classList.add('light');
        // Clear stored theme to avoid conflicts if re-enabled later
        localStorage.removeItem('theme');
    }, []);

    const toggleTheme = () => {
        // Disabled for MVP
        console.log('Dark mode is currently disabled for MVP launch.');
    };

    const setExplicitTheme = (newTheme) => {
        // Disabled for MVP
        console.log('Theme switching is currently disabled for MVP launch.');
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setExplicitTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
