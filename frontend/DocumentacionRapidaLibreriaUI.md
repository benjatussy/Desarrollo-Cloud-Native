# Comandos Importantes

Estos comandos son clave para el flujo de trabajo y desarrollo en Agnostos UI.

## Desarrollo y Compilación

### Compilar un paquete específico
```bash
npm run build --workspace=@agnostos/components
```

### Compilar todos los paquetes de la librería
```bash
npm run build:packages
```

### Generar paquetes comprimidos (.tgz)
```bash
npm run release
```

---

## Instalación

### Instalar un paquete desde npm (una vez publicado)
```bash
npm install @agnostos/components
```

### Instalar desde un archivo local .tgz
```bash
npm install agnostos-components-1.0.0.tgz
```

### Instalar todos los paquetes locales juntos en un proyecto
```powershell
npm install `
..\agnostos-ui\release\agnostos-tokens-1.0.0.tgz `
..\agnostos-ui\release\agnostos-core-1.0.0.tgz `
..\agnostos-ui\release\agnostos-semantics-1.0.0.tgz `
..\agnostos-ui\release\agnostos-layout-1.0.0.tgz `
..\agnostos-ui\release\agnostos-theme-1.0.0.tgz `
..\agnostos-ui\release\agnostos-components-1.0.0.tgz
```
npm install `
..\..\agnostos-ui\release\agnostos-tokens-1.0.0.tgz `
..\..\agnostos-ui\release\agnostos-core-1.0.0.tgz `
..\..\agnostos-ui\release\agnostos-semantics-1.0.0.tgz `
..\..\agnostos-ui\release\agnostos-layout-1.0.0.tgz `
..\..\agnostos-ui\release\agnostos-theme-1.0.0.tgz `
..\..\agnostos-ui\release\agnostos-components-1.0.0.tgz
---

# Catálogo de Componentes y Propiedades (API Reference)

A continuación, se documenta el uso, las propiedades (props) y ejemplos prácticos de todos los componentes de la biblioteca de Agnostos UI, divididos por sus paquetes correspondientes.

---

## 📦 Paquete: `@agnostos/components`

Este paquete contiene todos los componentes interactivos y de UI comunes, optimizados para un diseño accesible y altamente personalizable.

### 1. Button (Botón)
Componente de acción interactivo, con soporte integrado de iconos, tamaños y variantes visuales.

#### Propiedades (Props)
*Extiende de `React.ButtonHTMLAttributes<HTMLButtonElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'primary'` | Define el estilo visual y el rol del botón. |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Determina las dimensiones físicas (padding, min-height y font-size). |
| `hover` | `boolean` | `true` | Activa la respuesta visual (elevación/cambio de fondo) al pasar el puntero. |
| `icon` | `LucideIcon` | `undefined` | Icono opcional (de `lucide-react`). Si no hay `children`, se renderiza como botón circular de solo icono. |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Ubicación del icono con respecto al texto. |
| `iconSize` | `IconSize` (`'xs' \| 'sm' \| 'md' \| 'lg'`) | `'sm'` | Tamaño del icono. |
| `iconGap` | `SpacingSemantic` (de `@agnostos/tokens`) | `'xs'` | Espaciado/separación semántica entre el icono y el texto. |

#### Ejemplo de Uso
```tsx
import { Button } from '@agnostos/components';
import { Send } from 'lucide-react';

// Botón estándar con icono a la izquierda
<Button variant="primary" icon={Send}>
  Enviar Mensaje
</Button>

// Botón de peligro pequeño de solo icono
<Button variant="danger" size="sm" icon={Send} aria-label="Enviar" />
```

---

### 2. Card (Tarjeta)
Superficie contenedora para agrupar contenido relacionado, con soporte de elevación y respuestas interactivas.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'danger' \| 'ghost'` | `'default'` | Define la combinación de color de fondo y texto de la tarjeta. |
| `tone` | `'base' \| 'high' \| 'highest'` | automático | Tono de la rampa de la variante. Por defecto se resuelve por profundidad: la misma variante anidada sube un tono (base → high → highest). |
| `shadow` | `ShadowKey` (`'none' \| 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'`) | `'none'` | Nivel de elevación de sombra obtenido desde los primitive shadow tokens. |
| `hover` | `'background' \| 'lift'` | `undefined` | Estilo de interacción para tarjetas accionables (enlaces o botones). |

#### Tonos de anidación
Cada variante (excepto `ghost`) tiene una rampa de 3 tonos alimentada por tokens del tema. Cuando anidas la misma variante (`Card` dentro de `Card`, `Container` dentro de `Card`...), el tono sube automáticamente un nivel por profundidad — en dark anidar aclara y en light anidar oscurece. Una variante distinta dentro de otra reinicia la cadena en `base`, y la prop `tone` permite fijar el nivel a mano.

```tsx
<Card variant="default">
  <Card variant="default">        {/* tone="high" automático */}
    <Card variant="default">      {/* tone="highest" automático */}
      <Card variant="default" tone="base">  {/* fijado a mano */}
    </Card>
  </Card>
</Card>
```

#### Ejemplo de Uso
```tsx
import { Card } from '@agnostos/components';

<Card variant="default" shadow="md" hover="lift">
  <h3>Título del Artículo</h3>
  <p>Este es el cuerpo descriptivo de la tarjeta.</p>
</Card>
```

---

### 3. Carousel (Carrusel de Imágenes)
Visualizador de imágenes en secuencia con carga progresiva (Fade + Skeleton) e indicadores de navegación.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `slides` | `CarouselSlide[]` | *Requerido* | Lista de imágenes `{ src: string; alt: string; caption?: ReactNode }`. |
| `initialSlide` | `number` | `0` | Índice de la diapositiva que se muestra inicialmente. |
| `loading` | `boolean` | `true` | Habilita el estado de carga y skeleton de imagen. |
| `ariaLabel` | `string` | `'Carrusel de imágenes'` | Etiqueta accesible para el contenedor general del carrusel. |
| `imageFit` | `CarouselImageFit` (`'cover' \| 'contain' \| 'fill' \| 'none' \| 'scale-down'`) | `'cover'` | Controla el ajuste semántico (object-fit) de la imagen dentro del viewport. |
| `className` | `string` | `undefined` | Clase CSS adicional para el contenedor. |

#### Ejemplo de Uso
```tsx
import { Carousel } from '@agnostos/components';

const misDiapositivas = [
  { src: '/hero1.png', alt: 'Descripción de Hero 1', caption: 'Paso 1: Configurar' },
  { src: '/hero2.png', alt: 'Descripción de Hero 2', caption: 'Paso 2: Compilar' }
];

<Carousel slides={misDiapositivas} imageFit="contain" />
```

---

### 3.1 PanoramaImage (Visor de Imagen Panorámica)

Visor horizontal para mapas, timelines, diagramas, imágenes ultrapanorámicas o cualquier recurso visual más ancho que su contenedor. Está construido sobre `ScrollableGrid`, pero restringe el desplazamiento al eje horizontal y reemplaza completamente el scrollbar del navegador por un thumb tipo píldora, sin flechas del sistema operativo.

La imagen se escala por altura y conserva siempre su proporción (`width: auto`), por lo que no usa `object-fit: cover` ni corta los bordes. Si el ancho resultante excede el viewport, el scrollbar custom aparece automáticamente. Si la imagen cabe, permanece completa y se alinea dentro de una superficie semántica, evitando bandas negras o contenido cortado.

Durante la carga usa `Skeleton` y muestra la imagen con `Fade`, siguiendo el mismo patrón del componente `Carousel`.

#### Comportamiento y reglas de uso

| Regla | Comportamiento |
| :--- | :--- |
| Proporción | La imagen conserva su ratio original y se adapta a la altura del viewport; no se recorta. |
| Scroll automático | El scrollbar horizontal sólo se muestra cuando el ancho real de la imagen supera el ancho disponible. |
| Imagen no panorámica | Si la imagen es menos ancha de lo previsto, no se corta ni muestra fondo negro; puede alinearse al inicio, centro o final. |
| Scrollbar | Usa el mismo sistema custom de `ScrollableGrid`. Por defecto tiene grosor `sm` (8px), más fácil de arrastrar, y separación `xs` (4px). |
| Carga | Con `loading={true}` muestra skeleton hasta que el recurso termina de cargar o falla; luego aplica `Fade`. |

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `src` | `string` | *Requerido* | URL o ruta de la imagen panorámica. |
| `alt` | `string` | *Requerido* | Texto alternativo para la imagen. |
| `height` | `string \| number` | `'320px'` | Alto del viewport. Es la prop principal para controlar la escala de la panorámica. |
| `width` | `string \| number` | `'100%'` | Ancho del viewport. |
| `minHeight`, `minWidth`, `maxHeight`, `maxWidth` | `string \| number` | `undefined` | Límites dimensionales del viewport. |
| `align` | `'start' \| 'center' \| 'end'` | `'center'` | Posición de una imagen que cabe completamente dentro del viewport. |
| `loading` | `boolean` | `true` | Activa el skeleton y fade controlados por la carga de la imagen. |
| `ariaLabel` | `string` | `alt` | Etiqueta del visor para tecnologías de asistencia. |
| `scrollbarInset` | `SpacingSemantic` | `'xs'` | Separación tokenizada entre scrollbar y borde del viewport. |
| `scrollbarThickness` | `SpacingSemantic` | `'sm'` | Grosor tokenizado del scrollbar horizontal. |
| `onLoad` | `() => void` | `undefined` | Callback cuando el elemento `<img>` termina de cargar. |
| `onError` | `() => void` | `undefined` | Callback cuando la imagen no puede cargarse. |
| `className`, `style` | `string`, `CSSProperties` | `undefined` | Personalización adicional del contenedor. |

