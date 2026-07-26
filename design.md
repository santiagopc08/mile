# Sistema de Diseño: Cyber-Brutalista Mobile-First

Este documento define la dirección estética, la Directriz de Botones y la Directriz de Títulos Geométricos Animados de la aplicación. La interfaz está diseñada prioritariamente para **Mobile-First** (pantallas táctiles de smartphone).

---

## 1. Principios de Diseño

1. **Mobile-First Táctil e Interactivo**:
   - Elementos adaptados a zonas de alcance de pulgar en smartphone.
   - Objetos con respuesta háptica/táctil clara (`active:scale-95`).
   - **Auto-Shimmer Periódico**: Como en móviles no existe el evento de puntero `hover`, los componentes emiten ráfagas de luz neón y pulso cíclico de forma autónoma para mantener la pantalla viva. El ciclo dura `--dur-ambient` (8s): por debajo de 6s el fondo se lee como nervioso y compite con el contenido.

2. **Directriz Oficial de Botones Cyber (`CyberButton.tsx`)**:
   - **Forma Biselada**: Todos los botones principales adoptan esquinas cortadas en chaflán a 45° (`clip-path: polygon(...)`).
   - **Variantes Estructuradas**: `primary` (acento neón incandescente), `secondary` (translúcido), `outline` (borde neón), `danger` (alerta roja), `ghost`.
   - **Sin Ruidos Tipográficos**: Textos en mayúsculas limpias sin barras `//` ni guiones bajos `_`.

3. **Directriz de Títulos Geométricos Animados**:
   - TODOS los títulos de página y sección deben incluir una **insignia geométrica rotativa** (`◆`, `◈`, `▲`) con animación continua `animate-spin-slow`.
   - Líneas de escaneo láser pulsantes debajo de los títulos principales y banderas de notificación.
   - Tipografía limpia en mayúsculas: viñetas centrales (`·`), guiones (`-`) o espacios armónicos.

4. **Paneles Biselados Cyber (Chamfered Cuts)**:
   - Uso de recortes en chaflán a 45° en `ChamferedPanel` en lugar de esquinas redondeadas genéricas.
   - Pestañas flotantes laterales y biseles acentuados en color neón.

---

## 2. Tokens de Color y Acentuación

- **Ella (Mile)**: `#ff4b89` (Rosa Neón Vibrante) · Alpha Glow: `rgba(255, 75, 137, 0.25)`
- **Él (Santi)**: `#c3f400` (Verde Neón Solar) · Alpha Glow: `rgba(195, 244, 0, 0.25)`
- **Terciario (Sintonía)**: `#a178ff` (Púrpura Profundo)
- **Superficie Neón**: `#0a070c` (Negro Profundo con Tinte Violeta / 95% Opacidad con Glassmorphism `backdrop-blur-xl`)
- **Bordes Subtles**: `rgba(255, 255, 255, 0.12)`

### Fuente única de verdad: `src/lib/profilePalette.ts`

**Ningún componente vuelve a escribir un hex de perfil a mano.** Cada rampa (`primary`, `secondary`, `highlight`, `shadow`, `glow`, `line`) sale de `getProfilePalette(profile)`. Antes cada fondo definía la suya a ojo —`GeometricBackground` usaba `#89D94A`/`#FF4F9A` y `InteractiveBackground` los tokens reales—, así que el verde y el rosa **cambiaban de tono al navegar**: el síntoma más caro de todos, porque rompe la ilusión de una sola app sin que se pueda señalar qué pantalla está mal.

Sin perfil activo hay dos neutros y la diferencia importa: `NEUTRAL_PALETTE` (gris técnico normal) y `NEUTRAL_PALETTE_SOFT`, para capas que quedan detrás de un formulario y no deben competir con él (el login).

---

## 2 bis. Tokens de Movimiento

