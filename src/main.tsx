import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { I18nProvider } from './lib/i18n';
import { TripsProvider } from './lib/trips';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <I18nProvider>
      <TripsProvider>
        <App />
        <Toaster position="top-center" richColors />
      </TripsProvider>
    </I18nProvider>
  </StrictMode>
);
