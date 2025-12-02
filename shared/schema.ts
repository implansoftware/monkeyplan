import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, timestamp, boolean, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "reseller", "repair_center", "customer"]);
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
// PARTS LOAD (CARICO RICAMBI) ENUMS
// ==========================================

// Tipo documento carico
export const partsLoadDocumentTypeEnum = pgEnum("parts_load_document_type", [
  "ddt",               // Documento di Trasporto
  "fattura",           // Fattura Fornitore
]);

// Stato documento carico
export const partsLoadStatusEnum = pgEnum("parts_load_status", [
  "draft",             // Bozza - inserimento righe
  "processing",        // In elaborazione - abbinamento automatico
  "completed",         // Completato - tutti i ricambi assegnati
  "partial",           // Parziale - alcuni ricambi in eccedenza
  "cancelled",         // Annullato
]);

// Stato riga carico
export const partsLoadItemStatusEnum = pgEnum("parts_load_item_status", [
  "pending",           // In attesa di elaborazione
  "matched",           // Abbinato a ordine ricambi
  "stock",             // Destinato a magazzino stock
  "error",             // Errore abbinamento
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
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Repair Centers
export const repairCenters = pgTable("repair_centers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  resellerId: varchar("reseller_id"), // Rivenditore di appartenenza
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

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

// Products (Inventory items - Electronics parts)
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  category: text("category").notNull(), // display, batteria, scheda_madre, cover, etc.
  productType: productTypeEnum("product_type").notNull().default("ricambio"),
  description: text("description"),
  
  // Brand & Compatibility
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
  
  // Metadata
  isActive: boolean("is_active").notNull().default(true),
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
  signatureData: text("signature_data"), // Base64 firma (opzionale)
  idDocumentType: text("id_document_type"), // Tipo documento identità
  idDocumentNumber: text("id_document_number"), // Numero documento
  idDocumentPhoto: text("id_document_photo"), // URL foto documento identità
  notes: text("notes"),
  deliveredBy: varchar("delivered_by").notNull(), // ID utente che ha consegnato
  deliveredAt: timestamp("delivered_at").notNull().defaultNow(),
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

// Supplier Orders (Ordini a Fornitori)
export const supplierOrders = pgTable("supplier_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(), // Numero ordine (es: "ORD-2024-0001")
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id), // Centro che ordina
  
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
// PARTS LOAD (CARICO RICAMBI) TABLES
// ==========================================

// Parts Load Documents (Documenti di carico - DDT/Fattura)
export const partsLoadDocuments = pgTable("parts_load_documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  loadNumber: text("load_number").notNull().unique(), // Numero progressivo carico (es: "CAR-2024-0001")
  
  // Tipo e riferimento documento
  documentType: partsLoadDocumentTypeEnum("document_type").notNull(),
  documentNumber: text("document_number").notNull(), // Numero DDT o Fattura fornitore
  documentDate: timestamp("document_date").notNull(), // Data documento
  
  // Fornitore
  supplierId: varchar("supplier_id").notNull().references(() => suppliers.id),
  supplierOrderId: varchar("supplier_order_id").references(() => supplierOrders.id), // Ordine fornitore collegato (opzionale)
  
  // Centro riparazione
  repairCenterId: varchar("repair_center_id").notNull().references(() => repairCenters.id),
  
  // Stato
  status: partsLoadStatusEnum("status").notNull().default("draft"),
  
  // Totali
  totalItems: integer("total_items").notNull().default(0),
  totalQuantity: integer("total_quantity").notNull().default(0),
  totalAmount: integer("total_amount").notNull().default(0), // In centesimi
  
  // Statistiche abbinamento
  matchedItems: integer("matched_items").notNull().default(0), // Righe abbinate a ordini
  stockItems: integer("stock_items").notNull().default(0), // Righe destinate a stock
  errorItems: integer("error_items").notNull().default(0), // Righe con errore
  
  // Date elaborazione
  processedAt: timestamp("processed_at"), // Data elaborazione abbinamento
  completedAt: timestamp("completed_at"), // Data completamento
  
  // Note
  notes: text("notes"),
  
  // Import API (per carico automatico)
  isAutoImport: boolean("is_auto_import").notNull().default(false),
  importSource: text("import_source"), // "api", "email", "fattura_elettronica"
  importMetadata: text("import_metadata"), // JSON con dati import
  
  // Sessione (per carichi consecutivi)
  sessionId: varchar("session_id"), // ID sessione per carichi multipli
  sessionSequence: integer("session_sequence"), // Numero progressivo in sessione
  
  // Audit
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Parts Load Items (Righe documento carico)
export const partsLoadItems = pgTable("parts_load_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partsLoadDocumentId: varchar("parts_load_document_id").notNull().references(() => partsLoadDocuments.id, { onDelete: "cascade" }),
  
  // Dati articolo
  partCode: text("part_code").notNull(), // Codice ricambio (SKU fornitore)
  description: text("description").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: integer("unit_price").notNull(), // Prezzo unitario in centesimi
  totalPrice: integer("total_price").notNull(), // Prezzo totale in centesimi
  
  // Stato elaborazione
  status: partsLoadItemStatusEnum("status").notNull().default("pending"),
  
  // Abbinamento (se matched)
  matchedPartsOrderId: varchar("matched_parts_order_id").references(() => partsOrders.id), // Ordine ricambi abbinato
  matchedRepairOrderId: varchar("matched_repair_order_id").references(() => repairOrders.id), // Lavorazione abbinata
  matchedProductId: varchar("matched_product_id").references(() => products.id), // Prodotto abbinato
  
  // Destinazione stock (se stock)
  stockLocationSuggested: text("stock_location_suggested"), // Posizione suggerita (es: "Cassetto B3")
  stockLocationConfirmed: text("stock_location_confirmed"), // Posizione confermata
  addedToInventory: boolean("added_to_inventory").notNull().default(false), // Flag aggiunta inventario
  inventoryMovementId: varchar("inventory_movement_id"), // ID movimento inventario creato
  
  // Errore (se error)
  errorMessage: text("error_message"),
  
  // Note
  notes: text("notes"),
  
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==========================================
// UTILITY MODULE TABLES
// ==========================================

// Utility Suppliers (Fornitori Utility - TIM, Vodafone, Enel, etc.)
export const utilitySuppliers = pgTable("utility_suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // Codice fornitore interno (es: "UTL-TIM")
  name: text("name").notNull(), // Nome fornitore (es: "TIM Business")
  
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
  
  // Prodotto legacy (per retrocompatibilità, usare utility_practice_products per multi-prodotti)
  productId: varchar("product_id").references(() => products.id),
  
  // Fornitore
  supplierId: varchar("supplier_id").references(() => utilitySuppliers.id),
  
  // Cliente
  customerId: varchar("customer_id").notNull().references(() => users.id),
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

export const insertProductSchema = createInsertSchema(products).omit({
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

// Parts Load Documents schemas
export const insertPartsLoadDocumentSchema = createInsertSchema(partsLoadDocuments).omit({
  id: true,
  loadNumber: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartsLoadItemSchema = createInsertSchema(partsLoadItems).omit({
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
  address: z.string().min(1).trim(),
  city: z.string().min(1).trim(),
  zipCode: z.string().min(1).trim(),
  country: z.string().default("IT"),
  googlePlaceId: z.string().optional(),
  iban: z.string().optional(),
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

export type RepairAcceptance = typeof repairAcceptance.$inferSelect;
export type InsertRepairAcceptance = z.infer<typeof insertRepairAcceptanceSchema>;

export type RepairDiagnostics = typeof repairDiagnostics.$inferSelect;
export type InsertRepairDiagnostics = z.infer<typeof insertRepairDiagnosticsSchema>;

export type RepairQuote = typeof repairQuotes.$inferSelect;
export type InsertRepairQuote = z.infer<typeof insertRepairQuoteSchema>;

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

// Parts Load types
export type PartsLoadDocument = typeof partsLoadDocuments.$inferSelect;
export type InsertPartsLoadDocument = z.infer<typeof insertPartsLoadDocumentSchema>;
export type PartsLoadItem = typeof partsLoadItems.$inferSelect;
export type InsertPartsLoadItem = z.infer<typeof insertPartsLoadItemSchema>;

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
