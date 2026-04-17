import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import '../css/app.css';

// Detect if running in subdirectory (for Laragon setup)
const basename = window.location.pathname.includes('/payment-app')
    ? '/payment-app/public'
    : '';

ReactDOM.createRoot(document.getElementById('app')).render(
    <React.StrictMode>
        <BrowserRouter basename={basename}>
            <App />
        </BrowserRouter>
    </React.StrictMode>
);
