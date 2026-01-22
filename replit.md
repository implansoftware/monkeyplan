# MonkeyPlan Beta v.23.5

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

### Warranty/Insurance Extension System (MVP)
- **Multi-tenant Warranty Catalog**: Admin creates global products (resellerId=null), resellers create their own products
- **Database Tables**: `warranty_products`, `repair_warranties` with proper RBAC
- **Offering Flow**: During repair detail page, operators (admin, reseller, sub_reseller, repair_center) can offer warranty products to customers
- **Snapshot Pattern**: Price, duration, coverage, productName captured at offer time for historical accuracy
- **Automatic Invoice Generation**: Best-effort, non-blocking, VAT 22% IVA inclusa, source='other'
- **Customer Warranty History**: Customers can view their warranties with repair details at `/customer/warranties`
- **Analytics Dashboards**: 
  - Admin: Full network stats with conversion rates, top products, monthly trends
  - Reseller: Own stats + child network (sub-resellers inherit same view but see only own data)
  - Repair Center: Own sales stats only
- **RBAC**: Sub-resellers see only their own stats (includeChildren=false), main resellers see network (includeChildren=true)
- **Database Indexes**: Created 5 indexes on repair_warranties (customer_id, seller_id, status, created_at) and warranty_products (reseller_id)

### Device-Based Service Filtering (January 2026)
- **Service Catalog Enhancement**: Service items can now be linked to specific device types, brands, and models
- **Database Schema**: Added `brandId` and `modelId` optional foreign keys to `serviceItems` table
- **API Endpoint**: New GET `/api/service-items/by-device` with device filtering parameters:
  - Accepts `deviceTypeId`, `brandId`, `modelId`, `search`, `limit` query params
  - Auto-resolves brand/type from model when only modelId is provided
  - DB-level filtering with strict matching (services shown only if their restrictions are satisfied by query)
  - Staff permission check for reseller_staff/collaborator roles
- **Filtering Logic**:
  - Universal services (no restrictions) → always shown
  - If no device filter in query → show all services
  - If device filter present → services with restrictions shown only if all restrictions match
- **Frontend Integration**:
  - Reseller service catalog: Cascading dropdowns (Type → Brand → Model) for setting service compatibility
  - SearchableServiceCombobox: Accepts deviceTypeId, brandId, modelId to filter available services
  - QuoteFormDialog: Automatically passes device info from repair order to filter compatible services
- **Backward Compatibility**: Existing services without device restrictions continue to work as universal services

### Optional Quote Creation During Repair Order Intake (January 2026)
- **Feature**: Users can now optionally create a quote (preventivo) directly during the repair order creation process
- **Backend Changes**: Modified `POST /api/repair-orders` to accept optional `quote` object with parts, labor, and notes
- **Atomic Transaction**: When quote data is provided, both repair order and quote are created in a single transaction
- **Status Update**: Orders created with a quote start with status `preventivo_emesso` instead of `ingressato`
- **Wizard Updates**:
  - AcceptanceWizardDialog: New "Preventivo" step (Step 3/4) between acceptance-checks and review
  - RepairIntakeWizard: New "Preventivo" step (Step 4/6) with same functionality
- **Quote Step UI**:
  - Toggle to enable/disable quote creation
  - Warehouse selection dropdown (loads accessible warehouses)
  - Three input methods: Manual entry, Service Catalog (SearchableServiceCombobox), Warehouse Parts (SearchableProductCombobox)
  - Parts management (name, quantity, price) with add/remove controls
  - Labor cost input with automatic total calculation
  - Notes field for additional information
- **Device Filtering Integration**: SearchableServiceCombobox in quote step filters services by device type/brand/model from repair order
- **State Management**: Quote state properly reset on dialog close to prevent stale data (includes warehouse selection)
- **Backward Compatibility**: Existing diagnosis → quote workflow remains fully functional

### Optional Diagnosis Creation During Repair Order Intake (January 2026)
- **Feature**: Users can now optionally create a diagnosis record directly during the repair order creation process
- **Backend Changes**: Modified `POST /api/repair-orders` to accept optional `diagnosis` object with technicalDiagnosis, outcome, estimatedTime, notes
- **Atomic Transaction**: When diagnosis data is provided, both repair order and diagnosis are created together
- **Status Logic**:
  - Diagnosis only (no quote) → status = `in_diagnosi`
  - Quote only (no diagnosis) → status = `preventivo_emesso`
  - Both diagnosis and quote → status = `preventivo_emesso` (quote takes precedence)
  - Neither → status = `ingressato` (default)
- **Wizard Updates**:
  - AcceptanceWizardDialog: Step renamed to "Diagnosi e Preventivo" with combined diagnosis/quote interface
  - RepairIntakeWizard: Same step 4 changes with unified "Diagnosi e Preventivo" interface
- **Diagnosis Form UI** (Comprehensive, parity with DiagnosisFormDialog):
  - Toggle to enable diagnosis creation
  - Textarea for technical diagnosis (required when enabled)
  - **Risultati Diagnosi**: Multi-select checkboxes organized by category (Hardware, Software, Connettività, Altro) from `diagnostic_findings` table
  - **Componenti Danneggiati**: Multi-select checkboxes from `damaged_component_types` table, filtered by deviceTypeId
  - **Tempo Stimato**: Dropdown from `estimated_repair_times` table (computes hoursMax for estimatedRepairTime field)
  - **Esito Diagnosi**: Dropdown (riparabile, non_conveniente, irriparabile)
  - **Motivo Irriparabilità**: Conditional section when outcome=irriparabile, from `unrepairable_reasons` table
  - **Promozioni Suggerite**: Conditional section when outcome=non_conveniente, from `promotions` table
  - Skip Photos checkbox (DiagnosisPhotoUploader integration deferred)
  - Additional notes textarea
- **Payload Fields**: findingIds[], componentIds[], estimatedRepairTimeId, skipPhotos, unrepairableReasonId, suggestedPromotionIds[]
- **Query Optimization**: Lookup queries conditionally enabled only when diagnosis panel is open
- **State Management**: Diagnosis state properly reset on dialog close
- **Database**: Uses existing `repair_diagnostics` table with 1:1 relationship to repair orders
