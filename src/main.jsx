import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import QuorumSchedulingForm from './App';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QuorumSchedulingForm />
  </StrictMode>
);
