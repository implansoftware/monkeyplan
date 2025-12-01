# MonkeyPlan

## Overview
MonkeyPlan is an enterprise-level repair management platform designed to streamline device repair workflows, inventory, ticketing, and billing. It provides a full-stack TypeScript solution for administrators, resellers, repair centers, and customers, offering comprehensive repair order management, a real-time ticketing system, and robust inventory control across four distinct user roles. The platform aims to enhance efficiency and transparency in device repair processes.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18+ and TypeScript, utilizing `shadcn/ui` (Radix UI + Tailwind CSS) for a "New York" style UI. `Wouter` is used for routing and `TanStack Query` for server state management.

### Technical Implementations
The backend is an `Express.js` application with TypeScript, featuring a RESTful API and a `ws` WebSocket server for real-time communication. `Passport.js` and `express-session` handle session-based authentication with role-based authorization. Data is stored in a PostgreSQL database (Neon serverless) and accessed via `Drizzle ORM` for type-safe queries. The system enforces role-based access control (RBAC) and includes centralized error handling. Build processes use `Vite` for client assets and `esbuild` for server code.

### Feature Specifications

*   **Ticketing System**: Provides a RESTful API with RBAC, enabling customer ticket creation, detailed views with conversation threads, and management by admin, reseller, and repair center roles. Real-time WebSocket notifications are used for status changes, assignments, and new messages, with robust security.
*   **Repair Orders Management**: Offers a consolidated API endpoint with role-based filtering. Customers and resellers can create orders, while admins have full update access. Repair centers can only update assigned orders. Security measures include ID injection prevention and triple null-safe access controls.
*   **Inventory Management**: Features a comprehensive API for products and inventory. All authenticated users can view products, but only admins can perform CRUD operations. Inventory viewing and movement creation are role-based.
*   **Dashboard & Analytics**: Provides role-specific dashboards with KPIs, charts (PieChart, BarChart), and tables for performance overview, low stock alerts, revenue, and customer stats.
*   **Invoicing & Billing**: Backend API supports listing, viewing, creating, and updating invoices with RBAC.
*   **User Management**: Backend API for listing and updating users, with specialized endpoints for resellers and customer registration. Includes tenant ownership tracking via `resellerId`.
    *   **Reseller Classification**: Resellers can be categorized as Standard, Franchising, or GDO (Grande Distribuzione Organizzata) via `resellerCategory` field in users table. Frontend supports creation, editing, filtering by category, and export with category column.
    *   **Users vs Customers Separation**: Admin UI has separate pages for staff users (admin/reseller/repair_center) and customers, with tenant-aware filtering for resellers and repair centers.
*   **Corporate Branch Management (Franchising/GDO)**: Hierarchical customer structure supporting corporate customers with multiple branches.
    *   **Branch Registry**: Full CRUD for customer branches with branch code, name, address, contact info, and active status.
    *   **Company Categories**: Enum `companyCategory` (standard/franchising/gdo) in `billingData` to identify corporate customer types.
    *   **Branch-Repair Association**: Optional `branchId` field in `repairOrders` to track which branch submitted a repair.
    *   **Acceptance Wizard Integration**: Branch dropdown in the acceptance wizard when the selected customer has active branches.
    *   **Frontend Management**: CustomerBranchManager component with tabs interface in customer details view for resellers.
*   **File Uploads & Attachments**: Backend API supports listing, uploading, and deleting attachments for repair orders with RBAC.
*   **Repair Workflow System**: Extends `repair_orders` with detailed tracking (IMEI/serial, brand, ingress dates) and a comprehensive 10-state workflow enum. Includes `device_models` for catalog management, `repair_acceptance` for intake details, and `repair_diagnostics` for tracking test results and severity.
    *   **Acceptance Wizard**: Enables a multi-step process for creating repair orders, capturing device info, customer details, and acceptance checks. Automatically sets initial status to 'ingressato'.
    *   **Database-Driven Catalogs**: Uses `device_types`, `device_brands`, and `device_models` tables to provide cascading dropdowns for device selection, improving data consistency.
    *   **Diagnostics & Priority**: Allows creation and update of repair diagnostics by admins/repair centers, automatically calculating repair priority based on severity, estimated time, and external parts requirement. Transitions status to 'in_diagnosi'.
    *   **Quote Management**: Enables creation, update, acceptance, and rejection of repair quotes with detailed parts and labor costs. Quotes automatically transition the repair order status and persist calculated priority.
    *   **Parts Orders (FASE 5)**: Manages spare parts ordering with supplier tracking, order dates, expected arrival, and status lifecycle (ordered → in_transit → received). Auto-transitions repair status to 'attesa_ricambi' when parts are ordered and 'in_riparazione' when all parts are received.
    *   **Repair Logs (FASE 6)**: Tracks technician activities during repair including work hours, parts installed, test results, and photos. Supports log types: status_change, technician_note, parts_installed, test_result, customer_contact. Includes endpoint to start repair process.
    *   **Test & Delivery (FASE 7)**: Comprehensive device testing checklist (display, touch, battery, audio, camera, connectivity, buttons, sensors, charging, software) with pass/fail tracking. Delivery records capture recipient, method, signature, and ID verification. Complete workflow from 'in_riparazione' → 'in_test' → 'pronto_ritiro' → 'consegnato'.
