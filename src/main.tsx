import { createRoot } from 'react-dom/client';
import 'leaflet/dist/leaflet.css';
import './index.css';
import App from './App';
import AuthGate from './components/AuthGate';

createRoot(document.getElementById('root')!).render(
  <AuthGate>
    <App />
  </AuthGate>
);