#### Ejemplo: panorámica adaptativa

```tsx
import { PanoramaImage } from '@agnostos/components';

<PanoramaImage
  src="/assets/mapa-regional.jpg"
  alt="Mapa panorámico de la región"
  height="360px"
  align="center"
  onLoad={() => console.info('Panorámica lista')}
/>
```

#### Ejemplo: visor de diagrama con dimensiones y scrollbar personalizado

```tsx
<PanoramaImage
  src="/assets/arquitectura-completa.png"
  alt="Diagrama completo de arquitectura"
  width="min(100%, 1100px)"
  height="480px"
  maxHeight="60vh"
  align="start"
  scrollbarThickness="md"
  scrollbarInset="sm"
  loading={true}
  onError={() => console.error('No se pudo cargar el diagrama')}
/>
```

---

### 4. Fade (Efecto Desvanecido)
Componente de utilidad visual para animar la transición de elementos tras un estado de carga.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `loading` | `boolean` | *Requerido* | Determina si se muestra el skeleton o el contenido real. |
| `skeleton` | `ReactNode` | *Requerido* | Nodo que se renderiza durante la carga (usualmente un `<Skeleton />`). |
| `children` | `ReactNode` | *Requerido* | El elemento final que se desvanecerá con animación de entrada suave. |

#### Ejemplo de Uso
```tsx
import { Fade, Skeleton } from '@agnostos/components';

<Fade loading={cargando} skeleton={<Skeleton variant="rect" height={150} />}>
  <img src="foto.png" alt="Imagen Cargada" />
</Fade>
```

---

### 5. Input (Campo de Entrada)
Campo de texto estándar estilizado bajo el sistema de diseño semántico.

#### Propiedades (Props)
*Extiende de `React.InputHTMLAttributes<HTMLInputElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `error` | `boolean` | `false` | Aplica un contorno con sombra en color rojo de error y activa el estado `aria-invalid`. |

#### Ejemplo de Uso
```tsx
import { Input } from '@agnostos/components';

<Input placeholder="Ej. correo@dominio.com" error={true} />
```

---

### 6. MenuButton (Botón de Menú de Opciones)
Gatillo compacto que despliega un menú flotante con acciones interactivas y soporte completo de accesibilidad por teclado y pointer outside.

#### Propiedades (Props)
*Extiende propiedades seleccionadas de `ButtonProps` (`hover`, `iconGap`, `iconPosition`, `iconSize`, `variant`)*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `items` | `MenuButtonItem[]` | *Requerido* | Colección de opciones en el menú. Cada item contiene: `id`, `label?`, `ariaLabel?`, `icon?`, `iconPosition?`, `iconSize?`, `disabled?`, `onSelect?`. |
| `label` | `string` | `undefined` | Texto a mostrar al lado del icono en el botón disparador. |
| `icon` | `LucideIcon` | `Ellipsis` | Icono del botón disparador. |
| `ariaLabel` | `string` | `'Más opciones'` | Etiqueta accesible para lectores de pantalla. |
| `size` | `IconSize` | `'md'` | Tamaño general del componente. |
| `shadow` | `ShadowKey` | `'lg'` | Sombra de elevación aplicada al contenedor del menú. |

#### Ejemplo de Uso
```tsx
import { MenuButton } from '@agnostos/components';
import { Edit, Trash, Eye } from 'lucide-react';

const opciones = [
  { id: 'ver', label: 'Ver detalles', icon: Eye, onSelect: () => alert('Ver') },
  { id: 'editar', label: 'Editar', icon: Edit, onSelect: () => alert('Editar') },
  { id: 'eliminar', label: 'Eliminar', icon: Trash, onSelect: () => alert('Eliminar'), disabled: true }
];

<MenuButton items={opciones} label="Acciones" variant="secondary" />
```

---

### 6.1 TabMenu (Menú Compacto con Tabs)

Popover compacto inspirado en `MenuButton`, diseñado para agrupar herramientas, filtros, vistas o acciones relacionadas en tabs. El desarrollador puede declarar cualquier cantidad de tabs y cada uno acepta cualquier `ReactNode`: botones, formularios, inputs, cards, listas, imágenes o componentes completos.

El panel se posiciona respecto de su disparador y usa `ScrollableGrid` con densidad `2xs` (2px) para el riel, thumb y separación interna. El contenido activo se presenta con `Fade` al cambiar de tab.

#### Comportamiento y reglas de uso

| Regla | Comportamiento |
| :--- | :--- |
| Apertura | El botón disparador alterna el panel. Se puede usar de forma no controlada o controlada con `open` y `onOpenChange`. |
| Cierre | El panel se cierra al pulsar fuera de él o con `Escape`. En modo controlado el consumidor debe actualizar `open` desde `onOpenChange`. |
| Tabs | Se admiten tantos tabs como se necesiten. Los tabs deshabilitados no se seleccionan ni forman parte de la navegación por teclado. |
| Teclado | `←`, `→`, `Home` y `End` cambian el tab activo; clic permite seleccionar directamente. |
| Scroll | Cada tab comparte un viewport con scrollbar propio, estilo píldora y sin flechas del navegador. Si el contenido no excede `contentHeight`, el scrollbar no aparece. |
| Contenido | `content` no está limitado a texto ni ítems de menú. Puede contener cualquier árbol React, incluyendo componentes importados desde otros archivos `.tsx`. |
| Posición | El panel se ancla al disparador; `placement` define lado/alineación y `offset` define la separación con tokens de spacing. |

#### Propiedades (Props)

*Hereda las propiedades de botón `hover`, `iconGap`, `iconPosition`, `iconSize` y `variant`.*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `tabs` | `TabMenuTab[]` | *Requerido* | Tabs a renderizar. Cada tab contiene `id`, `label`, `content` y `disabled?`. |
| `label` | `string` | `undefined` | Texto visible en el disparador. Si se omite, puede usarse como botón de sólo icono. |
| `icon` | `LucideIcon` | `Ellipsis` | Icono del disparador. |
| `ariaLabel` | `string` | `'Abrir panel'` | Etiqueta accesible del botón y del panel. |
| `size` | `IconSize` | `'sm'` | Tamaño del icono del disparador. |
| `placement` | `'bottom-start' \| 'bottom-end' \| 'top-start' \| 'top-end'` | `'bottom-end'` | Posición del panel respecto al disparador. |
| `offset` | `SpacingSemantic` | `'2xs'` | Separación tokenizada entre botón y panel. `2xs` equivale a 2px. |
| `contentHeight` | `string \| number` | `'224px'` | Alto del viewport desplazable para el contenido de cada tab. |
| `contentInset` | `SpacingSemantic` | `'xs'` | Padding tokenizado del contenido activo. |
| `shadow` | `ShadowKey` | `'lg'` | Sombra aplicada al panel flotante. |
| `defaultTabId` | `string` | Primer tab habilitado | Id de la pestaña seleccionada inicialmente. |
| `onTabChange` | `(tabId: string) => void` | `undefined` | Callback al cambiar de tab. |
| `open` | `boolean` | `undefined` | Controla la apertura externamente. Si se omite, el componente administra su propio estado. |
| `onOpenChange` | `(open: boolean) => void` | `undefined` | Notifica peticiones de apertura/cierre; requerido para sincronizar el modo controlado. |
| `className` | `string` | `undefined` | Clase CSS adicional para el contenedor raíz. |

#### Contrato de `TabMenuTab`

```ts
interface TabMenuTab {
  id: string;          // Único y estable dentro del menú
  label: string;       // Texto de la pestaña
  content: ReactNode;  // Botones, formularios, listas o cualquier componente React
  disabled?: boolean;
}
```

#### Ejemplo: filtros con contenido arbitrario

```tsx
import { Button, Input, TabMenu } from '@agnostos/components';
import { Stack } from '@agnostos/layout';
import { Filter } from 'lucide-react';

<TabMenu
  label="Filtros"
  icon={Filter}
  ariaLabel="Filtros de proyectos"
  placement="bottom-start"
  contentHeight="240px"
  contentInset="xs"
  defaultTabId="estado"
  tabs={[
    {
      id: 'estado',
      label: 'Estado',
      content: (
        <Stack direction="column" gap="2xs">
          <Button variant="ghost">Activos</Button>
          <Button variant="ghost">En pausa</Button>
          <Button variant="ghost">Finalizados</Button>
        </Stack>
      ),
    },
    {
      id: 'buscar',
      label: 'Buscar',
      content: <Input aria-label="Buscar proyectos" placeholder="Nombre del proyecto" />,
    },
  ]}
