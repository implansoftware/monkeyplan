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

## Current Implementation Status

### Phase 3: Ticketing System (✅ COMPLETED)

**Task 3.1-3.3: Backend API + Customer Tickets**
- ✅ RESTful ticketing API with role-based ACL
- ✅ Customer tickets list/creation pages
- ✅ Ticket detail with conversation thread
- ✅ Security: Customer ID derived from auth session, internal message filtering

**Task 3.4: Admin/Reseller/RC Ticket Management**
- ✅ Admin tickets list page with filters (search, status, priority)
- ✅ Ticket detail pages for all roles with RBAC UI gating
- ✅ Separated components: `TicketDetailManageView` (Admin) vs `TicketDetailReadView` (Reseller/RC)
- ✅ Admin mutation hooks physically absent in ReadView (no privilege escalation risk)
- ✅ Real staff users data: `GET /api/users/staff` endpoint + `listStaffUsers()` storage method
- ✅ Assignment dropdown with real data (admin-only)
- ✅ Sidebar navigation for all roles
- ✅ Routing: Regex-based ticket ID extraction, role-aware back navigation

**Task 3.5: Real-Time WebSocket Notifications**
- ✅ Backend broadcast system for 4 ticket events:
  - `ticket_status_changed`: Status updates → notify customer + assigned staff
  - `ticket_assigned`: Assignment changes → notify customer + old/new assignee
  - `ticket_priority_changed`: Priority updates → notify customer + assigned staff
  - `ticket_new_message`: New messages → notify all participants (exclude sender)
- ✅ Frontend singleton WebSocket Provider (`TicketNotificationsContext`)
  - One shared connection per user session
  - Exponential backoff reconnection (max 5 attempts: 1s→2s→4s→8s→16s)
  - **Cleanup guards fix**: `shouldReconnectRef` + `userRef` set false/null BEFORE socket.close()
  - Prevents logout race condition (zero stale reconnections)
- ✅ React Query cache invalidation for real-time UI updates
- ✅ Provider nesting order: `QueryClient → Tooltip → Auth → TicketNotifications`
- ✅ WebSocket authentication: userId-based connection Map, auth message validation

**Technical Patterns:**
- **Security**: User/Customer ID forced from `req.user`, never from request body
- **ACL**: Single `/api/tickets` endpoint with role-based filtering
- **Routing**: Multi-role pattern matching with `useLocation` + regex extraction
- **WebSocket**: Singleton pattern with double-guard cleanup (race condition proof)
- **Real-time**: Broadcast → Cache invalidation → UI auto-update flow

### Phase 4: Repair Orders Management (✅ COMPLETED)

**Task 4.1: Backend Storage Interface**
- ✅ Added `updateRepairOrder()` to IStorage for multipurpose updates (status, costs, assignment, notes)
- ✅ Implemented in DatabaseStorage with automatic `updatedAt` timestamp
- ✅ Maintains existing CRUD methods (listRepairOrders, getRepairOrder, createRepairOrder, updateRepairOrderStatus)

**Task 4.2: Backend API Routes with RBAC** (server/routes.ts lines 1808-1966)
- ✅ `GET /api/repair-orders` - List with role-based filtering:
  - Customer: Own orders only (customerId filter)
  - Reseller: Created orders only (resellerId filter)
  - Repair Center: Assigned orders only (repairCenterId filter with triple null-check)
  - Admin: All orders (no filter)
- ✅ `GET /api/repair-orders/:id` - Detail with access control (triple null-check for repair centers)
- ✅ `POST /api/repair-orders` - Create order (customer/reseller only):
  - Customer: customerId forced from session
  - Reseller: resellerId forced from session, customerId validated
- ✅ `PATCH /api/repair-orders/:id` - Update multipurpose:
  - Admin: Full access (status, costs, notes, repairCenterId with validation)
  - Repair Center: Limited to assigned orders (status, costs, notes only)
  - Triple null-check: user.repairCenterId + order.repairCenterId + equality

**Task 4.3-4.6: Frontend Pages Consolidated**
All existing pages updated from separate role-specific endpoints to unified `/api/repair-orders`:
- ✅ `customer/repairs.tsx` - Lista ordini customer
- ✅ `customer/repair-detail.tsx` - Dettaglio ordine
- ✅ `reseller/new-repair.tsx` - Form creazione ordine
- ✅ `reseller/orders.tsx` - Lista ordini reseller
- ✅ `reseller/customers.tsx` - Lista clienti con ordini (type import fix)
- ✅ `admin/repairs.tsx` - Lista tutti ordini + update status
- ✅ `repair-center/repairs.tsx` - Lista ordini assegnati + update status/costs

**Security Architecture (Architect-Verified):**
- **ID Injection Prevention**: customerId/resellerId forced from `req.user` session (never trusted from body)
- **Triple Null-Safety**: Repair center endpoints require:
  1. `req.user.repairCenterId` exists (not null/undefined)
  2. `order.repairCenterId` exists (order is assigned)
  3. IDs match exactly
- **Early Role Gates**: Unauthorized roles blocked BEFORE database queries (performance + security)
- **No Data Leakage**: Repair centers with null ID see empty arrays, unassigned orders return 403
- **Validated Assignments**: Admin repair center assignments validated against storage before update

**RBAC Matrix:**
| Role | GET list | GET detail | POST create | PATCH update |
|------|----------|------------|-------------|--------------|
| Customer | Own only | Own only | ✅ (ID forced) | ❌ BLOCKED |
| Reseller | Own only | Own only | ✅ (ID forced) | ❌ BLOCKED |
| Repair Center | Assigned only (null-safe) | Assigned only (triple-check) | ❌ BLOCKED | Assigned only (triple-check) |
| Admin | All | All | ❌ BLOCKED | All (full access) |

**Technical Patterns:**
- **Endpoint Consolidation**: Single `/api/repair-orders` endpoint for all roles (pattern from tickets)
- **Backend RBAC**: Role-based filtering at API layer, frontend agnostic
- **Type Safety**: Import types from `@shared/schema` (no local duplicates)
- **Cache Invalidation**: TanStack Query `queryKey: ["/api/repair-orders"]` shared across all pages