import React from 'react';
import { createRoot } from 'react-dom/client';
import clarity from '@microsoft/clarity';
import './index.css';
import App from './App';
import AnalyticsProvider from './components/Analytics/Provider';

clarity.init('p7rboopwor');

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
 <React.StrictMode>
   <AnalyticsProvider>
     <App />
   </AnalyticsProvider>
 </React.StrictMode>
);