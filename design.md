# Sistema de Diseño: Cyber-Brutalista Mobile-First

Este documento define la dirección estética, la Directriz de Botones y la Directriz de Títulos Geométricos Animados de la aplicación. La interfaz está diseñada prioritariamente para **Mobile-First** (pantallas táctiles de smartphone).

---

## 1. Principios de Diseño

1. **Mobile-First Táctil e Interactivo**:
   - Elementos adaptados a zonas de alcance de pulgar en smartphone.
   - Objetos con respuesta háptica/táctil clara (`active:scale-95`).
   - **Auto-Shimmer Periódico**: Como en móviles no existe el evento de puntero `hover`, los componentes emiten ráfagas de luz neón y pulso cíclico cada 5 segundos de forma autónoma para mantener la pantalla viva.

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

---

## 3. Guía de Componentes

### `CyberButton`
Componente oficial para todos los botones. Ofrece soporte para iconos, estados de carga/deshabilitados, acento de color de perfil y recorte en chaflán de 45°.

### `ChamferedPanel`
Contenedor principal con esquinas cortadas en chaflán a 45°, marcadores HUD de retícula `[ + ]`, pestañas laterales flotantes, resplandor ambiental y animación de auto-shimmer cíclico para móvil.

### `AppNav`
Barra de navegación móvil flotante inferior con indicador de pestaña activa mediante barra neón incandescente e iconos con micro-animaciones al tocar.