/>
```

#### Ejemplo: modo controlado y contenido externo

```tsx
import { useState } from 'react';
import { TabMenu } from '@agnostos/components';
import { RecentProjects } from './panels/RecentProjects';
import { SavedProjects } from './panels/SavedProjects';

const ProjectMenu = () => {
  const [open, setOpen] = useState(false);

  return (
    <TabMenu
      label="Proyectos"
      open={open}
      onOpenChange={setOpen}
      onTabChange={(tabId) => console.info('Tab activo:', tabId)}
      placement="top-end"
      tabs={[
        { id: 'recent', label: 'Recientes', content: <RecentProjects /> },
        { id: 'saved', label: 'Guardados', content: <SavedProjects /> },
      ]}
    />
  );
};
```

---

### 7. Modal (Ventana Emergente)
Diálogo accesible renderizado mediante Portal para superficies de aplicación. Al abrirse bloquea el scroll del documento; el contenido interior usa el scrollbar personalizado tipo píldora de `ScrollableGrid`, por lo que no expone flechas ni la pintura nativa del sistema operativo.

El modal puede funcionar de dos maneras:

- **Contenido único:** se entrega mediante `children`, para confirmaciones, formularios o vistas breves.
- **Contenido por secciones:** se entrega mediante `sections`; el modal genera la navegación de tabs y renderiza únicamente la sección activa. Cada contenido puede provenir de un componente importado desde otro archivo `.tsx`.

#### Comportamiento y reglas de uso

| Regla | Comportamiento |
| :--- | :--- |
| Cierre | El usuario puede cerrar mediante el botón X o pulsando fuera del panel sobre el overlay. El consumidor controla el estado usando `open` y `onClose`. |
| Scroll | El documento queda bloqueado mientras el modal está abierto. Si el contenido excede el alto disponible, el desplazamiento ocurre dentro del modal con scrollbar custom tipo píldora. |
| Secciones | Si `sections` contiene elementos, se ignora `children` y se renderiza la primera sección habilitada o la indicada en `defaultSectionId`. |
| Tabs | Cada sección crea un tab con roles ARIA `tab`, `tablist` y `tabpanel`. Se puede navegar con clic, `←`, `→`, `Home` y `End`. |
| Secciones deshabilitadas | Una sección con `disabled: true` no se puede seleccionar ni se incluye en la navegación por teclado. |
| Archivos externos | El modal no descubre archivos automáticamente en runtime. Se debe importar el componente `.tsx` y entregarlo explícitamente como `content`; así se preservan el tipado y el empaquetado. |

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `open` | `boolean` | *Requerido* | Controla la visibilidad del modal. |
| `onClose` | `() => void` | *Requerido* | Función que se ejecuta al cerrar mediante X o clic sobre el overlay. |
| `ariaLabel` | `string` | *Requerido* | Nombre descriptivo requerido para lectores de pantalla (`role="dialog"`). |
| `inset` | `Inset` | `'xl'` (32px) | Distancia semántica de espaciado interior desde los bordes de la pantalla. |
| `contentInset` | `Inset` | `'xl'` | Padding tokenizado del contenido desplazable. Admite un token global o `{ top, right, bottom, left }`. |
| `children` | `ReactNode` | `undefined` | Contenido único; se utiliza sólo si `sections` no está definido. |
| `sections` | `ModalSection[]` | `undefined` | Secciones que habilitan tabs y contenido navegable. |
| `defaultSectionId` | `string` | Primera sección habilitada | Id de la sección que se selecciona cada vez que se abre el modal. |
| `onSectionChange` | `(sectionId: string) => void` | `undefined` | Callback al cambiar de sección mediante clic o teclado. |

#### Contrato de `ModalSection`

```ts
interface ModalSection {
  id: string;             // único y estable dentro del modal
  label: string;          // texto visible del tab
  content: React.ReactNode;
  disabled?: boolean;
}
```

#### Ejemplo: contenido único
```tsx
import { Modal } from '@agnostos/components';

<Modal open={isOpen} onClose={() => setIsOpen(false)} ariaLabel="Confirmar eliminación">
  <h3>¿Confirmar acción destructiva?</h3>
  <p>Esta acción eliminará permanentemente la entrada.</p>
</Modal>
```

#### Ejemplo: tabs con componentes externos

```tsx
import { Modal } from '@agnostos/components';
import { Gallery } from './modal-content/Gallery';
import { Description } from './modal-content/Description';
import { History } from './modal-content/History';

<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  ariaLabel="Detalle del proyecto"
  inset={{ top: 'xl', right: '3xl', bottom: 'xl', left: '3xl' }}
  contentInset={{ top: 'lg', right: 'xl', bottom: 'xl', left: 'xl' }}
  defaultSectionId="descripcion"
  onSectionChange={(sectionId) => console.info('Sección activa:', sectionId)}
  sections={[
    { id: 'imagenes', label: 'Imágenes', content: <Gallery /> },
    { id: 'descripcion', label: 'Descripción', content: <Description /> },
    { id: 'historial', label: 'Historial', content: <History />, disabled: true },
  ]}
/>
```

En el ejemplo, `Gallery`, `Description` y `History` viven en archivos independientes. El modal no necesita conocer su implementación: sólo recibe el nodo React que debe presentar en cada sección.

---

### 8. NavigationDrawer (Cajón de Navegación Lateral)
Panel deslizante lateral utilizado comúnmente para menús globales, filtros o configuraciones adicionales.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `open` | `boolean` | *Requerido* | Controla la visibilidad del cajón. |
| `onClose` | `() => void` | *Requerido* | Función callback de cierre. |
| `ariaLabel` | `string` | *Requerido* | Etiqueta accesible para lectores de pantalla. |
| `side` | `'left' \| 'right'` | `'left'` | Costado de la pantalla por el cual emerge el panel. |
| `inset` | `Inset` | `'md'` (16px) | Márgenes aplicados en la parte superior, inferior y lateral. |
| `width` | `string \| number` | `'360px'` | Ancho fijo del panel lateral. Cuenta con tope responsivo automático. |

#### Ejemplo de Uso
```tsx
import { NavigationDrawer } from '@agnostos/components';

<NavigationDrawer open={menuAbierto} onClose={() => setMenuAbierto(false)} side="left" ariaLabel="Menú principal">
  <ul>
    <li>Inicio</li>
    <li>Proyectos</li>
  </ul>
</NavigationDrawer>
```

---

### 9. ProcessSteps (Pasos de Proceso)
Visualizador vertical de pasos o flujos de progreso que combina indicadores numéricos, barras, círculos o checkmarks de éxito de forma progresiva.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `steps` | `ProcessStep[]` | *Requerido* | Lista de pasos. Cada paso es `{ id, title, text?, status: 'pending'\|'active'\|'done', progress?, shape?: 'linear'\|'circular' }`. |
| `className` | `string` | `undefined` | Clase CSS opcional para el contenedor. |

#### Ejemplo de Uso
```tsx
import { ProcessSteps } from '@agnostos/components';

const pasos = [
  { id: '1', title: 'Crear Cuenta', status: 'done' as const },
  { id: '2', title: 'Subir Archivos', status: 'active' as const, progress: 65, shape: 'circular' as const },
  { id: '3', title: 'Aprobación Final', status: 'pending' as const }
];

<ProcessSteps steps={pasos} />
```

---

### 10. ProgressBar (Barra de Progreso)
Indicador visual lineal para tareas con progreso determinado o indeterminado.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `undefined` | Valor porcentual de `0` a `100`. Si se omite, se renderiza en estado indeterminado (con animación fluida continua). |
| `height` | `number` | `8` | Altura en píxeles de la barra. |
| `className` | `string` | `undefined` | Nombre de clase adicional. |

#### Ejemplo de Uso
```tsx
import { ProgressBar } from '@agnostos/components';

// Barra determinada
<ProgressBar value={72} height={12} />

// Barra indeterminada (Carga constante)
<ProgressBar />
```

---

### 11. ProgressCircle (Anillo de Progreso)
Anillo circular de progreso inspirado en Material Design, con transiciones fluidas de trazo.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `value` | `number` | `undefined` | Porcentaje de carga de `0` a `100`. Si se omite, se activa la animación giratoria indeterminada. |
| `size` | `number` | `48` | Diámetro exterior en píxeles del anillo. |
| `strokeWidth` | `number` | `4` | Grosor del trazo circular en píxeles. |

#### Ejemplo de Uso
```tsx
import { ProgressCircle } from '@agnostos/components';

// Circular determinado
<ProgressCircle value={40} size={56} strokeWidth={6} />

