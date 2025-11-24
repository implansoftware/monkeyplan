# MonkeyPlan

## Overview

MonkeyPlan is an enterprise-level repair management platform designed to streamline device repair workflows, inventory, ticketing, and billing. It serves administrators, resellers, repair centers, and customers with a full-stack TypeScript application. Key capabilities include comprehensive repair order management, a real-time ticketing system, and robust inventory management, supporting four distinct user roles: Admin, Reseller, Repair Center, and Customer.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

Built with React 18+ and TypeScript, utilizing Vite, Wouter for routing, and TanStack Query for state management. UI components are developed with shadcn/ui (Radix UI + Tailwind CSS) following a "New York" style. Authentication is session-based with role-based redirects.

### Backend

An Express.js backend with TypeScript, using Passport.js for session-based authentication and `express-session`. It features a RESTful API with role-based authorization, JSON communication, and centralized error handling. Real-time communication is powered by a WebSocket server using the `ws` library.

### Database

PostgreSQL database hosted on Neon serverless, accessed via Drizzle ORM for type-safe queries. The schema supports a role-based multi-tenant architecture with tables for Users, Repair Centers, Products, Repair Orders, Tickets, Invoices, Inventory, and Chat Messages. Enums define user roles, ticket/repair/payment statuses, and inventory movement types.

### Build & Deployment

Development uses Vite for HMR. Production builds use Vite for client assets and esbuild for server code, producing ESM modules. Drizzle Kit handles database schema migrations.

### Core Features

*   **Ticketing System**: RESTful API with role-based access control (ACL), supporting customer ticket creation, detailed views with conversation threads, and admin/reseller/repair center management. Includes real-time WebSocket notifications for status changes, assignments, priority updates, and new messages, with robust security measures to prevent ID injection and ensure role-based data access.
*   **Repair Orders Management**: Consolidated API endpoint for all roles, featuring role-based filtering for listing and detailing orders. Customers and resellers can create orders (with IDs forced from session), while admins have full access to update all aspects. Repair centers can update assigned orders only. Strict security architecture prevents ID injection and ensures triple null-safe access for repair centers.
*   **Inventory Management**: Comprehensive API for products and inventory. All authenticated users can view products; only admins can perform CRUD operations on products. Inventory viewing and movement creation are role-based: admins see all, repair centers see their own, and customer/reseller roles are blocked. Security measures include early role gates, ID injection prevention, and Zod validation for movement types.

## External Dependencies

*   **Neon Database**: Serverless PostgreSQL hosting.
*   **Google Fonts**: Inter font family.
*   **Key NPM Packages**:
    *   `@neondatabase/serverless`: PostgreSQL client.
    *   `drizzle-orm`, `drizzle-zod`: ORM and Zod integration.
    *   `@tanstack/react-query`: Server state management.
    *   `@radix-ui/*`: Headless UI components.
    *   `passport`, `express-session`: Authentication.
    *   `ws`: WebSocket server.
    *   `date-fns`: Date utilities.
    *   `zod`: Runtime type validation.
    *   `react-hook-form`, `@hookform/resolvers`: Form management.
    *   `@uppy/*`: File uploads.
    *   `exceljs`: Excel file generation.
    *   `recharts`: Charting library.
*   **Development Dependencies**: `tsx`, `esbuild`, `drizzle-kit`.

## Implementation Status

### Phase 3: Ticketing System (✅ COMPLETED)
- RESTful ticketing API with role-based ACL and real-time WebSocket notifications
- Customer/Admin/Reseller/Repair Center ticket management with conversation threads
- WebSocket events: status changes, assignments, priority updates, new messages
- Security: Customer ID forced from session, singleton WebSocket provider with cleanup guards

### Phase 4: Repair Orders Management (✅ COMPLETED)
- Consolidated `/api/repair-orders` endpoint with role-based filtering
- Customer/Reseller order creation (IDs forced from session)
- Admin full update access, Repair Center limited to assigned orders
- Security: Triple null-safety for repair centers, early role gates, ID injection prevention

### Phase 5: Inventory Management (✅ COMPLETED)
- Products catalog API: All users view, only admin CRUD operations
- Inventory API: Role-based filtering (admin all, repair center own, customer/reseller blocked)
- Movement creation with enum validation ("in", "out", "adjustment")
- Security: Early role gates, nested data hydration (product/repairCenter), null-safe repair center access

### Phase 6: Dashboard & Analytics (✅ COMPLETED)
- Unified `/api/stats` endpoint with role-based data aggregation
- **Admin Dashboard**: Overview KPIs, PieChart (tickets), BarChart (repairs), top products table
- **Repair Center Dashboard**: Assigned repairs, low stock alerts with inventory table, status charts
- **Reseller Dashboard**: Orders stats, customers count, revenue calculation, quick actions
- **Customer Dashboard**: Own tickets/repairs with PieChart/BarChart, empty state handling
- Uses recharts for visualizations, leverages existing analytics helpers (getOverviewKPIs, getRepairCenterPerformance, getTopProducts)

### Phase 7: Invoicing & Billing (✅ BACKEND, 🔧 FRONTEND)
**Backend API (✅ COMPLETED):**
- `GET /api/invoices` - List with RBAC (admin all, customer own only, reseller/RC blocked)
- `GET /api/invoices/:id` - Detail with access control
- `POST /api/invoices` - Create invoice (admin only, auto-generates invoiceNumber INV-timestamp-count)
- `PATCH /api/invoices/:id` - Update payment status (admin only, auto-sets paidDate when paid)
- Storage methods: listInvoices (conditional .where()), createInvoice, updateInvoice, getInvoice
**Frontend (🔧 PARTIAL):**
- Admin invoices page: List view with filters (status, date range), export to Excel via `/api/reports/repairs?format=excel`

### Phase 8: User Management (✅ BACKEND, 🔧 FRONTEND)
**Backend API (✅ COMPLETED):**
- `GET /api/users` - List all users (admin only)
- `PATCH /api/users/:id` - Update user (admin updates all fields, users update own profile: email, fullName)
- Storage methods: updateUser (username, email, fullName, role, isActive, repairCenterId)
**Frontend (🔧 PARTIAL):**
- Admin users page: List view with filters (role, date range), create/edit dialog (fullName not firstName/lastName per schema), CSV export (no backend Excel endpoint)

### Phase 9: File Uploads & Attachments (✅ BACKEND, ⏳ FRONTEND)
**Backend API (✅ COMPLETED):**
- `GET /api/repair-orders/:repairOrderId/attachments` - List attachments (RBAC: customer/reseller own, RC assigned, admin all)
- `POST /api/repair-orders/:repairOrderId/attachments` - Upload attachment record (uploadedBy forced from session)
- `DELETE /api/repair-attachments/:id` - Delete attachment (admin all, uploader own only)
- Storage methods: addRepairAttachment, listRepairAttachments, getRepairAttachment, deleteRepairAttachment
- Triple null-check for repair center access (same pattern as repair orders)
**Frontend (⏳ TODO):**
- Upload component for repair orders with file preview

### Phase 10: Reports & Export (✅ BACKEND, ⏳ FRONTEND)
**Backend API (✅ COMPLETED):**
- `GET /api/reports/repairs?format=excel` - Export repairs to Excel (admin only, filters: status, repairCenterId)
- `GET /api/reports/inventory?format=excel` - Export inventory movements to Excel (admin only)
- Uses exceljs library for .xlsx generation with Italian headers, formatted currency (cents→euros)
**Frontend (⏳ TODO):**
- Admin reports page with date filters and download buttons