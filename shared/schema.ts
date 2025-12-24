import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, pgEnum, jsonb, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "admin_staff", "reseller", "reseller_staff", "repair_center", "customer"]);
export const resellerCategoryEnum = pgEnum("reseller_category", ["standard", "franchising", "gdo"]);
export const customerTypeEnum = pgEnum("customer_type", ["private", "company"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "closed"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high"]);
export const repairStatusEnum = pgEnum("repair_status", [
  "pending",           // In attesa (stato iniziale)
  "ingressato",        // Ricevuto in laboratorio
  "in_diagnosi",       // In fase diagnostica
  "preventivo_emesso", // Preventivo inviato al cliente
  "preventivo_accettato", // Cliente ha accettato il preventivo
  "preventivo_rifiutato", // Cliente ha rifiutato il preventivo
  "attesa_ricambi",    // In attesa ricambi (ex waiting_parts)
  "in_riparazione",    // In riparazione attiva
  "in_test",           // In fase di collaudo
  "pronto_ritiro",     // Pronto per il ritiro
  "consegnato",        // Consegnato (ex delivered)
  "cancelled"          // Annullato
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "paid", "overdue", "cancelled"]);
export const movementTypeEnum = pgEnum("movement_type", ["in", "out", "adjustment"]);

// Warehouse Management Enums
export const warehouseOwnerTypeEnum = pgEnum("warehouse_owner_type", ["admin", "reseller", "sub_reseller", "repair_center"]);
export const warehouseMovementTypeEnum = pgEnum("warehouse_movement_type", ["carico", "scarico", "trasferimento_in", "trasferimento_out", "rettifica"]);
export const warehouseTransferStatusEnum = pgEnum("warehouse_transfer_status", ["pending", "approved", "shipped", "received", "cancelled"]);

// B2B Reseller Purchase Orders Status
export const resellerPurchaseOrderStatusEnum = pgEnum("reseller_purchase_order_status", [
  "draft",             // Bozza (carrello non ancora inviato)
  "pending",           // In attesa di approvazione admin
  "approved",          // Approvato dall'admin
  "rejected",          // Rifiutato dall'admin
  "processing",        // In preparazione
  "shipped",           // Spedito
  "received",          // Ricevuto dal reseller
  "cancelled",         // Annullato
]);

// B2B Payment Method
export const b2bPaymentMethodEnum = pgEnum("b2b_payment_method", [
  "bank_transfer",     // Bonifico bancario
  "stripe",            // Pagamento Stripe
  "credit",            // Credito/Fido
]);
export const notificationTypeEnum = pgEnum("notification_type", ["repair_update", "sla_warning", "review_request", "message", "system"]);
// RIMOSSO: diagnosisSeverityEnum - non più necessario
export const quoteStatusEnum = pgEnum("quote_status", ["draft", "sent", "accepted", "rejected"]);
export const repairPriorityEnum = pgEnum("repair_priority", ["low", "medium", "high", "urgent"]);
export const partsOrderStatusEnum = pgEnum("parts_order_status", ["ordered", "in_transit", "received", "cancelled"]);
export const repairLogTypeEnum = pgEnum("repair_log_type", ["status_change", "technician_note", "parts_installed", "test_result", "customer_contact"]);
export const quoteBypassReasonEnum = pgEnum("quote_bypass_reason", ["garanzia", "omaggio"]);

// Diagnosis Outcome - esito della diagnosi
export const diagnosisOutcomeEnum = pgEnum("diagnosis_outcome", [
  "riparabile",        // Dispositivo riparabile normalmente
  "non_conveniente",   // Costo riparazione > valore dispositivo (economico)
  "irriparabile",      // Danno tecnico non risolvibile
]);

// Data Recovery Enums
export const dataRecoveryTriggerEnum = pgEnum("data_recovery_trigger", [
  "manual",            // Avviato manualmente dal tecnico
  "automatic",         // Avviato automaticamente dopo diagnosi
]);

export const dataRecoveryHandlingEnum = pgEnum("data_recovery_handling", [
  "internal",          // Recupero gestito internamente
  "external",          // Recupero inviato a laboratorio esterno
]);

export const dataRecoveryStatusEnum = pgEnum("data_recovery_status", [
  "pending",           // In attesa di assegnazione
  "assigned",          // Assegnato al tecnico/laboratorio
  "in_progress",       // Recupero in corso
  "awaiting_shipment", // In attesa spedizione (solo esterno)
  "shipped",           // Spedito al laboratorio (solo esterno)
  "at_lab",            // Ricevuto dal laboratorio (solo esterno)
  "completed",         // Recupero completato con successo
  "partial",           // Recupero parziale
  "failed",            // Recupero fallito
  "cancelled",         // Annullato
]);

// SLA Severity Enum - Gravità basata su soglie temporali
export const slaSeverityEnum = pgEnum("sla_severity", [
  "in_time",           // 🟢 Entro i tempi
  "late",              // 🟡 In ritardo (superata soglia warning)
  "urgent",            // 🔴 Urgente (superata soglia critica)
]);

// Appointment Status Enum - Stato appuntamenti consegna
export const appointmentStatusEnum = pgEnum("appointment_status", [
  "scheduled",         // Prenotato
  "confirmed",         // Confermato dal centro
  "completed",         // Consegna completata
  "cancelled",         // Annullato
  "no_show",           // Cliente non presentato
]);

export const dataRecoveryEventTypeEnum = pgEnum("data_recovery_event_type", [
  "created",           // Job creato
  "assigned",          // Assegnato
  "status_change",     // Cambio stato
  "note_added",        // Nota aggiunta
  "document_generated",// Documento generato
  "shipped",           // Spedito
  "tracking_update",   // Aggiornamento tracking
  "completed",         // Completato
  "failed",            // Fallito
]);

// ==========================================
// SUPPLIER MANAGEMENT ENUMS
// ==========================================

// Canale comunicazione preferito fornitore
export const supplierCommunicationChannelEnum = pgEnum("supplier_communication_channel", [
  "api",               // Integrazione API diretta
  "email",             // Ordini via email
  "whatsapp",          // Ordini via WhatsApp Business
  "manual",            // Gestione manuale (telefono, portale web)
]);

// Tipo integrazione API fornitore (provider specifici o generic)
export const supplierApiTypeEnum = pgEnum("supplier_api_type", [
  "foneday",           // Foneday.shop API
  "ifixit",            // iFixit API
  "mobilax",           // Mobilax API
  "sifar",             // SIFAR API (ricambi telefonia)
  "generic_rest",      // API REST generica
  "custom",            // Integrazione custom
]);

// Metodo autenticazione API
export const supplierApiAuthMethodEnum = pgEnum("supplier_api_auth_method", [
  "bearer_token",      // Authorization: Bearer <token>
  "api_key_header",    // X-API-Key: <key>
  "api_key_query",     // ?api_key=<key>
  "basic_auth",        // Authorization: Basic <base64>
  "oauth2",            // OAuth 2.0
  "none",              // Nessuna autenticazione
]);

// Stato sincronizzazione catalogo fornitore
export const supplierSyncStatusEnum = pgEnum("supplier_sync_status", [
  "pending",           // In attesa di sincronizzazione
  "syncing",           // Sincronizzazione in corso
  "success",           // Sincronizzazione completata
  "partial",           // Sincronizzazione parziale (alcuni errori)
  "failed",            // Sincronizzazione fallita
]);

// Tipo proprietario ordine fornitore
export const supplierOrderOwnerTypeEnum = pgEnum("supplier_order_owner_type", [
  "admin",             // Ordine per conto Admin (piattaforma)
  "reseller",          // Ordine per conto Reseller
  "sub_reseller",      // Ordine per conto Sub-Reseller
  "repair_center",     // Ordine per conto Centro Riparazione
]);

// Stato ordine fornitore
export const supplierOrderStatusEnum = pgEnum("supplier_order_status", [
  "draft",             // Bozza (non ancora inviato)
  "sent",              // Inviato al fornitore
  "confirmed",         // Confermato dal fornitore
  "partially_shipped", // Spedizione parziale
  "shipped",           // Spedito completamente
  "partially_received",// Ricevuto parzialmente
  "received",          // Ricevuto completamente
  "cancelled",         // Annullato
]);

// Stato reso fornitore
export const supplierReturnStatusEnum = pgEnum("supplier_return_status", [
  "draft",             // Bozza
  "requested",         // Richiesta inviata
  "approved",          // Approvato dal fornitore
  "shipped",           // Merce spedita al fornitore
  "received",          // Ricevuto dal fornitore
  "refunded",          // Rimborsato/Accreditato
  "rejected",          // Reso rifiutato
  "cancelled",         // Annullato
]);

// Motivo reso
export const returnReasonEnum = pgEnum("return_reason", [
  "defective",         // Prodotto difettoso
  "wrong_item",        // Articolo sbagliato
  "damaged",           // Danneggiato durante trasporto
  "not_as_described",  // Non conforme alla descrizione
  "excess_stock",      // Eccedenza di magazzino
  "other",             // Altro
]);

// Tipo comunicazione
export const communicationTypeEnum = pgEnum("communication_type", [
  "order",             // Ordine
  "return_request",    // Richiesta reso
  "inquiry",           // Richiesta informazioni
  "tracking_update",   // Aggiornamento tracking
  "confirmation",      // Conferma
]);

// Condizioni di pagamento fornitore
export const supplierPaymentTermsEnum = pgEnum("supplier_payment_terms", [
  "immediate",            // Pagamento immediato
  "cod",                  // Contrassegno
  "bank_transfer_15",     // Bonifico 15gg DFFM
  "bank_transfer_30",     // Bonifico 30gg DFFM
  "bank_transfer_60",     // Bonifico 60gg DFFM
  "bank_transfer_90",     // Bonifico 90gg DFFM
  "riba_30",              // RiBa 30gg DFFM
  "riba_60",              // RiBa 60gg DFFM
  "credit_card",          // Carta di credito
  "paypal",               // PayPal
  "custom",               // Personalizzato (specificare in note)
]);

// ==========================================
// UTILITY MODULE ENUMS
// ==========================================

// Categoria servizio utility
export const utilityCategoryEnum = pgEnum("utility_category", [
  "fisso",             // Telefonia fissa
  "mobile",            // Telefonia mobile
  "centralino",        // Centralino/PBX
  "luce",              // Energia elettrica
  "gas",               // Gas naturale
  "altro",             // Altro
]);

// Stato pratica utility
export const utilityPracticeStatusEnum = pgEnum("utility_practice_status", [
  "bozza",             // Bozza - in preparazione
  "inviata",           // Inviata al fornitore
  "in_lavorazione",    // In lavorazione dal fornitore
  "attesa_documenti",  // In attesa documenti cliente
  "completata",        // Pratica completata/attivata
  "rifiutata",         // Rifiutata dal fornitore
  "annullata",         // Annullata dal cliente
]);

// Stato commissione utility
export const utilityCommissionStatusEnum = pgEnum("utility_commission_status", [
  "pending",           // In attesa di maturazione
  "accrued",           // Maturata
  "invoiced",          // Fatturata
  "paid",              // Pagata
  "cancelled",         // Annullata
]);

// Priorità pratica utility
export const utilityPracticePriorityEnum = pgEnum("utility_practice_priority", [
  "bassa",
  "normale",
  "alta",
  "urgente",
]);

// Stato task pratica utility
export const utilityPracticeTaskStatusEnum = pgEnum("utility_practice_task_status", [
  "da_fare",
  "in_corso",
  "completato",
  "annullato",
]);

// Tipo evento timeline pratica utility
export const utilityPracticeEventTypeEnum = pgEnum("utility_practice_event_type", [
  "created",           // Pratica creata
  "status_change",     // Cambio stato
  "document_uploaded", // Documento caricato
  "document_deleted",  // Documento eliminato
  "task_created",      // Task creato
  "task_completed",    // Task completato
  "note_added",        // Nota aggiunta
  "assigned",          // Pratica assegnata
  "comment",           // Commento generico
]);

// Categoria documento pratica utility
export const utilityDocumentCategoryEnum = pgEnum("utility_document_category", [
  "contratto",
  "documento_identita",
  "codice_fiscale",
  "bolletta",
  "conferma_fornitore",
  "fattura",
  "altro",
]);

// Visibilità nota pratica utility
export const utilityNoteVisibilityEnum = pgEnum("utility_note_visibility", [
  "internal",          // Solo operatori
  "customer",          // Visibile al cliente
]);

// Staff Module Enum - Moduli accessibili dallo staff del rivenditore
export const staffModuleEnum = pgEnum("staff_module", [
  "repairs",           // Lavorazioni
  "customers",         // Clienti
  "products",          // Prodotti
  "inventory",         // Inventario/Magazzino
  "repair_centers",    // Centri riparazione
  "services",          // Servizi/Interventi
  "suppliers",         // Fornitori
  "supplier_orders",   // Ordini fornitori
  "appointments",      // Appuntamenti
  "invoices",          // Fatture
  "tickets",           // Ticket supporto
]);

// Admin Module Enum - Moduli accessibili dallo staff admin
export const adminModuleEnum = pgEnum("admin_module", [
  "users",             // Gestione utenti
  "resellers",         // Gestione rivenditori
  "repair_centers",    // Centri riparazione
  "repairs",           // Lavorazioni
  "products",          // Prodotti
  "inventory",         // Magazzino
  "suppliers",         // Fornitori
  "supplier_orders",   // Ordini fornitori
  "invoices",          // Fatture
  "tickets",           // Ticket supporto
  "utility",           // Pratiche utility
  "reports",           // Report/Analytics
  "settings",          // Impostazioni sistema
  "service_catalog",   // Catalogo interventi
]);

// ==========================================
// SALES / E-COMMERCE ENUMS
// ==========================================

// Stato ordine di vendita
export const salesOrderStatusEnum = pgEnum("sales_order_status", [
  "pending",           // In attesa di pagamento
  "confirmed",         // Confermato/Pagato
  "processing",        // In elaborazione
  "ready_to_ship",     // Pronto per la spedizione
  "shipped",           // Spedito
  "delivered",         // Consegnato
  "completed",         // Completato
  "cancelled",         // Annullato
  "refunded",          // Rimborsato
]);

// Metodo di pagamento
export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",              // Contanti
  "card",              // Carta di credito/debito
  "bank_transfer",     // Bonifico bancario
  "paypal",            // PayPal
  "stripe",            // Stripe
  "satispay",          // Satispay
  "pos",               // POS in negozio
  "credit",            // Credito/Finanziamento
]);

// Stato pagamento vendita
export const salesPaymentStatusEnum = pgEnum("sales_payment_status", [
  "pending",           // In attesa
  "processing",        // In elaborazione
  "completed",         // Completato
  "failed",            // Fallito
  "refunded",          // Rimborsato
  "partially_refunded",// Parzialmente rimborsato
]);

// Stato spedizione
export const shipmentStatusEnum = pgEnum("shipment_status", [
  "pending",           // In attesa di preparazione
  "preparing",         // In preparazione
  "ready",             // Pronto per ritiro corriere
  "picked_up",         // Ritirato dal corriere
  "in_transit",        // In transito
  "out_for_delivery",  // In consegna
  "delivered",         // Consegnato
  "failed_delivery",   // Consegna fallita
  "returned",          // Reso al mittente
]);

// Tipo di consegna
export const deliveryTypeEnum = pgEnum("delivery_type", [
  "pickup",            // Ritiro in negozio
  "shipping",          // Spedizione
  "express",           // Spedizione express
]);

// Corriere
export const carrierEnum = pgEnum("carrier", [
  "brt",               // BRT/Bartolini
  "gls",               // GLS
  "dhl",               // DHL
  "ups",               // UPS
  "fedex",             // FedEx
  "poste_italiane",    // Poste Italiane
  "sda",               // SDA
  "tnt",               // TNT
  "other",             // Altro
]);

// Stato reso ordine vendita
export const salesReturnStatusEnum = pgEnum("sales_return_status", [
  "requested",         // Richiesto dal cliente
  "approved",          // Approvato
  "rejected",          // Rifiutato
  "awaiting_shipment", // In attesa spedizione reso
  "shipped",           // Spedito dal cliente
  "received",          // Ricevuto
  "inspecting",        // In ispezione
  "refunded",          // Rimborsato
  "partially_refunded",// Parzialmente rimborsato
  "cancelled",         // Annullato
]);

// Motivo reso ordine vendita
export const salesReturnReasonEnum = pgEnum("sales_return_reason", [
  "defective",         // Difettoso
  "wrong_item",        // Articolo errato
  "not_as_described",  // Non conforme alla descrizione
  "changed_mind",      // Cambio idea
  "damaged_in_transit",// Danneggiato in transito
  "missing_parts",     // Parti mancanti
  "quality_issue",     // Problema qualità
  "other",             // Altro
]);

// Condizione articolo reso
export const returnItemConditionEnum = pgEnum("return_item_condition", [
  "new_sealed",        // Nuovo sigillato
  "new_opened",        // Nuovo aperto
  "used_good",         // Usato buone condizioni
  "used_damaged",      // Usato danneggiato
  "defective",         // Difettoso
]);

// Metodo rimborso
export const refundMethodEnum = pgEnum("refund_method", [
  "original_payment",  // Stesso metodo pagamento originale
  "store_credit",      // Credito negozio
  "bank_transfer",     // Bonifico bancario
]);

// Users table with role-based access
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("customer"),
  resellerCategory: resellerCategoryEnum("reseller_category").default("standard"), // Solo per role='reseller': standard/franchising/gdo
  parentResellerId: varchar("parent_reseller_id"), // Per sotto-rivenditori: ID del rivenditore padre (franchising/gdo)
  isActive: boolean("is_active").notNull().default(true),
  repairCenterId: varchar("repair_center_id"),
  resellerId: varchar("reseller_id"), // Which reseller this user belongs to (for customers and repair_centers)
  // Dati fiscali (principalmente per rivenditori)
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  ragioneSociale: text("ragione_sociale"),
  indirizzo: text("indirizzo"),
  cap: text("cap"),
  citta: text("citta"),
  provincia: text("provincia"),
  iban: text("iban"),
  codiceUnivoco: text("codice_univoco"), // Codice SDI per fatturazione elettronica
  pec: text("pec"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Reseller Staff Permissions - Permessi granulari per modulo per utenti staff del rivenditore
export const resellerStaffPermissions = pgTable("reseller_staff_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // L'utente staff
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }), // Il rivenditore proprietario
  module: staffModuleEnum("module").notNull(), // Il modulo a cui si applica il permesso
  canRead: boolean("can_read").notNull().default(false),
  canCreate: boolean("can_create").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResellerStaffPermissionSchema = createInsertSchema(resellerStaffPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResellerStaffPermission = z.infer<typeof insertResellerStaffPermissionSchema>;
export type ResellerStaffPermission = typeof resellerStaffPermissions.$inferSelect;

// Admin Staff Permissions - Permessi granulari per modulo per utenti staff dell'admin
export const adminStaffPermissions = pgTable("admin_staff_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }), // L'utente admin_staff
  adminId: varchar("admin_id").notNull().references(() => users.id, { onDelete: "cascade" }), // L'admin che ha creato lo staff
  module: adminModuleEnum("module").notNull(), // Il modulo a cui si applica il permesso
  canRead: boolean("can_read").notNull().default(false),
  canCreate: boolean("can_create").notNull().default(false),
  canUpdate: boolean("can_update").notNull().default(false),
  canDelete: boolean("can_delete").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAdminStaffPermissionSchema = createInsertSchema(adminStaffPermissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertAdminStaffPermission = z.infer<typeof insertAdminStaffPermissionSchema>;
export type AdminStaffPermission = typeof adminStaffPermissions.$inferSelect;

// Repair Centers
export const repairCenters = pgTable("repair_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  cap: text("cap"),
  provincia: text("provincia"),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  resellerId: varchar("reseller_id"), // Rivenditore di appartenenza
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Dati fiscali
  ragioneSociale: text("ragione_sociale"),
  partitaIva: text("partita_iva"),
  codiceFiscale: text("codice_fiscale"),
  iban: text("iban"),
  codiceUnivoco: text("codice_univoco"),
  pec: text("pec"),
  // Tariffa manodopera specifica per questo centro (in centesimi EUR)
  hourlyRateCents: integer("hourly_rate_cents"),
  // Impostazioni profilo pubblico
  description: text("description"), // Descrizione pubblica del centro
  websiteUrl: text("website_url"),
  logoUrl: text("logo_url"),
  publicPhone: text("public_phone"), // Telefono visibile ai clienti
  publicEmail: text("public_email"), // Email visibile ai clienti
  acceptsWalkIns: boolean("accepts_walk_ins").default(false), // Accetta clienti senza appuntamento
  openingHours: jsonb("opening_hours"), // JSON con orari di apertura per giorno
  socialLinks: jsonb("social_links"), // JSON con link social (facebook, instagram, etc.)
  notes: text("notes"), // Note interne
});

// Customer-RepairCenter many-to-many relationship
// Customers can belong to multiple repair centers
export const customerRepairCenters = pgTable("customer_repair_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.customerId, table.repairCenterId),
]);

export const insertCustomerRepairCenterSchema = createInsertSchema(customerRepairCenters).omit({
  id: true,
  createdAt: true,
});
export type InsertCustomerRepairCenter = z.infer<typeof insertCustomerRepairCenterSchema>;
export type CustomerRepairCenter = typeof customerRepairCenters.$inferSelect;

// Staff-RepairCenter many-to-many relationship
// Staff members (reseller_staff) can be assigned to specific repair centers
export const staffRepairCenters = pgTable("staff_repair_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  staffId: varchar("staff_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  unique().on(table.staffId, table.repairCenterId),
]);

