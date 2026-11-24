import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AppProvider } from './context.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppProvider>
        <App />
        <Toaster position="top-center" toastOptions={{ style: { fontFamily: 'Figtree, sans-serif' } }} />
      </AppProvider>
    </BrowserRouter>
  </React.StrictMode>
);