// Circular indeterminado (Spinner)
<ProgressCircle size={32} />
```

---

### 12. SearchBar (Campo de Búsqueda)
Campo de búsqueda optimizado con icono integrado, soporte para sugerencias o historial de búsquedas recientes (máximo 3) y confirmación por teclado.

#### Propiedades (Props)
*Extiende de `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'secondary' \| 'ghost'` | `'default'` | Fondo y estética del contenedor de búsqueda. |
| `shadow` | `ShadowKey` | `'none'` | Sombra de elevación aplicada al contenedor. |
| `value` | `string` | `undefined` | Valor del campo controlado. |
| `defaultSearches`| `string[]` | `[]` | Historial de consultas precargadas en el menú desplegable. |
| `onChange` | `(value: string) => void` | `undefined` | Callback invocado en cada pulsación de tecla. |
| `onSearch` | `(value: string) => void` | `undefined` | Callback invocado al presionar `Enter` o hacer clic en un elemento del historial. |

#### Ejemplo de Uso
```tsx
import { SearchBar } from '@agnostos/components';

<SearchBar
  placeholder="Buscar en el catálogo..."
  defaultSearches={['zapatos deportivos', 'chaquetas de cuero']}
  onSearch={(query) => console.log('Buscando:', query)}
/>
```

---

### 13. Skeleton (Capa de Esqueleto)
Contenedor que imita la estructura física de la interfaz para reducir el impacto visual durante la carga asíncrona de datos.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'text' \| 'rect' \| 'circle'` | `'rect'` | Forma geométrica del esqueleto. |
| `width` | `string \| number` | `undefined` | Ancho del esqueleto (ej. `'100%'`, `80` o `'150px'`). |
| `height` | `string \| number` | `undefined` | Alto del esqueleto. |
| `className` | `string` | `undefined` | Clase CSS para sobreescritura de estilos. |

#### Ejemplo de Uso
```tsx
import { Skeleton } from '@agnostos/components';

// Falsa tarjeta de perfil en carga
<div>
  <Skeleton variant="circle" width={60} height={60} />
  <Skeleton variant="text" width="180px" />
  <Skeleton variant="rect" width="100%" height={100} />
</div>
```

---

### 14. Switch (Interruptor)
Componente de selección de estado binario, con soporte opcional de iconos, etiquetas accesibles y control interactivo por teclado.

#### Propiedades (Props)
*Extiende de `Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `checked` | `boolean` | `undefined` | Estado del interruptor (controlado). |
| `defaultChecked` | `boolean` | `false` | Estado inicial no controlado. |
| `onCheckedChange`| `(checked: boolean) => void` | `undefined` | Callback cuando cambia la selección. |
| `label` | `ReactNode` | `undefined` | Texto o componente descriptivo ubicado al lado del interruptor. |
| `icon` | `LucideIcon` | `undefined` | Icono opcional que se renderiza a la izquierda o derecha. |
| `iconPosition` | `'left' \| 'right'` | `'left'` | Ubicación del icono. |
| `iconSize` | `IconSize` | `'sm'` | Tamaño del icono. |
| `hover` | `boolean` | `true` | Activa la animación al pasar el puntero. |

#### Ejemplo de Uso
```tsx
import { Switch } from '@agnostos/components';
import { Bell } from 'lucide-react';

<Switch
  label="Habilitar Notificaciones"
  icon={Bell}
  defaultChecked={true}
  onCheckedChange={(estado) => console.log('Habilitado:', estado)}
/>
```

---

### 15. Text (Componente Tipográfico)
Componente tipográfico semántico que sustituye el uso de etiquetas HTML directas y promueve consistencia visual.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'display-lg' \| 'display-md' \| 'display-sm' \| 'h1' \| 'h2' \| 'h3' \| 'h4' \| 'body' \| 'small' \| 'caption' \| 'overline'` | `'body'` | Estética y tamaño tipográfico preconfigurado en las variables del tema. Los `display` son para titulares de landing y son **fluidos** (`clamp()`: escalan con el viewport y respetan el máximo del token). |
| `as` | `'h1' \| 'h2' \| 'h3' \| 'h4' \| 'h5' \| 'h6' \| 'p' \| 'span' \| 'label'` | Mapeo automático de `variant` | Sobrescribe el tag HTML final renderizado para desacoplar semántica de estética. |
| `weight` | `'regular' \| 'medium' \| 'semibold' \| 'bold'` | `undefined` | Peso o grosor de la fuente tipográfica. |
| `color` | `'default' \| 'muted' \| 'primary' \| 'danger' \| 'success' \| 'warning'` | `'default'` | Color semántico derivado de la paleta inyectada por el tema activo. |
| `tracking` | `'tight' \| 'normal' \| 'wide' \| 'wider' \| 'widest'` | `undefined` | Espaciado entre letras. `overline` + `wider` + color = patrón eyebrow de landing. |
| `truncate` | `boolean` | `false` | Corta el desborde de texto con puntos suspensivos (`text-overflow: ellipsis`) en una sola línea. |
| `balance` | `boolean` | `false` | Equilibra el salto de líneas del titular (`text-wrap: balance`). |

#### Ejemplo de Uso
```tsx
import { Text } from '@agnostos/components';

{/* Eyebrow + titular de landing */}
<Text variant="overline" color="primary" tracking="widest">Agnostos UI</Text>
<Text variant="display-md" balance>Un solo sistema de UI para escritorio y web</Text>

<Text variant="h1" as="h1" weight="bold" color="primary">
  Título Principal Desacoplado
</Text>

<Text variant="body" truncate={true}>
  Este texto es sumamente largo y se recortará de forma elegante con puntos suspensivos si sobrepasa el límite.
</Text>
```

---

### 16. Reveal (Revelado al Scroll)
Anima la entrada de su contenido (fade + desplazamiento) cuando entra al viewport mediante `IntersectionObserver`. Respeta `prefers-reduced-motion`: con movimiento reducido el contenido se muestra sin transición.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `direction` | `'up' \| 'down' \| 'left' \| 'right' \| 'none'` | `'up'` | Dirección desde la que entra el contenido. `none` = solo fade. |
| `delay` | `'fast' \| 'base' \| 'slow' \| 'slower' \| number` | `'fast'` | Retardo en ms antes de animar — para escalonar elementos (stagger). |
| `distance` | `SpacingSemantic` | `'xl'` | Distancia del desplazamiento inicial. |
| `once` | `boolean` | `true` | Animar solo la primera vez que entra al viewport. |
| `amount` | `number` (0–1) | `0.2` | Fracción del elemento que debe ser visible antes de revelar. |

#### Ejemplo de Uso
```tsx
import { Reveal, Text, Button } from '@agnostos/components';
import { Flex } from '@agnostos/layout';

<Reveal>
  <Text variant="overline" color="primary" tracking="widest">Agnostos UI</Text>
</Reveal>
<Reveal delay="base">
  <Text variant="display-md" balance>Un solo sistema de UI</Text>
</Reveal>
<Reveal delay="slower">
  <Flex gap="md">
    <Button variant="primary">Empezar ahora</Button>
  </Flex>
</Reveal>
```

---

### 17. Badge (Etiqueta)
Etiqueta compacta de estado o categoría con tonos suaves derivados del tema (`color-mix` sobre el color semántico — funciona en light y dark sin tokens extra).

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLSpanElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Familia de color del badge. |
| `size` | `'sm' \| 'md'` | `'md'` | Tamaño del badge. |
| `dot` | `boolean` | `false` | Punto de estado a la izquierda (usa el color de la variante). |

#### Ejemplo de Uso
```tsx
import { Badge } from '@agnostos/components';

<Badge variant="success" dot>Operativo</Badge>
<Badge variant="primary">Nuevo</Badge>
```

---

### 18. Divider (Separador)
Línea separadora con label opcional centrado (patrón "o continúa con GitHub").

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `label` | `React.ReactNode` | `undefined` | Si se pasa, se muestra centrado entre dos líneas. |

#### Ejemplo de Uso
```tsx
import { Divider } from '@agnostos/components';

<Divider label="o continúa con GitHub" />
```

---

### 19. Rating (Calificación con Estrellas)
Calificación visual con soporte de mitades (4.5) vía clip del icono. Con `onChange` es interactivo (radiogroup accesible); sin él, es solo display.

#### Propiedades (Props)
*Extiende de `Omit<React.HTMLAttributes<HTMLDivElement>, 'size' \| 'onChange'>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `value` | `number` | *Requerido* | Valor de la calificación (0 a max). Acepta mitades: 3.5. |
| `max` | `number` | `5` | Cantidad de estrellas. |
| `onChange` | `(value: number) => void` | `undefined` | Presente = interactivo. Recibe el valor entero elegido. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Tamaño de las estrellas. |
| `showValue` | `boolean` | `false` | Muestra el valor numérico junto a las estrellas. |

#### Ejemplo de Uso
```tsx
import { Rating } from '@agnostos/components';