Definidos en `:root` de `globals.css`. El vocabulario de animación ya era enorme; lo que faltaba era **gramática común**: antes cada animación elegía su duración a ojo (2s, 2.2s, 2.6s, 10s, 12s, 24s, 35s…) y casi todas `ease-in-out`, así que nada se sentía coreografiado.

- **Curvas**: `--ease-out-expo` (entradas, arranca rápido y frena suave) · `--ease-in-out-quart` (transiciones simétricas) · `--ease-spring` (táctil, rebota un punto).
- **Duraciones**: `--dur-tap` 120ms · `--dur-ui` 240ms · `--dur-enter` 420ms · `--dur-ambient` 8s · `--dur-drift` 32s.
- **Escalonado**: `--stagger` 45ms, aplicado como `animation-delay: calc(var(--i) * var(--stagger))` con `style={{ '--i': index }}`.

Dos reglas que deciden casi todo:

1. **Nada ambiental por debajo de 6s** — parece nervioso y roba atención al contenido.
2. **Nada de UI por encima de 400ms** — parece lento y delata que es web, no app.

Corolario: una animación que solo se diferencia de otra en el retardo **no es una clase nueva**. Se parametriza con `--i` (así `.animate-opt-dance` reemplazó a trece clases idénticas).

### Coreografía de entrada

El contenedor de página (`template.tsx`) solo puede animar **opacidad**: un `transform` ahí crearía un containing block y desplazaría los fondos `fixed inset-0` al hacer scroll. La dirección del movimiento la ponen los hijos, con `.stagger-item` y el índice inline (`style={{ '--i': n }}`), o con `staggerIndex` si es un `ChamferedPanel`.

Dos detalles que no son opcionales:

- El fotograma final es `transform: none`, **no** `translateY(0)`: un `translateY(0)` computa a matriz y seguiría creando containing block, rompiendo los modales `fixed inset-0` que viven dentro de las tarjetas.
- El `fill-mode` es `backwards`, **no** `both`: con `both` el fotograma final se queda aplicado para siempre y ese `transform` gana a los estilos en línea de framer-motion, así que el `whileTap` de los paneles dejaría de responder al dedo.

**No hay animación de salida entre rutas, y es a propósito.** En App Router el árbol saliente se desmonta antes de que nada pueda animarlo; forzarlo con framer-motion ya se intentó aquí y dejaba páginas pesadas semi-invisibles (ver el comentario en `template.tsx`). La vía nativa (`document.startViewTransition`) necesita que el DOM nuevo esté confirmado dentro del callback, y `router.push` es asíncrono y no devuelve promesa: la captura se dispara antes de tiempo y parpadea. Por eso Next lo mantiene experimental.

---

## 2 ter. Sistema de Vidrio (Glassmorphism flotante)

Los contenedores dejaron de ser cajas opacas: son **vidrio traslúcido sobre el `AmbientField`**. La retícula, el halftone y la geometría del fondo se leen a través de cada panel, y eso —no una sombra— es lo que hace que todo «flote». Antes las superficies se apilaban a `/90`–`/98` (prácticamente sólidas) o directamente `bg-[#050505]`/`bg-black`, tapando el fondo por completo: el fondo elaborado no se veía nunca bajo el contenido.

Definido en `:root` de `globals.css` con utilidades `.glass` / `.glass-strong` / `.glass-float` / `.glass-sheen`:

- **Dos intensidades de tinte**: `--glass-bg` (`rgba(12,8,13,.42)`) para capas ligeras (chips, botones, tarjetas) y `--glass-bg-strong` (`.66`) bajo texto denso o formularios, donde la legibilidad manda sobre la transparencia. El tinte hereda el negro violáceo de la app, no un gris: sobre gris los acentos neón se ensucian.
- **`backdrop-blur` + `saturate(1.35)` siempre juntos**: el desenfoque apaga los neón que quedan detrás del vidrio; la saturación los revive. Uno sin el otro se ve muerto.
- **Filo de luz superior** (`glass-sheen` / gradiente blanco al 10% en el primer tercio): el reflejo que convierte una superficie plana en vidrio.

