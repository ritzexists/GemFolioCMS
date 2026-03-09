import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { MathJaxContext } from 'better-react-mathjax';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MathJaxContext>
      <App />
    </MathJaxContext>
  </StrictMode>,
);
