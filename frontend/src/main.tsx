import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '@agnostos/components/styles.css';
import '@agnostos/layout/styles.css';
import { UIRoot } from '@agnostos/core';
import { ToastProvider, ConfirmProvider, Card, Button, Text, ProgressCircle } from '@agnostos/components';
import { Flex } from '@agnostos/layout';
import { LogIn } from 'lucide-react';
import VistaPrincipal from './VistaPrincipal';

import { PublicClientApplication, EventType } from '@azure/msal-browser';
import { MsalProvider, useMsal, useIsAuthenticated } from '@azure/msal-react';

import { msalConfig, loginRequest } from '../authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

await msalInstance.initialize();

const accounts = msalInstance.getAllAccounts();
if (accounts.length > 0) {
  msalInstance.setActiveAccount(accounts[0]);
}

msalInstance.addEventCallback((event: any) => {
  if (event.eventType === EventType.LOGIN_SUCCESS && event.payload?.account) {
    msalInstance.setActiveAccount(event.payload.account);
  }
});

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { instance, inProgress } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [loggedOut, setLoggedOut] = useState(() => sessionStorage.getItem('msal_logged_out') === 'true');

  useEffect(() => {
    if (!isAuthenticated && inProgress === 'none' && !loggedOut) {
      instance.loginRedirect(loginRequest);
    }
  }, [isAuthenticated, inProgress, loggedOut, instance]);

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (loggedOut) {
    return (
      <Flex direction="column" align="center" justify="center" gap="lg" style={{ minHeight: '100vh' }}>
        <Card variant="default" shadow="md" style={{ maxWidth: 420, width: '100%', padding: 32 }}>
          <Flex direction="column" align="center" gap="md">
            <Text variant="h2" weight="bold">Sesión Finalizada</Text>
            <Text variant="body" color="muted" style={{ textAlign: 'center' }}>
              Has cerrado sesión en Microsoft Entra ID.
            </Text>
            <Button
              variant="primary"
              icon={LogIn}
              onClick={() => {
                sessionStorage.removeItem('msal_logged_out');
                setLoggedOut(false);
                instance.loginRedirect(loginRequest);
              }}
            >
              Iniciar sesión nuevamente
            </Button>
          </Flex>
        </Card>
      </Flex>
    );
  }

  return (
    <Flex direction="column" align="center" justify="center" gap="md" style={{ minHeight: '100vh' }}>
      <ProgressCircle size={48} />
      <Text variant="body" color="muted">Autenticando con Microsoft Entra ID...</Text>
    </Flex>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MsalProvider instance={msalInstance}>
      <UIRoot theme="system">
        <ToastProvider position="bottom-right">
          <ConfirmProvider>
            <AuthGuard>
              <VistaPrincipal />
            </AuthGuard>
          </ConfirmProvider>
        </ToastProvider>
      </UIRoot>
    </MsalProvider>
  </StrictMode>,
);