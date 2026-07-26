---
name: Symmetry
colors:
  surface: '#1f0e13'
  surface-dim: '#1f0e13'
  surface-bright: '#493338'
  surface-container-lowest: '#19090d'
  surface-container-low: '#28161b'
  surface-container: '#2d1a1f'
  surface-container-high: '#382529'
  surface-container-highest: '#442f34'
  on-surface: '#fbdae0'
  on-surface-variant: '#e5bcc4'
  inverse-surface: '#fbdae0'
  inverse-on-surface: '#3f2b2f'
  outline: '#ac878f'
  outline-variant: '#5c3f45'
  surface-tint: '#ffb1c3'
  primary: '#ffb1c3'
  on-primary: '#66002c'
  primary-container: '#ff4b89'
  on-primary-container: '#590026'
  inverse-primary: '#bb0058'
  secondary: '#ffffff'
  on-secondary: '#283500'
  secondary-container: '#c3f400'
  on-secondary-container: '#556d00'
  tertiary: '#d1bcff'
  on-tertiary: '#3c0090'
  tertiary-container: '#a178ff'
  on-tertiary-container: '#34007f'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9e0'
  primary-fixed-dim: '#ffb1c3'
  on-primary-fixed: '#3f0019'
  on-primary-fixed-variant: '#8f0041'
  secondary-fixed: '#c3f400'
  secondary-fixed-dim: '#abd600'
  on-secondary-fixed: '#161e00'
  on-secondary-fixed-variant: '#3c4d00'
  tertiary-fixed: '#e9ddff'
  tertiary-fixed-dim: '#d1bcff'
  on-tertiary-fixed: '#23005b'
  on-tertiary-fixed-variant: '#5700c9'
  background: '#1f0e13'
  on-background: '#fbdae0'
  surface-variant: '#442f34'
typography:
  headline-xl:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.5'
  body-md:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  body-sm:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.4'
  label-mono:
    fontFamily: Space Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1'
    letterSpacing: 0.1em
  code-display:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '300'
    lineHeight: '1.2'
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  grid-margin: 24px
  grid-gutter: 1px
---

## Brand & Style

This design system is rooted in **High-Tech Brutalism**, prioritizing raw structural logic and information density over decorative softness. The aesthetic is inspired by mainframe terminals, blueprint schematics, and cyberpunk utility. It targets technical power-users who require high data visibility and a "pro-tool" interface.

The emotional response is one of precision, urgency, and absolute control. Visual interest is generated not through depth or gradients, but through rigid geometric repetition, tactical use of neon accents, and the transparency of the layout's underlying grid.

## Colors

The palette is anchored by a deep obsidian base (`#131313`), providing a high-contrast environment for luminous signal colors. 

- **Primary (Vibrant Pink):** Reserved for critical actions, active states, and primary branding elements.
- **Secondary (Neon Green):** Used for "system-ready" status, success indicators, and secondary technical readouts.
- **Tertiary (Deep Purple):** Applied to auxiliary data streams, background accents, and low-priority structural highlights.
- **Functional Grays:** A range of cool-toned grays is used for borders and inactive states to maintain the blueprint aesthetic without competing with the neon signals.

Color should be used "digitally"—meaning full saturation or off. Avoid muddy transitions; prefer hard color steps and glowing strokes.

## Typography

The design system exclusively utilizes **Space Grotesk** to maintain a monospaced, technical feel across all hierarchies. The typography is treated as a structural element:

- **Headlines:** Should be tightly tracked and heavy. Use "headline-xl" sparingly for hero sections or major dashboard headers.
- **Labels:** Always uppercase with increased letter spacing. These are used for categories, metadata, and status indicators.
- **Readability:** Despite the brutalist style, body text maintains standard line heights to ensure long-form technical data remains legible.
- **Special Treatment:** Important values or IDs should use "label-mono" to simulate terminal output.

## Layout & Spacing

The layout follows a **Fixed-Grid Structural** model. A global 20px blueprint grid (1px lines at 10% opacity) should be visible in the background of the workspace.

- **Grid:** A 12-column system is used, but instead of wide gutters, elements are separated by 1px borders. This creates a "joined-cell" look common in complex technical interfaces.
- **Density:** Information density is high. Padding within components should be minimal (`sm` or `md`) to allow for maximum data visualization.
- **Structural Brackets:** Key sections or containers should be capped with L-shaped corner brackets in the primary or secondary color to define their boundaries.
- **Reflow:** On mobile, columns collapse to a single stack, but the 1px border separation remains to maintain the structural integrity.

## Elevation & Depth

This system rejects shadows and organic depth. Hierarchy is established through:

- **Border Weight:** 1px for standard containers, 2px for active or focused elements.
- **Tonal Stepping:** Using `#131313` for the base, `#1A1A1A` for cards, and `#252525` for elevated headers or tooltips.
- **Glow Accents:** Focused elements use an `outer-glow` (box-shadow with 0 blur, or very small spread of 4px) using the Primary or Secondary neon colors.
- **Overlays:** Content that sits "above" the UI (like modals) must have a thick 2px solid border and a 100% opaque background to clearly "cut out" from the grid beneath.

## Shapes

The shape language is strictly **Sharp (0px)**. There are no rounded corners in this design system. 

Every element—buttons, inputs, cards, and tags—must be perfectly rectangular. This reinforces the "blueprint" and "technical drawing" feel. In place of roundedness, use chamfered corners (clipped 45-degree angles) exclusively for decorative tab treatments or primary action buttons to denote special functionality.

## Components

### Buttons
Buttons are rectangular blocks with 1px solid borders. 
- **Primary:** Pink background, black text, 2px bottom-right "offset" border to simulate a tech-tactile feel.
- **Ghost:** Transparent background, 1px Pink or Green border, monospaced uppercase text.
- **State:** On hover, the button should "invert" (background color becomes the text color).

### Inputs & Terminal Fields
Input fields are styled like terminal prompts. They feature a bottom border only or a full 1px border with a "dot-matrix" texture background. The cursor should be a solid block or underscore that pulses rather than blinks.

### Cards & Modules
Modules must display their "Coordinates" or "ID" in the top-left corner using a small label-mono font. Use structural brackets `[ ]` around title text. A subtle dot-matrix pattern should be applied to the background of header sections within cards.

### Icons
Icons must be 1px thin-line style, geometric, and strictly non-rounded. Use 24x24px bounding boxes with a 2px padding. Icons should never be filled; they should appear as "wireframes."

### Progress & Data
Progress bars should be "chunked"—composed of individual rectangular segments rather than a smooth continuous bar. Each segment represents 5% or 10% of the total value.