export const insertStaffRepairCenterSchema = createInsertSchema(staffRepairCenters).omit({
  id: true,
  createdAt: true,
});
export type InsertStaffRepairCenter = z.infer<typeof insertStaffRepairCenterSchema>;
export type StaffRepairCenter = typeof staffRepairCenters.$inferSelect;

// Product type enum
export const productTypeEnum = pgEnum("product_type", [
  "ricambio",      // Spare part
  "accessorio",    // Accessory
  "dispositivo",   // Complete device
  "consumabile",   // Consumable (cables, adhesives, etc.)
]);

// Product condition enum
export const productConditionEnum = pgEnum("product_condition", [
  "nuovo",           // New
  "ricondizionato",  // Refurbished
  "usato",           // Used
  "compatibile",     // Compatible (third-party)
]);

// ==========================================
// SMARTPHONE & ACCESSORIES CATALOG ENUMS
// ==========================================

// Smartphone storage capacity
export const smartphoneStorageEnum = pgEnum("smartphone_storage", [
  "16GB",
  "32GB",
  "64GB",
  "128GB",
  "256GB",
  "512GB",
  "1TB",
  "2TB",
]);

// Smartphone grade (for refurbished/used)
export const smartphoneGradeEnum = pgEnum("smartphone_grade", [
  "A+",    // Come nuovo, nessun segno
  "A",     // Ottimo, micro-segni invisibili
  "B",     // Buono, leggeri segni visibili
  "C",     // Discreto, segni evidenti
  "D",     // Danneggiato esteticamente
]);

// Network lock status
export const networkLockEnum = pgEnum("network_lock", [
  "unlocked",       // Sbloccato
  "locked",         // Bloccato operatore
  "icloud_locked",  // Bloccato iCloud
]);

// Accessory type
export const accessoryTypeEnum = pgEnum("accessory_type", [
  "cover",           // Cover/Custodie
  "pellicola",       // Pellicole protettive
  "caricatore",      // Caricatori
  "cavo",            // Cavi
  "powerbank",       // Power bank
  "auricolari",      // Auricolari/Cuffie
  "supporto",        // Supporti auto/desk
  "adattatore",      // Adattatori
  "memoria",         // SD Card/Memory
  "altro",           // Altro
]);

