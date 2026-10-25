---
name: Finora Financial System
colors:
  surface: '#fbf8ff'
  surface-dim: '#d1d8ff'
  surface-bright: '#fbf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f2ff'
  surface-container: '#ecedff'
  surface-container-high: '#e4e7ff'
  surface-container-highest: '#dde1ff'
  on-surface: '#0e193e'
  on-surface-variant: '#434656'
  inverse-surface: '#242e55'
  inverse-on-surface: '#efefff'
  outline: '#747687'
  outline-variant: '#c4c5d8'
  surface-tint: '#104bec'
  primary: '#0045e4'
  on-primary: '#ffffff'
  primary-container: '#3361ff'
  on-primary-container: '#f7f5ff'
  inverse-primary: '#b8c4ff'
  secondary: '#b71945'
  on-secondary: '#ffffff'
  secondary-container: '#fd5275'
  on-secondary-container: '#5a001c'
  tertiary: '#745200'
  on-tertiary: '#ffffff'
  tertiary-container: '#946900'
  on-tertiary-container: '#fff5e9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b8c4ff'
  on-primary-fixed: '#001454'
  on-primary-fixed-variant: '#0037ba'
  secondary-fixed: '#ffd9dc'
  secondary-fixed-dim: '#ffb2ba'
  on-secondary-fixed: '#400011'
  on-secondary-fixed-variant: '#910031'
  tertiary-fixed: '#ffdea8'
  tertiary-fixed-dim: '#ffba20'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5e4200'
  background: '#fbf8ff'
  on-background: '#0e193e'
  surface-variant: '#dde1ff'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 34px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '700'
    lineHeight: 26px
  metric-number:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '800'
    lineHeight: 36px
    letterSpacing: -0.02em
  title-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1.5rem
  margin: 2rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 1.75rem
  space-xl: 2.5rem
---

## Brand & Style
The design system establishes a high-fidelity, polished, and friendly financial SaaS platform. It bridges enterprise-grade reliability and accounting precision with modern, consumer-grade clarity and approachability. 

The emotional tone evokes effortless control, financial transparency, and confidence. Clean layouts, airy margins, and generous curved corners remove the cognitive friction and coldness typical of traditional banking tools. Vibrant functional accents against a soft, chilled canvas highlight growth trends, critical updates, and actionable analytics without visual overwhelm.

## Colors
The color foundation utilizes a crisp, cool tinted canvas paired with pure white surfaces to create visual separation without harsh contrast.

- **Canvas & Surfaces**: The background uses `#F4F7FC` (with `#F8FAFD` for secondary panels). Elevating content surfaces are pure `#FFFFFF`, framed with an ultra-light border token (`#EEF2F6`).
- **Primary (Cobalt / Royal Blue)**: `#3361FF` (hover: `#234FE6`) serves as the dominant visual anchor. It powers primary CTA buttons, active sidebar icon indicators, solid hero metric cards, and primary chart lines.
- **Secondary (Coral / Rose)**: `#FF5376` provides energetic contrast for sales volume, negative margins, secondary chart series, and alert states.
- **Tertiary (Sunny Amber)**: `#FFB800` handles pending states, revenue indicators, and progress distributions.
- **Text & Neutral Hierarchy**: 
  - Primary Headlines & Key Figures: `#1B254B`
  - Body & Secondary Copy: `#4A5568`
  - Subtle Labels, Inactive Icons & Timeframes: `#8F9CA9`
  - Subtle Borders & Separators: `#EEF2F6`

## Typography
The system uses Plus Jakarta Sans across all roles to ensure geometric clarity and legibility for dense financial figures.

- **The Editorial Greeting Rule**: Top greetings pair an italic medium weight greeting prefix (`Hi,`) with a bold heavy font weight for the user's name (`Shahin Alam`), humanizing analytical dashboards.
- **Financial Figures (`metric-number`)**: Displayed with tight negative letter spacing (`-0.02em`) and weight `800` to anchor numerical authority.
- **Labels & Subtitles**: Kept intentionally lightweight (`400` or `500`) in muted gray tones (`#8F9CA9`) to prevent label dominance over underlying data.

## Layout & Spacing
The layout operates on an 8pt system, using a fluid multi-column grid within standard constraints.

