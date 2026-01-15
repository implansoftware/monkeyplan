# MonkeyPlan Beta v.22.5

## Overview
MonkeyPlan is an enterprise-level repair management platform designed to streamline device repair workflows, inventory, ticketing, and billing. It offers a full-stack TypeScript solution for administrators, resellers, repair centers, and customers, providing comprehensive repair order management, a real-time ticketing system, and robust inventory control across four distinct user roles. The platform's core purpose is to enhance efficiency and transparency in device repair processes with a business vision to dominate the repair management software market through its comprehensive features and user-friendly design.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18+ and TypeScript, utilizing `shadcn/ui` (Radix UI + Tailwind CSS) for a "New York" style UI. `Wouter` is used for routing and `TanStack Query` for server state management.

### Technical Implementations
The backend is an `Express.js` application with TypeScript, featuring a RESTful API and a `ws` WebSocket server for real-time communication. `Passport.js` and `express-session` handle session-based authentication with role-based authorization. Data is stored in a PostgreSQL database (Neon serverless) and accessed via `Drizzle ORM` for type-safe queries. The system enforces role-based access control (RBAC) and includes centralized error handling. Build processes use `Vite` for client assets and `esbuild` for server code.

### Feature Specifications
*   **Core Management**: Includes comprehensive Ticketing, Repair Orders, Warehouse/Inventory, User, and Invoice & Billing management systems, all featuring RBAC and robust security.
*   **Warehouse System**: Multi-tenant warehouse management with automatic user-specific warehouses. Each user type (admin, reseller, sub-reseller, repair center) has dedicated warehouse with stock tracking, movements, and inter-warehouse transfers. Uses dual-write bridge pattern for backward compatibility with legacy inventory system during migration.
*   **Workflow Systems**: Advanced repair workflow with a 10-state enum, acceptance wizard, diagnostics, quote management, parts ordering, and detailed repair logging.
*   **Supply Chain**: Supplier/Procurement module with multi-supplier support, order/return workflows, and external API integration for catalog sync and ordering.
*   **Customer & Service Management**: Corporate branch management, a standardized service catalog with custom pricing, and a delivery appointment system.
*   **Integrations**: Direct integration with SIFAR supplier API for spare parts ordering, including credential management, store mapping, catalog browsing, cart functionality, and order submission.
*   **B2B Ordering System**: Multi-level B2B ordering supporting both Reseller→Admin and RepairCenter→Reseller purchase flows with automatic stock transfers, order approval workflows, shipping tracking, and receipt confirmation.
*   **Multi-Role Ticketing**: Two ticket types - "support" (customer→admin) and "internal" (between business entities). Internal tickets enable resellers, repair centers, and admins to communicate with role-based filtering and access control. Tickets include initiator/target tracking with proper role-based visibility.

## External Dependencies

*   **Neon Database**: Serverless PostgreSQL hosting.
*   **Google Fonts**: Inter font family.
*   **Key NPM Packages**:
    *   `@neondatabase/serverless`
    *   `drizzle-orm`, `drizzle-zod`
    *   `@tanstack/react-query`
    *   `@radix-ui/*`
    *   `passport`, `express-session`
    *   `ws`
    *   `date-fns`
    *   `zod`
    *   `react-hook-form`, `@hookform/resolvers`
    *   `@uppy/*`
    *   `exceljs`
    *   `recharts`
*   **Development Dependencies**: `tsx`, `esbuild`, `drizzle-kit`.
## Recent Changes (January 2026)

### Dashboard Customization (Phase 1 - MVP)
- Added `dashboard_preferences` table to store user layout preferences
- Created widget registry with 14 reseller widgets and 10 repair center widgets
- Implemented DashboardCustomizer modal for toggling visibility and drag-reordering
- Added `useDashboardPreferences` hook for React state management
- Created DashboardGrid component for dynamic widget rendering
- Integrated customization button in reseller and repair-center dashboards
- API endpoints: GET/PUT `/api/dashboard-preferences`
- Sub-resellers use reseller layout (role normalization in API)
- **Phase 2 TODO**: Extract inline widgets into components and integrate DashboardGrid for reordering support


### Sibill Integration
- Added Sibill integration for invoice management and bank reconciliation
- Created database tables: `sibill_credentials`, `sibill_companies`, `sibill_documents`, `sibill_accounts`, `sibill_transactions`, `sibill_categories`
- Implemented Sibill API service (`server/services/sibill.ts`) with Bearer token authentication
- Added comprehensive API routes for credentials CRUD, test connection, and sync operations
- Sibill appears in integrations dashboard alongside SIFAR, Foneday, MobileSentrix, TrovaUsati
- Supports dual environments (development/production)
- Stores amounts in cents for precision, currency defaults to EUR


### Automatic Invoice Generation for Reseller Sales
- Modified `/api/sales-orders/:id/status` endpoint to auto-generate invoices when orders are marked as "delivered" or "completed"
- Added new storage function `createInvoiceForRepairCenterB2BOrder` for repair center B2B orders
- Modified `/api/reseller/rc-b2b-orders/:id/ship` endpoint to auto-generate invoices when resellers ship B2B orders to repair centers
- Invoice generation is limited to main resellers only (excludes sub_resellers with parentResellerId)
- Response includes optional `generatedInvoice` field for backward compatibility
- Idempotency checks prevent duplicate invoice creation

### Invoice Automation Rules
- **E-commerce Sales Orders**: Invoice created when status becomes "delivered" or "completed"
- **Repair Center B2B Orders**: Invoice created when reseller ships the order
- **Main Resellers**: Always get auto-generated invoices
- **Sub-Resellers**: Only get auto-invoices if `hasAutonomousInvoicing=true` (fiscal autonomy)
- **Dependent Sub-Resellers**: `hasAutonomousInvoicing=false` means parent reseller handles invoicing
- **Invoice Number Format**: `FT-R-{year}-{sequential}` (e.g., FT-R-2026-00001)

### Sub-Reseller Autonomous Invoicing
- Added `hasAutonomousInvoicing` boolean field to users table (default: false)
- Parent resellers control this flag when creating/editing sub-resellers
- UI toggle labeled "Fatturazione Autonoma" in sub-reseller management form
- Sub-resellers with own fiscal data can have autonomous invoicing enabled
- Sub-resellers sharing parent's fiscal data should have this disabled
