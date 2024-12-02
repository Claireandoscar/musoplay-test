import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import AnalyticsProvider from './components/Analytics/Provider';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
 <React.StrictMode>
   <AnalyticsProvider>
     <App />
   </AnalyticsProvider>
 </React.StrictMode>
);