# Rediseño High-Tech Brutalism

Este documento detalla el plan y la especificación técnica para aplicar la estética High-Tech Brutalism de la carpeta de recursos a la aplicación, sin alterar los colores base actuales (`user-a`, `user-b`, `user-c`) y evitando efectos estroboscópicos. 

Actualmente, el rediseño está implementado y validado en la pestaña de **Antojos** (Planes), la cual sirve como el modelo técnico de referencia para el resto de la aplicación.

---

## Decisiones de Diseño Globales (Symmetry Spec)

### 1. Tipografía Cohesiva (`Space Grotesk`)
* **Carga de Fuente:** Todo el texto del sitio utiliza la fuente geométrica de planos técnicos `Space Grotesk`, cargada de forma nativa en [layout.tsx](file:///Users/santiagoperezcastro/Documents/mile/src/app/layout.tsx) mediante el optimizador de Next.js.
* **Mapeo de Variables:** Las variables de Tailwind v4 `--font-sans` y `--font-mono` están enlazadas a `var(--font-space-grotesk)` en [globals.css](file:///Users/santiagoperezcastro/Documents/mile/src/app/globals.css).
* **Estilo Técnico:** Se realiza un uso extensivo de `uppercase` y espaciados amplios (`tracking-wider` o `tracking-[0.16em]`) en subtítulos, filtros y etiquetas para evocar un panel de control o terminal.

### 2. Contenedores y Bordes
* **Esquinas Rectas:** Forzado global de bordes rectos (`border-radius: 0px !important;` en todo el sitio).
* **Bordes Rigurosos:** Cajas delimitadas por bordes finos de 1px (`border-white/10` o equivalentes neutros oscuros).
* **Efectos de Foco:** Sin sombras difusas ni degradados suaves. Los estados activos o destacados se indican mediante bordes luminosos de color sólido o rellenos tenues del acento.

---

## Implementación de Referencia: Pestaña de Antojos

### 1. Cabecera y Navegación
* **Header Técnico:** El encabezado de la página de Planes utiliza un formato monospaciado con un diseño minimalista (`font-mono tracking-tighter uppercase`).
* **Información de Fuente Única (Sin Duplicados):** Se removió el bloque redundante de estadísticas rápidas de la cabecera de la página. Ahora, toda la información numérica agregada está centralizada exclusivamente en la cuadrícula de estadísticas técnicas superior (`SavingsOverview`), evitando la duplicación de datos y dándole mayor limpieza visual al panel.
* **Barra de Navegación Plana:** Rediseñada en [AppNav.tsx](file:///Users/santiagoperezcastro/Documents/mile/src/components/AppNav.tsx) eliminando el efecto `glassmorphic` por un fondo sólido `#120d0e` con bordes rígidos y un indicador luminoso superior de color acento para la pestaña activa.
* **Visualización en Dos Columnas (Geospatial Plan Tracker):** En el componente de mapa [GeospatialPlanTracker.tsx](file:///Users/santiagoperezcastro/Documents/mile/src/components/GeospatialPlanTracker.tsx), las secciones de "Próximos Destinos" y "Memorias Visitadas" organizan sus listas de forma sumamente robusta en una cuadrícula de **2 columnas** (`grid grid-cols-1 sm:grid-cols-2 gap-2`) que se adapta de manera responsiva, optimizando el espacio en pantallas medianas y grandes.

### 2. Sistema de Filtros Brutalistas
* **Filtro de Categorías:** Fila de botones perfectamente cuadrados de `w-9 h-9` con fondo plano `#050505` que muestran únicamente iconos vectoriales finos sin etiquetas de texto, alineados idénticamente al archivo de referencia `screen.png`.
* **Filtro de Estados:** Botones planos de texto alineados en la misma fila, formateados con tipografía técnica (`font-mono font-black uppercase tracking-[0.16em] text-[9px] h-9 px-4`).

### 3. Tarjeta de Planes (`WishlistCard.tsx`)
Cada antojo se despliega como un contenedor `<article>` que integra los siguientes componentes de diseño crítico:
* **Indicadores Laterales de Estado:** Una franja izquierda sólida de `w-[5px]` que recorre toda la altura de la tarjeta. Los colores están mapeados a clases dinámicas específicas de fondo en CSS (`.state-discovered-bg`, `.state-saving-bg`, etc.) basadas en el estado del plan.
* **Rejilla de Acciones Rígida (Top Right):** Un bloque acoplado compacto con bordes de 1px (`gap-[1px] bg-white/[0.08] brutal-border`) en la esquina superior derecha que contiene de forma lineal:
  * Botones de reacción rápidos representados por iconos vectoriales limpios de Lucide (`Heart`, `Zap`, `Sparkles`) con trazos geométricos finos (`strokeWidth={1.5}`) que se iluminan con el color de acento si están activos. Para anular las políticas globales de accesibilidad táctil de formularios, se incluyó la clase de reinicio `!min-h-0` en los botones, garantizando una alineación de altura perfecta (32px exactos) con el botón de mapa `MapPin` (ancla) y el badge del autor (`div`).
  * Botón/enlace de mapa dinámico (`MapPin`).
  * Indicador de autor (`S` o `M`) estilizado en caja acentuada según el perfil.
  * Etiqueta opcional "Para los dos" integrada al final de la tira.
* **Contenido Interno Indentado:** El cuerpo de la tarjeta cuenta con un padding izquierdo de `pl-7` que crea una alineación limpia y desahogada con respecto al indicador lateral de estado.
* **Barra de Progreso Fragmentada (Chunked):** Una hilera de pequeños bloques cuadrados rígidos (`.chunked-progress` / `.chunk`) que se rellenan secuencialmente representando el porcentaje ahorrado, evitando barras de progreso continuas o redondeadas.
* **Acciones Inferiores Separadas:** Una línea de comandos inferior (editar, borrar, avanzar de estado) delimitada por un borde superior punteado/tenue (`border-dashed border-white/20`).

---

## Guía de Migración para Siguientes Pestañas

Para mantener una consistencia perfecta, las siguientes pestañas (**Día a Día**, **Refugio**, **Salud**, **Juego**) deben migrar a la misma especificación técnica utilizando los componentes desarrollados como bloque constructor:
1. Reemplazar cualquier contenedor redondeado (`rounded-md`, `rounded-2xl`, etc.) por `rounded-none` o usar directamente las utilidades globales.
2. Formatear números grandes e indicadores clave en tipografía `font-mono` Space Grotesk.
3. Agrupar botones de interacción del mismo tipo en contenedores con bordes rígidos y `gap-[1px]`.
4. Utilizar exclusivamente iconos de trazo delgado (`strokeWidth={1.5}` o `1`) dentro de formas cuadradas rígidas.
5. Emplear bordes de estado de color sólido y fragmentos geométricos para cualquier indicador de progreso.
