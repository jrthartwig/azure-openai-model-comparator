import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add a helper class to detect dark mode for syntax highlighting
// This will be used by the CodeBlock component in ResponsePanel
const setDarkModeClass = () => {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

// Set the class initially
setDarkModeClass();

// Update the class when the preferred color scheme changes
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', setDarkModeClass);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
