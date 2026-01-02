# MonkeyPlan Design Guidelines

## Design Approach

**System-Based**: Productivity-focused design inspired by Linear, Vercel Dashboard, and Apple's interface guidelines. Optimized for "scimmia-proof" simplicity - if a monkey could use it, anyone can.

**Core Principles**:
- **Apple-Level Simplicity**: Every interaction should feel obvious and delightful
- **Fool-Proof Design**: Large touch targets (min 44px), clear labels, confirmation for destructive actions
- **Modern 2025 Aesthetic**: Subtle gradients, elegant shadows, refined micro-interactions
- **Information Clarity**: Scannable layouts with strong visual hierarchy
- **Mobile-First Excellence**: Perfect experience on both mobile and desktop

---

## Typography System

**Font Stack**: Inter (Google Fonts) - optimal readability at all sizes

**Hierarchy**:
- **Page Titles**: text-3xl font-bold (Dashboard, Gestione Centri)
- **Section Headers**: text-xl font-semibold
- **Card Titles**: text-lg font-semibold
- **Body Text**: text-base font-normal
- **Labels**: text-sm font-medium
- **Captions**: text-xs font-medium text-gray-600
- **Buttons**: text-base font-semibold (large touch targets)

---

## Layout System

**Spacing**: Tailwind units of **3, 4, 6, 8, 12, 16** for generous breathing room
- Component padding: p-6 or p-8
- Section gaps: space-y-8 or space-y-12
- Card spacing: gap-6
- Form fields: space-y-4

**Structure**:
- **Sidebar**: 280px (w-70) with rounded corners and subtle shadow, collapsible on mobile
- **Content Area**: max-w-7xl centered, px-6 lg:px-8
- **Dashboard Grid**: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- **Mobile Navigation**: Bottom tab bar with large icons and labels

---

## Visual Design Language

**Modern Touches**:
- **Subtle Gradients**: Background gradients from gray-50 to gray-100 on cards, brand gradients on primary CTAs
- **Layered Shadows**: Multiple shadow layers for depth - shadow-sm on cards, shadow-lg on modals, shadow-xl on dropdowns
- **Rounded Corners**: rounded-xl on cards, rounded-lg on buttons, rounded-full on avatars
- **Glass Effects**: backdrop-blur-md on overlays and floating elements
- **Border Treatments**: border border-gray-200 with hover states showing border-gray-300

**Color Strategy** (will be defined separately):
- Clear status indicators with accessible contrast ratios
- Distinct states for success, warning, error, info
- Muted backgrounds to let content shine

---

## Component Library

### Navigation
- **Sidebar**: Icons with labels, grouped sections with subtle dividers, active state with gradient background
- **Top Bar**: User avatar (w-10 h-10), notification badge, search bar with rounded-full styling
- **Mobile Bottom Nav**: 5 primary tabs with large icons (w-6 h-6) and labels

### Dashboard Elements
- **Stat Cards**: Large numbers (text-4xl font-bold), trend arrows, subtle gradient backgrounds, shadow-md elevation
- **Quick Actions**: Prominent gradient buttons (h-14) with icons, descriptive labels, shadow-lg on hover
- **Activity Feed**: Timeline design with connecting lines, user avatars, timestamps, card-based entries

### Data Tables
- **Desktop**: Sticky headers, row hover with subtle background change, shadow-sm on container
- **Mobile**: Card-based view with key info prominently displayed, expandable for details
- **Actions**: Icon buttons (w-10 h-10), tooltip on hover, dropdown menu for multiple actions
- **Filters**: Pill-shaped filter buttons with counts, slide-out panel for advanced filters

### Forms
- **Input Fields**: Large height (h-12), rounded-lg borders, focus ring with brand color, floating labels
- **Dropdowns**: Custom styled with icons, search capability for long lists
- **File Upload**: Drag-drop zone with dashed border, preview thumbnails, progress indicators
- **Buttons**: Primary (gradient, shadow-lg, h-12), Secondary (border, h-12), Destructive (red gradient)
- **Validation**: Inline error messages, success checkmarks, helpful hints below fields

### Tickets & Communication
- **Ticket Cards**: Status badge top-right, priority color strip on left, large clickable area
- **Detail View**: Full-screen on mobile, split-panel on desktop (60/40 conversation/metadata)
- **LiveChat**: Bottom-right bubble (w-14 h-14 rounded-full shadow-xl), expands to w-[400px] h-[600px] panel
- **Messages**: Bubbles with tails, sender avatar, timestamps, delivered/read indicators

### Status & Feedback
- **Badges**: rounded-full px-4 py-1.5 text-sm font-semibold with status-specific backgrounds
- **Toast Notifications**: Top-right slide-in with icon, message, action button, auto-dismiss
- **Loading States**: Skeleton screens with pulse animation, spinner for quick actions
- **Empty States**: Centered illustration icon, encouraging message, primary CTA button

### Overlays
- **Modals**: Centered max-w-2xl, backdrop-blur-md background, shadow-2xl, rounded-2xl corners
- **Slide-overs**: Right-side w-[480px] panel, backdrop blur, close button top-right
- **Confirmation Dialogs**: max-w-md, large buttons (h-12) with clear labels (Conferma/Annulla)

---

## Animations

**Smooth & Purposeful** (duration-300 as default):
- **Page Navigation**: Subtle fade-in for content
- **Modals**: Scale from 95% to 100% + fade backdrop
- **Dropdowns**: Slide-down with fade (duration-200)
- **Buttons**: Scale to 98% on press, smooth color transitions on hover
- **Cards**: Subtle lift on hover (transform translate-y-[-2px] + shadow increase)
- **Status Changes**: Color transition + scale pulse for badges
- **Loading**: Smooth pulse on skeletons, rotating spinner

---

## Mobile Excellence

**Touch Optimization**:
- Minimum touch target: 44px × 44px (use p-3 on icons for larger hit area)
- Bottom-aligned primary actions for thumb reach
- Swipe gestures: delete, archive, navigate between views
- Pull-to-refresh on lists and feeds

**Responsive Patterns**:
- **Tables → Cards**: Automatic transformation with key data visible
- **Multi-column → Single**: Stack gracefully with maintained hierarchy
- **Sidebar → Bottom Nav**: Switch at md: breakpoint
- **Forms**: Full-width inputs, stacked buttons, larger spacing

---

## Images & Assets

**Icons**: Heroicons (outline for navigation, solid for actions) via CDN
**Avatars**: Circular with gradient fallbacks showing initials, sizes w-8 to w-12
**Product Images**: Square thumbnails (w-20 h-20) with rounded-lg, lightbox view on click
**Empty States**: Simple icon illustrations from Heroicons, no custom graphics
**No Hero Images**: Application interface focuses on functionality and data

---

## Accessibility

- WCAG AA contrast ratios minimum
- Keyboard navigation with visible focus states (ring-2)
- Screen reader labels on icon-only buttons
- Error states with both color and icon indicators
- Large text option support (scales from text-base)