# MonkeyPlan Beta v.22

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