Dos reglas técnicas **no negociables**, porque ya costó descubrirlas:

1. **`clip-path` recorta la `box-shadow`.** Los paneles biselados (`ChamferedPanel`, `CyberButton`) no pueden flotar con sombra exterior: el recorte poligonal se la come. Allí la flotación es **solo translucidez + desenfoque**, y la profundidad la da un `inset` shadow (que sí sobrevive al recorte). Para el `CyberButton` el despegue y el halo neón van por `filter: drop-shadow`, que **sí** sigue la forma biselada.
2. **Nunca `filter` en `ChamferedPanel`.** `filter` crea un containing block para descendientes `position: fixed`, y varias tarjetas montan modales `fixed inset-0` dentro (Timeline, Mahjong, Toast) — el mismo motivo por el que el contenedor de página solo anima opacidad (ver *Coreografía de entrada*). Por eso `ChamferedPanel` flota sin `filter` ni sombra exterior: puro vidrio.

**Qué se deja opaco a propósito** (transparentar aquí resta, no suma): campos de formulario/inputs mientras se escribe, marcos de vídeo con `mix-blend-screen`, fichas del Mahjong, y los scrims oscuros de fondo de modal (`bg-black/60`…), que existen justo para separar el modal del resto.

---

## 3. Guía de Componentes

### `CyberButton`
Componente oficial para todos los botones. Ofrece soporte para iconos, estados de carga/deshabilitados, acento de color de perfil y recorte en chaflán de 45°. Es **vidrio** (`backdrop-blur` + `saturate`) y flota con `filter: drop-shadow` porque el chaflán recorta cualquier `box-shadow` (ver *Sistema de Vidrio*).

### `ChamferedPanel`
Contenedor principal con esquinas cortadas en chaflán a 45°, marcadores HUD de retícula `[ + ]`, pestañas laterales flotantes, resplandor ambiental y animación de auto-shimmer cíclico para móvil. Con `staggerIndex={n}` entra escalonado en la coreografía de la pantalla (ver *Tokens de Movimiento*). Superficie de **vidrio traslúcido** (`bg-[#0a070c]/45`): el `AmbientField` se lee a través. No lleva `filter` ni sombra exterior a propósito — rompería los modales `fixed` internos y el chaflán recorta la sombra (ver *Sistema de Vidrio*).

### `AmbientField`
**El único fondo de la app.** Sustituye a `InteractiveBackground` y `GeometricBackground`, que hacían casi lo mismo con rampas de color distintas y ocho bucles de framer-motion cada uno. Cinco capas, de atrás hacia delante:

1. **Base** — color plano más dos resplandores radiales del acento. Antes eran orbes animados con `blur(100px)`: un desenfoque de ese radio se recompone en cada fotograma y se veía prácticamente igual quieto.
2. **Retícula** — blueprint de 40px con máscara radial que la **desvanece hacia los bordes** en vez de cortarla a hueso contra el marco.
3. **Halftone** — trama de puntos de 26px derivando en sentido contrario y más lento que la retícula: eso es el parallax.
4. **Geometría** — wireframes flotantes propios de cada sección (`preset`).
5. **Grano + viñeta** — el grano se rasteriza una sola vez como data-URI, no como filtro SVG vivo. La viñeta es lo que convierte «fondo decorado» en «fondo con profundidad».

Toda la animación ambiental es CSS sobre `transform`, resuelto por el compositor: el hilo principal queda libre para el scroll, que es lo que el usuario sí nota. Animar `background-position` a pantalla completa —el atajo evidente— fuerza un repintado por fotograma y es justo lo que vuelve el scroll pastoso en móvil. Cada capa se desplaza un múltiplo exacto de su tile para que el bucle no salte.

`attach="parent"` lo mete dentro del contenedor que lo monta, en vez de clavarlo al viewport: necesario en el login, donde el contenedor ya es un `fixed inset-0` con fondo propio y un `z-[-1]` lo escondería detrás de su propio `bg`.