<Rating value={4.5} showValue />
<Rating value={rating} onChange={setRating} />
```

---

### 20. Avatar / AvatarGroup (Avatares)
Imagen de usuario con fallback de iniciales (`name` → "MP"). AvatarGroup apila avatares con solapamiento y colapsa los excedentes en "+N".

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLSpanElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `src` | `string` | `undefined` | URL de la imagen. |
| `alt` | `string` | `undefined` | Texto alternativo. |
| `name` | `string` | `undefined` | Nombre — genera las iniciales del fallback y el title. |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Diámetro del avatar (24–64px). |

**AvatarGroup**: `children` (Avatares), `max?: number` (colapsa en "+N"), `size?`.

#### Ejemplo de Uso
```tsx
import { Avatar, AvatarGroup } from '@agnostos/components';

<Avatar name="María Pérez" size="lg" />
<AvatarGroup max={4}>
  <Avatar name="María Pérez" />
  <Avatar name="Javier Muñoz" />
  <Avatar name="Ana Ruiz" />
  <Avatar name="Leo Torres" />
  <Avatar name="Sofía Vega" />
</AvatarGroup>
```

---

### 21. Accordion (Acordeón / FAQ)
Lista colapsable con animación fluida (`grid-template-rows` 0fr→1fr). Accesible: `aria-expanded`, `aria-controls`, `role="region"`.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `items` | `AccordionItemData[]` | *Requerido* | `{ id, title, content, disabled? }`. |
| `type` | `'single' \| 'multiple'` | `'single'` | single: al abrir un panel se cierra el anterior. |
| `defaultOpen` | `string[]` | `[]` | Ids abiertos al montar. |
| `onOpenChange` | `(openIds: string[]) => void` | `undefined` | Notifica los ids abiertos. |

#### Ejemplo de Uso
```tsx
import { Accordion } from '@agnostos/components';

<Accordion
  type="single"
  defaultOpen={['faq-1']}
  items={[
    { id: 'faq-1', title: '¿Funciona en Wails v2?', content: 'Sí — ...' },
    { id: 'faq-2', title: '¿Y en una landing?', content: 'También — ...' },
  ]}
/>
```

---

### 22. PricingCard (Tarjeta de Precios)
Tarjeta de plan de pricing para landings. Compone `Card` (participa de la anidación de tonos) con plan, precio + periodo, features y CTA.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `plan` | `React.ReactNode` | *Requerido* | Nombre del plan. |
| `price` | `React.ReactNode` | *Requerido* | Precio ("$19"). |
| `period` | `React.ReactNode` | `undefined` | Sufijo del precio ("/mes"). |
| `description` | `React.ReactNode` | `undefined` | Descripción corta. |
| `features` | `PricingFeature[]` | `[]` | `{ label, included? }` — `included: false` muestra muted con X. |
| `featured` | `boolean` | `false` | Destaca el plan: borde de primary + badge. |
| `featuredLabel` | `React.ReactNode` | `'Más popular'` | Texto del badge del plan destacado. |
| `cta` | `React.ReactNode` | `undefined` | CTA del plan (usualmente un Button). |
| `shadow` | `ShadowKey` | `'none'` (`'md'` si featured) | Elevación. |

#### Ejemplo de Uso
```tsx
import { PricingCard, Button } from '@agnostos/components';

<PricingCard
  featured
  plan="Pro"
  price="$19"
  period="/mes"
  features={[{ label: 'Todo incluido' }, { label: 'Soporte', included: false }]}
  cta={<Button variant="primary">Elegir Pro</Button>}
/>
```

---

### 23. Navbar (Barra de Navegación)
Header sticky para landings con fondo glass (blur). En viewport < 768px oculta links/acciones y muestra hamburguesa, que abre un `NavigationDrawer` con los mismos links.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `brand` | `React.ReactNode` | `undefined` | Marca. Texto plano se tipografía como brand. |
| `links` | `NavbarLink[]` | `[]` | `{ label, href?, onClick? }`. |
| `actions` | `React.ReactNode` | `undefined` | Slot de CTAs. Pasan al drawer en móvil. |
| `sticky` | `boolean` | `true` | Fija al tope al hacer scroll. |
| `glass` | `boolean` | `true` | Fondo translúcido con blur. |
| `drawerSide` | `'left' \| 'right'` | `'right'` | Lado del drawer móvil. |

#### Ejemplo de Uso
```tsx
import { Navbar, Button } from '@agnostos/components';

<Navbar
  brand="Agnostos UI"
  links={[{ label: 'Componentes' }, { label: 'Precios' }, { label: 'Docs', href: '#docs' }]}
  actions={<Button variant="primary" size="sm">Empezar ahora</Button>}
/>
```

---

### 24. Footer (Pie de Página)
Pie multi-columna: zona de marca, columnas de links en grid fluido y barra inferior. Combina con `Section as="footer"` si necesitas ritmo vertical extra.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `brand` | `React.ReactNode` | `undefined` | Marca. |
| `description` | `React.ReactNode` | `undefined` | Descripción bajo la marca. |
| `columns` | `FooterColumn[]` | `[]` | `{ title, links: FooterLink[] }`. |
| `bottom` | `React.ReactNode` | `undefined` | Barra inferior (copyright, legales). |

#### Ejemplo de Uso
```tsx
import { Footer } from '@agnostos/components';

<Footer
  brand="Agnostos UI"
  description="Un solo sistema de UI para escritorio y web."
  columns={[
    { title: 'Producto', links: [{ label: 'Componentes' }, { label: 'Precios' }] },
    { title: 'Legal', links: [{ label: 'Privacidad' }] },
  ]}
  bottom={<span>© 2026 Agnostos UI</span>}
/>
```

---

### 25. LogosStrip (Franja de Logos / Marquee)
Franja "Trusted by" con scroll infinito. El contenido se duplica para el loop continuo; pausa al hover y fila estática con `prefers-reduced-motion`.

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `children` | `React.ReactNode` | *Requerido* | Logos/imágenes/sellos a desplazar. |
| `speed` | `'slow' \| 'base' \| 'fast'` | `'base'` | Duración del ciclo completo. |
| `pauseOnHover` | `boolean` | `true` | Pausa el desplazamiento al hover. |
| `fadeEdges` | `boolean` | `true` | Difumina los bordes (mask). |

```tsx
import { LogosStrip } from '@agnostos/components';

<LogosStrip speed="slow">
  {brands.map((b) => <img key={b.name} src={b.logo} alt={b.name} height="32" />)}
</LogosStrip>
```

---

### 26. Stat (Contador Animado)
Número que cuenta de 0 a su valor al entrar al viewport (IntersectionObserver + rAF, easeOutCubic). Con `prefers-reduced-motion` muestra el valor final sin animar.

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `value` | `number` | *Requerido* | Valor final. |
| `decimals` | `number` | `0` | Decimales a mostrar. |
| `prefix` / `suffix` | `string` | — | "$", "+", "%", "★". |
| `label` | `React.ReactNode` | — | Etiqueta bajo el número. |
| `size` | `'md' \| 'lg' \| 'xl'` | `'md'` | Tamaño tipográfico (h1 → display-md). |
| `duration` | `number` | `1600` | Duración en ms. |

```tsx
<Stat value={12400} suffix="+" label="usuarios activos" />
<Stat value={99.9} decimals={1} suffix="%" label="uptime" />
```

---

### 27. Checkbox (Casilla de Verificación)
Input nativo oculto + control estilizado, mismo patrón que Switch. Soporta controlado/no-controlado, `indeterminate` (tristate) y todo el conjunto (control + texto) es clicable.

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `checked` / `defaultChecked` | `boolean` | `false` | Estado controlado / inicial. |
| `indeterminate` | `boolean` | `false` | Estado mixto (visual). |
| `label` | `React.ReactNode` | — | Etiqueta junto a la casilla. |
| `onCheckedChange` | `(checked: boolean) => void` | — | Notifica el nuevo estado. |
| `disabled` | `boolean` | — | Deshabilita (via `InputHTMLAttributes`). |

```tsx
<Checkbox label="Notificaciones por email" defaultChecked />
<Checkbox label="Seleccionar todo" indeterminate />
```

---

### 28. Radio / RadioGroup (Selección Única)
RadioGroup (rol radiogroup) clona los `Radio` hijos inyectando `name`, estado y `onChange`. Navegación por flechas del teclado la maneja el input nativo.

**RadioGroup**: `label?`, `direction?: 'row' | 'column'`, `value?` (controlado), `defaultValue?`, `onChange?: (value: string) => void`, `name?`.
**Radio**: `value: string` (requerido), `label?`, `disabled?`.

```tsx
<RadioGroup label="Plan" value={plan} onChange={setPlan}>
  <Radio value="starter" label="Starter" />
  <Radio value="pro" label="Pro" />
</RadioGroup>
```

---

### 29. Select (Selector)
`<select>` nativo estilizado (accesible, dropdown del SO/WebView) con chevron superpuesto y la estética de Input.

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `options` | `SelectOption[]` | — | `{ value, label, disabled? }`. Alternativa a children con `<option>`. |
| `label` | `React.ReactNode` | — | Etiqueta sobre el campo. |
| `placeholder` | `string` | — | Primera opción deshabilitada. |
| `error` | `boolean` | `false` | Borde danger. |

```tsx
<Select label="Idioma" defaultValue="es"
  options={[{ value: 'es', label: 'Español' }, { value: 'en', label: 'English' }]} />
