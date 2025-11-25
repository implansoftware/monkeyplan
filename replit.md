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
*   **File Uploads & Attachments**: Backend API supports listing, uploading, and deleting attachments for repair orders with RBAC.
*   **Repair Workflow System**: Extends `repair_orders` with detailed tracking (IMEI/serial, brand, ingress dates) and a comprehensive 10-state workflow enum. Includes `device_models` for catalog management, `repair_acceptance` for intake details, and `repair_diagnostics` for tracking test results and severity.
    *   **Acceptance Wizard**: Enables a multi-step process for creating repair orders, capturing device info, customer details, and acceptance checks. Automatically sets initial status to 'ingressato'.
    *   **Database-Driven Catalogs**: Uses `device_types`, `device_brands`, and `device_models` tables to provide cascading dropdowns for device selection, improving data consistency.
    *   **Diagnostics & Priority**: Allows creation and update of repair diagnostics by admins/repair centers, automatically calculating repair priority based on severity, estimated time, and external parts requirement. Transitions status to 'in_diagnosi'.
    *   **Quote Management**: Enables creation, update, acceptance, and rejection of repair quotes with detailed parts and labor costs. Quotes automatically transition the repair order status and persist calculated priority.

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