- **Sidebar Structure**: Compact left-hand navigation column (width `84px` desktop) fixed to the left canvas, keeping core interactions within easy reach while maximizing dashboard data width.
- **Header Structure**: Sticky, transparent top header spanning the remaining canvas with horizontal margin `space-xl` (`2.5rem`), housing personalized greeting copy on the left and rounded utility pill buttons on the right.
- **Grid Setup**: 12-column layout for desktop with `gutter: 1.5rem` (`24px`).
  - Small stat cards span 3 or 4 columns.
  - Primary analytics & trend charts span 8 columns.
  - Side summary widgets (donut splits, goal cards, mini circular bubbles) span 4 columns.
- **Breakpoints**:
  - `Desktop (>1200px)`: Full 12-column multi-widget arrangement with 84px persistent sidebar.
  - `Tablet (768px - 1199px)`: 6-column reflow; KPI metric cards stack into 2x2 rows; sidebar collapses into an icon bar or drawer.
  - `Mobile (<768px)`: Single-column linear stack, header actions convert into a bottom app bar or compact top sheet; `margin: 1rem`.

## Elevation & Depth
Depth is created through ambient, tinted micro-shadows combined with soft perimeter borders rather than harsh, heavy drops.

- **Base Card Elevation**: Card containers rest on `0px 10px 30px -4px rgba(51, 97, 255, 0.04), 0px 4px 12px -2px rgba(27, 37, 75, 0.02)` coupled with a `1px solid #EEF2F6` hairline border.
- **Active / Floating Pill Elevation**: Sidebar active pill item, tooltips, and floating action circles use `0px 8px 20px -2px rgba(51, 97, 255, 0.25)`.
- **Contrast Solid Card**: Solid primary cards (`#3361FF`) cast an ambient blue glow: `0px 14px 28px -6px rgba(51, 97, 255, 0.35)`.
- **Chart Tooltips**: High-contrast dark badge (`#1B254B`) with pure white text elevated with `0px 6px 16px rgba(0, 0, 0, 0.16)`.

## Shapes
The design embraces a generous, rounded geometry to convey modernity and tactile comfort.

- **Cards & Primary Modules**: Styled with large rounded corners (`24px` to `28px` / `rounded-3xl`).
- **Interactive Controls & Mini Badges**: Dropdown selectors, utility icons, and sidebar active indicators use pill or circular shapes (`rounded-full` / `9999px`).
- **Chart Bars & Progress Tracks**: Mini bar graphs, volume indicators, and donut rings always feature circular rounded terminals (`stroke-linecap: round`, bar corner radius `6px`).

## Components

### Cards & Metric Containers
- **Standard White Card**: White `#FFFFFF` background, `24px` border-radius, `1px solid #EEF2F6`, padded with `space-lg` (`1.75rem`). Top row contains the rounded icon badge (left) and the timeframe dropdown (right). Middle row displays the subtle label and bold figure. Bottom area displays sparklines, vertical pill bars, or secondary metrics.
- **Primary Hero Card**: Solid cobalt `#3361FF` background with pure white typography. Icon container has a translucent white fill (`rgba(255, 255, 255, 0.2)`). Sparkline charts and bar meters are rendered in semi-transparent white and pure white.

### Buttons & Action Pills
- **Icon Utility Buttons**: `44px` circular buttons (`#FFFFFF`) with subtle border `#EEF2F6`, holding gray icons (`#8F9CA9`). Hover states tint the background to `#F8FAFD` and shift the icon to `#3361FF`.
- **Timeframe Selector**: Pill-shaped button (`padding: 6px 14px`) with soft gray text (`#8F9CA9`), font size `12px`, with an inline chevron down icon.
- **Primary Action Buttons**: Pill shape, rich cobalt fill `#3361FF`, text `#FFFFFF`, font weight `600`, with a subtle blue glow shadow.

### Navigation Sidebar
- Vertical dock layout. Top section holds the brand glyph inside an accent-filled container.
- Nav items are centered vertically with 48px spacing.
- The active item is styled as a soft blue pill container (`#EBF1FF` or solid `#3361FF` with white icon) featuring rounded corners (`14px`) and a gentle drop shadow.

### Data Visualizations
- **Sparklines & Area Charts**: Smooth bezier curves (tension: 0.4) with subtle vertical linear gradients fading to 0% opacity at the base.
- **Donut & Circular Progress Rings**: Thick strokes (`14px - 18px`), rounded caps, with percentage and key description centered directly within the ring.
- **Bubble Analytics**: Nested circular hubs with saturated solid fills (`#3361FF`, `#FF5376`, `#FFB800`) housing white centered metrics and labels.

### Form Inputs & Dropdowns
- Inputs feature `16px` rounded corners, `#FFFFFF` surface, `1px solid #E2E8F0`, and `14px` typography. Focused state produces a `2px` ring in `#3361FF` with an offset shadow.