### Kit decorativo (`src/components/deco`)

El lenguaje lineal y geométrico del moodboard en piezas pequeñas y reutilizables: `DecoRule` (separador con ticks y etiqueta), `CornerBrackets` (corchetes HUD en las 4 esquinas de un padre `relative`), `TickScale` (regla de medición), `RadialBurst` (abanico radial), `ContourLines` (curvas topográficas), `DataStrip` (código de barras), `MicroLabel` (metadato mono) y `WireSolid` (poliedro isométrico en giro 3D).

Reglas comunes, no negociables:

- **`aria-hidden` + `pointer-events-none`**: son adorno, no contenido ni tacto.
- **Color por `currentColor`**: heredan el acento del contenedor. No se cablea el perfil pieza por pieza — se pone `style={{ color: accent }}` en el ancestro y todo el kit lo toma.
- **Los trazos se dibujan al entrar en pantalla** (`.deco-draw` + `pathLength={1}`), no aparecen con fade. `pathLength={1}` normaliza cualquier figura a la misma unidad de dasharray, así no hay que medir cada trazo.
- **Criterio de uso**: una o dos por pantalla, en los márgenes. Si tapan lo que se lee, sobran.

Dos trampas que ya están resueltas y conviene no reintroducir:

- **Coordenadas trigonométricas redondeadas a 3 decimales** (`r3`). `Math.cos`/`Math.sin` difieren en el último dígito entre Node (SSR) y el navegador; React serializa el float tal cual y el atributo SVG no coincide, disparando error de hidratación. A 3 decimales es idéntico y sub-píxel.
- **Patrones «aleatorios» deterministas** (`DataStrip` usa un PRNG con semilla, no `Math.random()`): un random en render produce distinto HTML en servidor y cliente.

### `useInView` (`src/lib/useInView`)

Un **único** `IntersectionObserver` compartido para toda la app, no uno por elemento: fondo, recursos y paneles pueden ser decenas de suscriptores. Si el navegador no lo trae, devuelve `true` de entrada — ante la duda, mostrar; un fallo de detección nunca debe dejar algo invisible para siempre.

### Scroll-driven

El parallax de los recursos usa `animation-timeline: view()` bajo `@supports`, sin fallback en JS: donde no exista, el recurso se queda quieto. Un parallax por listener de scroll cuesta más de lo que aporta. Y `prefers-reduced-motion` **deja el trazo dibujado y la trama visible** (`stroke-dashoffset: 0`), no anula sin más: anular a secas dejaría la figura en su estado inicial invisible, que es peor que no tener el efecto.

### `AppNav`
Barra de navegación móvil flotante inferior con indicador de pestaña activa mediante barra neón incandescente e iconos con micro-animaciones al tocar. Respeta el *safe area* de iOS (`nav-safe-offset` / `header-safe-offset`) y emite un tic háptico al cambiar de sección.

### `Toast` (`ToastProvider` + `useToast`)
**Directriz: prohibido `alert()`, `confirm()` y `prompt()` nativos.** Congelan el hilo principal, cortan las animaciones en curso y en la PWA de iOS se presentan con el prefijo del dominio, rompiendo la ilusión de app nativa.

Todo aviso pasa por `useToast()`:

- `success` / `error` / `warning` / `info` — avisos apilables (máx. 3), auto-descarte con cuenta atrás visible, arrastrables hacia arriba para cerrar, con háptica por variante y anuncio `aria-live` (`role="alert"` en errores).
- `confirm({ title, message, tone })` — diálogo modal biselado que devuelve una `Promise<boolean>`. Obligatorio antes de cualquier acción irreversible. Con `tone: 'danger'` el foco inicial va a **Cancelar**, para que un Enter reflejo no destruya nada. Cierra con Escape o tocando fuera, y atrapa el foco mientras está abierto.
- Claves de deduplicación (`key`) para avisos recurrentes, p. ej. el estado de conexión.