// Products (Inventory items - Electronics parts)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(), // display, batteria, scheda_madre, cover, etc.
  productType: productTypeEnum("product_type").notNull().default("ricambio"),
  description: text("description"),
  
  // Brand & Compatibility
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // Tipo dispositivo (Smartphone, Tablet, etc.)
  brand: text("brand"), // Apple, Samsung, Xiaomi, Huawei, etc.
  compatibleModels: text("compatible_models").array(), // ["iPhone 14", "iPhone 14 Pro"]
  color: text("color"), // Nero, Bianco, Blu, etc.
  
  // Pricing
  costPrice: integer("cost_price"), // Prezzo acquisto in cents
  unitPrice: integer("unit_price").notNull(), // Prezzo vendita in cents
  
  // Condition & Quality
  condition: productConditionEnum("condition").notNull().default("nuovo"),
  warrantyMonths: integer("warranty_months").default(3), // Garanzia in mesi
  
  // Supplier Info
  supplier: text("supplier"), // Nome fornitore principale
  supplierCode: text("supplier_code"), // Codice articolo fornitore
  
  // Inventory Management
  minStock: integer("min_stock").default(5), // Soglia scorta minima per alert
  location: text("location"), // Posizione in magazzino (es. "Scaffale A3")
  
  // Creatore (null = admin/globale, altrimenti = rivenditore specifico)
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }),
  
  // Immagine prodotto
  imageUrl: text("image_url"),
  
  // Metadata
  isActive: boolean("is_active").notNull().default(true),
  isVisibleInShop: boolean("is_visible_in_shop").notNull().default(true), // Visibilità globale nello shop (controllata da admin)
  
  // Marketplace settings (Reseller-to-Reseller B2B)
  isMarketplaceEnabled: boolean("is_marketplace_enabled").notNull().default(false), // Disponibile per vendita ad altri rivenditori
  marketplacePriceCents: integer("marketplace_price_cents"), // Prezzo B2B per marketplace (null = usa unitPrice)
  marketplaceMinQuantity: integer("marketplace_min_quantity").default(1), // Quantità minima ordine
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Prices (Prezzi personalizzati per rivenditori - impostati dall'admin)
export const productPrices = pgTable("product_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  // Rivenditore a cui si applica il prezzo (impostato dall'admin)
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Prezzi personalizzati
  priceCents: integer("price_cents").notNull(), // Prezzo vendita personalizzato in centesimi
  costPriceCents: integer("cost_price_cents"), // Prezzo costo personalizzato (opzionale)
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Reseller Products (Assegnazione prodotti globali ai reseller per pubblicazione nello shop)
export const resellerProducts = pgTable("reseller_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Pubblicazione nello shop
  isPublished: boolean("is_published").notNull().default(false),
  
  // Prezzo personalizzato per vendita al pubblico (override del prezzo base del prodotto)
  customPriceCents: integer("custom_price_cents"),
  
  // Prezzo B2B personalizzato (prezzo a cui il reseller acquista dall'admin)
  b2bPriceCents: integer("b2b_price_cents"),
  
  // Quantità minima ordine B2B (configurabile dall'admin per ogni reseller)
  minimumOrderQuantity: integer("minimum_order_quantity").default(1),
  
  // Ereditarietà franchising (prodotto assegnato dal reseller padre)
  inheritedFrom: varchar("inherited_from").references(() => users.id, { onDelete: "set null" }),
  canOverridePrice: boolean("can_override_price").notNull().default(true),
  canUnpublish: boolean("can_unpublish").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResellerProductSchema = createInsertSchema(resellerProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertResellerProduct = z.infer<typeof insertResellerProductSchema>;
export type ResellerProduct = typeof resellerProducts.$inferSelect;

// ==========================================
// SMARTPHONE SPECS (1:1 con products di tipo dispositivo)
// ==========================================
export const smartphoneSpecs = pgTable("smartphone_specs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }).unique(),
  
  // Specifiche tecniche
  storage: smartphoneStorageEnum("storage").notNull(),
  ram: text("ram"), // es. "8GB" - deprecated, kept for backward compatibility
  screenSize: text("screen_size"), // es. "6.1 pollici" - deprecated, kept for backward compatibility
  batteryHealth: text("battery_health"), // Range batteria: "100", "95-99", "90-94", "85-89", "80-84", "<80"
  
  // Condizione e grading
  grade: smartphoneGradeEnum("grade"),
  networkLock: networkLockEnum("network_lock").notNull().default("unlocked"),
  
  // Identificativi
  imei: text("imei"),
  imei2: text("imei2"), // Secondo IMEI per dual SIM
  serialNumber: text("serial_number"),
  
  // Info aggiuntive
  originalBox: boolean("original_box").notNull().default(false), // Ha scatola originale
  accessories: text("accessories").array(), // Accessori inclusi
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// ACCESSORY SPECS (1:1 con products di tipo accessorio)
// ==========================================
export const accessorySpecs = pgTable("accessory_specs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }).unique(),
  
  // Tipo accessorio
  accessoryType: accessoryTypeEnum("accessory_type").notNull(),
  
  // Compatibilità
  isUniversal: boolean("is_universal").notNull().default(false), // Compatibile con tutti i dispositivi
  compatibleBrands: text("compatible_brands").array(), // ["Apple", "Samsung"]
  compatibleModels: text("compatible_models").array(), // ["iPhone 15", "iPhone 14"]
  
  // Specifiche
  material: text("material"), // es. "Silicone", "Vetro temperato"
  color: text("color"),
  
  // Info aggiuntive
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Inventory movements
export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  repairCenterId: varchar("repair_center_id").notNull(),
  movementType: movementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

// Current inventory stock by repair center
export const inventoryStock = pgTable("inventory_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  repairCenterId: varchar("repair_center_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// WAREHOUSE MANAGEMENT (Gestione Magazzini)
// ==========================================

// Magazzini - ogni utente/entità ha il suo magazzino
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerType: warehouseOwnerTypeEnum("owner_type").notNull(),
  ownerId: varchar("owner_id").notNull(), // ID dell'admin/reseller/sub_reseller/repair_center
  name: text("name").notNull(),
  address: text("address"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Stock per magazzino
export const warehouseStock = pgTable("warehouse_stock", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  minStock: integer("min_stock").default(0),
  location: text("location"), // Posizione fisica: es. "A1-03"
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  uniqueWarehouseProduct: unique().on(table.warehouseId, table.productId),
}));

export const insertWarehouseStockSchema = createInsertSchema(warehouseStock).omit({
  id: true,
  updatedAt: true,
});

// Movimenti magazzino
export const warehouseMovements = pgTable("warehouse_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull(),
  productId: varchar("product_id").notNull(),
  movementType: warehouseMovementTypeEnum("movement_type").notNull(),
  quantity: integer("quantity").notNull(),
  referenceType: text("reference_type"), // ordine, riparazione, trasferimento, carico_fornitore
  referenceId: varchar("reference_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdBy: varchar("created_by").notNull(),
});

export const insertWarehouseMovementSchema = createInsertSchema(warehouseMovements).omit({
  id: true,
  createdAt: true,
});

// Trasferimenti tra magazzini
export const warehouseTransfers = pgTable("warehouse_transfers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferNumber: text("transfer_number").notNull().unique(),
  sourceWarehouseId: varchar("source_warehouse_id").notNull(),
  destinationWarehouseId: varchar("destination_warehouse_id").notNull(),
  status: warehouseTransferStatusEnum("status").notNull().default("pending"),
  requestedBy: varchar("requested_by").notNull(),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWarehouseTransferSchema = createInsertSchema(warehouseTransfers).omit({
  id: true,
  transferNumber: true,
  approvedBy: true,
  approvedAt: true,
  shippedAt: true,
  receivedAt: true,
  createdAt: true,
  updatedAt: true,
});

// Articoli del trasferimento
export const warehouseTransferItems = pgTable("warehouse_transfer_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transferId: varchar("transfer_id").notNull(),
  productId: varchar("product_id").notNull(),
  requestedQuantity: integer("requested_quantity").notNull(),
  shippedQuantity: integer("shipped_quantity"),
  receivedQuantity: integer("received_quantity"),
});

export const insertWarehouseTransferItemSchema = createInsertSchema(warehouseTransferItems).omit({
  id: true,
  shippedQuantity: true,
  receivedQuantity: true,
});

// ==========================================
// B2B RESELLER PURCHASE ORDERS (Ordini Reseller → Admin)
// ==========================================

// Ordini di acquisto B2B dei reseller verso l'admin
export const resellerPurchaseOrders = pgTable("reseller_purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // es. B2B-2024-00001
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Stato ordine
  status: resellerPurchaseOrderStatusEnum("status").notNull().default("draft"),
  
  // Totali (in centesimi)
  subtotal: integer("subtotal").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  shippingCost: integer("shipping_cost").notNull().default(0),
  total: integer("total").notNull().default(0),
  
  // Pagamento
  paymentMethod: b2bPaymentMethodEnum("payment_method").default("bank_transfer"),
  paymentReference: text("payment_reference"), // Riferimento bonifico / ID transazione Stripe
  paymentConfirmedAt: timestamp("payment_confirmed_at"),
  paymentConfirmedBy: varchar("payment_confirmed_by").references(() => users.id),
  
  // Note
  resellerNotes: text("reseller_notes"), // Note del reseller
  adminNotes: text("admin_notes"), // Note dell'admin
  rejectionReason: text("rejection_reason"), // Motivo rifiuto (se rejected)
  
  // Tracking approvazione
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  
  // Tracking spedizione
  shippedAt: timestamp("shipped_at"),
  shippedBy: varchar("shipped_by").references(() => users.id),
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  
  // Tracking ricezione
  receivedAt: timestamp("received_at"),
  
  // Collegamento al trasferimento magazzino generato
  warehouseTransferId: varchar("warehouse_transfer_id").references(() => warehouseTransfers.id),
  
  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertResellerPurchaseOrderSchema = createInsertSchema(resellerPurchaseOrders).omit({
  id: true,
  orderNumber: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  shippedAt: true,
  shippedBy: true,
  receivedAt: true,
  warehouseTransferId: true,
  paymentConfirmedAt: true,
  paymentConfirmedBy: true,
  createdAt: true,
  updatedAt: true,
});

// Articoli dell'ordine B2B
export const resellerPurchaseOrderItems = pgTable("reseller_purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => resellerPurchaseOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  
  // Dati articolo (snapshot al momento dell'ordine)
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  productImage: text("product_image"),
  
  // Quantità e prezzi (in centesimi)
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // Prezzo B2B unitario
  totalPrice: integer("total_price").notNull(), // quantity * unitPrice
  
  // Quantità effettivamente spedita/ricevuta (per gestione parziale)
  shippedQuantity: integer("shipped_quantity"),
  receivedQuantity: integer("received_quantity"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertResellerPurchaseOrderItemSchema = createInsertSchema(resellerPurchaseOrderItems).omit({
  id: true,
  shippedQuantity: true,
  receivedQuantity: true,
  createdAt: true,
});

export type ResellerPurchaseOrder = typeof resellerPurchaseOrders.$inferSelect;
export type InsertResellerPurchaseOrder = z.infer<typeof insertResellerPurchaseOrderSchema>;
export type ResellerPurchaseOrderItem = typeof resellerPurchaseOrderItems.$inferSelect;
export type InsertResellerPurchaseOrderItem = z.infer<typeof insertResellerPurchaseOrderItemSchema>;

// Repair Center B2B Purchase Orders (RC ordina dal Reseller proprietario)
export const repairCenterPurchaseOrders = pgTable("repair_center_purchase_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id, { onDelete: "cascade" }),
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  status: resellerPurchaseOrderStatusEnum("status").notNull().default("pending"),
  
  subtotal: integer("subtotal").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  shippingCost: integer("shipping_cost").notNull().default(0),
  total: integer("total").notNull().default(0),
  
  paymentMethod: b2bPaymentMethodEnum("payment_method").default("bank_transfer"),
  paymentReference: text("payment_reference"),
  paymentConfirmedAt: timestamp("payment_confirmed_at"),
  
  notes: text("notes"),
  rejectionReason: text("rejection_reason"),
  
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
  shippedAt: timestamp("shipped_at"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  
  deliveredAt: timestamp("delivered_at"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRepairCenterPurchaseOrderSchema = createInsertSchema(repairCenterPurchaseOrders).omit({
  id: true,
  orderNumber: true,
  approvedBy: true,
  approvedAt: true,
  shippedAt: true,
  deliveredAt: true,
  paymentConfirmedAt: true,
  createdAt: true,
  updatedAt: true,
});

export const repairCenterPurchaseOrderItems = pgTable("repair_center_purchase_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => repairCenterPurchaseOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRepairCenterPurchaseOrderItemSchema = createInsertSchema(repairCenterPurchaseOrderItems).omit({
  id: true,
  createdAt: true,
});

export type RepairCenterPurchaseOrder = typeof repairCenterPurchaseOrders.$inferSelect;
export type InsertRepairCenterPurchaseOrder = z.infer<typeof insertRepairCenterPurchaseOrderSchema>;
export type RepairCenterPurchaseOrderItem = typeof repairCenterPurchaseOrderItems.$inferSelect;
export type InsertRepairCenterPurchaseOrderItem = z.infer<typeof insertRepairCenterPurchaseOrderItemSchema>;

// ==========================================
// REPAIR CENTER B2B RETURNS
// ==========================================

export const rcB2bReturnStatusEnum = pgEnum("rc_b2b_return_status", [
  "requested",
  "approved",
  "awaiting_shipment",
  "shipped",
  "received",
  "inspecting",
  "completed",
  "rejected",
  "cancelled",
]);

export const rcB2bReturnReasonEnum = pgEnum("rc_b2b_return_reason", [
  "defective",
  "wrong_item",
  "damaged",
  "not_as_described",
  "excess_quantity",
  "other",
]);

export const rcB2bReturns = pgTable("rc_b2b_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnNumber: text("return_number").notNull().unique(),
  orderId: varchar("order_id").notNull(),
  repairCenterId: varchar("repair_center_id").notNull(),
  resellerId: varchar("reseller_id").notNull(),
  status: rcB2bReturnStatusEnum("status").notNull().default("requested"),
  reason: rcB2bReturnReasonEnum("reason").notNull(),
  reasonDetails: text("reason_details"),
  totalAmount: real("total_amount").notNull().default(0),
  creditAmount: real("credit_amount"),
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  completedAt: timestamp("completed_at"),
  repairCenterNotes: text("repair_center_notes"),
  resellerNotes: text("reseller_notes"),
  rejectionReason: text("rejection_reason"),
  inspectionNotes: text("inspection_notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const rcB2bReturnItems = pgTable("rc_b2b_return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnId: varchar("return_id").notNull().references(() => rcB2bReturns.id, { onDelete: "cascade" }),
  orderItemId: varchar("order_item_id"),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  returnReason: text("return_reason"),
  condition: text("condition"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRcB2bReturnSchema = createInsertSchema(rcB2bReturns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRcB2bReturn = z.infer<typeof insertRcB2bReturnSchema>;
export type RcB2bReturn = typeof rcB2bReturns.$inferSelect;

export const insertRcB2bReturnItemSchema = createInsertSchema(rcB2bReturnItems).omit({ id: true, createdAt: true });
export type InsertRcB2bReturnItem = z.infer<typeof insertRcB2bReturnItemSchema>;
export type RcB2bReturnItem = typeof rcB2bReturnItems.$inferSelect;

// Repair orders (Lavorazioni)
export const repairOrders = pgTable("repair_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  branchId: varchar("branch_id"), // FK a customer_branches (opzionale, per clienti FRANCHISING/GDO)
  resellerId: varchar("reseller_id"),
  repairCenterId: varchar("repair_center_id"),
  deviceType: text("device_type").notNull(), // smartphone, laptop, tablet, tv, etc.
  deviceModel: text("device_model").notNull(),
  brand: text("brand"), // Marca dispositivo (auto-selezionata da catalogo modelli)
  deviceModelId: varchar("device_model_id").references(() => deviceModels.id), // FK to device catalog (nullable for manual entries)
  imei: text("imei"), // IMEI dispositivo
  serial: text("serial"), // Numero seriale
  imeiNotReadable: boolean("imei_not_readable").notNull().default(false), // Flag: IMEI non leggibile
  imeiNotPresent: boolean("imei_not_present").notNull().default(false), // Flag: IMEI non presente
  serialOnly: boolean("serial_only").notNull().default(false), // Flag: Solo seriale presente
  issueDescription: text("issue_description").notNull(),
  status: repairStatusEnum("status").notNull().default("pending"),
  priority: repairPriorityEnum("priority"), // Auto-calculated from diagnostics
  estimatedCost: integer("estimated_cost"), // in cents
  finalCost: integer("final_cost"), // in cents
  notes: text("notes"),
  ingressatoAt: timestamp("ingressato_at"), // Data ingresso in laboratorio
  quoteBypassReason: quoteBypassReasonEnum("quote_bypass_reason"), // Motivo bypass preventivo (garanzia/omaggio)
  quoteBypassedAt: timestamp("quote_bypassed_at"), // Data bypass preventivo
  skipDiagnosis: boolean("skip_diagnosis").notNull().default(false), // Flag: diagnosi saltata
  skipDiagnosisReason: text("skip_diagnosis_reason"), // Motivo salto diagnosi
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Device Types Lookup (Admin-managed categories)
export const deviceTypes = pgTable("device_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // es: "Smartphone", "Tablet", "Laptop"
  description: text("description"), // Descrizione categoria
  isActive: boolean("is_active").notNull().default(true), // Solo attivi appaiono nei dropdown
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Device Brands Lookup (Admin-managed brands)
export const deviceBrands = pgTable("device_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // es: "Apple", "Samsung", "Huawei"
  logoUrl: text("logo_url"), // URL logo brand (opzionale)
  isActive: boolean("is_active").notNull().default(true), // Solo attivi appaiono nei dropdown
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Issue Types Lookup (Problemi predefiniti per tipo dispositivo)
export const issueTypes = pgTable("issue_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Schermo rotto", "Batteria esaurita"
  description: text("description"), // Descrizione dettagliata
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Aesthetic Defects Lookup (Difetti estetici predefiniti)
export const aestheticDefects = pgTable("aesthetic_defects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Graffi sul display", "Ammaccature"
  description: text("description"),
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Accessory Types Lookup (Accessori predefiniti)
export const accessoryTypes = pgTable("accessory_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Caricabatterie", "Custodia"
  description: text("description"),
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Diagnostic Findings Lookup (Risultati diagnosi predefiniti)
export const diagnosticFindings = pgTable("diagnostic_findings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Display danneggiato", "Connettore di ricarica difettoso"
  description: text("description"),
  category: text("category"), // es: "Hardware", "Software", "Batteria"
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Damaged Component Types Lookup (Componenti danneggiabili predefiniti)
export const damagedComponentTypes = pgTable("damaged_component_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Display", "Batteria", "Scheda madre"
  description: text("description"),
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Estimated Repair Times Lookup (Tempi stimati predefiniti)
export const estimatedRepairTimes = pgTable("estimated_repair_times", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "30 minuti", "1 ora", "2 ore"
  description: text("description"), // es: "Intervento rapido"
  hoursMin: real("hours_min").notNull(), // 0.5, 1, 1.5, 2, etc (ore con decimali)
  hoursMax: real("hours_max").notNull(), // Ore precise per il calcolo manodopera
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Promotions & Suggestions (Promozioni e Suggerimenti per dispositivi non convenienti)
export const promotions = pgTable("promotions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Telefono nuovo con SIM inclusa"
  description: text("description"), // Descrizione dettagliata
  icon: text("icon"), // Nome icona Lucide (es: "Smartphone", "CreditCard")
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Unrepairable Reasons (Motivi irriparabilità filtrati per device type)
export const unrepairableReasons = pgTable("unrepairable_reasons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // es: "Ossidazione Diffusa", "CPU Danneggiata"
  description: text("description"),
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // null = tutti i tipi
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Device Models Catalog
export const deviceModels = pgTable("device_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  modelName: text("model_name").notNull(), // es: "iPhone 12", "Samsung Galaxy S21"
  brandId: varchar("brand_id").references(() => deviceBrands.id), // FK to brands (nullable for backward compat)
  typeId: varchar("type_id").references(() => deviceTypes.id), // FK to types (nullable for backward compat)
  brand: text("brand"), // Legacy text column (kept for backward compatibility)
  deviceClass: text("device_class"), // Legacy text column (kept for backward compatibility)
  marketCode: text("market_code"), // Codice markettario
  photoUrl: text("photo_url"), // URL foto dispositivo (da API o manuale)
  isActive: boolean("is_active").notNull().default(true), // Soft delete flag
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Reseller Custom Device Brands (Brand personalizzati per rivenditore)
export const resellerDeviceBrands = pgTable("reseller_device_brands", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => users.id),
  name: text("name").notNull(), // Nome brand personalizzato
  logoUrl: text("logo_url"), // URL logo (opzionale)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Reseller Custom Device Models (Modelli personalizzati per rivenditore)
export const resellerDeviceModels = pgTable("reseller_device_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => users.id),
  modelName: text("model_name").notNull(), // Nome modello personalizzato
  brandId: varchar("brand_id").references(() => deviceBrands.id), // FK a brand globale (opzionale)
  resellerBrandId: varchar("reseller_brand_id").references(() => resellerDeviceBrands.id), // FK a brand custom (opzionale)
  brandName: text("brand_name"), // Nome brand testuale (per quando non c'è FK)
  typeId: varchar("type_id").references(() => deviceTypes.id), // Tipo dispositivo
  photoUrl: text("photo_url"), // URL foto (opzionale)
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product Device Compatibilities (Many-to-Many: Products <-> Device Brand/Model)
export const productDeviceCompatibilities = pgTable("product_device_compatibilities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  deviceBrandId: varchar("device_brand_id").notNull().references(() => deviceBrands.id),
  deviceModelId: varchar("device_model_id").references(() => deviceModels.id), // Nullable: null = all models of brand
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Repair Acceptance Data (Check di accettazione)
export const repairAcceptance = pgTable("repair_acceptance", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().unique().references(() => repairOrders.id), // One acceptance per repair
  declaredDefects: text("declared_defects").array(), // Guasti dichiarati dal cliente
  aestheticCondition: text("aesthetic_condition"), // Condizione estetica generale
  aestheticNotes: text("aesthetic_notes"), // Note dettagliate su difetti estetici
  aestheticPhotosMandatory: boolean("aesthetic_photos_mandatory").notNull().default(false),
  accessories: text("accessories").array(), // Lista accessori in dotazione
  lockCode: text("lock_code"), // Codice di blocco/password
  lockPattern: text("lock_pattern"), // Pattern di blocco (serializzato)
  hasLockCode: boolean("has_lock_code"), // Cliente ha confermato presenza codice
  accessoriesRemoved: boolean("accessories_removed"), // Conferma rimozione accessori non necessari
  acceptedBy: varchar("accepted_by").notNull(), // ID utente che ha fatto l'accettazione
  acceptedAt: timestamp("accepted_at").notNull().defaultNow(),
});

// Repair Order Attachments (Photos and documents for repair orders)
export const repairAttachments = pgTable("repair_attachments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull(),
  objectKey: text("object_key").notNull(), // Key in object storage
  fileName: text("file_name").notNull(), // Original file name
  fileType: text("file_type").notNull(), // MIME type
  fileSize: integer("file_size").notNull(), // Size in bytes
  uploadedBy: varchar("uploaded_by").notNull(),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
});

// Repair Diagnostics (Technical diagnosis by repair center)
export const repairDiagnostics = pgTable("repair_diagnostics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().unique().references(() => repairOrders.id), // One diagnosis per repair
  technicalDiagnosis: text("technical_diagnosis").notNull(), // Diagnosi tecnica dettagliata
  damagedComponents: text("damaged_components").array(), // Componenti danneggiati
  estimatedRepairTime: real("estimated_repair_time"), // Tempo stimato in ore (supporta decimali es. 0.5, 1.5)
  requiresExternalParts: boolean("requires_external_parts").notNull().default(false), // Necessità ricambi esterni
  diagnosisNotes: text("diagnosis_notes"), // Note aggiuntive del tecnico
  photos: text("photos").array(), // Array di URL foto diagnostiche
  skipPhotos: boolean("skip_photos").notNull().default(false), // True se il tecnico ha scelto di non caricare foto
  findingIds: text("finding_ids").array(), // IDs dei problemi selezionati dal catalogo
  componentIds: text("component_ids").array(), // IDs dei componenti danneggiati dal catalogo
  estimatedRepairTimeId: varchar("estimated_repair_time_id"), // ID del tempo stimato selezionato
  // Esito diagnosi - nuovo sistema
  diagnosisOutcome: diagnosisOutcomeEnum("diagnosis_outcome").default("riparabile"), // Esito: riparabile, non_conveniente, irriparabile
  // Per esito "irriparabile"
  unrepairableReasonId: varchar("unrepairable_reason_id").references(() => unrepairableReasons.id), // Motivo predefinito
  unrepairableReasonOther: text("unrepairable_reason_other"), // Campo libero "Altro"
  // Per esito "non_conveniente"
  customerDataImportant: boolean("customer_data_important").default(false), // Dati importanti? → attiva recupero dati
  suggestedPromotionIds: text("suggested_promotion_ids").array(), // IDs promozioni suggerite
  dataRecoveryRequested: boolean("data_recovery_requested").default(false), // Richiesto recupero dati
  diagnosedBy: varchar("diagnosed_by").notNull(), // ID tecnico che ha fatto la diagnosi
  diagnosedAt: timestamp("diagnosed_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Repair Quotes (Preventivi riparazione)
export const repairQuotes = pgTable("repair_quotes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().unique().references(() => repairOrders.id), // One quote per repair
  quoteNumber: text("quote_number").notNull().unique(), // Auto-generated quote number
  parts: text("parts"), // JSON array: [{name, quantity, unitPrice}]
  laborCost: integer("labor_cost").notNull().default(0), // Costo manodopera in cents
  totalAmount: integer("total_amount").notNull(), // Totale preventivo in cents
  status: quoteStatusEnum("status").notNull().default("draft"),
  validUntil: timestamp("valid_until"), // Data scadenza preventivo
  notes: text("notes"), // Note aggiuntive
  createdBy: varchar("created_by").notNull(), // ID utente che ha creato il preventivo
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Parts Orders (Ordini ricambi - FASE 5)
export const partsOrders = pgTable("parts_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().references(() => repairOrders.id),
  productId: varchar("product_id").references(() => products.id), // Collegamento opzionale al prodotto in magazzino
  partName: text("part_name").notNull(), // Nome ricambio
  partNumber: text("part_number"), // Codice ricambio fornitore
  quantity: integer("quantity").notNull().default(1),
  unitCost: integer("unit_cost"), // Costo unitario in cents
  supplier: text("supplier"), // Nome fornitore
  status: partsOrderStatusEnum("status").notNull().default("ordered"),
  orderedAt: timestamp("ordered_at").notNull().defaultNow(),
  expectedArrival: timestamp("expected_arrival"), // Data arrivo prevista
  receivedAt: timestamp("received_at"), // Data arrivo effettiva
  orderedBy: varchar("ordered_by").notNull(), // ID utente che ha ordinato
  notes: text("notes"),
});

// Repair Logs (Log attività riparazione - FASE 6)
export const repairLogs = pgTable("repair_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().references(() => repairOrders.id),
  logType: repairLogTypeEnum("log_type").notNull(),
  description: text("description").notNull(), // Descrizione attività
  technicianId: varchar("technician_id").notNull(), // ID tecnico
  hoursWorked: integer("hours_worked"), // Ore lavorate (in minuti per precisione)
  partsUsed: text("parts_used"), // JSON array di parti utilizzate
  testResults: text("test_results"), // JSON risultati test
  photos: text("photos").array(), // Array URL foto
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Test Checklist (Checklist collaudo - FASE 7)
export const repairTestChecklist = pgTable("repair_test_checklist", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().unique().references(() => repairOrders.id),
  displayTest: boolean("display_test"), // Test display
  touchTest: boolean("touch_test"), // Test touch
  batteryTest: boolean("battery_test"), // Test batteria
  audioTest: boolean("audio_test"), // Test audio
  cameraTest: boolean("camera_test"), // Test fotocamera
  connectivityTest: boolean("connectivity_test"), // Test WiFi/BT/4G
  buttonsTest: boolean("buttons_test"), // Test pulsanti fisici
  sensorsTest: boolean("sensors_test"), // Test sensori
  chargingTest: boolean("charging_test"), // Test ricarica
  softwareTest: boolean("software_test"), // Test software/OS
  overallResult: boolean("overall_result"), // Risultato complessivo (true = passed)
  notes: text("notes"), // Note sul collaudo
  testedBy: varchar("tested_by").notNull(), // ID tecnico
  testedAt: timestamp("tested_at").notNull().defaultNow(),
});

// Delivery Records (Conferma consegna - FASE 7)
export const repairDelivery = pgTable("repair_delivery", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().unique().references(() => repairOrders.id),
  deliveredTo: text("delivered_to").notNull(), // Nome di chi ritira
  deliveryMethod: text("delivery_method").notNull().default("in_store"), // in_store, courier, pickup
  signatureData: text("signature_data"), // Base64 firma (legacy - opzionale)
  idDocumentType: text("id_document_type"), // Tipo documento identità
  idDocumentNumber: text("id_document_number"), // Numero documento
  idDocumentPhoto: text("id_document_photo"), // URL foto documento identità
  notes: text("notes"),
  // Firma Cliente
  customerSignature: text("customer_signature"), // Base64 PNG della firma cliente
  customerSignerName: text("customer_signer_name"), // Nome di chi ha firmato
  customerSignedAt: timestamp("customer_signed_at"), // Quando ha firmato
  // Firma Tecnico/Rivenditore
  technicianSignature: text("technician_signature"), // Base64 PNG della firma tecnico
  technicianSignerName: text("technician_signer_name"), // Nome del tecnico
  technicianSignedAt: timestamp("technician_signed_at"), // Quando ha firmato
  deliveredBy: varchar("delivered_by").notNull(), // ID utente che ha consegnato
  deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
});

// ==========================================
// DELIVERY APPOINTMENT SYSTEM
// ==========================================

// Repair Center Availability (Disponibilità settimanale centro riparazione)
export const repairCenterAvailability = pgTable("repair_center_availability", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id, { onDelete: 'cascade' }),
  weekday: integer("weekday").notNull(), // 0=Domenica, 1=Lunedì, ..., 6=Sabato
  startTime: text("start_time").notNull(), // "09:00" formato HH:mm
  endTime: text("end_time").notNull(), // "18:00" formato HH:mm
  slotDurationMinutes: integer("slot_duration_minutes").notNull().default(30), // Durata slot in minuti
  capacityPerSlot: integer("capacity_per_slot").notNull().default(1), // Appuntamenti max per slot
  isClosed: boolean("is_closed").notNull().default(false), // Giorno di chiusura
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Repair Center Blackouts (Giorni di chiusura straordinaria/ferie)
export const repairCenterBlackouts = pgTable("repair_center_blackouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id, { onDelete: 'cascade' }),
  date: text("date").notNull(), // "2024-12-25" formato YYYY-MM-DD
  startTime: text("start_time"), // null = giorno intero, altrimenti "09:00"
  endTime: text("end_time"), // null = giorno intero, altrimenti "13:00"
  reason: text("reason"), // "Natale", "Ferie", "Manutenzione"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Delivery Appointments (Appuntamenti per consegna dispositivi)
export const deliveryAppointments = pgTable("delivery_appointments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().references(() => repairOrders.id),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id),
  resellerId: varchar("reseller_id").references(() => users.id), // Chi ha prenotato (reseller)
  customerId: varchar("customer_id").references(() => users.id), // Cliente finale
  date: text("date").notNull(), // "2024-12-20" formato YYYY-MM-DD
  startTime: text("start_time").notNull(), // "10:00" formato HH:mm
  endTime: text("end_time").notNull(), // "10:30" formato HH:mm
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"), // Note aggiuntive
  confirmedBy: varchar("confirmed_by"), // ID utente che ha confermato
  confirmedAt: timestamp("confirmed_at"), // Data conferma
  cancelledBy: varchar("cancelled_by"), // ID utente che ha annullato
  cancelledAt: timestamp("cancelled_at"), // Data annullamento
  cancelReason: text("cancel_reason"), // Motivo annullamento
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// SLA TRACKING SYSTEM
// ==========================================

// Repair Order State History (Cronologia stati per calcolo SLA)
export const repairOrderStateHistory = pgTable("repair_order_state_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  repairOrderId: varchar("repair_order_id").notNull().references(() => repairOrders.id),
  status: repairStatusEnum("status").notNull(), // Stato in cui è entrato
  enteredAt: timestamp("entered_at").notNull().defaultNow(), // Quando è entrato in questo stato
  exitedAt: timestamp("exited_at"), // Quando è uscito da questo stato (null = stato corrente)
  durationMinutes: integer("duration_minutes"), // Durata calcolata all'uscita
  changedBy: varchar("changed_by"), // ID utente che ha cambiato stato
});

// Supplier Return State History (Cronologia stati resi per calcolo SLA)
export const supplierReturnStateHistory = pgTable("supplier_return_state_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierReturnId: varchar("supplier_return_id").notNull().references(() => supplierReturns.id),
  status: text("status").notNull(), // Stato in cui è entrato
  enteredAt: timestamp("entered_at").notNull().defaultNow(), // Quando è entrato in questo stato
  exitedAt: timestamp("exited_at"), // Quando è uscito da questo stato (null = stato corrente)
  durationMinutes: integer("duration_minutes"), // Durata calcolata all'uscita
  changedBy: varchar("changed_by"), // ID utente che ha cambiato stato
});

// Admin Settings (Configurazione sistema)
export const adminSettings = pgTable("admin_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settingKey: text("setting_key").notNull().unique(), // es: "hourly_rate", "vat_rate"
  settingValue: text("setting_value").notNull(), // Valore come stringa (convertito dal codice)
  description: text("description"), // Descrizione dell'impostazione
  updatedBy: varchar("updated_by"), // ID admin che ha modificato
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// DATA RECOVERY SYSTEM
// ==========================================

// External Labs (Laboratori esterni convenzionati)
export const externalLabs = pgTable("external_labs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // Codice breve es: "LAB001"
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone"),
  email: text("email").notNull(),
  contactPerson: text("contact_person"), // Referente
  apiEndpoint: text("api_endpoint"), // URL API se supportato
  apiKey: text("api_key"), // Chiave API (criptata)
  supportsApiIntegration: boolean("supports_api_integration").notNull().default(false),
  trackingPrefix: text("tracking_prefix"), // Prefisso per tracking (es: "LAB-")
  avgTurnaroundDays: integer("avg_turnaround_days").default(7), // Tempo medio lavorazione
  baseCost: integer("base_cost"), // Costo base in centesimi
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Data Recovery Jobs (Lavorazioni recupero dati)
export const dataRecoveryJobs = pgTable("data_recovery_jobs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  jobNumber: text("job_number").notNull().unique(), // es: "REC-2024-0001"
  parentRepairOrderId: varchar("parent_repair_order_id").notNull().references(() => repairOrders.id),
  diagnosisId: varchar("diagnosis_id").references(() => repairDiagnostics.id),
  triggerType: dataRecoveryTriggerEnum("trigger_type").notNull().default("manual"),
  handlingType: dataRecoveryHandlingEnum("handling_type").notNull(),
  status: dataRecoveryStatusEnum("status").notNull().default("pending"),
  
  // Device info snapshot (dal repair order principale)
  deviceDescription: text("device_description").notNull(), // es: "iPhone 14 Pro - IMEI: 123456"
  
  // Internal handling
  assignedToUserId: varchar("assigned_to_user_id"), // Tecnico interno assegnato
  assignedToGroupId: varchar("assigned_to_group_id"), // Gruppo tecnici
  
  // External handling
  externalLabId: varchar("external_lab_id").references(() => externalLabs.id),
  externalLabJobRef: text("external_lab_job_ref"), // Riferimento laboratorio esterno
  
  // Shipping (for external)
  shippingDocumentUrl: text("shipping_document_url"), // URL documento spedizione PDF
  shippingLabelUrl: text("shipping_label_url"), // URL etichetta logistica PDF
  trackingNumber: text("tracking_number"), // Numero tracking corriere
  trackingCarrier: text("tracking_carrier"), // Nome corriere
  shippedAt: timestamp("shipped_at"),
  receivedAtLabAt: timestamp("received_at_lab_at"),
  
  // Outcome
  recoveryOutcome: text("recovery_outcome"), // "success" | "partial" | "failed"
  recoveredDataDescription: text("recovered_data_description"), // Cosa è stato recuperato
  recoveredDataSize: text("recovered_data_size"), // Es: "256GB"
  recoveredDataMediaType: text("recovered_data_media_type"), // Es: "USB Drive", "Cloud Upload"
  
  // Costs
  estimatedCost: integer("estimated_cost"), // Costo stimato in centesimi
  finalCost: integer("final_cost"), // Costo finale in centesimi
  
  // Notes
  internalNotes: text("internal_notes"), // Note interne
  customerNotes: text("customer_notes"), // Note visibili al cliente
  
  // Timestamps
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
});

// Data Recovery Events (Timeline eventi)
export const dataRecoveryEvents = pgTable("data_recovery_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dataRecoveryJobId: varchar("data_recovery_job_id").notNull().references(() => dataRecoveryJobs.id),
  eventType: dataRecoveryEventTypeEnum("event_type").notNull(),
  title: text("title").notNull(), // Titolo breve evento
  description: text("description"), // Descrizione dettagliata
  metadata: text("metadata"), // JSON extra data (tracking info, etc)
  createdBy: varchar("created_by"), // ID utente o "system"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// SUPPLIER MANAGEMENT SYSTEM
// ==========================================

// Suppliers (Anagrafica Fornitori)
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // Codice fornitore interno (es: "FORN001")
  name: text("name").notNull(), // Ragione sociale
  
  // Ownership: null = admin/global, userId = reseller-owned
  createdBy: varchar("created_by").references(() => users.id),
  
  // Contatti
  email: text("email"),
  phone: text("phone"),
  whatsapp: text("whatsapp"), // Numero WhatsApp Business
  website: text("website"),
  
  // Indirizzo
  address: text("address"),
  city: text("city"),
  zipCode: text("zip_code"),
  country: text("country").default("IT"),
  
  // Dati fiscali
  vatNumber: text("vat_number"), // Partita IVA
  fiscalCode: text("fiscal_code"), // Codice fiscale
  
  // Canale comunicazione preferito
  communicationChannel: supplierCommunicationChannelEnum("communication_channel").notNull().default("email"),
  
  // Integrazione API (se canale = api)
  apiType: supplierApiTypeEnum("api_type"), // Tipo integrazione (foneday, generic, etc.)
  apiEndpoint: text("api_endpoint"), // URL base API (es: https://foneday.shop/api/v1)
  apiSecretName: text("api_secret_name"), // Nome del secret per API key (riferimento a Replit Secrets)
  apiAuthMethod: supplierApiAuthMethodEnum("api_auth_method").default("bearer_token"), // Metodo autenticazione
  apiFormat: text("api_format").default("json"), // Formato: "json", "xml"
  
  // Endpoint specifici (sovrascrivono i default del tipo API)
  apiProductsEndpoint: text("api_products_endpoint"), // Endpoint prodotti (es: /products)
  apiOrdersEndpoint: text("api_orders_endpoint"), // Endpoint ordini (es: /orders)
  apiCartEndpoint: text("api_cart_endpoint"), // Endpoint carrello (es: /shopping-cart-add-items)
  apiInvoicesEndpoint: text("api_invoices_endpoint"), // Endpoint fatture (es: /invoices)
  
  // Stato sincronizzazione catalogo
  catalogSyncEnabled: boolean("catalog_sync_enabled").default(false), // Sincronizzazione automatica abilitata
  catalogSyncStatus: supplierSyncStatusEnum("catalog_sync_status"), // Stato ultima sincronizzazione
  catalogLastSyncAt: timestamp("catalog_last_sync_at"), // Data ultima sincronizzazione
  catalogProductsCount: integer("catalog_products_count").default(0), // Numero prodotti sincronizzati
  
  // Integrazione Email
  orderEmailTemplate: text("order_email_template"), // Template email ordini
  returnEmailTemplate: text("return_email_template"), // Template email resi
  
  // Condizioni commerciali
  paymentTerms: supplierPaymentTermsEnum("payment_terms").default("bank_transfer_30"), // Condizioni pagamento
  deliveryDays: integer("delivery_days").default(3), // Giorni medi consegna
  minOrderAmount: integer("min_order_amount"), // Ordine minimo in centesimi
  shippingCost: integer("shipping_cost"), // Costo spedizione in centesimi
  freeShippingThreshold: integer("free_shipping_threshold"), // Soglia spedizione gratuita
  
  // Note
  internalNotes: text("internal_notes"), // Note interne
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Product-Supplier Relationship (Molti-a-molti)
export const productSuppliers = pgTable("product_suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  
  // Dati specifici fornitore per questo prodotto
  supplierCode: text("supplier_code"), // Codice articolo del fornitore (SKU fornitore)
  supplierName: text("supplier_name"), // Nome prodotto presso il fornitore
  purchasePrice: integer("purchase_price"), // Prezzo acquisto in centesimi
  minOrderQty: integer("min_order_qty").default(1), // Quantità minima ordinabile
  packSize: integer("pack_size").default(1), // Pezzi per confezione
  leadTimeDays: integer("lead_time_days"), // Tempo approvvigionamento in giorni
  
  // Flag
  isPreferred: boolean("is_preferred").notNull().default(false), // Fornitore preferito per questo prodotto
  isActive: boolean("is_active").notNull().default(true),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supplier Catalog Products (Prodotti nel catalogo fornitore esterno - sincronizzati via API)
export const supplierCatalogProducts = pgTable("supplier_catalog_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  
  // Identificatori fornitore (dati originali dall'API)
  externalSku: text("external_sku").notNull(), // SKU fornitore (es: "AA215P0195N" per Foneday)
  externalEan: text("external_ean"), // EAN/Barcode
  externalArtcode: text("external_artcode"), // Codice articolo fornitore
  
  // Dati prodotto
  title: text("title").notNull(), // Nome prodotto
  description: text("description"), // Descrizione
  category: text("category"), // Categoria (es: "Display", "Battery")
  brand: text("brand"), // Marca prodotto (es: "OEM", "Original")
  modelBrand: text("model_brand"), // Marca dispositivo compatibile (es: "For Apple")
  modelCodes: text("model_codes"), // Codici modello compatibili (JSON array)
  suitableFor: text("suitable_for"), // Descrizione compatibilità
  quality: text("quality"), // Qualità (es: "Refurbished", "OEM-Equivalent")
  
  // Prezzo e disponibilità
  priceCents: integer("price_cents").notNull(), // Prezzo in centesimi
  currency: text("currency").default("EUR"), // Valuta
  inStock: boolean("in_stock").notNull().default(false), // Disponibilità
  stockQuantity: integer("stock_quantity"), // Quantità disponibile (se fornita)
  
  // Immagini
  imageUrl: text("image_url"), // URL immagine principale
  thumbnailUrl: text("thumbnail_url"), // URL miniatura
  
  // Metadati sincronizzazione
  rawData: text("raw_data"), // JSON completo risposta API (per debugging)
  lastSyncAt: timestamp("last_sync_at").notNull().defaultNow(), // Ultima sincronizzazione
  
  // Link a prodotto interno (se mappato)
  linkedProductId: varchar("linked_product_id").references(() => products.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supplier Sync Logs (Log sincronizzazioni catalogo)
export const supplierSyncLogs = pgTable("supplier_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id, { onDelete: "cascade" }),
  
  // Risultati sincronizzazione
  status: supplierSyncStatusEnum("status").notNull(),
  productsTotal: integer("products_total").default(0), // Totale prodotti ricevuti
  productsCreated: integer("products_created").default(0), // Nuovi prodotti
  productsUpdated: integer("products_updated").default(0), // Prodotti aggiornati
  productsFailed: integer("products_failed").default(0), // Prodotti con errori
  
  // Durata e dettagli
  durationMs: integer("duration_ms"), // Durata in millisecondi
  errorMessage: text("error_message"), // Messaggio errore (se fallita)
  errorDetails: text("error_details"), // Dettagli tecnici errore (JSON)
  
  // Audit
  triggeredBy: varchar("triggered_by"), // "system" o ID utente
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// EXTERNAL INTEGRATIONS (Admin-managed)
// ==========================================

// External API integrations that admin can enable/disable for resellers
export const externalIntegrations = pgTable("external_integrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Identification
  code: text("code").notNull().unique(), // es: "sifar", "foneday", "ifixit", "mobilax"
  name: text("name").notNull(), // Nome visualizzato
  description: text("description"), // Descrizione
  logoUrl: text("logo_url"), // URL logo integrazione
  
  // Status
  isActive: boolean("is_active").notNull().default(false), // Admin abilita/disabilita globalmente
  
  // Configuration template (JSON with required fields for reseller setup)
  configFields: text("config_fields"), // JSON: [{key, label, type, required, placeholder}]
  
  // API defaults (used if reseller doesn't override)
  defaultApiEndpoint: text("default_api_endpoint"), // URL base API
  defaultAuthMethod: text("default_auth_method"), // bearer_token, api_key_header, etc.
  
  // Features supported
  supportsCatalog: boolean("supports_catalog").default(false),
  supportsOrdering: boolean("supports_ordering").default(false),
  supportsCart: boolean("supports_cart").default(false),
  
  // Documentation
  docsUrl: text("docs_url"), // Link documentazione API
  
  // Metadata
  displayOrder: integer("display_order").default(0), // Ordine visualizzazione
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// SIFAR INTEGRATION TABLES
// ==========================================

// Ambiente SIFAR (test/produzione)
export const sifarEnvironmentEnum = pgEnum("sifar_environment", [
  "collaudo",            // https://collaudo.sifar.it/apiv2/
  "produzione",          // https://www.sifar.it/apiv2/
]);

// Stato carrello SIFAR
export const sifarCartStatusEnum = pgEnum("sifar_cart_status", [
  "active",              // Carrello attivo
  "submitted",           // Ordine inviato
  "expired",             // Carrello scaduto
]);

// Credenziali SIFAR per Reseller
export const sifarCredentials = pgTable("sifar_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Credenziali SIFAR
  clientKey: text("client_key").notNull(), // Token SIFAR (CLIENT_KEY)
  allowedIp: text("allowed_ip"), // IP fisso autorizzato
  partnerCode: text("partner_code"), // Codice partner (prefisso XX)
  
  // Ambiente
  environment: sifarEnvironmentEnum("environment").notNull().default("collaudo"),
  
  // Configurazione default
  defaultCourierId: text("default_courier_id"), // Corriere predefinito
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  lastTestAt: timestamp("last_test_at"), // Ultimo test connessione
  lastTestResult: text("last_test_result"), // Risultato ultimo test
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Punti Vendita SIFAR (mappatura filiali)
export const sifarStores = pgTable("sifar_stores", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => sifarCredentials.id, { onDelete: "cascade" }),
  
  // Dati SIFAR
  storeCode: text("store_code").notNull(), // Codice punto vendita SIFAR (es: XX001)
  storeName: text("store_name").notNull(), // Nome punto vendita
  
  // Mappatura interna (opzionale)
  branchId: varchar("branch_id").references(() => customerBranches.id, { onDelete: "set null" }),
  repairCenterId: varchar("repair_center_id").references(() => repairCenters.id, { onDelete: "set null" }),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Carrelli SIFAR attivi (per tracciamento)
export const sifarCarts = pgTable("sifar_carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => sifarCredentials.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").notNull().references(() => sifarStores.id, { onDelete: "cascade" }),
  
  // Stato carrello
  status: sifarCartStatusEnum("status").notNull().default("active"),
  itemsCount: integer("items_count").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  
  // Dati carrello SIFAR (cache)
  cartData: text("cart_data"), // JSON del carrello SIFAR
  
  // Tracking
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ordini SIFAR (storico)
export const sifarOrders = pgTable("sifar_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => sifarCredentials.id, { onDelete: "cascade" }),
  storeId: varchar("store_id").notNull().references(() => sifarStores.id, { onDelete: "cascade" }),
  
  // Dati ordine SIFAR
  sifarOrderId: text("sifar_order_id"), // ID ordine restituito da SIFAR
  sifarOrderNumber: text("sifar_order_number"), // Numero ordine SIFAR
  
  // Importi
  subtotalCents: integer("subtotal_cents").notNull(),
  shippingCents: integer("shipping_cents").default(0),
  taxCents: integer("tax_cents").default(0),
  totalCents: integer("total_cents").notNull(),
  
  // Spedizione
  courierId: text("courier_id"),
  courierName: text("courier_name"),
  trackingNumber: text("tracking_number"),
  
  // Stato
  status: text("status").notNull().default("pending"), // pending, confirmed, shipped, delivered
  
  // Dati completi ordine (JSON)
  orderData: text("order_data"),
  
  // Link a ordine fornitore interno (opzionale)
  supplierOrderId: varchar("supplier_order_id").references(() => supplierOrders.id, { onDelete: "set null" }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Catalogo SIFAR sincronizzato
export const sifarCatalog = pgTable("sifar_catalog", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // Identificatori SIFAR
  codiceArticolo: text("codice_articolo").notNull().unique(), // Codice articolo SIFAR
  ean: text("ean"), // Codice EAN
  
  // Dati prodotto
  descrizione: text("descrizione").notNull(),
  marca: text("marca"), // Brand (es: Samsung, Apple)
  modello: text("modello"), // Modello dispositivo
  categoria: text("categoria"), // Categoria ricambio
  gruppo: text("gruppo"), // Gruppo/sottocategoria
  
  // Prezzo
  prezzoNetto: integer("prezzo_netto"), // Prezzo in centesimi
  aliquotaIva: integer("aliquota_iva").default(22), // Aliquota IVA %
  
  // Disponibilità
  disponibile: boolean("disponibile").notNull().default(false),
  giacenza: integer("giacenza"), // Quantità disponibile
  contattaPerOrdinare: boolean("contatta_per_ordinare").default(false),
  
  // Immagine
  imageUrl: text("image_url"),
  
  // Qualità
  qualita: text("qualita"), // Original, Compatible, Refurbished
  mesiGaranzia: integer("mesi_garanzia").default(0),
  
  // Sincronizzazione
  lastSyncAt: timestamp("last_sync_at").notNull().defaultNow(),
  rawData: text("raw_data"), // JSON completo risposta API
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Modelli dispositivi SIFAR
export const sifarModels = pgTable("sifar_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  codiceModello: text("codice_modello").notNull().unique(), // Codice modello SIFAR
  descrizione: text("descrizione").notNull(), // Descrizione (es: "Samsung Galaxy A41")
  codiceMarca: text("codice_marca").notNull(), // Codice brand
  nomeMarca: text("nome_marca"), // Nome brand
  imageUrl: text("image_url"),
  
  lastSyncAt: timestamp("last_sync_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Compatibilità prodotto-modello SIFAR
export const sifarProductCompatibility = pgTable("sifar_product_compatibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  catalogId: varchar("catalog_id").notNull().references(() => sifarCatalog.id, { onDelete: "cascade" }),
  modelId: varchar("model_id").notNull().references(() => sifarModels.id, { onDelete: "cascade" }),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// TROVAUSATI INTEGRATION TABLES
// ==========================================

// Tipo API TrovaUsati (resellers o stores)
export const trovausatiApiTypeEnum = pgEnum("trovausati_api_type", [
  "resellers",   // API per rivenditori (marketplace)
  "stores",      // API per GDS (valutazioni, coupon, scatole)
]);

// Credenziali TrovaUsati per Reseller
export const trovausatiCredentials = pgTable("trovausati_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Tipo di API
  apiType: trovausatiApiTypeEnum("api_type").notNull().default("resellers"),
  
  // Credenziali TrovaUsati
  apiKey: text("api_key").notNull(), // X-Authorization header
  marketplaceId: text("marketplace_id"), // ID del marketplace (per API resellers)
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  lastTestAt: timestamp("last_test_at"),
  lastTestResult: text("last_test_result"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Negozi TrovaUsati (per API stores/GDS)
export const trovausatiShops = pgTable("trovausati_shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => trovausatiCredentials.id, { onDelete: "cascade" }),
  
  // Dati TrovaUsati
  shopId: text("shop_id").notNull(), // X-Shop-Id header
  shopName: text("shop_name").notNull(),
  
  // Mappatura interna
  branchId: varchar("branch_id").references(() => customerBranches.id, { onDelete: "set null" }),
  repairCenterId: varchar("repair_center_id").references(() => repairCenters.id, { onDelete: "set null" }),
  
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stato ordini TrovaUsati
export const trovausatiOrderStatusEnum = pgEnum("trovausati_order_status", [
  "pending",      // In attesa
  "confirmed",    // Confermato
  "shipped",      // Spedito
  "delivered",    // Consegnato
  "cancelled",    // Annullato
]);

// Ordini TrovaUsati (marketplace)
export const trovausatiOrders = pgTable("trovausati_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => trovausatiCredentials.id, { onDelete: "cascade" }),
  
  // Dati ordine TrovaUsati
  externalOrderId: text("external_order_id").notNull(), // ID ordine su TrovaUsati
  reference: text("reference"), // Riferimento testuale
  status: trovausatiOrderStatusEnum("status").notNull().default("pending"),
  
  // Totali
  totalProducts: integer("total_products").notNull().default(0),
  totalCents: integer("total_cents").notNull().default(0),
  
  // Spedizione
  carrierCode: text("carrier_code"),
  trackingCode: text("tracking_code"),
  shippingPdfUrl: text("shipping_pdf_url"),
  
  // Indirizzo
  addressData: text("address_data"), // JSON
  
  // Cache dati prodotti
  productsData: text("products_data"), // JSON array dei prodotti
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Stato coupon TrovaUsati
export const trovausatiCouponStatusEnum = pgEnum("trovausati_coupon_status", [
  "issued",     // Emesso
  "used",       // Usato
  "cancelled",  // Annullato
  "expired",    // Scaduto
]);

// Coupon TrovaUsati (GDS)
export const trovausatiCoupons = pgTable("trovausati_coupons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => trovausatiCredentials.id, { onDelete: "cascade" }),
  shopId: varchar("shop_id").references(() => trovausatiShops.id, { onDelete: "set null" }),
  
  // Dati coupon TrovaUsati
  couponCode: text("coupon_code").notNull(),
  barcode: text("barcode"),
  valueCents: integer("value_cents").notNull(),
  status: trovausatiCouponStatusEnum("status").notNull().default("issued"),
  
  // Dispositivo valutato
  brand: text("brand"),
  model: text("model"),
  imeiOrSn: text("imei_or_sn"),
  
  // Consumo
  consumedAt: timestamp("consumed_at"),
  consumedShopId: text("consumed_shop_id"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Modelli dispositivi TrovaUsati (cache valutazioni)
export const trovausatiModels = pgTable("trovausati_models", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => trovausatiCredentials.id, { onDelete: "cascade" }),
  
  // Dati modello TrovaUsati
  externalId: integer("external_id").notNull(),
  brand: text("brand").notNull(),
  model: text("model").notNull(),
  modelBase: text("model_base"),
  variant: text("variant"),
  deviceType: text("device_type"), // Smartphone, Tablet, etc.
  label: text("label"),
  imageUrl: text("image_url"),
  
  // Prezzi valutazione (in centesimi)
  priceNeverUsed: integer("price_never_used"),
  priceGreat: integer("price_great"),
  priceGood: integer("price_good"),
  priceAverage: integer("price_average"),
  priceShop: integer("price_shop"),
  pricePublic: integer("price_public"),
  
  lastSyncAt: timestamp("last_sync_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ FONEDAY INTEGRATION ============

// Credenziali Foneday per reseller
export const fonedayCredentials = pgTable("foneday_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Token API Foneday (Bearer token)
  apiToken: text("api_token").notNull(),
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  lastTestAt: timestamp("last_test_at"),
  testStatus: text("test_status"), // "success" | "error"
  testMessage: text("test_message"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ordini Foneday (tracciamento ordini inviati)
export const fonedayOrders = pgTable("foneday_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => fonedayCredentials.id, { onDelete: "cascade" }),
  
  // Dati ordine Foneday
  fonedayOrderNumber: text("foneday_order_number").notNull(),
  status: text("status").notNull(), // holding, shipped, etc.
  shipmentMethod: text("shipment_method"),
  trackingNumber: text("tracking_number"),
  
  // Importi
  totalInclVat: integer("total_incl_vat").notNull(), // In centesimi
  paid: boolean("paid").notNull().default(false),
  invoiceNumber: text("invoice_number"),
  
  // Quantità
  amountOfProducts: integer("amount_of_products").notNull().default(0),
  totalProducts: integer("total_products").notNull().default(0),
  
  // Dati ordine completo (JSON)
  orderData: text("order_data"),
  
  fonedayCreatedAt: timestamp("foneday_created_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ============ MOBILESENTRIX INTEGRATION ============

// Credenziali MobileSentrix per reseller (OAuth 1.0 style)
export const mobilesentrixCredentials = pgTable("mobilesentrix_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  resellerId: varchar("reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Consumer credentials (OAuth 1.0)
  consumerName: text("consumer_name").notNull(),
  consumerKey: text("consumer_key").notNull(),
  consumerSecret: text("consumer_secret").notNull(),
  
  // Environment: "production" (www.mobilesentrix.eu) | "staging" (preprod.mobilesentrix.eu)
  environment: text("environment").notNull().default("production"),
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  lastSyncAt: timestamp("last_sync_at"),
  lastTestAt: timestamp("last_test_at"),
  testStatus: text("test_status"), // "success" | "error"
  testMessage: text("test_message"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ordini MobileSentrix (tracciamento ordini inviati)
export const mobilesentrixOrders = pgTable("mobilesentrix_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  credentialId: varchar("credential_id").notNull().references(() => mobilesentrixCredentials.id, { onDelete: "cascade" }),
  
  // Dati ordine MobileSentrix
  mobilesentrixOrderId: text("mobilesentrix_order_id").notNull(),
  orderNumber: text("order_number"),
  status: text("status").notNull(), // pending, processing, shipped, completed, etc.
  
  // Importi
  totalAmount: integer("total_amount").notNull(), // In centesimi
  currency: text("currency").default("USD"),
  
  // Spedizione
  shippingMethod: text("shipping_method"),
  trackingNumber: text("tracking_number"),
  
  // Dati ordine completo (JSON)
  orderData: text("order_data"),
  
  mobilesentrixCreatedAt: timestamp("mobilesentrix_created_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supplier Orders (Ordini a Fornitori)
export const supplierOrders = pgTable("supplier_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // Numero ordine (es: "ORD-2024-0001")
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  
  // Proprietario ordine (chi effettua l'ordine)
  ownerType: supplierOrderOwnerTypeEnum("owner_type").default("repair_center"), // Tipo entità proprietaria
  ownerId: varchar("owner_id"), // ID dell'entità proprietaria (admin user ID, reseller ID, repair center ID)
  
  // Centro riparazione (opzionale, mantenuto per backward compatibility)
  repairCenterId: varchar("repair_center_id").references(() => repairCenters.id), // Centro associato (ora opzionale)
  
  // Magazzino destinazione per ricezione prodotti
  targetWarehouseId: varchar("target_warehouse_id").references(() => warehouses.id),
  
  // Stato e tracking
  status: supplierOrderStatusEnum("status").notNull().default("draft"),
  
  // Totali
  subtotal: integer("subtotal").notNull().default(0), // Subtotale in centesimi
  shippingCost: integer("shipping_cost").default(0), // Costo spedizione
  taxAmount: integer("tax_amount").default(0), // IVA
  totalAmount: integer("total_amount").notNull().default(0), // Totale
  
  // Date
  expectedDelivery: timestamp("expected_delivery"), // Data consegna prevista
  sentAt: timestamp("sent_at"), // Data invio ordine
  confirmedAt: timestamp("confirmed_at"), // Data conferma fornitore
  shippedAt: timestamp("shipped_at"), // Data spedizione
  receivedAt: timestamp("received_at"), // Data ricezione completa
  
  // Tracking spedizione
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  
  // Collegamento opzionale a repair order (se ordine per riparazione specifica)
  repairOrderId: varchar("repair_order_id").references(() => repairOrders.id),
  
  // Note
  notes: text("notes"), // Note per il fornitore
  internalNotes: text("internal_notes"), // Note interne
  
  // Audit
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supplier Order Items (Righe ordine fornitore)
export const supplierOrderItems = pgTable("supplier_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierOrderId: varchar("supplier_order_id").notNull().references(() => supplierOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id), // Collegamento prodotto (opzionale)
  
  // Dati articolo
  supplierCode: text("supplier_code"), // Codice fornitore
  description: text("description").notNull(), // Descrizione articolo
  quantity: integer("quantity").notNull().default(1), // Quantità ordinata
  unitPrice: integer("unit_price").notNull(), // Prezzo unitario in centesimi
  totalPrice: integer("total_price").notNull(), // Prezzo totale riga
  
  // Quantità ricevute (per ricezioni parziali)
  quantityReceived: integer("quantity_received").notNull().default(0),
  
  // Note
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Supplier Returns (Resi a Fornitori)
export const supplierReturns = pgTable("supplier_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnNumber: text("return_number").notNull().unique(), // Numero reso (es: "RES-2024-0001")
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id),
  supplierOrderId: varchar("supplier_order_id").references(() => supplierOrders.id), // Ordine originale (opzionale)
  
  // Stato
  status: supplierReturnStatusEnum("status").notNull().default("draft"),
  reason: returnReasonEnum("reason").notNull(),
  reasonDetails: text("reason_details"), // Dettagli motivo reso
  
  // Totali
  totalAmount: integer("total_amount").notNull().default(0), // Valore totale reso
  refundAmount: integer("refund_amount"), // Importo rimborsato/accreditato
  
  // Date
  requestedAt: timestamp("requested_at"), // Data richiesta reso
  approvedAt: timestamp("approved_at"), // Data approvazione
  shippedAt: timestamp("shipped_at"), // Data spedizione al fornitore
  receivedAt: timestamp("received_at"), // Data ricezione da fornitore
  refundedAt: timestamp("refunded_at"), // Data rimborso
  
  // Tracking spedizione
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  
  // RMA/Autorizzazione
  rmaNumber: text("rma_number"), // Numero RMA fornitore
  
  // Note
  notes: text("notes"),
  internalNotes: text("internal_notes"),
  
  // Audit
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Supplier Return Items (Righe reso)
export const supplierReturnItems = pgTable("supplier_return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierReturnId: varchar("supplier_return_id").notNull().references(() => supplierReturns.id, { onDelete: "cascade" }),
  productId: varchar("product_id").references(() => products.id),
  supplierOrderItemId: varchar("supplier_order_item_id").references(() => supplierOrderItems.id), // Riga ordine originale
  
  // Dati articolo
  supplierCode: text("supplier_code"),
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  
  // Note
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Communication Logs (Log comunicazioni con fornitori)
export const supplierCommunicationLogs = pgTable("supplier_communication_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  
  // Tipo e riferimento
  communicationType: communicationTypeEnum("communication_type").notNull(),
  channel: supplierCommunicationChannelEnum("channel").notNull(),
  
  // Riferimento entità (ordine o reso)
  entityType: text("entity_type"), // "supplier_order" | "supplier_return"
  entityId: varchar("entity_id"), // ID ordine o reso
  
  // Contenuto
  subject: text("subject"), // Oggetto (per email)
  content: text("content").notNull(), // Contenuto messaggio
  
  // Stato invio
  sentAt: timestamp("sent_at"),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
  failedAt: timestamp("failed_at"),
  failureReason: text("failure_reason"),
  
  // Risposta (se applicabile)
  responseContent: text("response_content"),
  responseReceivedAt: timestamp("response_received_at"),
  
  // Metadati
  metadata: text("metadata"), // JSON con dati extra (headers, message ID, etc.)
  
  // Audit
  createdBy: varchar("created_by"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// UTILITY MODULE TABLES
// ==========================================

// Utility Suppliers (Fornitori Utility - TIM, Vodafone, Enel, etc.)
export const utilitySuppliers = pgTable("utility_suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // Codice fornitore interno (es: "UTL-TIM")
  name: text("name").notNull(), // Nome fornitore (es: "TIM Business")
  
  // Ownership: NULL = fornitore globale (admin), UUID = fornitore del reseller
  resellerId: varchar("reseller_id").references(() => users.id),
  
  // Categoria principale servita
  category: utilityCategoryEnum("category").notNull(),
  
  // Contatti
  email: text("email"),
  phone: text("phone"),
  referentName: text("referent_name"), // Nome referente commerciale
  referentPhone: text("referent_phone"),
  referentEmail: text("referent_email"),
  
  // Portale/Accesso
  portalUrl: text("portal_url"), // URL portale partner
  portalUsername: text("portal_username"), // Username portale (non sensibile)
  
  // Condizioni commerciali
  defaultCommissionPercent: real("default_commission_percent"), // Commissione % default
  defaultCommissionFixed: integer("default_commission_fixed"), // Commissione fissa in centesimi
  paymentTermsDays: integer("payment_terms_days").default(30), // Giorni pagamento commissioni
  
  // Note
  notes: text("notes"),
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Utility Services (Prodotti/Servizi Utility - offerte specifiche)
export const utilityServices = pgTable("utility_services", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull().references(() => utilitySuppliers.id, { onDelete: "cascade" }),
  
  code: text("code").notNull(), // Codice offerta (es: "TIM-MOBILE-PRO")
  name: text("name").notNull(), // Nome offerta
  description: text("description"),
  category: utilityCategoryEnum("category").notNull(),
  
  // Pricing
  monthlyPriceCents: integer("monthly_price_cents"), // Canone mensile in centesimi
  activationFeeCents: integer("activation_fee_cents"), // Costo attivazione in centesimi
  
  // Commissioni per questo servizio (override fornitore)
  commissionPercent: real("commission_percent"), // Commissione % (null = usa default fornitore)
  commissionFixed: integer("commission_fixed"), // Commissione fissa in centesimi
  commissionOneTime: integer("commission_one_time"), // Commissione una tantum attivazione
  
  // Durata contratto
  contractMonths: integer("contract_months").default(24), // Durata contratto in mesi
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Utility Practices (Pratiche - contratti con clienti)
export const utilityPractices = pgTable("utility_practices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceNumber: text("practice_number").notNull().unique(), // Numero pratica (es: "UTL-2024-0001")
  
  // Tipo item: servizio, prodotto, o entrambi
  itemType: text("item_type").notNull().default("service"), // "service", "product", "service_with_products"
  
  // Servizio utility (presente se itemType = "service" o "service_with_products")
  serviceId: varchar("service_id").references(() => utilityServices.id),
  customServiceName: text("custom_service_name"), // Nome servizio temporaneo/custom (alternativo a serviceId)
  
  // Prodotto legacy (per retrocompatibilità, usare utility_practice_products per multi-prodotti)
  productId: varchar("product_id").references(() => products.id),
  
  // Fornitore
  supplierId: varchar("supplier_id").references(() => utilitySuppliers.id),
  temporarySupplierName: text("temporary_supplier_name"), // Nome fornitore temporaneo (alternativo a supplierId)
  
  // Cliente
  customerId: varchar("customer_id").references(() => users.id), // Reso opzionale per permettere cliente temporaneo
  temporaryCustomerName: text("temporary_customer_name"), // Nome cliente temporaneo
  temporaryCustomerEmail: text("temporary_customer_email"), // Email cliente temporaneo
  temporaryCustomerPhone: text("temporary_customer_phone"), // Telefono cliente temporaneo
  resellerId: varchar("reseller_id").references(() => users.id), // Reseller che ha gestito la pratica
  
  // Stato pratica
  status: utilityPracticeStatusEnum("status").notNull().default("bozza"),
  priority: utilityPracticePriorityEnum("priority").notNull().default("normale"),
  
  // Assegnazione
  assignedTo: varchar("assigned_to").references(() => users.id), // Operatore assegnato
  
  // Riferimento fornitore
  supplierReference: text("supplier_reference"), // Codice pratica del fornitore
  externalIdentifiers: jsonb("external_identifiers").$type<Record<string, string>>(), // Altri codici esterni
  
  // Canale comunicazione preferito
  communicationChannel: text("communication_channel"), // email, telefono, whatsapp
  
  // Date
  submittedAt: timestamp("submitted_at"), // Data invio al fornitore
  activatedAt: timestamp("activated_at"), // Data attivazione servizio
  expiresAt: timestamp("expires_at"), // Data scadenza contratto
  expectedActivationDate: timestamp("expected_activation_date"), // Data attivazione prevista
  goLiveDate: timestamp("go_live_date"), // Data effettiva go-live
  contractEndDate: timestamp("contract_end_date"), // Data fine contratto
  slaDueAt: timestamp("sla_due_at"), // Scadenza SLA
  
  // Importi effettivi (possono differire dal servizio base)
  priceType: text("price_type").notNull().default("mensile"), // "mensile" o "forfait"
  monthlyPriceCents: integer("monthly_price_cents"), // Prezzo mensile in centesimi
  flatPriceCents: integer("flat_price_cents"), // Prezzo forfait in centesimi
  activationFeeCents: integer("activation_fee_cents"),
  
  // Commissione calcolata per questa pratica
  commissionAmountCents: integer("commission_amount_cents"), // Importo commissione totale
  
  // Note
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Utility Practice Products (Prodotti associati alla pratica - relazione many-to-many)
export const utilityPracticeProducts = pgTable("utility_practice_products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id),
  
  // Quantità e prezzo
  quantity: integer("quantity").notNull().default(1),
  unitPriceCents: integer("unit_price_cents").notNull(), // Prezzo unitario in centesimi
  
  // Note specifiche per questo prodotto nella pratica
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Utility Commissions (Compensi - tracking pagamenti commissioni)
export const utilityCommissions = pgTable("utility_commissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  
  // Periodo
  periodMonth: integer("period_month").notNull(), // Mese (1-12)
  periodYear: integer("period_year").notNull(), // Anno
  
  // Importo
  amountCents: integer("amount_cents").notNull(), // Importo commissione in centesimi
  
  // Stato
  status: utilityCommissionStatusEnum("status").notNull().default("pending"),
  
  // Date
  accruedAt: timestamp("accrued_at"), // Data maturazione
  invoicedAt: timestamp("invoiced_at"), // Data fatturazione
  paidAt: timestamp("paid_at"), // Data pagamento
  
  // Riferimenti fattura
  invoiceNumber: text("invoice_number"), // Numero fattura emessa
  
  // Note
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Utility Practice Documents (Documenti allegati alla pratica)
export const utilityPracticeDocuments = pgTable("utility_practice_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  
  // File info
  objectKey: text("object_key").notNull(), // Key in object storage
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // in bytes
  mimeType: text("mime_type"),
  
  // Categorizzazione
  category: utilityDocumentCategoryEnum("category").notNull().default("altro"),
  description: text("description"),
  
  // Tracking
  uploadedBy: varchar("uploaded_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Utility Practice Tasks (Checklist attività)
export const utilityPracticeTasks = pgTable("utility_practice_tasks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  
  // Task info
  title: text("title").notNull(),
  description: text("description"),
  status: utilityPracticeTaskStatusEnum("status").notNull().default("da_fare"),
  
  // Assegnazione e scadenza
  assignedTo: varchar("assigned_to").references(() => users.id),
  dueDate: timestamp("due_date"),
  
  // Ordinamento
  sortOrder: integer("sort_order").notNull().default(0),
  
  // Tracking
  createdBy: varchar("created_by").notNull().references(() => users.id),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Utility Practice Notes (Note e comunicazioni)
export const utilityPracticeNotes = pgTable("utility_practice_notes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  
  // Contenuto
  body: text("body").notNull(),
  visibility: utilityNoteVisibilityEnum("visibility").notNull().default("internal"),
  
  // Tracking
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Utility Practice Timeline (Cronologia eventi)
export const utilityPracticeTimeline = pgTable("utility_practice_timeline", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  
  // Evento
  eventType: utilityPracticeEventTypeEnum("event_type").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  payload: jsonb("payload").$type<Record<string, unknown>>(), // Dati aggiuntivi evento
  
  // Tracking
  createdBy: varchar("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Utility Practice State History (Storico cambi stato)
export const utilityPracticeStateHistory = pgTable("utility_practice_state_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  practiceId: varchar("practice_id").notNull().references(() => utilityPractices.id, { onDelete: "cascade" }),
  
  // Transizione
  fromStatus: utilityPracticeStatusEnum("from_status"),
  toStatus: utilityPracticeStatusEnum("to_status").notNull(),
  reason: text("reason"), // Motivo del cambio
  
  // Tracking
  changedBy: varchar("changed_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// SERVICE CATALOG (CATALOGO INTERVENTI)
// ==========================================

// Service Items (Interventi - gestiti da Admin o Reseller)
export const serviceItems = pgTable("service_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // Codice intervento (es. "DISP-001")
  name: text("name").notNull(), // Nome intervento (es. "Sostituzione Display")
  description: text("description"), // Descrizione dettagliata
  category: text("category").notNull(), // Categoria (display, batteria, software, ecc.)
  
  // Compatibilità dispositivi (opzionale)
  deviceTypeId: varchar("device_type_id").references(() => deviceTypes.id), // Tipo dispositivo compatibile
  
  // Prezzi e tempi default
  defaultPriceCents: integer("default_price_cents").notNull(), // Prezzo base in centesimi
  defaultLaborMinutes: integer("default_labor_minutes").notNull().default(60), // Tempo manodopera stimato in minuti
  
  // Creatore (null = admin/globale, altrimenti = rivenditore specifico)
  createdBy: varchar("created_by").references(() => users.id, { onDelete: "cascade" }),
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Service Item Prices (Prezzi personalizzati per rivenditori/centri)
export const serviceItemPrices = pgTable("service_item_prices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serviceItemId: varchar("service_item_id").notNull().references(() => serviceItems.id, { onDelete: "cascade" }),
  
  // Owner (uno dei due deve essere valorizzato, se entrambi null = prezzo base)
  resellerId: varchar("reseller_id").references(() => users.id, { onDelete: "cascade" }), // Rivenditore
  repairCenterId: varchar("repair_center_id").references(() => repairCenters.id, { onDelete: "cascade" }), // Centro riparazione
  
  // Prezzi personalizzati
  priceCents: integer("price_cents").notNull(), // Prezzo personalizzato in centesimi
  laborMinutes: integer("labor_minutes"), // Tempo personalizzato (opzionale, se null usa default)
  
  // Stato
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Support Tickets
export const tickets = pgTable("tickets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketNumber: text("ticket_number").notNull().unique(),
  customerId: varchar("customer_id").notNull(),
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  assignedTo: varchar("assigned_to"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Ticket Messages (conversation thread)
export const ticketMessages = pgTable("ticket_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: varchar("ticket_id").notNull(),
  userId: varchar("user_id").notNull(),
  message: text("message").notNull(),
  isInternal: boolean("is_internal").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Invoices (Fatture)
export const invoices = pgTable("invoices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  invoiceNumber: text("invoice_number").notNull().unique(),
  repairOrderId: varchar("repair_order_id"),
  customerId: varchar("customer_id").notNull(),
  amount: integer("amount").notNull(), // in cents
  tax: integer("tax").notNull().default(0), // in cents
  total: integer("total").notNull(), // in cents
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("pending"),
  paymentMethod: text("payment_method").default("bank_transfer"),
  dueDate: timestamp("due_date"),
  paidDate: timestamp("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Billing Data
export const billingData = pgTable("billing_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  customerType: customerTypeEnum("customer_type").notNull().default("private"),
  companyName: text("company_name"),
  vatNumber: text("vat_number"),
  fiscalCode: text("fiscal_code"),
  pec: text("pec"),
  codiceUnivoco: text("codice_univoco"),
  iban: text("iban"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  zipCode: text("zip_code").notNull(),
  country: text("country").notNull().default("IT"),
  googlePlaceId: text("google_place_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Customer Branches (Filiali/Punti Vendita per clienti FRANCHISING/GDO)
export const customerBranches = pgTable("customer_branches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parentCustomerId: varchar("parent_customer_id").notNull(), // FK al cliente principale (FRANCHISING/GDO)
  branchCode: text("branch_code").notNull(), // Codice identificativo (es. "PV001", "FR-MILANO-01")
  branchName: text("branch_name").notNull(), // Nome della filiale/punto vendita
  address: text("address"),
  city: text("city"),
  province: text("province"),
  postalCode: text("postal_code"),
  contactName: text("contact_name"), // Referente locale
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  notes: text("notes"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Live Chat Messages
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: varchar("sender_id").notNull(),
  receiverId: varchar("receiver_id").notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Activity Logs (Audit Trail)
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  action: text("action").notNull(), // e.g., "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT"
  entityType: text("entity_type"), // e.g., "user", "repair_order", "ticket", "product"
  entityId: varchar("entity_id"),
  changes: text("changes"), // JSON string with before/after data
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Analytics Cache (for performance optimization)
export const analyticsCache = pgTable("analytics_cache", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  data: text("data").notNull(), // JSON string with aggregated analytics data
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notifications (Real-time alerts for users)
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: notificationTypeEnum("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: text("data"), // JSON string with additional notification data
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Notification Preferences (User settings for notifications)
export const notificationPreferences = pgTable("notification_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  emailEnabled: boolean("email_enabled").notNull().default(true),
  pushEnabled: boolean("push_enabled").notNull().default(true),
  types: text("types").array().notNull().default(sql`ARRAY['repair_update', 'sla_warning', 'review_request', 'message', 'system']::text[]`),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// SALES / E-COMMERCE TABLES
// ==========================================

// Customer Addresses - Indirizzi di spedizione/fatturazione clienti
export const customerAddresses = pgTable("customer_addresses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").notNull(),
  resellerId: varchar("reseller_id").notNull(),
  label: text("label"), // es. "Casa", "Ufficio"
  recipientName: text("recipient_name").notNull(),
  phone: text("phone"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  province: text("province").notNull(),
  postalCode: text("postal_code").notNull(),
  country: text("country").notNull().default("IT"),
  isDefault: boolean("is_default").notNull().default(false),
  isBilling: boolean("is_billing").notNull().default(false), // Indirizzo fatturazione
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Shopping Carts - Carrelli attivi
export const carts = pgTable("carts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id"), // Null per carrelli anonimi/guest
  resellerId: varchar("reseller_id").notNull(), // Shop del reseller
  sessionId: varchar("session_id"), // Per carrelli guest
  status: text("status").notNull().default("active"), // active, abandoned, converted
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  shippingCost: real("shipping_cost").notNull().default(0),
  total: real("total").notNull().default(0),
  couponCode: text("coupon_code"),
  notes: text("notes"),
  expiresAt: timestamp("expires_at"), // Scadenza carrello
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Cart Items - Articoli nel carrello
export const cartItems = pgTable("cart_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  cartId: varchar("cart_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  discount: real("discount").notNull().default(0),
  productSnapshot: text("product_snapshot"), // JSON con dati prodotto al momento dell'aggiunta
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales Orders - Ordini di vendita
export const salesOrders = pgTable("sales_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // es. ORD-2024-00001
  customerId: varchar("customer_id").notNull(),
  resellerId: varchar("reseller_id").notNull(),
  branchId: varchar("branch_id"), // Filiale cliente se corporate
  status: salesOrderStatusEnum("status").notNull().default("pending"),
  deliveryType: deliveryTypeEnum("delivery_type").notNull().default("shipping"),
  // Totali
  subtotal: real("subtotal").notNull(),
  discountAmount: real("discount_amount").notNull().default(0),
  discountCode: text("discount_code"),
  shippingCost: real("shipping_cost").notNull().default(0),
  taxAmount: real("tax_amount").notNull().default(0),
  total: real("total").notNull(),
  // Indirizzo spedizione (copia al momento ordine)
  shippingAddressId: varchar("shipping_address_id"),
  shippingRecipient: text("shipping_recipient"),
  shippingAddress: text("shipping_address"),
  shippingCity: text("shipping_city"),
  shippingProvince: text("shipping_province"),
  shippingPostalCode: text("shipping_postal_code"),
  shippingCountry: text("shipping_country").default("IT"),
  shippingPhone: text("shipping_phone"),
  // Indirizzo fatturazione
  billingAddressId: varchar("billing_address_id"),
  billingRecipient: text("billing_recipient"),
  billingAddress: text("billing_address"),
  billingCity: text("billing_city"),
  billingProvince: text("billing_province"),
  billingPostalCode: text("billing_postal_code"),
  billingCountry: text("billing_country").default("IT"),
  // Note
  customerNotes: text("customer_notes"), // Note del cliente
  internalNotes: text("internal_notes"), // Note interne
  // Tracking
  estimatedDelivery: timestamp("estimated_delivery"),
  confirmedAt: timestamp("confirmed_at"),
  shippedAt: timestamp("shipped_at"),
  deliveredAt: timestamp("delivered_at"),
  cancelledAt: timestamp("cancelled_at"),
  cancellationReason: text("cancellation_reason"),
  // Meta
  source: text("source").default("web"), // web, pos, phone
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales Order Items - Righe ordine di vendita
export const salesOrderItems = pgTable("sales_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(), // Snapshot nome
  productSku: text("product_sku"), // Snapshot SKU
  productImage: text("product_image"), // Snapshot immagine
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  discount: real("discount").notNull().default(0),
  totalPrice: real("total_price").notNull(),
  // Tracking inventario
  inventoryReserved: boolean("inventory_reserved").notNull().default(false),
  inventoryDeducted: boolean("inventory_deducted").notNull().default(false),
  // Meta
  productSnapshot: text("product_snapshot"), // JSON completo prodotto
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Order type enum for payments
export const paymentOrderTypeEnum = pgEnum("payment_order_type", ["b2c", "b2b"]);

// Sales Order Payments - Pagamenti ordine (B2C e B2B)
export const salesOrderPayments = pgTable("sales_order_payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(), // Per B2C: sales_orders.id, per B2B: reseller_purchase_orders.id
  orderType: paymentOrderTypeEnum("order_type").notNull().default("b2c"), // Tipo ordine
  orderNumber: text("order_number"), // Numero ordine per riferimento
  method: paymentMethodEnum("method").notNull(),
  status: salesPaymentStatusEnum("status").notNull().default("pending"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("EUR"),
  // Gateway info
  transactionId: text("transaction_id"), // ID transazione gateway
  gatewayReference: text("gateway_reference"), // Riferimento gateway / riferimento bonifico
  gatewayResponse: text("gateway_response"), // JSON risposta gateway
  // Dettagli
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  refundedAt: timestamp("refunded_at"),
  refundAmount: real("refund_amount"),
  refundReason: text("refund_reason"),
  notes: text("notes"),
  // Chi ha confermato
  confirmedBy: varchar("confirmed_by"), // ID utente che ha confermato
  // Reseller info (per B2B)
  resellerId: varchar("reseller_id"), // ID reseller per ordini B2B
  resellerName: text("reseller_name"), // Nome reseller
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales Order Shipments - Spedizioni ordine
export const salesOrderShipments = pgTable("sales_order_shipments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  status: shipmentStatusEnum("status").notNull().default("pending"),
  carrier: carrierEnum("carrier"),
  carrierName: text("carrier_name"), // Nome corriere se "other"
  trackingNumber: text("tracking_number"),
  trackingUrl: text("tracking_url"),
  // Dimensioni pacco
  weight: real("weight"), // kg
  length: real("length"), // cm
  width: real("width"),   // cm
  height: real("height"), // cm
  // Costi
  shippingCost: real("shipping_cost"),
  insuranceValue: real("insurance_value"),
  // Date
  preparedAt: timestamp("prepared_at"),
  pickedUpAt: timestamp("picked_up_at"),
  deliveredAt: timestamp("delivered_at"),
  estimatedDelivery: timestamp("estimated_delivery"),
  // Dettagli consegna
  deliverySignature: text("delivery_signature"),
  deliveryPhoto: text("delivery_photo"),
  deliveryNotes: text("delivery_notes"),
  // Meta
  labelUrl: text("label_url"), // URL etichetta
  manifestId: text("manifest_id"), // ID manifesto corriere
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Shipment Tracking Events - Eventi tracking spedizione
export const shipmentTrackingEvents = pgTable("shipment_tracking_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shipmentId: varchar("shipment_id").notNull(),
  status: text("status").notNull(), // Stato del corriere
  statusCode: text("status_code"), // Codice stato corriere
  description: text("description"),
  location: text("location"),
  eventAt: timestamp("event_at").notNull(),
  rawData: text("raw_data"), // JSON dati grezzi corriere
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Stock Reservations - Prenotazioni stock per ordini
export const stockReservations = pgTable("stock_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  orderItemId: varchar("order_item_id").notNull(),
  productId: varchar("product_id").notNull(),
  resellerId: varchar("reseller_id").notNull(),
  repairCenterId: varchar("repair_center_id"),
  quantity: integer("quantity").notNull(),
  status: text("status").notNull().default("reserved"), // reserved, committed, released
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"), // Scadenza prenotazione
  committedAt: timestamp("committed_at"), // Quando stock effettivamente detratto
  releasedAt: timestamp("released_at"), // Quando liberato (annullamento)
});

// Sales Order State History - Storico stati ordine
export const salesOrderStateHistory = pgTable("sales_order_state_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedBy: varchar("changed_by"),
  reason: text("reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Sales Order Returns - Resi ordini vendita
export const salesOrderReturns = pgTable("sales_order_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnNumber: text("return_number").notNull().unique(), // es: "RES-SALE-2024-0001"
  orderId: varchar("order_id").notNull(),
  resellerId: varchar("reseller_id"),
  customerId: varchar("customer_id"),
  status: salesReturnStatusEnum("status").notNull().default("requested"),
  reason: salesReturnReasonEnum("reason").notNull(),
  reasonDetails: text("reason_details"),
  // Importi
  totalAmount: real("total_amount").notNull().default(0), // Valore totale articoli resi
  refundAmount: real("refund_amount"), // Importo effettivamente rimborsato
  refundMethod: refundMethodEnum("refund_method"),
  // Spedizione reso
  trackingNumber: text("tracking_number"),
  carrier: carrierEnum("carrier"),
  shippingCost: real("shipping_cost"), // Costo spedizione reso (a carico cliente o negozio)
  customerPaysShipping: boolean("customer_pays_shipping").default(false),
  // Date
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  inspectedAt: timestamp("inspected_at"),
  refundedAt: timestamp("refunded_at"),
  // Note
  customerNotes: text("customer_notes"), // Note del cliente
  internalNotes: text("internal_notes"), // Note interne
  rejectionReason: text("rejection_reason"), // Motivo rifiuto
  inspectionNotes: text("inspection_notes"), // Note ispezione
  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Sales Order Return Items - Articoli reso
export const salesOrderReturnItems = pgTable("sales_order_return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnId: varchar("return_id").notNull(),
  orderItemId: varchar("order_item_id"), // Riferimento all'articolo originale
  productId: varchar("product_id"),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(), // Prezzo unitario originale
  refundAmount: real("refund_amount"), // Importo rimborsato per questo articolo
  reason: text("reason"), // Motivo specifico per questo articolo
  condition: returnItemConditionEnum("condition"), // Condizione articolo ricevuto
  conditionNotes: text("condition_notes"),
  // Restock
  restocked: boolean("restocked").default(false), // Rimesso in inventario
  restockedAt: timestamp("restocked_at"),
  restockedQuantity: integer("restocked_quantity"),
  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ==========================================
// B2B RETURNS - Resi Ordini B2B (Reseller → Admin)
// ==========================================

// Stato reso B2B
export const b2bReturnStatusEnum = pgEnum("b2b_return_status", [
  "requested",         // Richiesto dal reseller
  "approved",          // Approvato dall'admin
  "rejected",          // Rifiutato
  "awaiting_shipment", // In attesa spedizione reso
  "shipped",           // Spedito dal reseller
  "received",          // Ricevuto dall'admin
  "inspecting",        // In ispezione
  "completed",         // Completato (stock ripristinato)
  "cancelled",         // Annullato
]);

// Motivo reso B2B
export const b2bReturnReasonEnum = pgEnum("b2b_return_reason", [
  "defective",         // Difettoso
  "wrong_item",        // Articolo errato
  "not_as_described",  // Non conforme alla descrizione
  "damaged_in_transit",// Danneggiato in transito
  "excess_stock",      // Eccesso di stock
  "quality_issue",     // Problema qualità
  "other",             // Altro
]);

// B2B Returns - Resi ordini B2B
export const b2bReturns = pgTable("b2b_returns", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnNumber: text("return_number").notNull().unique(), // es: "RES-B2B-2024-0001"
  orderId: varchar("order_id").notNull(), // Riferimento a reseller_purchase_orders
  resellerId: varchar("reseller_id").notNull(),
  status: b2bReturnStatusEnum("status").notNull().default("requested"),
  reason: b2bReturnReasonEnum("reason").notNull(),
  reasonDetails: text("reason_details"),
  // Importi
  totalAmount: real("total_amount").notNull().default(0), // Valore totale articoli resi
  creditAmount: real("credit_amount"), // Importo accreditato
  // Spedizione reso
  trackingNumber: text("tracking_number"),
  carrier: text("carrier"),
  // Date
  requestedAt: timestamp("requested_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
  rejectedAt: timestamp("rejected_at"),
  shippedAt: timestamp("shipped_at"),
  receivedAt: timestamp("received_at"),
  completedAt: timestamp("completed_at"),
  // Note
  resellerNotes: text("reseller_notes"),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  inspectionNotes: text("inspection_notes"),
  // Documenti spedizione (generati all'approvazione)
  shippingLabelPath: text("shipping_label_path"),
  ddtPath: text("ddt_path"),
  documentsGeneratedAt: timestamp("documents_generated_at"),
  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// B2B Return Items - Articoli reso B2B
export const b2bReturnItems = pgTable("b2b_return_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  returnId: varchar("return_id").notNull(),
  orderItemId: varchar("order_item_id"), // Riferimento all'articolo originale
  productId: varchar("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
  reason: text("reason"),
  condition: returnItemConditionEnum("condition"),
  conditionNotes: text("condition_notes"),
  // Restock
  restocked: boolean("restocked").default(false),
  restockedAt: timestamp("restocked_at"),
  restockedQuantity: integer("restocked_quantity"),
  // Meta
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Zod schemas per B2B Returns
export const insertB2bReturnSchema = createInsertSchema(b2bReturns).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertB2bReturn = z.infer<typeof insertB2bReturnSchema>;
export type B2bReturn = typeof b2bReturns.$inferSelect;

export const insertB2bReturnItemSchema = createInsertSchema(b2bReturnItems).omit({ id: true, createdAt: true });
export type InsertB2bReturnItem = z.infer<typeof insertB2bReturnItemSchema>;
export type B2bReturnItem = typeof b2bReturnItems.$inferSelect;

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  repairCenter: one(repairCenters, {
    fields: [users.repairCenterId],
    references: [repairCenters.id],
  }),
  repairOrders: many(repairOrders),
  tickets: many(tickets),
  billingData: one(billingData),
  sentMessages: many(chatMessages, { relationName: "sentMessages" }),
  receivedMessages: many(chatMessages, { relationName: "receivedMessages" }),
  activityLogs: many(activityLogs),
  notifications: many(notifications),
  notificationPreferences: one(notificationPreferences),
}));

export const repairCentersRelations = relations(repairCenters, ({ many }) => ({
  staff: many(users),
  repairOrders: many(repairOrders),
  inventoryStock: many(inventoryStock),
  inventoryMovements: many(inventoryMovements),
}));

export const productsRelations = relations(products, ({ many }) => ({
  inventoryStock: many(inventoryStock),
  inventoryMovements: many(inventoryMovements),
}));

export const repairOrdersRelations = relations(repairOrders, ({ one, many }) => ({
  customer: one(users, {
    fields: [repairOrders.customerId],
    references: [users.id],
  }),
  branch: one(customerBranches, {
    fields: [repairOrders.branchId],
    references: [customerBranches.id],
  }),
  reseller: one(users, {
    fields: [repairOrders.resellerId],
    references: [users.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [repairOrders.repairCenterId],
    references: [repairCenters.id],
  }),
  invoices: many(invoices),
  attachments: many(repairAttachments),
  acceptance: one(repairAcceptance, {
    fields: [repairOrders.id],
    references: [repairAcceptance.repairOrderId],
  }),
  diagnostics: one(repairDiagnostics, {
    fields: [repairOrders.id],
    references: [repairDiagnostics.repairOrderId],
  }),
  quote: one(repairQuotes, {
    fields: [repairOrders.id],
    references: [repairQuotes.repairOrderId],
  }),
  partsOrders: many(partsOrders),
  logs: many(repairLogs),
  testChecklist: one(repairTestChecklist, {
    fields: [repairOrders.id],
    references: [repairTestChecklist.repairOrderId],
  }),
  delivery: one(repairDelivery, {
    fields: [repairOrders.id],
    references: [repairDelivery.repairOrderId],
  }),
  stateHistory: many(repairOrderStateHistory),
}));

export const repairOrderStateHistoryRelations = relations(repairOrderStateHistory, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairOrderStateHistory.repairOrderId],
    references: [repairOrders.id],
  }),
  changedByUser: one(users, {
    fields: [repairOrderStateHistory.changedBy],
    references: [users.id],
  }),
}));

export const supplierReturnStateHistoryRelations = relations(supplierReturnStateHistory, ({ one }) => ({
  supplierReturn: one(supplierReturns, {
    fields: [supplierReturnStateHistory.supplierReturnId],
    references: [supplierReturns.id],
  }),
  changedByUser: one(users, {
    fields: [supplierReturnStateHistory.changedBy],
    references: [users.id],
  }),
}));

export const repairAttachmentsRelations = relations(repairAttachments, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairAttachments.repairOrderId],
    references: [repairOrders.id],
  }),
  uploadedByUser: one(users, {
    fields: [repairAttachments.uploadedBy],
    references: [users.id],
  }),
}));

export const repairAcceptanceRelations = relations(repairAcceptance, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairAcceptance.repairOrderId],
    references: [repairOrders.id],
  }),
}));

export const repairDiagnosticsRelations = relations(repairDiagnostics, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairDiagnostics.repairOrderId],
    references: [repairOrders.id],
  }),
  diagnosedByUser: one(users, {
    fields: [repairDiagnostics.diagnosedBy],
    references: [users.id],
  }),
  unrepairableReason: one(unrepairableReasons, {
    fields: [repairDiagnostics.unrepairableReasonId],
    references: [unrepairableReasons.id],
  }),
}));

// Promotions Relations
export const promotionsRelations = relations(promotions, ({ }) => ({
  // No direct relations - used via suggestedPromotionIds array in diagnostics
}));

// Unrepairable Reasons Relations
export const unrepairableReasonsRelations = relations(unrepairableReasons, ({ one, many }) => ({
  deviceType: one(deviceTypes, {
    fields: [unrepairableReasons.deviceTypeId],
    references: [deviceTypes.id],
  }),
  diagnostics: many(repairDiagnostics),
}));

export const repairQuotesRelations = relations(repairQuotes, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairQuotes.repairOrderId],
    references: [repairOrders.id],
  }),
  createdByUser: one(users, {
    fields: [repairQuotes.createdBy],
    references: [users.id],
  }),
}));

export const partsOrdersRelations = relations(partsOrders, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [partsOrders.repairOrderId],
    references: [repairOrders.id],
  }),
  orderedByUser: one(users, {
    fields: [partsOrders.orderedBy],
    references: [users.id],
  }),
}));

export const repairLogsRelations = relations(repairLogs, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairLogs.repairOrderId],
    references: [repairOrders.id],
  }),
  technician: one(users, {
    fields: [repairLogs.technicianId],
    references: [users.id],
  }),
}));

export const repairTestChecklistRelations = relations(repairTestChecklist, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairTestChecklist.repairOrderId],
    references: [repairOrders.id],
  }),
  testedByUser: one(users, {
    fields: [repairTestChecklist.testedBy],
    references: [users.id],
  }),
}));

export const repairDeliveryRelations = relations(repairDelivery, ({ one }) => ({
  repairOrder: one(repairOrders, {
    fields: [repairDelivery.repairOrderId],
    references: [repairOrders.id],
  }),
  deliveredByUser: one(users, {
    fields: [repairDelivery.deliveredBy],
    references: [users.id],
  }),
}));

export const deviceTypesRelations = relations(deviceTypes, ({ many }) => ({
  models: many(deviceModels),
}));

export const deviceBrandsRelations = relations(deviceBrands, ({ many }) => ({
  models: many(deviceModels),
}));

export const deviceModelsRelations = relations(deviceModels, ({ one }) => ({
  brand: one(deviceBrands, {
    fields: [deviceModels.brandId],
    references: [deviceBrands.id],
  }),
  type: one(deviceTypes, {
    fields: [deviceModels.typeId],
    references: [deviceTypes.id],
  }),
}));

// Reseller Device Brands Relations
export const resellerDeviceBrandsRelations = relations(resellerDeviceBrands, ({ one, many }) => ({
  reseller: one(users, {
    fields: [resellerDeviceBrands.resellerId],
    references: [users.id],
  }),
  models: many(resellerDeviceModels),
}));

// Reseller Device Models Relations
export const resellerDeviceModelsRelations = relations(resellerDeviceModels, ({ one }) => ({
  reseller: one(users, {
    fields: [resellerDeviceModels.resellerId],
    references: [users.id],
  }),
  globalBrand: one(deviceBrands, {
    fields: [resellerDeviceModels.brandId],
    references: [deviceBrands.id],
  }),
  resellerBrand: one(resellerDeviceBrands, {
    fields: [resellerDeviceModels.resellerBrandId],
    references: [resellerDeviceBrands.id],
  }),
  type: one(deviceTypes, {
    fields: [resellerDeviceModels.typeId],
    references: [deviceTypes.id],
  }),
}));

// Service Catalog Relations
export const serviceItemsRelations = relations(serviceItems, ({ one, many }) => ({
  deviceType: one(deviceTypes, {
    fields: [serviceItems.deviceTypeId],
    references: [deviceTypes.id],
  }),
  customPrices: many(serviceItemPrices),
}));

export const serviceItemPricesRelations = relations(serviceItemPrices, ({ one }) => ({
  serviceItem: one(serviceItems, {
    fields: [serviceItemPrices.serviceItemId],
    references: [serviceItems.id],
  }),
  reseller: one(users, {
    fields: [serviceItemPrices.resellerId],
    references: [users.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [serviceItemPrices.repairCenterId],
    references: [repairCenters.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one, many }) => ({
  customer: one(users, {
    fields: [tickets.customerId],
    references: [users.id],
  }),
  assignedUser: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
  messages: many(ticketMessages),
}));

export const ticketMessagesRelations = relations(ticketMessages, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketMessages.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketMessages.userId],
    references: [users.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  customer: one(users, {
    fields: [invoices.customerId],
    references: [users.id],
  }),
  repairOrder: one(repairOrders, {
    fields: [invoices.repairOrderId],
    references: [repairOrders.id],
  }),
}));

export const billingDataRelations = relations(billingData, ({ one, many }) => ({
  user: one(users, {
    fields: [billingData.userId],
    references: [users.id],
  }),
  branches: many(customerBranches),
}));

export const customerBranchesRelations = relations(customerBranches, ({ one, many }) => ({
  parentCustomer: one(users, {
    fields: [customerBranches.parentCustomerId],
    references: [users.id],
  }),
  repairOrders: many(repairOrders),
}));

export const inventoryStockRelations = relations(inventoryStock, ({ one }) => ({
  product: one(products, {
    fields: [inventoryStock.productId],
    references: [products.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [inventoryStock.repairCenterId],
    references: [repairCenters.id],
  }),
}));

export const inventoryMovementsRelations = relations(inventoryMovements, ({ one }) => ({
  product: one(products, {
    fields: [inventoryMovements.productId],
    references: [products.id],
  }),
  repairCenter: one(repairCenters, {
    fields: [inventoryMovements.repairCenterId],
    references: [repairCenters.id],
  }),
  createdByUser: one(users, {
    fields: [inventoryMovements.createdBy],
    references: [users.id],
  }),
}));

// Warehouse Relations
export const warehousesRelations = relations(warehouses, ({ many }) => ({
  stock: many(warehouseStock),
  movements: many(warehouseMovements),
  outgoingTransfers: many(warehouseTransfers, { relationName: "sourceWarehouse" }),
  incomingTransfers: many(warehouseTransfers, { relationName: "destinationWarehouse" }),
}));

export const warehouseStockRelations = relations(warehouseStock, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseStock.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [warehouseStock.productId],
    references: [products.id],
  }),
}));

export const warehouseMovementsRelations = relations(warehouseMovements, ({ one }) => ({
  warehouse: one(warehouses, {
    fields: [warehouseMovements.warehouseId],
    references: [warehouses.id],
  }),
  product: one(products, {
    fields: [warehouseMovements.productId],
    references: [products.id],
  }),
  createdByUser: one(users, {
    fields: [warehouseMovements.createdBy],
    references: [users.id],
  }),
}));

export const warehouseTransfersRelations = relations(warehouseTransfers, ({ one, many }) => ({
  sourceWarehouse: one(warehouses, {
    fields: [warehouseTransfers.sourceWarehouseId],
    references: [warehouses.id],
    relationName: "sourceWarehouse",
  }),
  destinationWarehouse: one(warehouses, {
    fields: [warehouseTransfers.destinationWarehouseId],
    references: [warehouses.id],
    relationName: "destinationWarehouse",
  }),
  requestedByUser: one(users, {
    fields: [warehouseTransfers.requestedBy],
    references: [users.id],
  }),
  approvedByUser: one(users, {
    fields: [warehouseTransfers.approvedBy],
    references: [users.id],
  }),
  items: many(warehouseTransferItems),
}));

export const warehouseTransferItemsRelations = relations(warehouseTransferItems, ({ one }) => ({
  transfer: one(warehouseTransfers, {
    fields: [warehouseTransferItems.transferId],
    references: [warehouseTransfers.id],
  }),
  product: one(products, {
    fields: [warehouseTransferItems.productId],
    references: [products.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  sender: one(users, {
    fields: [chatMessages.senderId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  receiver: one(users, {
    fields: [chatMessages.receiverId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
}));

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  user: one(users, {
    fields: [activityLogs.userId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  resellerId: z.string().nullable().optional(),
  resellerCategory: z.enum(["standard", "franchising", "gdo"]).nullable().optional(),
});

export const insertRepairCenterSchema = createInsertSchema(repairCenters).omit({
  id: true,
  createdAt: true,
});

// Schema per aggiornamento impostazioni profilo repair center (self-service)
export const updateRepairCenterSettingsSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  address: z.string().optional(),
  city: z.string().optional(),
  cap: z.string().optional().nullable(),
  provincia: z.string().optional().nullable(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  publicPhone: z.string().optional().nullable(),
  publicEmail: z.string().email().optional().nullable().or(z.literal('')),
  websiteUrl: z.string().url().optional().nullable().or(z.literal('')),
  logoUrl: z.string().optional().nullable(),
  acceptsWalkIns: z.boolean().optional(),
  openingHours: z.record(z.object({
    isOpen: z.boolean(),
    start: z.string().optional(),
    end: z.string().optional(),
    breakStart: z.string().optional().nullable(),
    breakEnd: z.string().optional().nullable(),
  })).optional().nullable(),
  socialLinks: z.object({
    facebook: z.string().optional().nullable(),
    instagram: z.string().optional().nullable(),
    linkedin: z.string().optional().nullable(),
    twitter: z.string().optional().nullable(),
  }).optional().nullable(),
  notes: z.string().optional().nullable(),
  // Dati fiscali (self-editable)
  ragioneSociale: z.string().optional().nullable(),
  partitaIva: z.string().optional().nullable(),
  codiceFiscale: z.string().optional().nullable(),
  iban: z.string().optional().nullable(),
  codiceUnivoco: z.string().optional().nullable(),
  pec: z.string().email().optional().nullable().or(z.literal('')),
});
export type UpdateRepairCenterSettings = z.infer<typeof updateRepairCenterSettingsSchema>;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductPriceSchema = createInsertSchema(productPrices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSmartphoneSpecsSchema = createInsertSchema(smartphoneSpecs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessorySpecsSchema = createInsertSchema(accessorySpecs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({
  id: true,
  createdAt: true,
});

export const insertInventoryStockSchema = createInsertSchema(inventoryStock).omit({
  id: true,
  updatedAt: true,
});

export const insertRepairOrderSchema = createInsertSchema(repairOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceTypeSchema = createInsertSchema(deviceTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceBrandSchema = createInsertSchema(deviceBrands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertIssueTypeSchema = createInsertSchema(issueTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAestheticDefectSchema = createInsertSchema(aestheticDefects).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAccessoryTypeSchema = createInsertSchema(accessoryTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDiagnosticFindingSchema = createInsertSchema(diagnosticFindings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDamagedComponentTypeSchema = createInsertSchema(damagedComponentTypes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEstimatedRepairTimeSchema = createInsertSchema(estimatedRepairTimes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPromotionSchema = createInsertSchema(promotions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUnrepairableReasonSchema = createInsertSchema(unrepairableReasons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceModelSchema = createInsertSchema(deviceModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResellerDeviceBrandSchema = createInsertSchema(resellerDeviceBrands).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResellerDeviceModelSchema = createInsertSchema(resellerDeviceModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProductDeviceCompatibilitySchema = createInsertSchema(productDeviceCompatibilities).omit({
  id: true,
  createdAt: true,
});

export const insertRepairAcceptanceSchema = createInsertSchema(repairAcceptance).omit({
  id: true,
  acceptedAt: true,
});

export const insertRepairDiagnosticsSchema = createInsertSchema(repairDiagnostics).omit({
  id: true,
  diagnosedAt: true,
  updatedAt: true,
});

export const insertRepairQuoteSchema = createInsertSchema(repairQuotes).omit({
  id: true,
  quoteNumber: true,
  createdAt: true,
  updatedAt: true,
});

// Service Catalog Schemas
export const insertServiceItemSchema = createInsertSchema(serviceItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceItemPriceSchema = createInsertSchema(serviceItemPrices)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .refine(
    (data) => {
      const hasReseller = !!data.resellerId;
      const hasRepairCenter = !!data.repairCenterId;
      return (hasReseller && !hasRepairCenter) || (!hasReseller && hasRepairCenter);
    },
    {
      message: "Deve essere specificato esattamente uno tra resellerId e repairCenterId",
    }
  );

export const updateServiceItemSchema = createInsertSchema(serviceItems)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
  })
  .partial();

export const updateServiceItemPriceSchema = createInsertSchema(serviceItemPrices)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    serviceItemId: true,
  })
  .partial();

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  ticketNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketMessageSchema = createInsertSchema(ticketMessages).omit({
  id: true,
  createdAt: true,
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  invoiceNumber: true,
  createdAt: true,
});

export const insertBillingDataSchema = createInsertSchema(billingData).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerBranchSchema = createInsertSchema(customerBranches).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  createdAt: true,
});

export const insertAnalyticsCacheSchema = createInsertSchema(analyticsCache).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepairAttachmentSchema = createInsertSchema(repairAttachments).omit({
  id: true,
  uploadedAt: true,
});

export const insertPartsOrderSchema = createInsertSchema(partsOrders).omit({
  id: true,
  orderedAt: true,
});

export const insertRepairLogSchema = createInsertSchema(repairLogs).omit({
  id: true,
  createdAt: true,
});

export const insertRepairTestChecklistSchema = createInsertSchema(repairTestChecklist).omit({
  id: true,
  testedAt: true,
});

export const insertRepairDeliverySchema = createInsertSchema(repairDelivery).omit({
  id: true,
  deliveredAt: true,
});

// Delivery Appointment Schemas
export const insertRepairCenterAvailabilitySchema = createInsertSchema(repairCenterAvailability).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertRepairCenterBlackoutSchema = createInsertSchema(repairCenterBlackouts).omit({
  id: true,
  createdAt: true,
});

export const insertDeliveryAppointmentSchema = createInsertSchema(deliveryAppointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  confirmedAt: true,
  cancelledAt: true,
});

// SLA State History Schemas
export const insertRepairOrderStateHistorySchema = createInsertSchema(repairOrderStateHistory).omit({
  id: true,
});

export const insertSupplierReturnStateHistorySchema = createInsertSchema(supplierReturnStateHistory).omit({
  id: true,
});

// SLA Thresholds Configuration Schema (stored as JSON in admin_settings)
export const slaThresholdsSchema = z.object({
  // Soglie per ogni stato (in ore)
  ingressato: z.object({
    warning: z.number().default(24), // 🟡 dopo 24 ore
    critical: z.number().default(48), // 🔴 dopo 48 ore
  }).default({ warning: 24, critical: 48 }),
  in_diagnosi: z.object({
    warning: z.number().default(24),
    critical: z.number().default(48),
  }).default({ warning: 24, critical: 48 }),
  preventivo_emesso: z.object({
    warning: z.number().default(48),
    critical: z.number().default(72),
  }).default({ warning: 48, critical: 72 }),
  attesa_ricambi: z.object({
    warning: z.number().default(72),
    critical: z.number().default(120),
  }).default({ warning: 72, critical: 120 }),
  in_riparazione: z.object({
    warning: z.number().default(24),
    critical: z.number().default(48),
  }).default({ warning: 24, critical: 48 }),
  in_test: z.object({
    warning: z.number().default(8),
    critical: z.number().default(24),
  }).default({ warning: 8, critical: 24 }),
  pronto_ritiro: z.object({
    warning: z.number().default(48),
    critical: z.number().default(72),
  }).default({ warning: 48, critical: 72 }),
  // Soglie per resi fornitori
  supplier_return_draft: z.object({
    warning: z.number().default(24),
    critical: z.number().default(48),
  }).default({ warning: 24, critical: 48 }),
  supplier_return_requested: z.object({
    warning: z.number().default(48),
    critical: z.number().default(96),
  }).default({ warning: 48, critical: 96 }),
  supplier_return_approved: z.object({
    warning: z.number().default(24),
    critical: z.number().default(48),
  }).default({ warning: 24, critical: 48 }),
  supplier_return_shipped: z.object({
    warning: z.number().default(72),
    critical: z.number().default(120),
  }).default({ warning: 72, critical: 120 }),
});

export type SlaThresholds = z.infer<typeof slaThresholdsSchema>;

export const insertAdminSettingSchema = createInsertSchema(adminSettings).omit({
  id: true,
  updatedAt: true,
});

export const updateAdminSettingSchema = z.object({
  settingValue: z.string().min(1),
  description: z.string().optional(),
});

// Data Recovery Schemas
export const insertExternalLabSchema = createInsertSchema(externalLabs).omit({
  id: true,
  createdAt: true,
});

export const insertDataRecoveryJobSchema = createInsertSchema(dataRecoveryJobs).omit({
  id: true,
  jobNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDataRecoveryEventSchema = createInsertSchema(dataRecoveryEvents).omit({
  id: true,
  createdAt: true,
});

// Supplier Management Schemas
export const insertSupplierSchema = createInsertSchema(suppliers).omit({
  id: true,
  code: true, // Auto-generated
  createdAt: true,
  updatedAt: true,
});

export const insertProductSupplierSchema = createInsertSchema(productSuppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierCatalogProductSchema = createInsertSchema(supplierCatalogProducts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierSyncLogSchema = createInsertSchema(supplierSyncLogs).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierOrderSchema = createInsertSchema(supplierOrders).omit({
  id: true,
  orderNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierOrderItemSchema = createInsertSchema(supplierOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierReturnSchema = createInsertSchema(supplierReturns).omit({
  id: true,
  returnNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSupplierReturnItemSchema = createInsertSchema(supplierReturnItems).omit({
  id: true,
  createdAt: true,
});

export const insertSupplierCommunicationLogSchema = createInsertSchema(supplierCommunicationLogs).omit({
  id: true,
  createdAt: true,
});

// External Integrations schema
export const insertExternalIntegrationSchema = createInsertSchema(externalIntegrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertExternalIntegration = z.infer<typeof insertExternalIntegrationSchema>;
export type ExternalIntegration = typeof externalIntegrations.$inferSelect;

// SIFAR Integration schemas
export const insertSifarCredentialSchema = createInsertSchema(sifarCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSifarStoreSchema = createInsertSchema(sifarStores).omit({
  id: true,
  createdAt: true,
});

export const insertSifarCartSchema = createInsertSchema(sifarCarts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSifarOrderSchema = createInsertSchema(sifarOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSifarCatalogSchema = createInsertSchema(sifarCatalog).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSifarModelSchema = createInsertSchema(sifarModels).omit({
  id: true,
  createdAt: true,
});

export const insertSifarProductCompatibilitySchema = createInsertSchema(sifarProductCompatibility).omit({
  id: true,
  createdAt: true,
});

// TrovaUsati schemas
export const insertTrovausatiCredentialSchema = createInsertSchema(trovausatiCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrovausatiShopSchema = createInsertSchema(trovausatiShops).omit({
  id: true,
  createdAt: true,
});

export const insertTrovausatiOrderSchema = createInsertSchema(trovausatiOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrovausatiCouponSchema = createInsertSchema(trovausatiCoupons).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTrovausatiModelSchema = createInsertSchema(trovausatiModels).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Foneday schemas
export const insertFonedayCredentialSchema = createInsertSchema(fonedayCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFonedayOrderSchema = createInsertSchema(fonedayOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// MobileSentrix schemas
export const insertMobilesentrixCredentialSchema = createInsertSchema(mobilesentrixCredentials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMobilesentrixOrderSchema = createInsertSchema(mobilesentrixOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Utility Module Schemas
export const insertUtilitySupplierSchema = createInsertSchema(utilitySuppliers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUtilityServiceSchema = createInsertSchema(utilityServices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUtilityPracticeSchema = createInsertSchema(utilityPractices).omit({
  id: true,
  practiceNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUtilityPracticeProductSchema = createInsertSchema(utilityPracticeProducts).omit({
  id: true,
  createdAt: true,
});

export const insertUtilityCommissionSchema = createInsertSchema(utilityCommissions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUtilityPracticeDocumentSchema = createInsertSchema(utilityPracticeDocuments).omit({
  id: true,
  createdAt: true,
});

export const insertUtilityPracticeTaskSchema = createInsertSchema(utilityPracticeTasks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUtilityPracticeNoteSchema = createInsertSchema(utilityPracticeNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUtilityPracticeTimelineSchema = createInsertSchema(utilityPracticeTimeline).omit({
  id: true,
  createdAt: true,
});

export const insertUtilityPracticeStateHistorySchema = createInsertSchema(utilityPracticeStateHistory).omit({
  id: true,
  createdAt: true,
});

// Sales / E-commerce Insert Schemas
export const insertCustomerAddressSchema = createInsertSchema(customerAddresses).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartSchema = createInsertSchema(carts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesOrderSchema = createInsertSchema(salesOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesOrderItemSchema = createInsertSchema(salesOrderItems).omit({
  id: true,
  createdAt: true,
});

export const insertSalesOrderPaymentSchema = createInsertSchema(salesOrderPayments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalesOrderShipmentSchema = createInsertSchema(salesOrderShipments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertShipmentTrackingEventSchema = createInsertSchema(shipmentTrackingEvents).omit({
  id: true,
  createdAt: true,
});

export const insertStockReservationSchema = createInsertSchema(stockReservations).omit({
  id: true,
});

export const insertSalesOrderStateHistorySchema = createInsertSchema(salesOrderStateHistory).omit({
  id: true,
  createdAt: true,
});

export const insertSalesOrderReturnSchema = createInsertSchema(salesOrderReturns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  requestedAt: true,
});

export const insertSalesOrderReturnItemSchema = createInsertSchema(salesOrderReturnItems).omit({
  id: true,
  createdAt: true,
});

export const createDataRecoveryEventSchema = z.object({
  eventType: z.enum(["created", "status_change", "assigned", "shipped", "received", "completed", "note_added", "document_uploaded"]).default("note_added"),
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
});

export const updateDataRecoveryJobSchema = z.object({
  status: z.enum(["pending", "assigned", "in_progress", "awaiting_shipment", "shipped", "at_lab", "completed", "partial", "failed", "cancelled"]).optional(),
  assignedToUserId: z.string().optional().nullable(),
  externalLabId: z.string().optional().nullable(),
  externalLabJobRef: z.string().optional().nullable(),
  trackingNumber: z.string().optional().nullable(),
  trackingCarrier: z.string().optional().nullable(),
  recoveryOutcome: z.enum(["success", "partial", "failed"]).optional().nullable(),
  recoveredDataDescription: z.string().optional().nullable(),
  recoveredDataSize: z.string().optional().nullable(),
  recoveredDataMediaType: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  finalCost: z.number().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
});

export const createDataRecoveryJobSchema = z.object({
  parentRepairOrderId: z.string().min(1),
  triggerType: z.enum(["manual", "automatic"]).default("manual"),
  handlingType: z.enum(["internal", "external"]),
  deviceDescription: z.string().min(1),
  assignedToUserId: z.string().optional().nullable(),
  externalLabId: z.string().optional().nullable(),
  estimatedCost: z.number().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
  customerNotes: z.string().optional().nullable(),
});

// Update schemas for PATCH endpoints
export const updateRepairStatusSchema = z.object({
  status: z.enum(["pending", "in_progress", "waiting_parts", "completed", "delivered", "cancelled"]),
});

export const updateTicketStatusSchema = z.object({
  status: z.enum(["open", "in_progress", "waiting_response", "resolved", "closed"]),
});

export const createTicketMessageSchema = z.object({
  message: z.string().min(1).trim(),
  isInternal: z.boolean().optional().default(false),
});

// Customer Registration Wizard Schemas
const baseCustomerSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(1).trim(),
  address: z.string().optional(),
  city: z.string().optional(),
  zipCode: z.string().optional(),
  country: z.string().default("IT"),
  googlePlaceId: z.string().optional(),
  iban: z.string().optional(),
  showAddress: z.boolean().optional().default(false),
  showIban: z.boolean().optional().default(false),
});

export const privateCustomerSchema = baseCustomerSchema.extend({
  customerType: z.literal("private"),
  fullName: z.string().min(1).trim(),
});

const companyCustomerSchemaBase = baseCustomerSchema.extend({
  customerType: z.literal("company"),
  companyName: z.string().min(1).trim(),
  vatNumber: z.string().optional(),
  fiscalCode: z.string().optional(),
  pec: z.string().email().optional(),
  codiceUnivoco: z.string().optional(),
});

export const companyCustomerSchema = companyCustomerSchemaBase.refine(
  (data) => data.pec || data.codiceUnivoco,
  { message: "Almeno uno tra PEC o Codice Univoco è richiesto", path: ["pec"] }
);

export const customerWizardSchema = z.discriminatedUnion("customerType", [
  privateCustomerSchema,
  companyCustomerSchemaBase,
]).superRefine((data, ctx) => {
  // Validazione per clienti privati: indirizzo obbligatorio se showAddress è true
  if (data.customerType === "private" && data.showAddress) {
    if (!data.address || data.address.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indirizzo è obbligatorio",
        path: ["address"],
      });
    }
    if (!data.city || data.city.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Città è obbligatoria",
        path: ["city"],
      });
    }
    if (!data.zipCode || data.zipCode.trim().length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "CAP è obbligatorio",
        path: ["zipCode"],
      });
    }
  }
  // Validazione per aziende: PEC o Codice Univoco obbligatorio
  if (data.customerType === "company") {
    if (!data.pec && !data.codiceUnivoco) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Almeno uno tra PEC o Codice Univoco è richiesto",
        path: ["pec"],
      });
    }
  }
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type RepairCenter = typeof repairCenters.$inferSelect;
export type InsertRepairCenter = z.infer<typeof insertRepairCenterSchema>;

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type ProductPrice = typeof productPrices.$inferSelect;
export type InsertProductPrice = z.infer<typeof insertProductPriceSchema>;

export type SmartphoneSpecs = typeof smartphoneSpecs.$inferSelect;
export type InsertSmartphoneSpecs = z.infer<typeof insertSmartphoneSpecsSchema>;

export type AccessorySpecs = typeof accessorySpecs.$inferSelect;
export type InsertAccessorySpecs = z.infer<typeof insertAccessorySpecsSchema>;

export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

export type InventoryStock = typeof inventoryStock.$inferSelect;
export type InsertInventoryStock = z.infer<typeof insertInventoryStockSchema>;

export type RepairOrder = typeof repairOrders.$inferSelect;
export type InsertRepairOrder = z.infer<typeof insertRepairOrderSchema>;

export type DeviceType = typeof deviceTypes.$inferSelect;
export type InsertDeviceType = z.infer<typeof insertDeviceTypeSchema>;

export type DeviceBrand = typeof deviceBrands.$inferSelect;
export type InsertDeviceBrand = z.infer<typeof insertDeviceBrandSchema>;

export type IssueType = typeof issueTypes.$inferSelect;
export type InsertIssueType = z.infer<typeof insertIssueTypeSchema>;

export type AestheticDefect = typeof aestheticDefects.$inferSelect;
export type InsertAestheticDefect = z.infer<typeof insertAestheticDefectSchema>;

export type AccessoryType = typeof accessoryTypes.$inferSelect;
export type InsertAccessoryType = z.infer<typeof insertAccessoryTypeSchema>;

export type DiagnosticFinding = typeof diagnosticFindings.$inferSelect;
export type InsertDiagnosticFinding = z.infer<typeof insertDiagnosticFindingSchema>;

export type DamagedComponentType = typeof damagedComponentTypes.$inferSelect;
export type InsertDamagedComponentType = z.infer<typeof insertDamagedComponentTypeSchema>;

export type EstimatedRepairTime = typeof estimatedRepairTimes.$inferSelect;
export type InsertEstimatedRepairTime = z.infer<typeof insertEstimatedRepairTimeSchema>;

export type Promotion = typeof promotions.$inferSelect;
export type InsertPromotion = z.infer<typeof insertPromotionSchema>;

export type UnrepairableReason = typeof unrepairableReasons.$inferSelect;
export type InsertUnrepairableReason = z.infer<typeof insertUnrepairableReasonSchema>;

export type DeviceModel = typeof deviceModels.$inferSelect;
export type InsertDeviceModel = z.infer<typeof insertDeviceModelSchema>;

export type ResellerDeviceBrand = typeof resellerDeviceBrands.$inferSelect;
export type InsertResellerDeviceBrand = z.infer<typeof insertResellerDeviceBrandSchema>;

export type ResellerDeviceModel = typeof resellerDeviceModels.$inferSelect;
export type InsertResellerDeviceModel = z.infer<typeof insertResellerDeviceModelSchema>;

export type ProductDeviceCompatibility = typeof productDeviceCompatibilities.$inferSelect;
export type InsertProductDeviceCompatibility = z.infer<typeof insertProductDeviceCompatibilitySchema>;

export type RepairAcceptance = typeof repairAcceptance.$inferSelect;
export type InsertRepairAcceptance = z.infer<typeof insertRepairAcceptanceSchema>;

export type RepairDiagnostics = typeof repairDiagnostics.$inferSelect;
export type InsertRepairDiagnostics = z.infer<typeof insertRepairDiagnosticsSchema>;

export type RepairQuote = typeof repairQuotes.$inferSelect;
export type InsertRepairQuote = z.infer<typeof insertRepairQuoteSchema>;

// Service Catalog Types
export type ServiceItem = typeof serviceItems.$inferSelect;
export type InsertServiceItem = z.infer<typeof insertServiceItemSchema>;

export type ServiceItemPrice = typeof serviceItemPrices.$inferSelect;
export type InsertServiceItemPrice = z.infer<typeof insertServiceItemPriceSchema>;

export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;

export type TicketMessage = typeof ticketMessages.$inferSelect;
export type InsertTicketMessage = z.infer<typeof insertTicketMessageSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type BillingData = typeof billingData.$inferSelect;
export type InsertBillingData = z.infer<typeof insertBillingDataSchema>;

export type CustomerBranch = typeof customerBranches.$inferSelect;
export type InsertCustomerBranch = z.infer<typeof insertCustomerBranchSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;

export type AnalyticsCache = typeof analyticsCache.$inferSelect;
export type InsertAnalyticsCache = z.infer<typeof insertAnalyticsCacheSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;

export type RepairAttachment = typeof repairAttachments.$inferSelect;
export type InsertRepairAttachment = z.infer<typeof insertRepairAttachmentSchema>;

export type PartsOrder = typeof partsOrders.$inferSelect;
export type InsertPartsOrder = z.infer<typeof insertPartsOrderSchema>;

export type RepairLog = typeof repairLogs.$inferSelect;
export type InsertRepairLog = z.infer<typeof insertRepairLogSchema>;

export type RepairTestChecklist = typeof repairTestChecklist.$inferSelect;
export type InsertRepairTestChecklist = z.infer<typeof insertRepairTestChecklistSchema>;

export type RepairDelivery = typeof repairDelivery.$inferSelect;
export type InsertRepairDelivery = z.infer<typeof insertRepairDeliverySchema>;

// Delivery Appointment Types
export type RepairCenterAvailability = typeof repairCenterAvailability.$inferSelect;
export type InsertRepairCenterAvailability = z.infer<typeof insertRepairCenterAvailabilitySchema>;

export type RepairCenterBlackout = typeof repairCenterBlackouts.$inferSelect;
export type InsertRepairCenterBlackout = z.infer<typeof insertRepairCenterBlackoutSchema>;

export type DeliveryAppointment = typeof deliveryAppointments.$inferSelect;
export type InsertDeliveryAppointment = z.infer<typeof insertDeliveryAppointmentSchema>;

// Appointment Status Type
export type AppointmentStatus = "scheduled" | "confirmed" | "completed" | "cancelled" | "no_show";

// ==========================================
// MARKETPLACE (Reseller-to-Reseller B2B)
// ==========================================

// Marketplace Order Status Enum
export const marketplaceOrderStatusEnum = pgEnum("marketplace_order_status", [
  "pending",           // In attesa di approvazione venditore
  "approved",          // Approvato dal venditore
  "rejected",          // Rifiutato dal venditore
  "processing",        // In preparazione
  "shipped",           // Spedito
  "received",          // Ricevuto dall'acquirente
  "cancelled",         // Annullato
]);

// Marketplace Orders Table (Reseller-to-Reseller)
export const marketplaceOrders = pgTable("marketplace_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // es. MP-2024-00001
  
  // Buyer and Seller
  buyerResellerId: varchar("buyer_reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sellerResellerId: varchar("seller_reseller_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Status
  status: marketplaceOrderStatusEnum("status").notNull().default("pending"),
  
  // Totals (in cents)
  subtotal: integer("subtotal").notNull().default(0),
  discountAmount: integer("discount_amount").notNull().default(0),
  shippingCost: integer("shipping_cost").notNull().default(0),
  total: integer("total").notNull().default(0),
  
  // Payment
  paymentMethod: b2bPaymentMethodEnum("payment_method").default("bank_transfer"),
  paymentReference: text("payment_reference"),
  paymentConfirmedAt: timestamp("payment_confirmed_at"),
  paymentConfirmedBy: varchar("payment_confirmed_by").references(() => users.id),
  
  // Notes
  buyerNotes: text("buyer_notes"),
  sellerNotes: text("seller_notes"),
  rejectionReason: text("rejection_reason"),
  
  // Approval tracking
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  rejectedBy: varchar("rejected_by").references(() => users.id),
  rejectedAt: timestamp("rejected_at"),
  
  // Shipping tracking
  shippedAt: timestamp("shipped_at"),
  shippedBy: varchar("shipped_by").references(() => users.id),
  trackingNumber: text("tracking_number"),
  trackingCarrier: text("tracking_carrier"),
  
  // Receipt tracking
  receivedAt: timestamp("received_at"),
  
  // Warehouse transfer link
  warehouseTransferId: varchar("warehouse_transfer_id").references(() => warehouseTransfers.id),
  
  // Audit
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertMarketplaceOrderSchema = createInsertSchema(marketplaceOrders).omit({
  id: true,
  orderNumber: true,
  approvedBy: true,
  approvedAt: true,
  rejectedBy: true,
  rejectedAt: true,
  shippedAt: true,
  shippedBy: true,
  receivedAt: true,
  warehouseTransferId: true,
  paymentConfirmedAt: true,
  paymentConfirmedBy: true,
  createdAt: true,
  updatedAt: true,
});

// Marketplace Order Items
export const marketplaceOrderItems = pgTable("marketplace_order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull().references(() => marketplaceOrders.id, { onDelete: "cascade" }),
  productId: varchar("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
  
  // Quantity & pricing (snapshot at order time)
  quantity: integer("quantity").notNull(),
  unitPrice: integer("unit_price").notNull(), // In cents
  totalPrice: integer("total_price").notNull(), // quantity * unitPrice
  
  // Product snapshot (in case product changes later)
  productName: text("product_name").notNull(),
  productSku: text("product_sku"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMarketplaceOrderItemSchema = createInsertSchema(marketplaceOrderItems).omit({
  id: true,
  createdAt: true,
});

// SLA State History Types
export type RepairOrderStateHistory = typeof repairOrderStateHistory.$inferSelect;
export type InsertRepairOrderStateHistory = z.infer<typeof insertRepairOrderStateHistorySchema>;

export type SupplierReturnStateHistory = typeof supplierReturnStateHistory.$inferSelect;
export type InsertSupplierReturnStateHistory = z.infer<typeof insertSupplierReturnStateHistorySchema>;

// SLA Severity Type
export type SlaSeverity = "in_time" | "late" | "urgent";

export type AdminSetting = typeof adminSettings.$inferSelect;
export type InsertAdminSetting = z.infer<typeof insertAdminSettingSchema>;

// Data Recovery Types
export type ExternalLab = typeof externalLabs.$inferSelect;
export type InsertExternalLab = z.infer<typeof insertExternalLabSchema>;

export type DataRecoveryJob = typeof dataRecoveryJobs.$inferSelect;
export type InsertDataRecoveryJob = z.infer<typeof insertDataRecoveryJobSchema>;
export type CreateDataRecoveryJob = z.infer<typeof createDataRecoveryJobSchema>;
export type UpdateDataRecoveryJob = z.infer<typeof updateDataRecoveryJobSchema>;

export type DataRecoveryEvent = typeof dataRecoveryEvents.$inferSelect;
export type InsertDataRecoveryEvent = z.infer<typeof insertDataRecoveryEventSchema>;

// Supplier Management Types
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;

export type ProductSupplier = typeof productSuppliers.$inferSelect;
export type InsertProductSupplier = z.infer<typeof insertProductSupplierSchema>;

export type SupplierCatalogProduct = typeof supplierCatalogProducts.$inferSelect;
export type InsertSupplierCatalogProduct = z.infer<typeof insertSupplierCatalogProductSchema>;

export type SupplierSyncLog = typeof supplierSyncLogs.$inferSelect;
export type InsertSupplierSyncLog = z.infer<typeof insertSupplierSyncLogSchema>;

export type SupplierOrderOwnerType = "admin" | "reseller" | "sub_reseller" | "repair_center";
export type SupplierOrder = typeof supplierOrders.$inferSelect;
export type InsertSupplierOrder = z.infer<typeof insertSupplierOrderSchema>;

export type SupplierOrderItem = typeof supplierOrderItems.$inferSelect;
export type InsertSupplierOrderItem = z.infer<typeof insertSupplierOrderItemSchema>;

export type SupplierReturn = typeof supplierReturns.$inferSelect;
export type InsertSupplierReturn = z.infer<typeof insertSupplierReturnSchema>;

export type SupplierReturnItem = typeof supplierReturnItems.$inferSelect;
export type InsertSupplierReturnItem = z.infer<typeof insertSupplierReturnItemSchema>;

export type SupplierCommunicationLog = typeof supplierCommunicationLogs.$inferSelect;
export type InsertSupplierCommunicationLog = z.infer<typeof insertSupplierCommunicationLogSchema>;

// SIFAR Integration types
export type SifarCredential = typeof sifarCredentials.$inferSelect;
export type InsertSifarCredential = z.infer<typeof insertSifarCredentialSchema>;

export type SifarStore = typeof sifarStores.$inferSelect;
export type InsertSifarStore = z.infer<typeof insertSifarStoreSchema>;

export type SifarCart = typeof sifarCarts.$inferSelect;
export type InsertSifarCart = z.infer<typeof insertSifarCartSchema>;

export type SifarOrder = typeof sifarOrders.$inferSelect;
export type InsertSifarOrder = z.infer<typeof insertSifarOrderSchema>;

export type SifarCatalogProduct = typeof sifarCatalog.$inferSelect;
export type InsertSifarCatalogProduct = z.infer<typeof insertSifarCatalogSchema>;

export type SifarModel = typeof sifarModels.$inferSelect;
export type InsertSifarModel = z.infer<typeof insertSifarModelSchema>;

export type SifarProductCompatibility = typeof sifarProductCompatibility.$inferSelect;
export type InsertSifarProductCompatibility = z.infer<typeof insertSifarProductCompatibilitySchema>;

// TrovaUsati types
export type TrovausatiCredential = typeof trovausatiCredentials.$inferSelect;
export type InsertTrovausatiCredential = z.infer<typeof insertTrovausatiCredentialSchema>;

export type TrovausatiShop = typeof trovausatiShops.$inferSelect;
export type InsertTrovausatiShop = z.infer<typeof insertTrovausatiShopSchema>;

export type TrovausatiOrder = typeof trovausatiOrders.$inferSelect;
export type InsertTrovausatiOrder = z.infer<typeof insertTrovausatiOrderSchema>;

export type TrovausatiCoupon = typeof trovausatiCoupons.$inferSelect;
export type InsertTrovausatiCoupon = z.infer<typeof insertTrovausatiCouponSchema>;

export type TrovausatiModel = typeof trovausatiModels.$inferSelect;
export type InsertTrovausatiModel = z.infer<typeof insertTrovausatiModelSchema>;

// Foneday types
export type FonedayCredential = typeof fonedayCredentials.$inferSelect;
export type InsertFonedayCredential = z.infer<typeof insertFonedayCredentialSchema>;

export type FonedayOrder = typeof fonedayOrders.$inferSelect;
export type InsertFonedayOrder = z.infer<typeof insertFonedayOrderSchema>;

// MobileSentrix types
export type MobilesentrixCredential = typeof mobilesentrixCredentials.$inferSelect;
export type InsertMobilesentrixCredential = z.infer<typeof insertMobilesentrixCredentialSchema>;

export type MobilesentrixOrder = typeof mobilesentrixOrders.$inferSelect;
export type InsertMobilesentrixOrder = z.infer<typeof insertMobilesentrixOrderSchema>;

// Utility Module Types
export type UtilityCategory = "fisso" | "mobile" | "centralino" | "luce" | "gas" | "altro";
export type UtilityPracticeStatus = "bozza" | "inviata" | "in_lavorazione" | "attesa_documenti" | "completata" | "rifiutata" | "annullata";
export type UtilityCommissionStatus = "pending" | "accrued" | "invoiced" | "paid" | "cancelled";

export type UtilitySupplier = typeof utilitySuppliers.$inferSelect;
export type InsertUtilitySupplier = z.infer<typeof insertUtilitySupplierSchema>;

export type UtilityService = typeof utilityServices.$inferSelect;
export type InsertUtilityService = z.infer<typeof insertUtilityServiceSchema>;

export type UtilityPractice = typeof utilityPractices.$inferSelect;
export type InsertUtilityPractice = z.infer<typeof insertUtilityPracticeSchema>;

export type UtilityPracticeProduct = typeof utilityPracticeProducts.$inferSelect;
export type InsertUtilityPracticeProduct = z.infer<typeof insertUtilityPracticeProductSchema>;

export type UtilityCommission = typeof utilityCommissions.$inferSelect;
export type InsertUtilityCommission = z.infer<typeof insertUtilityCommissionSchema>;

export type UtilityPracticeDocument = typeof utilityPracticeDocuments.$inferSelect;
export type InsertUtilityPracticeDocument = z.infer<typeof insertUtilityPracticeDocumentSchema>;

export type UtilityPracticeTask = typeof utilityPracticeTasks.$inferSelect;
export type InsertUtilityPracticeTask = z.infer<typeof insertUtilityPracticeTaskSchema>;

export type UtilityPracticeNote = typeof utilityPracticeNotes.$inferSelect;
export type InsertUtilityPracticeNote = z.infer<typeof insertUtilityPracticeNoteSchema>;

export type UtilityPracticeTimelineEvent = typeof utilityPracticeTimeline.$inferSelect;
export type InsertUtilityPracticeTimelineEvent = z.infer<typeof insertUtilityPracticeTimelineSchema>;

export type UtilityPracticeStateHistoryEntry = typeof utilityPracticeStateHistory.$inferSelect;
export type InsertUtilityPracticeStateHistoryEntry = z.infer<typeof insertUtilityPracticeStateHistorySchema>;

// Sales / E-commerce Types
export type CustomerAddress = typeof customerAddresses.$inferSelect;
export type InsertCustomerAddress = z.infer<typeof insertCustomerAddressSchema>;

export type Cart = typeof carts.$inferSelect;
export type InsertCart = z.infer<typeof insertCartSchema>;

export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;

export type SalesOrder = typeof salesOrders.$inferSelect;
export type InsertSalesOrder = z.infer<typeof insertSalesOrderSchema>;

export type SalesOrderItem = typeof salesOrderItems.$inferSelect;
export type InsertSalesOrderItem = z.infer<typeof insertSalesOrderItemSchema>;

export type SalesOrderPayment = typeof salesOrderPayments.$inferSelect;
export type InsertSalesOrderPayment = z.infer<typeof insertSalesOrderPaymentSchema>;

export type SalesOrderShipment = typeof salesOrderShipments.$inferSelect;
export type InsertSalesOrderShipment = z.infer<typeof insertSalesOrderShipmentSchema>;

export type ShipmentTrackingEvent = typeof shipmentTrackingEvents.$inferSelect;
export type InsertShipmentTrackingEvent = z.infer<typeof insertShipmentTrackingEventSchema>;

export type StockReservation = typeof stockReservations.$inferSelect;
export type InsertStockReservation = z.infer<typeof insertStockReservationSchema>;

export type SalesOrderStateHistoryEntry = typeof salesOrderStateHistory.$inferSelect;
export type InsertSalesOrderStateHistoryEntry = z.infer<typeof insertSalesOrderStateHistorySchema>;

export type SalesOrderReturn = typeof salesOrderReturns.$inferSelect;
export type InsertSalesOrderReturn = z.infer<typeof insertSalesOrderReturnSchema>;

export type SalesOrderReturnItem = typeof salesOrderReturnItems.$inferSelect;
export type InsertSalesOrderReturnItem = z.infer<typeof insertSalesOrderReturnItemSchema>;

// Sales Order Status Type
export type SalesOrderStatus = "pending" | "confirmed" | "processing" | "ready_to_ship" | "shipped" | "delivered" | "completed" | "cancelled" | "refunded";
export type PaymentMethod = "cash" | "card" | "bank_transfer" | "paypal" | "stripe" | "satispay" | "pos" | "credit";
export type SalesPaymentStatus = "pending" | "processing" | "completed" | "failed" | "refunded" | "partially_refunded";
export type ShipmentStatus = "pending" | "preparing" | "ready" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered" | "failed_delivery" | "returned";
export type DeliveryType = "pickup" | "shipping" | "express";
export type Carrier = "brt" | "gls" | "dhl" | "ups" | "fedex" | "poste_italiane" | "sda" | "tnt" | "other";
export type SalesReturnStatus = "requested" | "approved" | "rejected" | "awaiting_shipment" | "shipped" | "received" | "inspecting" | "refunded" | "partially_refunded" | "cancelled";
export type SalesReturnReason = "defective" | "wrong_item" | "not_as_described" | "changed_mind" | "damaged_in_transit" | "missing_parts" | "quality_issue" | "other";
export type ReturnItemCondition = "new_sealed" | "new_opened" | "used_good" | "used_damaged" | "defective";
export type RefundMethod = "original_payment" | "store_credit" | "bank_transfer";

// Warehouse Management Types
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;

export type WarehouseStock = typeof warehouseStock.$inferSelect;
export type InsertWarehouseStock = z.infer<typeof insertWarehouseStockSchema>;

export type WarehouseMovement = typeof warehouseMovements.$inferSelect;
export type InsertWarehouseMovement = z.infer<typeof insertWarehouseMovementSchema>;

export type WarehouseTransfer = typeof warehouseTransfers.$inferSelect;
export type InsertWarehouseTransfer = z.infer<typeof insertWarehouseTransferSchema>;

export type WarehouseTransferItem = typeof warehouseTransferItems.$inferSelect;
export type InsertWarehouseTransferItem = z.infer<typeof insertWarehouseTransferItemSchema>;

export type WarehouseOwnerType = "admin" | "reseller" | "sub_reseller" | "repair_center";
export type WarehouseMovementType = "carico" | "scarico" | "trasferimento_in" | "trasferimento_out" | "rettifica";
export type WarehouseTransferStatus = "pending" | "approved" | "shipped" | "received" | "cancelled";

// Marketplace Types (Reseller-to-Reseller B2B)
export type MarketplaceOrder = typeof marketplaceOrders.$inferSelect;
export type InsertMarketplaceOrder = z.infer<typeof insertMarketplaceOrderSchema>;
export type MarketplaceOrderItem = typeof marketplaceOrderItems.$inferSelect;
export type InsertMarketplaceOrderItem = z.infer<typeof insertMarketplaceOrderItemSchema>;
export type MarketplaceOrderStatus = "pending" | "approved" | "rejected" | "processing" | "shipped" | "received" | "cancelled";
