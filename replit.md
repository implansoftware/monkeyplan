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

### Phase 8: User Management (✅ COMPLETED)
**Backend API (✅ COMPLETED):**
- `GET /api/users` - List all users (admin only)
- `GET /api/admin/resellers` - List resellers with aggregated customer counts (admin only, password sanitized)
- `PATCH /api/users/:id` - Update user (admin updates all fields, users update own profile: email, fullName)
- Storage methods: updateUser (username, email, fullName, role, isActive, repairCenterId, resellerId)
**Frontend (✅ COMPLETED):**
- Admin users page: List view with filters (role, date range), create/edit dialog, CSV export
- Admin resellers page: List view with customer counts, create/edit dialog
- Customer registration wizard: 3-step UI (type selection, details form, review/confirm) with discriminated union validation for private/company customers
**Tenant Ownership (✅ COMPLETED):**
- Database: `users.resellerId` field tracks which reseller created a customer (nullable)
- API Security: POST `/api/customers` enforces resellerId from session for reseller/repair_center roles, admin can override via body
- Schema: InsertUser includes optional resellerId field for type consistency
- Frontend: CustomerWizardDialog automatically assigns reseller from session, no manual selection needed

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

### Phase 11: Repair Workflow System (🔧 IN PROGRESS)
**FASE 1: Schema & Data Model (✅ COMPLETED, ARCHITECT REVIEWED)**
- Extended `repair_orders` table:
  - Added IMEI/serial tracking fields (`imei`, `serial`, `imeiNotReadable`, `imeiNotPresent`, `serialOnly`)
  - Added `brand` field for device brand tracking
  - Added `ingressatoAt` timestamp for lab reception tracking
- Extended `repair_status` enum with 10 new workflow states:
  - `ingressato`, `in_diagnosi`, `preventivo_emesso`, `preventivo_accettato`, `preventivo_rifiutato`
  - `attesa_ricambi`, `in_riparazione`, `in_test`, `pronto_ritiro`, `consegnato`
- Created `device_models` table: Device catalog with brand, deviceClass, marketCode, photoUrl
- Created `repair_acceptance` table: Acceptance wizard data (declaredDefects, aestheticCondition, accessories, lockCode, etc.)
- Implemented `checkImeiSerialDuplicate()` storage method: Validates IMEI/serial uniqueness in open repairs (excludes consegnato/cancelled)
- Full Drizzle relations: `repairOrders.acceptance` ↔ `repairAcceptance.repairOrder` with foreign key constraint
- All insert schemas and types generated for new tables (DeviceModel, InsertDeviceModel, RepairAcceptance, InsertRepairAcceptance)

**FASE 2: Acceptance Wizard (✅ COMPLETED)**
**Backend API (✅ COMPLETED):**
- Extended POST `/api/repair-orders` endpoint to support optional acceptance data
- Added `createRepairWithAcceptance()` storage method using Drizzle transaction
- IMEI/serial duplicate detection with 409 Conflict response if duplicate found
- Role-based customerId validation (customer: session, reseller/admin/RC: body + existence check)
- Returns both order and acceptance records when acceptance data provided
- Status automatically set to 'ingressato' with ingressatoAt timestamp
**Frontend (✅ COMPLETED):**
- Created AcceptanceWizardDialog component with 3 steps: device info, acceptance checks, review
- Step 1: Customer selection (admin/RC only), device type/brand/model, IMEI/serial with validation flags, issue description
- Step 2: Declared defects, aesthetic condition, accessories, lock code/pattern
- Step 3: Review summary with all entered data
- Integrated into admin and repair center pages with "Nuovo ingresso" button
- Customer query for admin/repair_center to select customer for the order

**FASE 2.5: Database-Driven Dropdown Catalogs (✅ COMPLETED, ARCHITECT REVIEWED)**
**Schema Extensions (✅):**
- Extended `device_types` and `device_brands` tables: Added to replace free-text input with admin-managed catalogs
- Extended `device_models` table: Added `isActive` flag, `updatedAt` timestamp for lifecycle management
- Added `device_model_id` nullable FK to `repair_orders`: Links orders to catalog entries while maintaining backward-compatible text fields
- Unique index on `device_models(type_id, brand_id, LOWER(model_name))`: Prevents duplicate model entries per brand/type combo
- Seeded 7 device types (Smartphone, Tablet, Laptop, etc.) and 14 brands (Apple, Samsung, Dell, etc.)
- Seeded 11 sample device models (iPhone 15 Pro, Galaxy S24, MacBook Air, etc.) with proper FK relationships
**Backend API (✅ COMPLETED):**
- `GET /api/device-types` - Returns active device types for dropdown (requireAuth, activeOnly default true)
- `GET /api/device-brands` - Returns active brands for dropdown (requireAuth, activeOnly default true)
- `GET /api/device-models?typeId=X&brandId=Y` - Cascading dropdown endpoint, filters models by type+brand (requireAuth)
- Storage method `listDeviceModels({ typeId, brandId, activeOnly })` - Conditional filtering with Drizzle where/and clauses
**Frontend Cascading Dropdowns (✅ COMPLETED):**
- Device type Select: onChange tracks `selectedTypeId` state, resets brand/model selections
- Brand Select: onChange tracks `selectedBrandId` state, resets model selection
- Device model Select: Cascading dropdown that loads when type+brand selected via TanStack Query with custom queryFn
- Query automatically refetches when type/brand IDs change, disabled until both parent selections made
- Fallback to text Input when no models available for selected type/brand combination
- "Altro (inserimento manuale)" option in model dropdown for custom entries not in catalog
- Clean state reset when type/brand selections change ensures consistent UX

**FASE 3: Diagnostics & Priority (⏳ PENDING)**
- Diagnostics table and API
- Priority calculation logic

**FASE 4: Quote Management (⏳ PENDING)**
- Quotes table and API with parts list, labor costs