### Estados vacíos
Una lista vacía nunca debe renderizar la nada. Como mínimo: un borde discontinuo, una frase que explique **por qué** está vacía y —cuando el usuario pueda hacer algo— el botón que lo arranca. Nunca mensajes dirigidos al desarrollador (claves de API, variables de entorno, rutas de archivos): el usuario final no puede actuar sobre eso y solo le tapa lo que sí le sirve.

### Pantallas de fallo (`error.tsx`, `global-error.tsx`, `not-found.tsx`)
Cuando algo va mal, la app debe seguir pareciéndose a sí misma y ofrecer una salida. Nunca una pantalla en blanco ni la página por defecto de Next: en una PWA instalada no hay barra de direcciones ni botón de recarga, así que el usuario se queda sin salida salvo cerrar la app.

- `error.tsx` — fallo de un segmento. Mantiene la navegación y ofrece `reset()` («Reintentar») más una vuelta al inicio.
- `global-error.tsx` — fallo en el layout raíz. Reemplaza el documento entero, así que va en **estilos en línea**: no puede depender de Tailwind, de globals.css ni de las fuentes.
- `not-found.tsx` — 404 en púrpura terciario con vuelta al inicio.

Todas insisten en lo mismo, porque es lo que el usuario teme: *«Tus datos están a salvo: no se ha borrado nada.»*

### Accesibilidad transversal
- Zoom permitido hasta 5× (bloquearlo impide ampliar texto a quien lo necesita).
- Anillo de foco púrpura global en `:focus-visible`.
- Enlace «Saltar al contenido» como primer elemento tabulable, apuntando a `#contenido` (`template.tsx`).

### Ergonomía táctil (Mobile-First, iOS)

Dos reglas sistémicas, aplicadas cada una en un solo sitio:

- **Colchón inferior del contenido** (`.pb-app-nav` en el `<body>`): la barra inferior es `fixed` y mide ~77px, pero el `<body>` solo reservaba el safe-area (el home indicator). El último elemento de cada página quedaba tapado. El colchón es `alto del nav + safe-area + respiro`; en `lg` la navegación pasa a barra lateral y se reduce al safe-area. No repetir padding inferior por página: ya lo hereda todo del body.
- **Objetivo táctil mínimo de 44px** (Apple HIG). Todo vive bajo `@media (pointer: coarse)` —el mismo gate que la fuente de 16px de los campos—: en escritorio el ratón apunta fino y agrandar solo mete aire. Tres piezas:
  - **Red de seguridad global**: `:where(a[href], button, [role=button], summary):not(...) { min-height: 44px }`. Un barrido encontró decenas de controles de 20–36px por todos los módulos; etiquetarlos a mano (186 solo en `components`) era inviable y no verificable en preview. Claves de que es segura: **solo `min-height`, nunca `min-width`** (el ancho rompería el empaquetado de filas densas; la altura nunca desborda en horizontal); `:where()` tiene especificidad 0, así que cualquier altura explícita del componente gana sin `!important` de por medio (p. ej. `!min-h-0` del banner de cumple); los enlaces `display:inline` son inmunes (`min-height` no les aplica). Excepciones: nav y header (ya tratados) y `.no-touch` como escape puntual.
  - **`.touch-target`**: añade el `min-width: 44px` que la red global deja fuera a propósito. Para botones de solo icono que deben quedar **cuadrados** (los del header): la red da el alto, esto el ancho.
  - **Inputs**: `min-height: 44px` (el 34px de reposo es para ratón).

Cuidado al verificar: el navegador de previsualización redimensionado sigue siendo puntero **fino**, así que estas reglas no se activan ahí aunque el viewport sea de móvil. Se comprueban con `matchMedia('(pointer: coarse)')`, inyectando la regla sin gate y capturando, o —definitivo— en el iPhone / simulador.