```

---

### 30. Textarea (Campo Multilínea)
Estética de Input con `autoResize` opcional (crece con el contenido hasta `maxRows`).

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `label` | `React.ReactNode` | — | Etiqueta sobre el campo. |
| `error` | `boolean` | `false` | Borde danger. |
| `autoResize` | `boolean` | `false` | Crece automáticamente. |
| `minRows` / `maxRows` | `number` | `3` / `10` | Límites con autoResize. |

```tsx
<Textarea label="Descripción" placeholder="Cuéntanos…" autoResize />
```

---

### 31. Toast (Notificaciones)
`ToastProvider` (dentro de UIRoot) + `useToast()`. Auto-dismiss configurable (`duration: 0` = persistente), variantes semánticas con icono, cierre manual y `aria-live="polite"`.

```tsx
// En el root:
<UIRoot><ToastProvider><App /></ToastProvider></UIRoot>

// En cualquier componente:
const toast = useToast();
toast.push({ title: 'Cambios guardados', variant: 'success' });
toast.push({ title: 'Error', description: '…', variant: 'danger', duration: 0 });
```

**ToastProvider**: `position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'`, `defaultDuration?: number` (4500).
**ToastOptions**: `title` (requerido), `description?`, `variant?: 'info' | 'success' | 'warning' | 'danger'`, `duration?: number`.

---

### 32. Tooltip (Pista Contextual)
CSS puro (sin JS de posicionamiento): aparece con `:hover` / `:focus-within`. Soporta 4 lados y retardo configurable.

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `content` | `React.ReactNode` | *Requerido* | Contenido de la pista. |
| `side` | `'top' \| 'bottom' \| 'left' \| 'right'` | `'top'` | Lado de aparición. |
| `delay` | `number` | `300` | Retardo en ms. |

```tsx
<Tooltip content="Editar elemento">
  <Button variant="secondary" size="sm">Editar</Button>
</Tooltip>
```

---

### 33. Tabs (Pestañas de Contenido)
ARIA completa (`tablist`/`tab`/`tabpanel`) + teclado: ArrowLeft/ArrowRight cambian la pestaña activa (roving tabindex). Para navegación de página usa `TabMenu`.

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `items` | `TabItem[]` | *Requerido* | `{ id, label, content, disabled? }`. |
| `activeId` | `string` | — | Id activo (controlado). |
| `defaultActiveId` | `string` | primer no deshabilitado | Id activo al montar. |
| `onChange` | `(id: string) => void` | — | Notifica el cambio. |

```tsx
<Tabs
  items={[
    { id: 'general', label: 'General', content: <PanelGeneral /> },
    { id: 'avanzado', label: 'Avanzado', content: <PanelAvanzado /> },
  ]}
/>
```

---

## 🖥️ Kit de Escritorio (Wails) — componentes 34–46

Componentes pensados para el shell de una app de escritorio (Wails v2 + WebView2). Todos funcionan también en web — los controles de ventana son no-op/fuera de Wails.

### 34. TitleBar — barra de título para ventanas frameless
Zona arrastrable (`--wails-draggable` + `-webkit-app-region: drag`) con slots `left`/`center`/`right` y controles minimizar/maximizar/cerrar que llaman a `window.runtime` de Wails (no-op y deshabilitados en web). Props: `left?`, `center?`, `right?`, `windowControls?` (true), `height?` (40).

### 35. Kbd + useHotkeys — teclado
`<Kbd keys={['Ctrl', 'K']} />` muestra la combinación. `useHotkeys({ 'mod+k': fn })` (core) suscribe atajos globales; `mod` = Ctrl/Cmd; no captura en inputs de texto salvo que uses modificadores.

### 36. Sidebar / SidebarItem / SidebarSection — navegación lateral
```tsx
<Sidebar activeId={section} onSelect={setSection}>
  <SidebarSection label="Espacio">
    <SidebarItem id="proyectos" icon={Boxes}>Proyectos</SidebarItem>
  </SidebarSection>
</Sidebar>
```
Props Sidebar: `activeId?`, `onSelect?`, `width?` (240). Item: `id`, `icon?`, `end?` (badge/contador).

### 37. SplitView — paneles redimensionables
`<SplitView first={<Sidebar/>} second={<Contenido/>} />` con divisor arrastrable (pointer capture). Props: `direction?` (horizontal), `defaultSize?` (280), `minSize?` (180), `maxSize?` (80%). Al arrastrar, los `Container` internos re-disparan breakpoints.

### 38. CommandPalette — paleta de comandos
Overlay tipo Ctrl+K: búsqueda por palabras, grupos, flechas + Enter, Escape. Conecta el atajo con `useHotkeys`.
```tsx
<CommandPalette open={open} onClose={() => setOpen(false)}
  items={[{ id, label, icon, group, shortcut: ['Ctrl','N'], action }]} />
```

### 39. StatusBar / StatusBarItem — barra de estado
`<StatusBar><StatusBarItem>Guardado</StatusBarItem><StatusBarItem side="right">v2.0</StatusBarItem></StatusBar>`

### 40. ContextMenu — menú al clic derecho
Envuelve contenido; abre en las coordenadas del puntero. Items: `{ label, icon?, danger?, disabled?, separator?, onClick? }`. Cierra con clic fuera, Escape o selección.

### 41. Breadcrumb — ruta de navegación
`<Breadcrumb items={[{ label: 'Estudio' }, { label: 'Proyectos', href: '#' }]} />` — el último item es el actual (aria-current).

### 42. SegmentedControl — switcher de vistas
`<SegmentedControl options={[{ value: 'list', icon: List }, { value: 'grid', icon: LayoutGrid }]} />` — role radiogroup, controlado/no-controlado.

### 43. Table — tabla con orden y selección
```tsx
<Table columns={[{ key: 'name', header: 'Proyecto', sortable: true }]}
  rows={rows} getRowId={(r) => r.id}
  selectable selectedIds={sel} onSelectionChange={setSel}
  defaultSort={{ key: 'name', dir: 'asc' }} />
```
Columna: `{ key, header, width?, align?, sortable?, sortValue?, render? }`. Orden por cabecera (aria-sort), columna de Checkbox con select-all/indeterminate.

### 44. TreeView — árbol jerárquico
Items recursivos `{ id, label, icon?, children?, disabled? }`, expansión con chevron, `defaultExpandedIds`, `activeId`, `onSelect`, indentación por profundidad.

### 45. EmptyState — vista vacía
`<EmptyState icon={Inbox} title="Sin proyectos" description="…" action={<Button>Crear</Button>} />`

### 46. AlertDialog — confirmación con Promise
```tsx
// Root: <ConfirmProvider>
const confirm = useConfirm();
if (await confirm({ title: '¿Eliminar?', variant: 'danger', confirmLabel: 'Eliminar' })) { … }
```

### Densidad (compact/comfortable)
`<UIRoot density="compact">` compacta el spacing de TODA la librería: las CSS vars (`--aui-spacing-*`) y los componentes de layout (Box/Flex/Grid/Container/Section) se resuelven por la escala de la densidad activa (`spacingScales` en tokens). Demo 17 del playground incluye el toggle en vivo.

---

## 📐 Paquete: `@agnostos/layout`

Este paquete provee primitivas avanzadas y componentes de estructura para armar composiciones flexibles y responsivas (Mobile-First).

#### Estrategia responsiva híbrida
Las props `Responsive<T>` (`{ xs, sm, md, lg, xl }`) se resuelven así:
1. **Dentro de un `Container`** → por el breakpoint del contenedor (medido con ResizeObserver). Ideal para apps de escritorio (Wails): el layout responde al tamaño del panel, no de la ventana.
2. **Sin `Container` ancestro** → por el breakpoint del **viewport** (matchMedia, vía UIRoot). Ideal para landings: el layout responde al ancho de la ventana.

En ambos casos la resolución es mobile-first: si el breakpoint activo no define valor, se busca hacia abajo en la escala.

### 1. Box, Flex y Grid (Primitivas de Diseño)
Contenedores basados en propiedades responsivas (`Responsive<T>`), donde el valor puede ser único o definirse por breakpoint: `{ xs, sm, md, lg, xl }`.

#### Propiedades Comunes de Layout (`LayoutProps`)
| Prop | Tipo | Descripción |
| :--- | :--- | :--- |
| `padding` | `Responsive<SpacingSemantic>` | Padding en todos los costados. |
| `paddingX` | `Responsive<SpacingSemantic>` | Padding izquierdo y derecho. |
| `paddingY` | `Responsive<SpacingSemantic>` | Padding superior e inferior. |
| `margin` | `Responsive<SpacingSemantic>` | Margen en todos los costados. |
| `gap` | `Responsive<SpacingSemantic>` | Espaciado entre elementos hijos. |
| `width`/`height`| `string \| number` | Ancho y alto explícitos. |

