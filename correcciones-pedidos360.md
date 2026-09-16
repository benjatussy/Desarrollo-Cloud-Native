# Correcciones — Proyecto Pedidos360 (DSY1107)

Este documento junta las correcciones de código pendientes y la reorganización de carpetas antes de subir los repos a GitHub.

---

## 1. Frontend — el flujo de tokens no llega al backend

**Problema:** el login con MSAL funciona, pero nunca se pide el scope de la API, nunca se obtiene el access token, y `apiRequest()` no manda el header `Authorization`. Resultado: todo llamado al backend devuelve 401.

### 1.1 `authConfig.js`

Separa el request de login (identidad) del request del token de API (para llamar al gateway):

```js
export const msalConfig = {
    auth: {
        clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_AZURE_TENANT_ID}`,
        redirectUri: window.location.origin,
        postLogoutRedirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: 'sessionStorage',
    },
};

// Scopes solo para autenticar al usuario (login)
export const loginRequest = {
    scopes: ['openid', 'profile'],
};

// Scopes para obtener el token que el API Gateway va a validar
export const apiTokenRequest = {
    scopes: [import.meta.env.VITE_API_SCOPE],
};

export const protectedResources = {
    api: {
        endpoint: import.meta.env.VITE_API_BASE_URL,
        scopes: [import.meta.env.VITE_API_SCOPE],
    },
};
```

### 1.2 `VistaPrincipal.tsx` — obtener y adjuntar el token

Agrega una función que pida el token (con `acquireTokenSilent`, y si falla usa `acquireTokenRedirect` como respaldo), y pásala a `apiRequest`:

```tsx
import { useMsal } from '@azure/msal-react';
import { apiTokenRequest } from '../authConfig.js';

// dentro del componente, junto a `instance`/`accounts` que ya tienes:
async function getAccessToken(instance: any, account: any): Promise<string> {
    try {
        const result = await instance.acquireTokenSilent({
            ...apiTokenRequest,
            account,
        });
        return result.accessToken;
    } catch {
        // si el token silencioso falla (ej. expiró la sesión), reintenta con redirect
        await instance.acquireTokenRedirect(apiTokenRequest);
        throw new Error('Redirigiendo para renovar sesión...');
    }
}

// apiRequest ahora recibe el token y lo adjunta
async function apiRequest<T>(
    path: string,
    token: string,
    options?: RequestInit,
): Promise<T> {
    let res: Response;
    try {
        res = await fetch(`${API_BASE}${path}`, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
                ...(options?.headers || {}),
            },
            ...options,
        });
    } catch {
        throw new Error('No se pudo conectar con el servidor. Verifica que el gateway esté activo en el puerto 8089.');
    }

    if (!res.ok) {
        let message = `Error ${res.status} al comunicarse con el servidor`;
        try {
            const body = await res.json();
            message = body?.message || body?.error || message;
        } catch {
            // sin cuerpo JSON, se mantiene el mensaje por defecto
        }
        throw new Error(message);
    }

    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
}
```

Como `UsersApi`, `ItemsApi` y `CategoriesApi` llaman a `apiRequest` internamente, cada una de sus funciones también necesita recibir el `token` y pasarlo. Por ejemplo:

```tsx
const UsersApi = {
    list: (token: string) => apiRequest<UserResponse[]>('/users', token),
    create: (token: string, data: { name: string; email: string; password: string }) =>
        apiRequest<UserResponse>('/users', token, { method: 'POST', body: JSON.stringify(data) }),
    // ...igual para el resto
};
```

Y en los `useEffect`/handlers donde hoy llamas `UsersApi.list()`, `ItemsApi.list()`, etc., primero obtén el token con `getAccessToken(instance, accounts[0])` y pásalo.

### 1.3 `.gitignore` del frontend

Agrega `.env` para no subir tus credenciales de Azure AD al repo (sube un `.env.example` sin valores reales en su lugar):

```gitignore
# Variables de entorno (contiene client-id / tenant-id)
.env
.env.local
```

---

## 2. Backend — CORS no está activo en el gateway

**Problema:** `api-gateway/api-gateway/src/main/resources/application.properties` (el archivo que realmente usa tu app) no tiene CORS configurado. La configuración de CORS que sí existe está en `bin/src/main/resources/application.yml`, una carpeta de build que no se usa en tiempo de ejecución.

### 2.1 Agrega esto a `application.properties`

```properties
# CORS para el frontend
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowedOrigins=http://localhost:5173
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowedMethods=GET,POST,PUT,DELETE,PATCH,OPTIONS
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowedHeaders=*
spring.cloud.gateway.globalcors.cors-configurations.[/**].allowCredentials=true
spring.cloud.gateway.globalcors.cors-configurations.[/**].maxAge=3600
```

Cuando despliegues, cambia `http://localhost:5173` por la URL real donde quede publicado el frontend.

### 2.2 `.gitignore` del `api-gateway`

La carpeta `bin/` (generada por Eclipse/STS) no está excluida y no debería subirse al repo. Agrégala:

```gitignore
bin/
```

---

## 3. Reorganización de carpetas

Hoy cada microservicio tiene una carpeta duplicada con su propio nombre (ej. `user/user/...`), quedó una carpeta `bin/` de build dentro del gateway, y hay un `DCN.zip` suelto con una copia antigua del proyecto (sin MySQL). Antes de subir a GitHub, deja la estructura así:

**Repo del backend** (o un repo por microservicio, según lo que pida tu profe):

```
pedidos360-backend/
├── api-gateway/
│   ├── src/
│   ├── pom.xml
│   └── .gitignore
├── user-service/
│   ├── src/
│   ├── pom.xml
│   └── .gitignore
├── item-service/
│   ├── src/
│   ├── pom.xml
│   └── .gitignore
└── category-service/
    ├── src/
    ├── pom.xml
    └── .gitignore
```

Pasos:
1. Elimina el nivel duplicado: mueve el contenido de `user/user/*` a `user-service/*` (y lo mismo para `item`, `categories`, `api-gateway`), en vez de dejar `user/user/`.
2. Borra la carpeta `bin/` dentro de `api-gateway/api-gateway/`.
3. Borra el `DCN.zip` suelto (o, si quieres conservarlo como respaldo local, no lo incluyas en el repo).
4. Verifica que ningún `target/` quede trackeado (ya está bien en el `.gitignore` de cada servicio).

**Repo del frontend:**

```
pedidos360-frontend/
├── src/
│   ├── VistaPrincipal.tsx
│   ├── main.tsx
│   └── assets/
├── public/
├── authConfig.js
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig*.json
├── .env.example
└── .gitignore
```

Aquí no hay carpeta duplicada que corregir; solo asegúrate de que `.env` (con tus IDs reales) quede fuera del repo y subas `.env.example` con las variables sin valores.

---

## Resumen de pendientes

- [ ] Frontend: pedir el scope de la API y adjuntar el JWT en cada llamada al backend
- [ ] Backend: activar CORS en `application.properties` del gateway
- [ ] `.gitignore` del gateway: excluir `bin/`
- [ ] `.gitignore` del frontend: excluir `.env`
- [ ] Aplanar las carpetas duplicadas (`user/user` → `user-service`, etc.)
- [ ] Eliminar `DCN.zip` y la carpeta `bin/` del contenido a subir
