import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { MathJaxContext } from 'better-react-mathjax';
import { HelmetProvider } from 'react-helmet-async';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <MathJaxContext>
        <App />
      </MathJaxContext>
    </HelmetProvider>
  </StrictMode>,
);