#### Propiedades Específicas
- **`Box`**: Soporta `variant` (`SurfaceVariant`), `tone` (`'base' | 'high' | 'highest'`, automático por anidación) y `shadow` (`ShadowKey`).
- **`Flex`**: Soporta `direction` (`row|column`), `align` (`center|stretch...`), `justify` (`between|center...`) y `wrap` (`boolean|'reverse'`).
- **`Grid`**: Soporta `columns` (`number|string`), `autoColumns` (`GridAutoColumn` como `'md'`), `rows` (`number|string`), `columnGap`, `rowGap`.

#### Ejemplo de Uso
```tsx
import { Box, Flex, Grid } from '@agnostos/layout';

// Contenedor flexible responsivo
<Flex direction={{ xs: 'column', md: 'row' }} gap="md" align="center">
  <Box padding="sm" variant="secondary">Elemento 1</Box>
  <Box padding="sm" variant="secondary">Elemento 2</Box>
</Flex>

// Grid fluido autoajustable con columnas de tamaño mínimo 'md' (240px)
<Grid autoColumns="md" gap="md">
  <Box padding="md" variant="default" shadow="xs">Card 1</Box>
  <Box padding="md" variant="default" shadow="xs">Card 2</Box>
</Grid>
```

---

### 2. Container (Contenedor con Contexto de Tamaño)
Contenedor primario de diseño equipado con un `ResizeObserver` interno de alta precisión para medir dinámicamente sus dimensiones físicas y proveer un estado responsivo local para todos sus descendientes.

#### Propiedades (Props)
*Hereda todas las propiedades de `LayoutProps` y `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `SurfaceVariant` | `undefined` | Aplica fondo, bordes y color de texto predeterminado al contenedor. |
| `tone` | `'base' \| 'high' \| 'highest'` | automático | Tono de la rampa de la variante; sube solo al anidar la misma variante (igual que Card y Box). |
| `shadow` | `ShadowKey` | `undefined` | Sombra física del contenedor. |

#### Ejemplo de Uso
```tsx
import { Container } from '@agnostos/layout';

<Container variant="default" shadow="sm" padding="lg">
  {/* Todos los Flex, Grid y Box internos sabrán exactamente el ancho de este Container */}
  <h3>Contenedor Medido</h3>
</Container>
```

---

### 3. Stack (Pila)
Shorthand optimizado de composición para apilar elementos en columna o fila. Basado en `Flex`.

#### Propiedades (Props)
*Hereda de `FlexProps` excluyendo `direction`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `direction` | `'column' \| 'row'` | `'column'` | Dirección de apilamiento. |

#### Ejemplo de Uso
```tsx
import { Stack } from '@agnostos/layout';

<Stack gap="sm">
  <span>Fila 1</span>
  <span>Fila 2</span>
  <span>Fila 3</span>
</Stack>
```

---

### 4. ScrollArea (Área de Desplazamiento)
Superficie scrollable responsiva con diseño estilizado para barras de navegación, menús laterales o listados densos.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLDivElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `direction` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Dirección permitida del scroll. |
| `maxHeight` | `string \| number` | `undefined` | Altura máxima. |
| `maxWidth` | `string \| number` | `undefined` | Ancho máximo. |

#### Ejemplo de Uso
```tsx
import { ScrollArea } from '@agnostos/layout';

<ScrollArea maxHeight="250px" direction="vertical">
  <div style={{ height: '600px' }}>
    Contenido muy largo que se desplazará verticalmente...
  </div>
</ScrollArea>
```

---

### 5. ScrollableGrid (Grid de Ventana con Scrollbar Propio)

Grid para superficies acotadas de una aplicación: paneles, exploradores, bibliotecas o tablas visuales. Conserva el mecanismo de scroll del navegador para rueda, teclado y touch, pero oculta su pintura completamente y muestra un scrollbar propio en forma de píldora, sin botones ni flechas del sistema operativo.

> Define `height`, `maxHeight`, `width` o `maxWidth` para establecer el viewport desplazable. Este componente está pensado para una ventana de aplicación, no para el flujo largo de una landing page.

#### Propiedades (Props)

*Extiende `React.HTMLAttributes<HTMLDivElement>`.*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `direction` | `'vertical' \| 'horizontal' \| 'both'` | `'vertical'` | Ejes que permiten desplazamiento. |
| `height`, `maxHeight`, `width`, `maxWidth` | `string \| number` | `undefined` | Dimensiones del viewport. |
| `columns`, `rows` | `number \| string` | `undefined` | Plantillas del grid. Un número se resuelve como `repeat(n, minmax(0, 1fr))`. |
| `autoColumns` | `GridAutoColumn` | `undefined` | Grid fluido mediante tokens (`'xs'` a `'xl'`). |
| `gap`, `columnGap`, `rowGap` | `SpacingSemantic` | `undefined` | Separación tokenizada entre items. |
| `inset` | `Inset` | `undefined` | Padding tokenizado del contenido, global o por lado: `{ top, right, bottom, left }`. |
| `scrollbarInset` | `SpacingSemantic` | `'xs'` | Separación del riel respecto de sus bordes. |
| `scrollbarThickness` | `SpacingSemantic` | `'xs'` | Grosor tokenizado del riel y del thumb. |
| `minThumbSize` | `number` | `24` | Tamaño mínimo, en px, del thumb arrastrable. |

#### Ejemplo de Uso

```tsx
import { Card, Text } from '@agnostos/components';
import { ScrollableGrid } from '@agnostos/layout';

<ScrollableGrid
  height="480px"
  autoColumns="sm"
  direction="vertical"
  gap="sm"
  inset={{ top: 'md', right: 'lg', bottom: 'md', left: 'md' }}
  scrollbarInset="xs"
  scrollbarThickness="xs"
  aria-label="Proyectos recientes"
>
  {projects.map((project) => (
    <Card key={project.id} variant="secondary">
      <Text variant="h4">{project.name}</Text>
    </Card>
  ))}
</ScrollableGrid>
```

El scrollbar aparece únicamente cuando hay contenido que desplazar. Se puede arrastrar el thumb o pulsar el riel para saltar a otra posición.

---

### 6. Section (Sección de Página / Landing)
Estructura de página para landings y páginas de marketing: ritmo vertical generoso (`size`), ancho de contenido centrado (`container`) y fondos/patrones decorativos. No mide — si necesitas breakpoints por contenedor, anida un `Container` dentro.

#### Propiedades (Props)
*Extiende de `React.HTMLAttributes<HTMLElement>`*

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `as` | `'section' \| 'header' \| 'footer' \| 'div'` | `'section'` | Tag semántico: `header` para el hero, `footer` para el pie. |
| `size` | `Responsive<'sm' \| 'md' \| 'lg' \| 'xl'>` | `'md'` | Ritmo vertical (padding-block): 48 / 64 / 80 / 96px. |
| `container` | `Responsive<'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'>` | `'lg'` | Ancho máximo del contenido centrado: 640 / 768 / 1024 / 1280px / sin límite. |
| `background` | `'default' \| 'subtle' \| 'brand' \| 'glow'` | `'default'` | Fondo de la sección. `brand` usa el degradado de marca y ajusta el texto. `glow` un halo radial de primary arriba. |
| `pattern` | `'none' \| 'dots' \| 'grid'` | `'none'` | Patrón decorativo superpuesto (no interactivo). Sigue el color del texto de la sección. |

#### Ejemplo de Uso
```tsx
import { Section } from '@agnostos/layout';
import { Reveal, Text, Button } from '@agnostos/components';
import { Flex } from '@agnostos/layout';

<Section as="header" background="glow" pattern="dots" size="xl" container="md">
  <Flex direction="column" align="center" gap="lg">
    <Reveal>
      <Text variant="overline" color="primary" tracking="widest">Agnostos UI</Text>
    </Reveal>
    <Reveal delay="base">
      <Text variant="display-md" balance>Un solo sistema de UI para escritorio y web</Text>
    </Reveal>
    <Reveal delay="slower">
      <Button variant="primary">Empezar ahora</Button>
    </Reveal>
  </Flex>
</Section>

<Section background="subtle" pattern="grid" size="lg" container="lg">
  {/* Features... */}
</Section>
```

Los fondos usan los gradient tokens (`--aui-gradient-brand/subtle/glow`), que referencian las vars del tema y se adaptan solos a light/dark.

---

## 🏷️ Paquete: `@agnostos/semantics`

Provee componentes para encapsular intención semántica, variaciones de estado o herencia de superficies visuales a través de la cascada de CSS (sin heredar clases complejas).

### 1. Surface (Superficie)
Aplica y propaga variables del tema (como color de fondo e inyección de bordes/colores interactivos) a todos los descendientes mediante un elemento invisible (`display: contents`).

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'inverted' \| 'muted' \| 'elevated' \| 'interactive' \| 'glass'` | `'default'` | El tipo de fondo semántico a aplicar. Modifica dinámicamente `--aui-surface`. |
| `depth` | `number` | Calculado automáticamente | Nivel de anidamiento de la superficie. Incrementa de forma automática de padre a hijo. |

