import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { BrowserRouter } from 'react-router-dom';
import { NewAuthProvider } from '@/contexts/NewAuthContext';
import * as fflate from 'fflate';
import { ProjectProvider } from '@/contexts/ProjectContext';

window.fflate = fflate;

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <NewAuthProvider>
        <ProjectProvider>
          <App />
        </ProjectProvider>
      </NewAuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);