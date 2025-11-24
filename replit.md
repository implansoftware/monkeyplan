# MonkeyPlan

## Overview

MonkeyPlan is a comprehensive repair management platform designed for enterprise-level operations. The system facilitates coordination between administrators, resellers, repair centers, and customers in managing device repair workflows, inventory, ticketing, and billing. Built as a full-stack TypeScript application, it uses React with shadcn/ui components for the frontend and Express.js for the backend, with real-time communication capabilities via WebSockets.

The platform follows a role-based architecture with four distinct user types:
- **Admin**: Full system control, analytics, user management, and oversight
- **Reseller**: Order creation and customer management
- **Repair Center**: Work order processing and inventory management
- **Customer**: Repair tracking and support ticket creation

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### November 2024

**Task 1: Activity Logs & Audit Trail (Completed)**
- Added `activity_logs` table in database schema tracking all mutations with userId, action, entityType, entityId, changes (JSON), ipAddress, userAgent, timestamp
- Implemented automatic logging middleware using `res.locals` pattern (`setActivityEntity` helper)
- Created Admin Activity Logs page with comprehensive filters (user, action, entity type, date range)
- Implemented 90-day retention policy with automatic cleanup job
- All 14 POST/PATCH/DELETE endpoints now automatically log activities

**Task 2: Export CSV/Excel with Filters (Completed)**
- Installed and integrated ExcelJS library for Excel workbook generation
- Created `/api/admin/export/:type` endpoint supporting 4 datasets: invoices, inventory, repairs, users
- Implemented comprehensive filtering system:
  - Date range filtering (startDate/endDate) for all datasets
  - Status filtering for invoices, repairs, users
  - Center filtering for inventory
- Added date range picker UI components on all 4 admin pages using Popover + Calendar (shadcn/ui)
- Export buttons integrated with toast notifications, loading states, and data validation
- Excel files include styled headers (bold, gray background), auto-fit columns, proper filenames with date stamps

**Task 3: Analytics & KPI System (Completed)**
- Added `analytics_cache` table for caching aggregated data with automatic TTL-based expiration
- Implemented 7 storage methods for analytics aggregations:
  - `getRevenueByPeriod`: Revenue trends grouped by day/month with invoice counts
  - `getRepairCenterPerformance`: Per-center metrics (total repairs, completion rate, avg repair time, revenue)
  - `getTopProducts`: Most-used products across inventory with usage counts and stock levels
  - `getOverviewKPIs`: Dashboard-level metrics (revenue, repairs, tickets, avg repair time)
  - Cache layer methods: `getCachedAnalytics`, `setCachedAnalytics`, `invalidateAnalyticsCache`
- Created 4 REST API endpoints under `/api/admin/analytics`:
  - `GET /overview` - Dashboard KPI summary
  - `GET /revenue?startDate=X&endDate=Y&groupBy=day|month` - Revenue trends with filtering
  - `GET /repair-centers/performance` - All repair centers performance metrics
  - `GET /products/top?limit=10` - Top N most-used products
- Implemented automatic cache invalidation on repair_orders and invoices mutations (14 endpoints total)
- Built comprehensive Admin Analytics dashboard with Recharts visualizations:
  - 6 KPI cards: Total Revenue, Active Repairs, Avg Repair Time, Total Tickets, Open Tickets, Completed Repairs
  - LineChart: Revenue trends over time with period selector (week/month/year)
  - PieChart: Repair status distribution (in progress, completed, cancelled)
  - BarChart: Top performing repair centers by revenue
  - BarChart: Top 10 most-used products
- Integrated auto-refresh with 30-second polling interval on all analytics queries
- Added skeleton loading states for all charts and KPI cards
- Registered `/admin/analytics` route and added Analytics navigation item to admin sidebar

## System Architecture

### Frontend Architecture

**Framework & Tooling**
- React 18+ with TypeScript for type safety
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and caching