*   **Supplier/Procurement Module**: Complete supplier management system with multi-supplier support per product.
    *   **Supplier Registry**: Full CRUD for suppliers with contact info, payment terms (bank transfer, credit card, PayPal, cash on delivery), delivery preferences, and communication channel configuration (API, email, WhatsApp).
    *   **Multi-Supplier Products**: Many-to-many relationship between products and suppliers via `productSuppliers` table, storing supplier-specific SKU, unit price, lead time, and priority ranking.
    *   **Supplier Orders**: Complete order workflow (draft → sent → confirmed → shipped → partially_received → received) with line items, pricing, tracking, and automatic inventory movements upon receipt. Uses incremental delta calculation for idempotent stock updates.
    *   **Supplier Returns**: Return management with RMA tracking, refund workflow (draft → requested → approved → shipped → received → refunded/rejected), and automatic inventory decrements on shipment with idempotency protection.
    *   **Communication Logs**: Tracks all communications with suppliers including order confirmations, status updates, and return requests.
    *   **Inventory Integration**: Automatic stock movements when supplier orders are received (incremental 'in') or returns are shipped (one-time 'out'), ensuring accurate inventory tracking.
    *   **External API Integration**: Supports external supplier APIs (Foneday, generic, custom) with configurable endpoints for products, orders, cart, and invoices.
        *   **API Configuration**: API type selection (foneday, generic, custom), multiple authentication methods (bearer_token, basic_auth, api_key, oauth2), secure API key storage via Replit Secrets references.
        *   **Catalog Synchronization**: `supplier_catalog_products` table stores synchronized product catalogs with external SKU mapping, pricing, stock data, and linking to local products.
        *   **Sync Logging**: `supplier_sync_logs` table tracks synchronization operations with detailed metrics (products created/updated/failed, duration).
        *   **API Endpoints**: POST `/api/suppliers/:id/test-connection` for connection testing, POST `/api/suppliers/:id/sync-catalog` for catalog synchronization.
        *   **Frontend Tab**: Dedicated "API" tab in supplier management with API type selection, authentication config, multiple endpoint fields, and real-time sync status.
*   **SIFAR Integration**: Direct integration with SIFAR supplier API for spare parts ordering by resellers.
    *   **Reseller Credentials**: Secure per-reseller API credential storage (`sifarCredentials` table) with environment selection (collaudo/produzione) and client key management.
    *   **Store Mapping**: `sifarStores` table links reseller accounts to SIFAR store codes (puntiVendita), enabling multi-location support.
    *   **REST API Client**: `sifarService.ts` provides typed methods for catalog browsing (categories, groups, brands, models, articles), cart management (add, update, remove, view), and order submission with courier selection.
    *   **Catalog Browser**: Hierarchical filtering interface allowing resellers to navigate Categories → Groups → Brands → Models → Articles with real-time stock and pricing display.
    *   **Cart Workflow**: Draft → Active → Completed/Expired status progression with quantity updates, item removal, and order finalization with selected courier.
    *   **Frontend Pages**: Three dedicated reseller pages (`/reseller/sifar/settings`, `/reseller/sifar/catalog`, `/reseller/sifar/cart`) with Italian UI for credential configuration, catalog browsing, and cart management.
    *   **API Endpoints**: Backend routes for credential CRUD, store management, catalog queries, cart operations, and order submission with role-based access (reseller only).

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