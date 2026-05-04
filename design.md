---
name: Symmetry
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#e1bfb2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#a88a7e'
  outline-variant: '#594137'
  surface-tint: '#ffb595'
  primary: '#ffb595'
  on-primary: '#571e00'
  primary-container: '#ff7020'
  on-primary-container: '#5c2000'
  inverse-primary: '#a23f00'
  secondary: '#e5b5ff'
  on-secondary: '#4e0078'
  secondary-container: '#a100f0'
  on-secondary-container: '#f7e1ff'
  tertiary: '#00dbe9'
  on-tertiary: '#00363a'
  tertiary-container: '#00acb7'
  on-tertiary-container: '#00393e'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb595'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7c2e00'
  secondary-fixed: '#f4d9ff'
  secondary-fixed-dim: '#e5b5ff'
  on-secondary-fixed: '#30004b'
  on-secondary-fixed-variant: '#7000a8'
  tertiary-fixed: '#7df4ff'
  tertiary-fixed-dim: '#00dbe9'
  on-tertiary-fixed: '#002022'
  on-tertiary-fixed-variant: '#004f54'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 64px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: 0.05em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.1em
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: 0.01em
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0.01em
  mono-data:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
  label-caps:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.15em
spacing:
  unit: 4px
  gutter: 16px
  margin: 24px
  grid-size: 32px
---

## Brand & Style

This design system is built for elite productivity, channeling the aesthetic of a **tactical dashboard** or a **high-end IDE**. The personality is focused, analytical, and uncompromisingly technical. It targets "power users" who view their workflow as a series of precise operations rather than casual tasks.

The visual style is **Refined Brutalism**. It utilizes a strict adherence to a grid, sharp geometric forms, and high-contrast accents to create a sense of digital permanence. The interface avoids organic shapes and soft shadows in favor of hard edges, hair-line borders, and "glowing" data points, ensuring the user feels in total control of a complex, futuristic system.

## Colors

The palette is anchored in a **Deep Black (#000000)** foundation to maximize contrast and visual depth. 

- **Primary Accent (Vibrant Orange):** Reserved for critical actions, active focus states, and progress indicators. It serves as the "ignition" color of the system.
- **Secondary Accent (Neon Purple):** Used for navigation highlights, categorization of creative tasks, and secondary interaction feedback.
- **Tertiary Accent (Teal):** Applied to data visualization, status "OK" indicators, and technical categorization.
- **Neutral Layers:** Greys are kept exceptionally dark (#121212, #1A1A1A) to maintain the "stealth" aesthetic, used primarily for container backgrounds and input fields.

## Typography

The typography strategy leverages the technical grit of **Space Grotesk** for all structural and data-heavy elements. Headlines are intentionally bold and condensed to mimic military-spec labeling.

**Inter** provides the necessary legibility for body text and long-form descriptions, ensuring that while the shell is brutalist, the information remains highly readable. A heavy reliance on **Uppercase** with increased letter spacing for labels and sub-headers reinforces the "dashboard" feel. Large numerals (e.g., timers, stats) should always use the Display style for maximum impact.

## Layout & Spacing

The design system utilizes a **Fixed 12-Column Grid** layered over a **subtle 32px background grid pattern**. All components must align to the grid intersections.

Spacing is governed by a 4px base unit, favoring density over whitespace. The "Symmetry" name is reflected in perfectly balanced horizontal distributions. Large components are separated by 32px or 48px blocks, while internal element padding is kept tight (8px to 16px) to maintain a sense of precision and information density common in professional monitoring tools.

## Elevation & Depth

This design system rejects traditional shadows. Depth is achieved through:
- **Tonal Layering:** Background surfaces are #000000. Level 1 containers are #0A0A0A. Level 2 (active cards) are #121212.
- **Thin Borders:** 1px solid borders in low-opacity white (10%) or primary orange (100%) define edges.
- **Glowing Accents:** Active elements utilize a 0px blur, high-spread "glow" using the primary or secondary accent colors to simulate an illuminated hardware display.
- **Grid Transparency:** A fixed background grid pattern is visible through semi-transparent containers, creating a sense of "glass-on-metal" layering.

## Shapes

The shape language is strictly **Sharp (0px)**. No rounded corners are permitted in the standard UI kit. This reinforces the brutalist, architectural nature of the interface. 

Buttons, input fields, and containers are all perfect rectangles. The only exception is the "Circular Profile" element (as seen in the reference), which acts as a focal point of "organic" data within the rigid machine environment.

## Components

- **Buttons:** Sharp edges. Primary buttons are solid Orange with Black text. Secondary buttons are Black with a 1px border and Orange text. Use a slight outer glow on hover.
- **Input Fields:** Dark grey backgrounds (#0A0A0A) with a bottom-only or full 1px border. Focus state triggers an Orange border and a "Label-Caps" label floating above.
- **Cards:** 1px border (#1A1A1A). Headers within cards should have a subtle horizontal separator line. Use the background grid pattern as a "fill" for empty states.
- **Progress Bars:** Thin, linear, and non-rounded. Use segment markers to show granular progress rather than a smooth fill.
- **Chips/Tags:** Monospaced text inside a small rectangular frame. Use Teal or Purple for categorization tags.
- **Tactical HUD Elements:** Small, non-interactive "status" text like "V2.0" or "SYS_READY" in the corners of containers to enhance the futuristic aesthetic.