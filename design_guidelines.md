# MonkeyPlan Design Guidelines

## Design Approach

**System-Based Approach**: This platform requires a productivity-focused design system optimized for data-dense enterprise applications. Drawing inspiration from Linear, Vercel Dashboard, and modern SaaS platforms that excel at information hierarchy and user efficiency.

**Core Principles**:
- **Clarity Over Creativity**: Information must be instantly scannable
- **Role-Based Consistency**: Similar patterns across different user dashboards
- **Data Density Without Clutter**: Efficient use of space for tables, forms, and metrics
- **Professional Trust**: Convey reliability and competence

---

## Typography System

**Font Stack**: Inter (Google Fonts) for all text - exceptional readability at small sizes, professional appearance

**Hierarchy**:
- **Page Titles**: text-2xl font-semibold (Dashboard, Gestione Centri, etc.)
- **Section Headers**: text-lg font-semibold
- **Card/Widget Titles**: text-base font-medium
- **Body Text**: text-sm font-normal
- **Labels/Captions**: text-xs font-medium uppercase tracking-wide
- **Data Tables**: text-sm font-normal (headers font-medium)
- **Buttons**: text-sm font-medium

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 3, 4, 6, 8, 12** for consistent rhythm
- Component padding: p-4 or p-6
- Section spacing: space-y-6 or space-y-8
- Card gaps: gap-4
- Form field spacing: space-y-3

**Grid Structure**:
- **Sidebar Navigation**: Fixed 256px width (w-64) on desktop, collapsible to icons on tablet
- **Main Content Area**: flex-1 with max-width constraints (max-w-7xl) centered with padding
- **Dashboard Cards**: Grid layout - grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6
- **Data Tables**: Full-width within content container with horizontal scroll on mobile

---

## Component Library

### Navigation
- **Sidebar**: Vertical navigation with role-specific menu items, collapsible sections for sub-menus
- **Top Bar**: User profile dropdown, notifications bell, quick actions, breadcrumb trail
- **Menu Items**: Icon + label, active state with subtle indicator (border-l-2 on selected item)

### Dashboard Widgets
- **Stat Cards**: Compact metric displays with icon, number (text-3xl font-bold), label, and optional trend indicator
- **Quick Action Cards**: Prominent CTAs for common tasks ("Nuovo Ticket", "Aggiungi Lavorazione")
- **Recent Activity**: List view with timestamps, user avatars, action descriptions

### Data Tables
- **Structure**: Sticky header, alternating row backgrounds for readability, hover states on rows
- **Actions**: Icon buttons in final column (edit, view, delete), bulk actions toolbar when rows selected
- **Pagination**: Bottom-aligned with page size selector, showing "1-20 of 150 results"
- **Filters**: Top-aligned filter bar with dropdowns, search input, date range pickers

### Forms
- **Layout**: Single column on mobile, 2-column grid on desktop for related fields (grid-cols-2 gap-4)
- **Input Groups**: Label above input, helper text below, error messages in validation state
- **Field Types**: Text inputs with border, select dropdowns, date pickers, file upload with drag-drop zone
- **Actions**: Primary button (right-aligned), secondary/cancel (left-aligned), destructive actions require confirmation

### Tickets & Chat
- **Ticket List**: Card-based view with status badges, priority indicators, timestamp, assignee avatar
- **Ticket Detail**: Split view - left: conversation thread, right: metadata sidebar (status, priority, assignee)
- **LiveChat Interface**: Fixed bottom-right bubble, expandable panel (w-96 h-[500px]), message bubbles with timestamps
- **Message Input**: Bottom-fixed with emoji picker, file attachment, send button

### Status Indicators
- **Badges**: Rounded-full px-3 py-1 text-xs font-medium (for order status, ticket status, payment status)
- **Progress Bars**: Thin height (h-2), rounded corners, showing completion percentage
- **Availability Dots**: Small circles (w-2 h-2) next to names for online/offline status

### Modals & Overlays
- **Modal Container**: max-w-2xl centered, overlay backdrop with blur
- **Confirmation Dialogs**: Compact (max-w-md) with clear action buttons
- **Slide-overs**: Right-side panel (w-96) for detail views and quick edits

---

## Responsive Behavior

**Breakpoints**:
- Mobile: Base styles, stacked layouts, full-width cards
- Tablet (md:): 2-column grids, persistent sidebar (icon-only)
- Desktop (lg:): 3-4 column grids, full sidebar with labels
- Wide (xl:): Max content width, optimal table column display

**Mobile Adaptations**:
- Navigation: Bottom tab bar for primary sections
- Tables: Horizontal scroll or card-based list view toggle
- Forms: Full-width inputs, larger touch targets (min-h-12)
- Dashboard: Single column cards with swipe gestures

---

## Animations

**Minimal & Purposeful**:
- Page transitions: None (instant navigation)
- Dropdown menus: Simple fade-in (duration-150)
- Modal appearance: Fade + scale (duration-200)
- Loading states: Subtle pulse on skeleton screens
- Notifications: Slide-in from top-right (duration-300)
- No scroll animations or parallax effects

---

## Images

**Usage Strategy**:
- **User Avatars**: Circular (w-8 h-8 to w-12 h-12), fallback to initials with consistent system
- **Product Images**: Square thumbnails in inventory (w-16 h-16), larger in detail views (w-32 h-32)
- **Empty States**: Simple illustrative icons (not full images) with helpful text
- **No Hero Images**: This is a web application, not marketing site - focus on data and functionality