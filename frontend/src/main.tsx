import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@agnostos/components/styles.css';
import '@agnostos/layout/styles.css';
import { UIRoot } from '@agnostos/core';
import { ToastProvider, ConfirmProvider } from '@agnostos/components';
import VistaPrincipal from './VistaPrincipal';

import { PublicClientApplication } from '@azure/msal-browser';
import { MsalProvider } from '@azure/msal-react';

import { msalConfig } from '../authConfig.js';

const msalInstance = new PublicClientApplication(msalConfig);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <UIRoot theme="system">
        <ToastProvider position="bottom-right">
          <ConfirmProvider>
            <VistaPrincipal />
          </ConfirmProvider>
        </ToastProvider>
      </UIRoot>
    </MsalProvider>
  </StrictMode>,
)