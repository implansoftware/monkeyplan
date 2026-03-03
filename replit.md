# MonkeyPlan

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
*   **B2B Ordering System**: Multi-level B2B ordering supporting Reseller→Admin and RepairCenter→Reseller purchase flows with automatic stock transfers, order approval, shipping tracking, and receipt confirmation.
*   **Multi-Role Ticketing**: Supports "support" (customer→admin) and "internal" (between business entities) ticket types with role-based filtering and access control.
*   **Invoice Automation**: Automatic invoice generation for reseller sales based on order status ("delivered" or "completed") and B2B order shipments. Supports autonomous invoicing for sub-resellers.
*   **Warranty/Insurance Extension System**: Multi-tenant warranty catalog, offering flow during repair intake, snapshot pattern for historical accuracy, automatic invoice generation, customer warranty history, and analytics dashboards.
*   **Device-Based Service Filtering**: Service items can be linked to specific device types, brands, and models for precise filtering during service selection.
*   **Integrated Intake Workflow**: Ability to optionally create quotes and/or diagnosis records directly during the repair order intake process within a unified wizard step.
*   **Customer Invite Links**: Resellers can generate shareable self-registration links for customers. Supports private/business customer types, optional labels, expiry dates, and max usage limits. Links are managed from the Customers page (side panel). Public page at `/invite/:token` allows customers to self-register with form adapted to customer type. Endpoints: `GET/POST /api/reseller/invite-links`, `PATCH/DELETE /api/reseller/invite-links/:id`, `GET /api/public/invite/:token`, `POST /api/public/invite/:token/register`.
*   **Device Return (Rientro) System**: Simplified return workflow for devices that come back for re-repair. Links new repair orders to parent orders, auto-inherits device/customer info, with a dedicated 3-step wizard (search→details→confirm). Available for all roles (admin, reseller, repair center).
*   **Admin Price List Management**: Admin users can create and manage their own price lists for B2B scenarios, defining products and pricing for resellers.
*   **Fiscal Compliance**: POS system with multi-VAT rate support, daily fiscal reporting, and integration with Registratore Telematico (RT) Cloud services (e.g., Fiskaly SIGN IT) for automated fiscal document submission and tracking.
*   **Push Notification System**: Expo Push Notification integration for real-time alerts to users, featuring token management, queued sending with retry mechanisms, and receipt tracking.
*   **SEO & Accessibility**: Comprehensive SEO overhaul including meta tags, sitemap, robots.txt, JSON-LD, dynamic page titles, and semantic HTML.
*   **Multilingual Support (i18n)**: 8-language internationalization using `react-i18next`: Italian, English, French, Spanish, German, Chinese (Simplified), Dutch, Arabic. 3,700+ translation keys organized by domain (common, repairs, invoices, tickets, warehouse, products, customers, b2b, pos, hr, warranties, utility, suppliers, shipping, settings, dashboard, reports, ai, shop, marketplace, license, fiscal, public). Language switcher in all app headers. Config at `client/src/i18n.ts`, locales at `client/src/locales/{it,en,fr,es,de,zh,nl,ar}/common.json`. Language detection: localStorage key `monkeyplan-lang` → navigator → Italian fallback.
*   **CSV Customer Import**: Bulk customer import from CSV files. Available to resellers, sub-resellers, reseller staff, and repair centers. Supports comma/semicolon separators, auto-parses Italian-format addresses, auto-generates usernames/passwords, handles email deduplication. Max 500 customers per import. Component: `client/src/components/CsvImportDialog.tsx`. Endpoints: `POST /api/reseller/customers/import-csv`, `POST /api/repair-center/customers/import-csv`.
*   **Stripe Recurring Subscriptions**: License plans support Stripe recurring subscriptions. Admin can sync plans with Stripe Prices. Resellers subscribe via Stripe Checkout (subscription mode), with automatic renewal via webhooks (invoice.paid, customer.subscription.deleted/updated). Cancel/reactivate subscription from my-license page. DB fields: `stripePriceId` (license_plans), `stripeSubscriptionId`/`cancelAtPeriodEnd` (licenses), `stripeCustomerId` (users). Webhook security enforced via signature verification. Backward compatible with free/manual licenses.
*   **Automatic Email Notifications (SMTP)**: Comprehensive email notification system using `nodemailer` via SMTP (mail.tophost.it:587 STARTTLS). Sends branded HTML emails with MonkeyPlan design (monkey logo, blue gradient header, responsive layout) for: repair order creation, all 10 status changes, quote issuance, ready-for-pickup, delivery + invoice, ticket creation/replies/closure, new customer welcome with credentials, delivery appointments, standalone quotes. Service: `server/services/email.ts` (templates), `server/services/emailNotifications.ts` (notification orchestration). All email sends are fire-and-forget (non-blocking). SMTP config: `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, `SMTP_FROM_NAME` env vars + `SMTP_USER`/`SMTP_PASS` secrets. Admin test endpoints: `POST /api/admin/smtp/test`, `POST /api/admin/smtp/send-test`.

## External Dependencies

*   **Neon Database**: Serverless PostgreSQL hosting.
*   **Google Fonts**: Inter font family.
*   **Sibill**: Invoice management and bank reconciliation.
*   **Fiskaly SIGN IT**: Cloud-certified fiscal reporting service.
*   **Expo Push**: Push notification service.
*   **OpenAI**: AI assistant integration (GPT-4o-mini) with admin-controlled access per entity.
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