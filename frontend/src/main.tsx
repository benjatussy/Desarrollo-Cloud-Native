import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@agnostos/components/styles.css';
import '@agnostos/layout/styles.css';
import { UIRoot } from '@agnostos/core';
import { ToastProvider, ConfirmProvider } from '@agnostos/components';
import VistaPrincipal from './VistaPrincipal';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <UIRoot theme="system">
      <ToastProvider position="bottom-right">
        <ConfirmProvider>
          <VistaPrincipal />
        </ConfirmProvider>
      </ToastProvider>
    </UIRoot>
  </StrictMode>,
)