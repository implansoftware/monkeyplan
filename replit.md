# MonkeyPlan

## Overview

MonkeyPlan is an enterprise-level repair management platform that streamlines device repair workflows, inventory, ticketing, and billing for administrators, resellers, repair centers, and customers. It is a full-stack TypeScript application featuring a React frontend with shadcn/ui and an Express.js backend, complemented by real-time WebSocket communication. The platform supports four distinct user roles: Admin, Reseller, Repair Center, and Customer, each with specific functionalities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built with React 18+ and TypeScript, using Vite for development and bundling. It leverages Wouter for routing and TanStack Query for server state management and caching. UI components are built with shadcn/ui, based on Radix UI primitives and styled with Tailwind CSS, following a "New York" style variant and Inter font family for a professional, data-dense interface. Authentication is session-based using Passport.js, with protected routes and role-based redirects.

### Backend Architecture

The backend utilizes Express.js with TypeScript, supporting separate development and production environments. Authentication is managed via Passport.js with a Local Strategy and `express-session` for session persistence, backed by PostgreSQL session storage. The API is RESTful, organized by resource type, and includes role-based authorization middleware, JSON request/response formats, and centralized error handling. Real-time communication is handled by a WebSocket server using the `ws` library, with authentication-based connections.

### Database Architecture

Drizzle ORM is used for type-safe queries against a PostgreSQL database hosted on Neon serverless. The schema is designed for a role-based multi-tenant architecture, including tables for Users, Repair Centers, Products, Repair Orders, Tickets, Invoices, Inventory, and Chat Messages. Key entities and their relationships are defined with enums for user roles, ticket statuses, repair statuses, payment statuses, and inventory movement types.

### Build & Deployment

The development workflow uses `npm run dev` for Vite HMR and live reloading. Production builds (via `npm run build`) involve a two-stage process: Vite for client assets and esbuild for server code, both producing ESM modules with tree-shaking. Database schema management is handled by `npm run db:push` using Drizzle Kit for migrations.

## External Dependencies

**Third-party Services**
- Neon Database: Serverless PostgreSQL hosting
- Google Fonts: Inter font family

**Key NPM Packages**
- `@neondatabase/serverless`: PostgreSQL client
- `drizzle-orm`: Type-safe ORM
- `drizzle-zod`: Zod integration for Drizzle
- `@tanstack/react-query`: Server state management
- `@radix-ui/*`: Headless UI components
- `passport`, `express-session`: Authentication
- `ws`: WebSocket server
- `date-fns`: Date utilities
- `zod`: Runtime type validation
- `react-hook-form`, `@hookform/resolvers`: Form management
- `@uppy/*`: File uploads
- `exceljs`: Excel file generation
- `recharts`: Charting library

**Development Dependencies**
- `tsx`: TypeScript execution
- `esbuild`: Production bundling
- `drizzle-kit`: Database migration tooling