# MonkeyPlan Beta v.24

## Overview
MonkeyPlan is an enterprise-level repair management platform designed to streamline device repair workflows, inventory, ticketing, and billing. It provides a full-stack TypeScript solution for administrators, resellers, repair centers, and customers, offering comprehensive repair order management, a real-time ticketing system, and robust inventory control across four distinct user roles. The platform aims to enhance efficiency and transparency in device repair processes with a business vision to dominate the repair management software market.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18+ and TypeScript, utilizing `shadcn/ui` (Radix UI + Tailwind CSS) for a "New York" style UI. `Wouter` is used for routing and `TanStack Query` for server state management.

### Technical Implementations
The backend is an `Express.js` application with TypeScript, featuring a RESTful API and a `ws` WebSocket server for real-time communication. `Passport.js` and `express-session` handle session-based authentication with role-based authorization. Data is stored in a PostgreSQL database (Neon serverless) and accessed via `Drizzle ORM` for type-safe queries. The system enforces role-based access control (RBAC) and includes centralized error handling. Build processes use `Vite` for client assets and `esbuild` for server code.

### Feature Specifications
*   **Core Management**: Comprehensive Ticketing, Repair Orders, Warehouse/Inventory, User, and Invoice & Billing management systems, all featuring RBAC and robust security.
*   **Warehouse System**: Multi-tenant warehouse management with automatic user-specific warehouses, stock tracking, movements, and inter-warehouse transfers.
*   **Workflow Systems**: Advanced repair workflow with a 10-state enum, acceptance wizard, diagnostics, quote management, parts ordering, and detailed repair logging.
*   **Supply Chain**: Supplier/Procurement module with multi-supplier support, order/return workflows, and external API integration.
*   **Customer & Service Management**: Corporate branch management, a standardized service catalog with custom pricing, and a delivery appointment system.
*   **Integrations**: Direct integration with the SIFAR supplier API for spare parts ordering.
*   **B2B Ordering System**: Multi-level B2B ordering supporting Reseller→Admin and RepairCenter→Reseller purchase flows with automatic stock transfers, order approval, shipping tracking, and receipt confirmation.
*   **Multi-Role Ticketing**: Supports "support" (customer→admin) and "internal" (between business entities) ticket types with role-based filtering and access control.
*   **Invoice Automation**: Automatic invoice generation for reseller sales based on order status ("delivered" or "completed") and B2B order shipments. Supports autonomous invoicing for sub-resellers.
*   **Warranty/Insurance Extension System**: Multi-tenant warranty catalog, offering flow during repair intake, snapshot pattern for historical accuracy, automatic invoice generation, customer warranty history, and analytics dashboards.
*   **Device-Based Service Filtering**: Service items can be linked to specific device types, brands, and models for precise filtering during service selection.
*   **Integrated Intake Workflow**: Ability to optionally create quotes and/or diagnosis records directly during the repair order intake process within a unified wizard step.
*   **Admin Price List Management**: Admin users can create and manage their own price lists for B2B scenarios, defining products and pricing for resellers.

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
*   **Sibill**: Invoice management and bank reconciliation.
## Recent Changes (February 2026)

### Admin Payment Configuration
- Added GET/PUT `/api/admin/payment-config` endpoints for admin to manage their payment methods
- Admin Settings page now includes "Metodi di Pagamento B2B" section with:
  - Bank transfer toggle with IBAN, BIC, account holder, bank name fields
  - Stripe, PayPal, Satispay toggles
- Conditional validation: IBAN and account holder required when bank transfer enabled
- Resellers see admin's payment methods when placing B2B orders
- Replaced emoji phase icons in SLA section with lucide-react icons

### Remote Repair Quote/Approval Workflow
- Added 3 new remote repair request statuses: `quoted`, `quote_accepted`, `quote_declined`
- Added 9 new columns: quoteAmount, quoteDescription, quoteValidUntil, quotedAt, quoteResponseAt, paymentMethod, paymentStatus, stripePaymentIntentId, paypalOrderId
- 8 new API endpoints for quote and payment management:
  - PATCH `/api/repair-center/remote-requests/:id/quote` - RC sends quote
  - PATCH `/api/repair-center/remote-requests/:id/skip-quote` - RC skips quote, goes directly to awaiting_shipment
  - PATCH `/api/customer/remote-requests/:id/accept-quote` - Customer accepts with payment method choice
  - PATCH `/api/customer/remote-requests/:id/decline-quote` - Customer declines quote
  - POST `/api/customer/remote-requests/stripe-payment` - Create Stripe PaymentIntent
  - POST `/api/customer/remote-requests/stripe-confirm` - Confirm after Stripe payment
  - POST `/api/customer/remote-requests/paypal-create` - Create PayPal order
  - POST `/api/customer/remote-requests/paypal-capture` - Capture PayPal payment
- Flow: accepted → [quote] → quoted → [accept] → quote_accepted → [payment] → awaiting_shipment
- Alternative: accepted → [skip-quote] → awaiting_shipment directly
- Payment methods: in_store, online_stripe, online_paypal
- Frontend: RC quote dialog, Customer quote card with accept/decline + checkout, all dashboards updated with new status labels and filters

### Italian Fiscal Compliance POS System
- Added per-item `vatRate` to `posTransactionItems` (default 22%) for multi-VAT rate support
- Added `lotteryCode` (8-char alphanumeric), `documentType` (receipt/invoice), `dailyNumber` (progressive per-register per-day) to `posTransactions`
- Added `totalsByVatRate` (JSON with imponibile/iva/totale per rate) and `dailyReportGenerated` to `posSessions`
- Storage: `generatePosDailyNumber()` for daily progressive numbering, `getDailyCorrispettivi()` for daily fiscal reports
- Both RC and Reseller POS transaction routes compute weighted average tax rate from per-item VAT, apply discount ratio proportionally
- Session close routes aggregate totalsByVatRate across completed transactions (with discount ratio applied)
- New endpoints: `GET /api/repair-center/pos/corrispettivi?date=YYYY-MM-DD` and `GET /api/reseller/pos/corrispettivi?date=YYYY-MM-DD`
- PDF receipt/invoice updated: multi-VAT breakdown table ("RIEPILOGO IVA"), lottery code display, document type labels, daily number
- Frontend: lottery code input field (8 chars, alphanumeric, auto-uppercase), documentType auto-set with invoice toggle, vatRate per item sent in payment mutation
- Session detail pages show totalsByVatRate breakdown (Aliquota / Imponibile / IVA / Totale grid)