**UI Component System**
- shadcn/ui components built on Radix UI primitives
- Tailwind CSS for styling with custom design tokens
- "New York" style variant with neutral base color
- Design system inspired by Linear and Vercel Dashboard (productivity-focused, data-dense interfaces)
- Inter font family for professional readability

**State Management**
- React Query for async server state with aggressive caching (`staleTime: Infinity`)
- React Context for authentication state (`AuthContext`)
- Local component state for UI interactions

**Authentication Flow**
- Session-based authentication using Passport.js with LocalStrategy
- Protected route wrapper component that checks authentication status
- Role-based redirects after login (different dashboards per user role)

### Backend Architecture

**Server Framework**
- Express.js with TypeScript
- Separate development (`index-dev.ts`) and production (`index-prod.ts`) entry points
- Development mode uses Vite middleware for HMR
- Production mode serves static built assets

**Authentication & Session Management**
- Passport.js with Local Strategy for username/password authentication
- Express-session for session persistence
- PostgreSQL-based session storage using `connect-pg-simple`
- Password hashing using Node.js native `scrypt` with random salts

**API Design**
- RESTful endpoints organized by resource type
- Role-based middleware for authorization (`requireRole` and `requireAuth`)
- JSON request/response format
- Centralized error handling

**Real-time Communication**
- WebSocket server for live chat functionality
- ws library for WebSocket implementation
- Authentication-based WebSocket connections

### Database Architecture

**ORM & Database**
- Drizzle ORM for type-safe database queries
- PostgreSQL as the primary database (via Neon serverless)
- Schema-first approach with TypeScript types derived from database schema

**Schema Design**
The database follows a role-based multi-tenant architecture:

- **Users**: Central user table with role-based access (`admin`, `reseller`, `repair_center`, `customer`)
- **Repair Centers**: Physical locations for repair services
- **Products**: Inventory items catalog (SKU-based)
- **Repair Orders**: Core business entity tracking device repairs through workflow stages
- **Tickets**: Customer support system with priority levels and status tracking
- **Invoices**: Billing records with payment status tracking
- **Inventory**: Stock tracking and movement history
- **Chat Messages**: Real-time communication records

**Database Enums**
- `user_role`: Defines access levels
- `ticket_status`, `ticket_priority`: Support workflow states
- `repair_status`: Repair lifecycle tracking
- `payment_status`: Billing states
- `movement_type`: Inventory transaction types

### External Dependencies

**Third-party Services**
- Neon Database: Serverless PostgreSQL hosting with WebSocket support
- Google Fonts: Inter font family hosting

**Key NPM Packages**
- `@neondatabase/serverless`: PostgreSQL client optimized for serverless
- `drizzle-orm`: Type-safe ORM
- `drizzle-zod`: Schema validation integration
- `@tanstack/react-query`: Async state management
- `@radix-ui/*`: Headless UI component primitives (17+ components)
- `passport`, `express-session`: Authentication infrastructure
- `ws`: WebSocket server
- `date-fns`: Date manipulation utilities
- `zod`: Runtime type validation
- `react-hook-form`, `@hookform/resolvers`: Form state management

**Development Dependencies**
- `tsx`: TypeScript execution for development
- `esbuild`: Production bundling for server code
- `drizzle-kit`: Database migration tooling
- Replit-specific plugins for development environment integration

### Build & Deployment

**Development Workflow**
- `npm run dev`: Starts development server with Vite HMR and live reloading
- Hot module replacement for client-side code
- TypeScript checking without emission

**Production Build**
- `npm run build`: Two-stage build process
  1. Vite builds client assets to `dist/public`
  2. esbuild bundles server code to `dist/index.js`
- ESM module format throughout
- Tree-shaking and code splitting enabled

**Database Management**
- `npm run db:push`: Push schema changes to database (uses Drizzle Kit)
- Migrations stored in `migrations/` directory
- Connection via `DATABASE_URL` environment variable