#### Ejemplo de Uso
```tsx
import { Surface } from '@agnostos/semantics';

<Surface variant="glass">
  <div className="tarjeta">
    {/* Heredará variables translúcidas y filtros blur de la superficie glass */}
    <p>Texto translúcido</p>
  </div>
</Surface>
```

---

### 2. Intent (Intención / Canal de Estado)
Establece un contexto semántico (éxito, peligro, información, advertencia) utilizable por subcomponentes anidados para auto-configurar su estética de retroalimentación de forma coordinada.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | `'default'` | Variante de intención a propagar en el subárbol. |

#### Ejemplo de Uso
```tsx
import { Intent } from '@agnostos/semantics';

<Intent variant="danger">
  {/* Componentes hijos pueden consumir el contexto de peligro para acoplarse */}
</Intent>
```

---

## ⚡ Paquete: `@agnostos/core`

Contiene el motor y adaptadores de inicialización de la librería. Se encarga de sincronizar y adaptar temas y preferencias del navegador en tiempo de ejecución.

### 1. UIRoot (Proveedor Raíz)
Componente central y obligatorio de envoltura para cualquier aplicación que utilice Agnostos UI. Maneja observadores y adapters del DOM para sincronizar y aplicar variables globales.

#### Propiedades (Props)

| Prop | Tipo | Por Defecto | Descripción |
| :--- | :--- | :--- | :--- |
| `children` | `ReactNode` | *Requerido* | Componentes de la aplicación. |
| `breakpoints`| `Partial<BreakpointConfig>` | Valores estándar | Personalización opcional del mapa de breakpoints responsivos. |
| `theme` | `'light' \| 'dark' \| 'system'` | `'system'` | Selección de tema de color. |

#### Ejemplo de Uso
```tsx
import React from 'react';
import { UIRoot } from '@agnostos/core';

export default function App() {
  return (
    <UIRoot theme="system">
      <MainLayout />
    </UIRoot>
  );
}
```


#uso de en un proyecto wails para scrollbable grid para que funcione correctamente.
# Arquitectura del Shell de Aplicación Wails

Documentación del patrón de layout usado en AgnostosV2 y por qué cada pieza es necesaria.

---

## ¿Por qué declarar `html, body, #root { height: 100% }`?

### El problema raíz

Un navegador (y el WebView de Wails) asigna por defecto a `html` y `body` una altura **`auto`** — es decir, la altura se calcula a partir del contenido, no del viewport. Esto significa:

```
Viewport Wails: 900px de alto
  └── <html>   → height: auto → colapsa al contenido
       └── <body>  → height: auto → colapsa al contenido
            └── #root   → height: auto → colapsa al contenido
                 └── Tu app React → intenta usar flex: 1... pero ¿1 de qué?
```

**`flex: 1` en un hijo solo funciona si el padre tiene una altura definida.** Si `#root` no tiene altura, `flex: 1` resuelve a `0px` — el componente colapsa.

### La solución: anclar la cadena al 100% del viewport

```css
html,
body,
#root {
    height: 100%;   /* hereda el 100% del viewport hacia abajo */
    margin: 0;      /* reset de margen default del browser */
    padding: 0;     /* reset de padding default del browser */
    overflow: hidden; /* evita scrollbar global en la ventana Wails */
}
```

Con esto, la cadena queda:
```
Viewport Wails: 900px
  └── <html>   → height: 100% = 900px
       └── <body>  → height: 100% = 900px
            └── #root   → height: 100% = 900px
                 └── Flex(column, height:'100%') → 900px ✓
```

Ahora `flex: 1` en los hijos tiene un valor concreto del que crecer.

> **¿Por qué `overflow: hidden` en `#root`?**  
> En una app de escritorio Wails, el scroll global de la ventana no tiene sentido — cada panel tiene su propio scroll. `overflow: hidden` en `#root` elimina cualquier scrollbar nativo residual y garantiza que el contenido no "se derrame" fuera de la ventana.

---

## Estructura del shell en `Layout.tsx`

```tsx
<Flex direction="column" style={{ height: '100%' }}>
  {/* ① Header: altura natural (determinada por su contenido) */}
  <Box variant="default" shadow="md" className="app-drag-region">
    ...botones de ventana, menú...
  </Box>

  {/* ② Contenedor de vistas: ocupa TODO el espacio restante */}
  <Box style={{
    position: 'relative',   // ← ancestor posicionado para los hijos absolute
    flex: '1 1 0%',         // ← crece para llenar lo que sobra tras el header
    minHeight: 0,           // ← permite que flex shrink funcione correctamente
    overflow: 'hidden',     // ← el clip lo maneja cada vista, no el contenedor
  }}>
    <Outlet />  {/* cada ruta hija se renderiza aquí */}
  </Box>

  {/* ③ Drawers: posicionados fixed/absolute por el propio componente */}
  <NavigationDrawer ... />
</Flex>
```

### ¿Por qué `position: relative` en el Box de contenido?

Porque las vistas hijas usan `position: absolute; inset: 0` para llenarlo. Un elemento `position: absolute` se posiciona respecto a su **ancestor posicionado más cercano** (`position` distinto de `static`). Sin el `position: relative` en el Box, la vista se posicionaría respecto a `#root` o a `html`, ignorando el header.

### ¿Por qué `minHeight: 0`?

Por defecto, un flex-item tiene `min-height: auto`, lo que significa que **no puede reducirse por debajo del tamaño de su contenido**. Si el contenido de una vista es muy alto, el Box rompería el layout en lugar de scrollear internamente. `minHeight: 0` permite que el Box se comprima correctamente cuando la ventana es pequeña.

---

## Patrón de cada vista de ruta

Cada componente de ruta (VistaMarketplace, VistaEncriptar, etc.) sigue este patrón:

```tsx
function MiVista() {
  return (
    // ① Se ancla absolutamente al Box de Layout
    <Flex direction="column" style={{ position: 'absolute', inset: 0 }}>

      {/* ② Secciones con altura natural (header de vista, filtros, etc.) */}
      <Box padding="lg">
        ...contenido superior fijo...
      </Box>

      {/* ③ Área scrolleable: fill consume el espacio restante del Flex */}
      <ScrollableGrid fill ...>
        ...items...
      </ScrollableGrid>

    </Flex>
  );
}
```

### ¿Por qué `position: absolute; inset: 0` en la vista?

- **Rompe la dependencia de la cadena flex externa.** El componente obtiene su tamaño del Box posicionado del Layout, no de propagar `flex: 1` a través de React Router, Outlet, etc.
- **El layout interno es autocontenido.** Una vez que la vista tiene tamaño propio (el del Box), puede usar flex-column internamente con total independencia.
- **Escala automáticamente.** Cuando la ventana Wails crece o se reduce, el Box de Layout cambia de tamaño → `inset: 0` sigue sus bordes → la vista siempre ocupa exactamente el área disponible.

### ¿Por qué `fill` en `ScrollableGrid` en vez de `height` fijo?

```tsx
// ❌ Fijo: no responde al tamaño de la ventana
<ScrollableGrid height="400px" ...>

// ✅ fill: flex: 1 1 0% — crece para llenar el espacio restante del Flex padre
<ScrollableGrid fill ...>
```

La prop `fill` aplica `flex: 1 1 0%` + `minHeight: 0` al wrapper del componente, convirtiéndolo en un flex-item que consume todo el espacio vertical disponible después de los elementos de altura natural (searchbar, filtros, etc.).

---

## Diagrama completo

```
Viewport Wails (ej. 900×600px)
│
├── html / body / #root    → height: 100%, overflow: hidden
│
└── UIRoot (Provider — sin estilo propio)
     │
     └── Flex(column, height:'100%')    ← Layout.tsx
          │
          ├── Box(header)               → ~48px, altura natural
          │    └── [botones, drag region]
          │
          └── Box(position:relative, flex:1, minHeight:0)   → ~552px restantes
               │
               └── <Outlet> → VistaMarketplace
                    │
                    └── Flex(column, position:absolute, inset:0)   → 0,0 → 552px
                         │
                         ├── Box(padding lg)                       → altura natural
                         │    └── [SearchBar, filtros]
                         │
                         └── ScrollableGrid(fill)                  → flex:1, resto
                              └── [cards del marketplace, scroll propio]
```

---

## Resumen de reglas

| Elemento | CSS clave | Razón |
|---|---|---|
| `html, body, #root` | `height: 100%; overflow: hidden` | Ancla la cadena de altura al viewport; elimina scroll global |
| `Layout` raíz | `height: 100%` en Flex | Propaga la altura del `#root` a la estructura del shell |
| Box de contenido | `position: relative; flex: 1 1 0%; minHeight: 0` | Crea el ancestor posicionado y consume el espacio tras el header |
| Vista de ruta | `position: absolute; inset: 0` | Se ancla al Box, tamaño propio sin depender de cadena flex externa |
| `ScrollableGrid` | `fill` | `flex: 1 1 0%` dentro de la vista, consume espacio restante |
