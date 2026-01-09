CREATE TYPE "public"."accessory_type" AS ENUM('cover', 'pellicola', 'caricatore', 'cavo', 'powerbank', 'auricolari', 'supporto', 'adattatore', 'memoria', 'altro');--> statement-breakpoint
CREATE TYPE "public"."admin_module" AS ENUM('users', 'resellers', 'repair_centers', 'repairs', 'products', 'inventory', 'suppliers', 'supplier_orders', 'invoices', 'tickets', 'utility', 'reports', 'settings', 'service_catalog');--> statement-breakpoint
CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');--> statement-breakpoint
CREATE TYPE "public"."b2b_payment_method" AS ENUM('bank_transfer', 'stripe', 'credit');--> statement-breakpoint
CREATE TYPE "public"."b2b_return_reason" AS ENUM('defective', 'wrong_item', 'not_as_described', 'damaged_in_transit', 'excess_stock', 'quality_issue', 'other');--> statement-breakpoint
CREATE TYPE "public"."b2b_return_status" AS ENUM('requested', 'approved', 'rejected', 'awaiting_shipment', 'shipped', 'received', 'inspecting', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."carrier" AS ENUM('brt', 'gls', 'dhl', 'ups', 'fedex', 'poste_italiane', 'sda', 'tnt', 'other');--> statement-breakpoint
CREATE TYPE "public"."communication_type" AS ENUM('order', 'return_request', 'inquiry', 'tracking_update', 'confirmation');--> statement-breakpoint
CREATE TYPE "public"."customer_type" AS ENUM('private', 'company');--> statement-breakpoint
CREATE TYPE "public"."data_recovery_event_type" AS ENUM('created', 'assigned', 'status_change', 'note_added', 'document_generated', 'shipped', 'tracking_update', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."data_recovery_handling" AS ENUM('internal', 'external');--> statement-breakpoint
CREATE TYPE "public"."data_recovery_status" AS ENUM('pending', 'assigned', 'in_progress', 'awaiting_shipment', 'shipped', 'at_lab', 'completed', 'partial', 'failed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."data_recovery_trigger" AS ENUM('manual', 'automatic');--> statement-breakpoint
CREATE TYPE "public"."delivery_type" AS ENUM('pickup', 'shipping', 'express');--> statement-breakpoint
CREATE TYPE "public"."diagnosis_outcome" AS ENUM('riparabile', 'non_conveniente', 'irriparabile');--> statement-breakpoint
CREATE TYPE "public"."hr_absence_type" AS ENUM('ritardo', 'uscita_anticipata', 'assenza_ingiustificata', 'assenza_giustificata');--> statement-breakpoint
CREATE TYPE "public"."hr_audit_action" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'clock_in', 'clock_out', 'validate');--> statement-breakpoint
CREATE TYPE "public"."hr_certificate_type" AS ENUM('malattia', 'infortunio', 'maternita', 'altro');--> statement-breakpoint
CREATE TYPE "public"."hr_clock_event_status" AS ENUM('valid', 'pending_validation', 'validated', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."hr_clock_event_type" AS ENUM('entrata', 'uscita', 'pausa_inizio', 'pausa_fine');--> statement-breakpoint
CREATE TYPE "public"."hr_expense_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'paid');--> statement-breakpoint
CREATE TYPE "public"."hr_justification_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."hr_leave_request_status" AS ENUM('pending', 'approved', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."hr_leave_type" AS ENUM('ferie', 'permesso_rol', 'permesso_studio', 'permesso_medico', 'permesso_lutto', 'permesso_matrimonio', 'congedo_parentale', 'altro');--> statement-breakpoint
CREATE TYPE "public"."hr_notification_channel" AS ENUM('in_app', 'email', 'sms');--> statement-breakpoint
CREATE TYPE "public"."marketplace_order_status" AS ENUM('pending', 'approved', 'rejected', 'processing', 'shipped', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."network_lock" AS ENUM('unlocked', 'locked', 'icloud_locked');--> statement-breakpoint
CREATE TYPE "public"."parts_order_status" AS ENUM('ordered', 'in_transit', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."parts_purchase_destination" AS ENUM('external_supplier', 'internal_warehouse');--> statement-breakpoint
CREATE TYPE "public"."parts_purchase_order_status" AS ENUM('draft', 'submitted', 'processing', 'shipped', 'partial_received', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'bank_transfer', 'paypal', 'stripe', 'satispay', 'pos', 'credit');--> statement-breakpoint
CREATE TYPE "public"."payment_order_type" AS ENUM('b2c', 'b2b');--> statement-breakpoint
CREATE TYPE "public"."product_condition" AS ENUM('nuovo', 'ricondizionato', 'usato', 'compatibile');--> statement-breakpoint
CREATE TYPE "public"."product_type" AS ENUM('ricambio', 'accessorio', 'dispositivo', 'consumabile');--> statement-breakpoint
CREATE TYPE "public"."quote_bypass_reason" AS ENUM('garanzia', 'omaggio');--> statement-breakpoint
CREATE TYPE "public"."quote_status" AS ENUM('draft', 'sent', 'accepted', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."rc_b2b_return_reason" AS ENUM('defective', 'wrong_item', 'damaged', 'not_as_described', 'excess_quantity', 'other');--> statement-breakpoint
CREATE TYPE "public"."rc_b2b_return_status" AS ENUM('requested', 'approved', 'awaiting_shipment', 'shipped', 'received', 'inspecting', 'completed', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."refund_method" AS ENUM('original_payment', 'store_credit', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."remote_repair_request_status" AS ENUM('pending', 'assigned', 'accepted', 'rejected', 'awaiting_shipment', 'in_transit', 'received', 'repair_created', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."repair_log_type" AS ENUM('status_change', 'technician_note', 'parts_installed', 'test_result', 'customer_contact');--> statement-breakpoint
CREATE TYPE "public"."repair_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."reseller_category" AS ENUM('standard', 'franchising', 'gdo');--> statement-breakpoint
CREATE TYPE "public"."reseller_purchase_order_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'processing', 'shipped', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."return_item_condition" AS ENUM('new_sealed', 'new_opened', 'used_good', 'used_damaged', 'defective');--> statement-breakpoint
CREATE TYPE "public"."return_reason" AS ENUM('defective', 'wrong_item', 'damaged', 'not_as_described', 'excess_stock', 'other');--> statement-breakpoint
CREATE TYPE "public"."sales_order_status" AS ENUM('pending', 'confirmed', 'processing', 'ready_to_ship', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded');--> statement-breakpoint
CREATE TYPE "public"."sales_payment_status" AS ENUM('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');--> statement-breakpoint
CREATE TYPE "public"."sales_return_reason" AS ENUM('defective', 'wrong_item', 'not_as_described', 'changed_mind', 'damaged_in_transit', 'missing_parts', 'quality_issue', 'other');--> statement-breakpoint
CREATE TYPE "public"."sales_return_status" AS ENUM('requested', 'approved', 'rejected', 'awaiting_shipment', 'shipped', 'received', 'inspecting', 'refunded', 'partially_refunded', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_order_payment_method" AS ENUM('in_person', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."service_order_payment_status" AS ENUM('pending', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."service_order_status" AS ENUM('pending', 'accepted', 'scheduled', 'in_progress', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."shipment_status" AS ENUM('pending', 'preparing', 'ready', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed_delivery', 'returned');--> statement-breakpoint
CREATE TYPE "public"."sifar_cart_status" AS ENUM('active', 'submitted', 'expired');--> statement-breakpoint
CREATE TYPE "public"."sifar_environment" AS ENUM('collaudo', 'produzione');--> statement-breakpoint
CREATE TYPE "public"."sla_severity" AS ENUM('in_time', 'late', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."smartphone_grade" AS ENUM('A+', 'A', 'B', 'C', 'D');--> statement-breakpoint
CREATE TYPE "public"."smartphone_storage" AS ENUM('16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB');--> statement-breakpoint
CREATE TYPE "public"."staff_module" AS ENUM('repairs', 'customers', 'products', 'inventory', 'repair_centers', 'services', 'suppliers', 'supplier_orders', 'appointments', 'invoices', 'tickets');--> statement-breakpoint
CREATE TYPE "public"."supplier_api_auth_method" AS ENUM('bearer_token', 'api_key_header', 'api_key_query', 'basic_auth', 'oauth2', 'none');--> statement-breakpoint
CREATE TYPE "public"."supplier_api_type" AS ENUM('foneday', 'ifixit', 'mobilax', 'sifar', 'generic_rest', 'custom');--> statement-breakpoint
CREATE TYPE "public"."supplier_communication_channel" AS ENUM('api', 'email', 'whatsapp', 'manual');--> statement-breakpoint
CREATE TYPE "public"."supplier_order_owner_type" AS ENUM('admin', 'reseller', 'sub_reseller', 'repair_center');--> statement-breakpoint
CREATE TYPE "public"."supplier_order_status" AS ENUM('draft', 'sent', 'confirmed', 'partially_shipped', 'shipped', 'partially_received', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."supplier_payment_terms" AS ENUM('immediate', 'cod', 'bank_transfer_15', 'bank_transfer_30', 'bank_transfer_60', 'bank_transfer_90', 'riba_30', 'riba_60', 'credit_card', 'paypal', 'custom');--> statement-breakpoint
CREATE TYPE "public"."supplier_return_status" AS ENUM('draft', 'requested', 'approved', 'shipped', 'received', 'refunded', 'rejected', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."supplier_sync_status" AS ENUM('pending', 'syncing', 'success', 'partial', 'failed');--> statement-breakpoint
CREATE TYPE "public"."ticket_target_type" AS ENUM('admin', 'reseller', 'repair_center');--> statement-breakpoint
CREATE TYPE "public"."ticket_type" AS ENUM('support', 'internal');--> statement-breakpoint
CREATE TYPE "public"."transfer_request_status" AS ENUM('pending', 'approved', 'rejected', 'shipped', 'received', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."transfer_requester_type" AS ENUM('repair_center', 'sub_reseller');--> statement-breakpoint
CREATE TYPE "public"."trovausati_api_type" AS ENUM('resellers', 'stores');--> statement-breakpoint
CREATE TYPE "public"."trovausati_coupon_status" AS ENUM('issued', 'used', 'cancelled', 'expired');--> statement-breakpoint
CREATE TYPE "public"."trovausati_order_status" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."utility_category" AS ENUM('fisso', 'mobile', 'centralino', 'luce', 'gas', 'altro');--> statement-breakpoint
CREATE TYPE "public"."utility_commission_status" AS ENUM('pending', 'accrued', 'invoiced', 'paid', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."utility_document_category" AS ENUM('contratto', 'documento_identita', 'codice_fiscale', 'bolletta', 'conferma_fornitore', 'fattura', 'altro');--> statement-breakpoint
CREATE TYPE "public"."utility_note_visibility" AS ENUM('internal', 'customer');--> statement-breakpoint
CREATE TYPE "public"."utility_practice_event_type" AS ENUM('created', 'status_change', 'document_uploaded', 'document_deleted', 'task_created', 'task_completed', 'note_added', 'assigned', 'comment', 'commissione_maturata', 'commissione_approvata', 'commissione_rifiutata');--> statement-breakpoint
CREATE TYPE "public"."utility_practice_priority" AS ENUM('bassa', 'normale', 'alta', 'urgente');--> statement-breakpoint
CREATE TYPE "public"."utility_practice_status" AS ENUM('bozza', 'inviata', 'in_lavorazione', 'attesa_documenti', 'completata', 'rifiutata', 'annullata');--> statement-breakpoint
CREATE TYPE "public"."utility_practice_task_status" AS ENUM('da_fare', 'in_corso', 'completato', 'annullato');--> statement-breakpoint
CREATE TYPE "public"."warehouse_movement_type" AS ENUM('carico', 'scarico', 'trasferimento_in', 'trasferimento_out', 'rettifica');--> statement-breakpoint
CREATE TYPE "public"."warehouse_owner_type" AS ENUM('admin', 'reseller', 'sub_reseller', 'repair_center');--> statement-breakpoint
CREATE TYPE "public"."warehouse_transfer_status" AS ENUM('pending', 'approved', 'shipped', 'received', 'cancelled');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'admin_staff' BEFORE 'reseller';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'reseller_staff' BEFORE 'repair_center';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'repair_center_staff' BEFORE 'customer';--> statement-breakpoint
CREATE TABLE "accessory_specs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"accessory_type" "accessory_type" NOT NULL,
	"is_universal" boolean DEFAULT false NOT NULL,
	"compatible_brands" text[],
	"compatible_models" text[],
	"material" text,
	"color" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "accessory_specs_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "accessory_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admin_settings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"setting_key" text NOT NULL,
	"setting_value" text NOT NULL,
	"description" text,
	"updated_by" varchar,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_settings_setting_key_unique" UNIQUE("setting_key")
);
--> statement-breakpoint
CREATE TABLE "admin_staff_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"admin_id" varchar NOT NULL,
	"module" "admin_module" NOT NULL,
	"can_read" boolean DEFAULT false NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_update" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "aesthetic_defects" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_return_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" varchar NOT NULL,
	"order_item_id" varchar,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" real NOT NULL,
	"total_price" real NOT NULL,
	"reason" text,
	"condition" "return_item_condition",
	"condition_notes" text,
	"restocked" boolean DEFAULT false,
	"restocked_at" timestamp,
	"restocked_quantity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "b2b_returns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_number" text NOT NULL,
	"order_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"status" "b2b_return_status" DEFAULT 'requested' NOT NULL,
	"reason" "b2b_return_reason" NOT NULL,
	"reason_details" text,
	"total_amount" real DEFAULT 0 NOT NULL,
	"credit_amount" real,
	"tracking_number" text,
	"carrier" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"completed_at" timestamp,
	"reseller_notes" text,
	"admin_notes" text,
	"rejection_reason" text,
	"inspection_notes" text,
	"shipping_label_path" text,
	"ddt_path" text,
	"documents_generated_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "b2b_returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "cart_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cart_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" real NOT NULL,
	"total_price" real NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"product_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "carts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar,
	"reseller_id" varchar NOT NULL,
	"session_id" varchar,
	"status" text DEFAULT 'active' NOT NULL,
	"subtotal" real DEFAULT 0 NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"shipping_cost" real DEFAULT 0 NOT NULL,
	"total" real DEFAULT 0 NOT NULL,
	"coupon_code" text,
	"notes" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_addresses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"label" text,
	"recipient_name" text NOT NULL,
	"phone" text,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"province" text NOT NULL,
	"postal_code" text NOT NULL,
	"country" text DEFAULT 'IT' NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"is_billing" boolean DEFAULT false NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_branches" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"parent_customer_id" varchar NOT NULL,
	"branch_code" text NOT NULL,
	"branch_name" text NOT NULL,
	"address" text,
	"city" text,
	"province" text,
	"postal_code" text,
	"contact_name" text,
	"contact_phone" text,
	"contact_email" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer_repair_centers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"customer_id" varchar NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "customer_repair_centers_customer_id_repair_center_id_unique" UNIQUE("customer_id","repair_center_id")
);
--> statement-breakpoint
CREATE TABLE "damaged_component_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_recovery_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"data_recovery_job_id" varchar NOT NULL,
	"event_type" "data_recovery_event_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"metadata" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "data_recovery_jobs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_number" text NOT NULL,
	"parent_repair_order_id" varchar NOT NULL,
	"diagnosis_id" varchar,
	"trigger_type" "data_recovery_trigger" DEFAULT 'manual' NOT NULL,
	"handling_type" "data_recovery_handling" NOT NULL,
	"status" "data_recovery_status" DEFAULT 'pending' NOT NULL,
	"device_description" text NOT NULL,
	"assigned_to_user_id" varchar,
	"assigned_to_group_id" varchar,
	"external_lab_id" varchar,
	"external_lab_job_ref" text,
	"shipping_document_url" text,
	"shipping_label_url" text,
	"tracking_number" text,
	"tracking_carrier" text,
	"shipped_at" timestamp,
	"received_at_lab_at" timestamp,
	"recovery_outcome" text,
	"recovered_data_description" text,
	"recovered_data_size" text,
	"recovered_data_media_type" text,
	"estimated_cost" integer,
	"final_cost" integer,
	"internal_notes" text,
	"customer_notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "data_recovery_jobs_job_number_unique" UNIQUE("job_number")
);
--> statement-breakpoint
CREATE TABLE "delivery_appointments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"reseller_id" varchar,
	"customer_id" varchar,
	"date" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"confirmed_by" varchar,
	"confirmed_at" timestamp,
	"cancelled_by" varchar,
	"cancelled_at" timestamp,
	"cancel_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_brands" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "device_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"model_name" text NOT NULL,
	"brand_id" varchar,
	"type_id" varchar,
	"reseller_id" varchar,
	"brand" text,
	"device_class" text,
	"market_code" text,
	"photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "diagnostic_findings" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "estimated_repair_times" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"hours_min" real NOT NULL,
	"hours_max" real NOT NULL,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "external_integrations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"logo_url" text,
	"is_active" boolean DEFAULT false NOT NULL,
	"config_fields" text,
	"default_api_endpoint" text,
	"default_auth_method" text,
	"supports_catalog" boolean DEFAULT false,
	"supports_ordering" boolean DEFAULT false,
	"supports_cart" boolean DEFAULT false,
	"docs_url" text,
	"display_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_integrations_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "external_labs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"address" text NOT NULL,
	"city" text NOT NULL,
	"phone" text,
	"email" text NOT NULL,
	"contact_person" text,
	"api_endpoint" text,
	"api_key" text,
	"supports_api_integration" boolean DEFAULT false NOT NULL,
	"tracking_prefix" text,
	"avg_turnaround_days" integer DEFAULT 7,
	"base_cost" integer,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "external_labs_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "foneday_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"api_token" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"last_test_at" timestamp,
	"test_status" text,
	"test_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foneday_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"foneday_order_number" text NOT NULL,
	"status" text NOT NULL,
	"shipment_method" text,
	"tracking_number" text,
	"total_incl_vat" integer NOT NULL,
	"paid" boolean DEFAULT false NOT NULL,
	"invoice_number" text,
	"amount_of_products" integer DEFAULT 0 NOT NULL,
	"total_products" integer DEFAULT 0 NOT NULL,
	"order_data" text,
	"foneday_created_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "foneday_products_cache" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"products_data" text NOT NULL,
	"total_products" integer DEFAULT 0 NOT NULL,
	"last_sync_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"sync_duration_ms" integer,
	"sync_status" text DEFAULT 'success' NOT NULL,
	"sync_error" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_absences" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"absence_type" "hr_absence_type" NOT NULL,
	"absence_date" timestamp NOT NULL,
	"expected_time" varchar(5),
	"actual_time" varchar(5),
	"minutes_lost" integer,
	"is_justified" boolean DEFAULT false,
	"auto_detected" boolean DEFAULT true,
	"related_clock_event_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_audit_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"user_id" varchar,
	"target_user_id" varchar,
	"action" "hr_audit_action" NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" varchar NOT NULL,
	"previous_data" jsonb,
	"new_data" jsonb,
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_certificates" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"certificate_type" "hr_certificate_type" NOT NULL,
	"related_sick_leave_id" varchar,
	"file_name" varchar(255) NOT NULL,
	"file_url" text NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp,
	"uploaded_by" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_clock_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"event_type" "hr_clock_event_type" NOT NULL,
	"event_time" timestamp NOT NULL,
	"latitude" real,
	"longitude" real,
	"accuracy" real,
	"device_info" text,
	"policy_id" varchar,
	"distance_from_location" real,
	"status" "hr_clock_event_status" DEFAULT 'valid' NOT NULL,
	"validated_by" varchar,
	"validated_at" timestamp,
	"validation_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_clocking_policies" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"location_name" varchar(200) NOT NULL,
	"latitude" real NOT NULL,
	"longitude" real NOT NULL,
	"radius_meters" integer DEFAULT 100 NOT NULL,
	"requires_geolocation" boolean DEFAULT true,
	"allow_manual_entry" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_expense_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expense_report_id" varchar NOT NULL,
	"expense_date" timestamp NOT NULL,
	"category" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"amount" real NOT NULL,
	"receipt_url" text,
	"receipt_file_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_expense_reports" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"report_number" varchar(50),
	"title" varchar(200) NOT NULL,
	"description" text,
	"total_amount" real DEFAULT 0 NOT NULL,
	"status" "hr_expense_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"paid_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_justifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"absence_id" varchar NOT NULL,
	"user_id" varchar NOT NULL,
	"justification_text" text NOT NULL,
	"status" "hr_justification_status" DEFAULT 'pending' NOT NULL,
	"reviewed_by" varchar,
	"reviewed_at" timestamp,
	"review_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_leave_balances" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"leave_type" "hr_leave_type" NOT NULL,
	"year" integer NOT NULL,
	"accrued" real DEFAULT 0 NOT NULL,
	"used" real DEFAULT 0 NOT NULL,
	"pending" real DEFAULT 0 NOT NULL,
	"carried_over" real DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_leave_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"leave_type" "hr_leave_type" NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"is_full_day" boolean DEFAULT true NOT NULL,
	"total_hours" real NOT NULL,
	"total_days" real NOT NULL,
	"reason" text,
	"status" "hr_leave_request_status" DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_notifications" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"recipient_id" varchar,
	"channel" "hr_notification_channel" NOT NULL,
	"subject" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_broadcast" boolean DEFAULT false,
	"target_filters" jsonb,
	"sent_at" timestamp,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_sick_leaves" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"protocol_number" varchar(50),
	"certificate_required" boolean DEFAULT true,
	"certificate_uploaded" boolean DEFAULT false,
	"certificate_deadline" timestamp,
	"validated_by" varchar,
	"validated_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_work_profile_assignments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"work_profile_id" varchar NOT NULL,
	"valid_from" timestamp DEFAULT now() NOT NULL,
	"valid_to" timestamp,
	"assigned_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_work_profile_versions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"work_profile_id" varchar NOT NULL,
	"version_number" integer NOT NULL,
	"weekly_hours" real NOT NULL,
	"daily_hours" real NOT NULL,
	"work_days" jsonb NOT NULL,
	"break_minutes" integer,
	"tolerance_minutes" integer,
	"valid_from" timestamp NOT NULL,
	"valid_to" timestamp,
	"changed_by" varchar,
	"change_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "hr_work_profiles" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"weekly_hours" real NOT NULL,
	"daily_hours" real NOT NULL,
	"work_days" jsonb NOT NULL,
	"start_time" varchar(5),
	"end_time" varchar(5),
	"break_minutes" integer DEFAULT 60,
	"tolerance_minutes" integer DEFAULT 15,
	"is_default" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"source_type" varchar(20),
	"source_entity_id" varchar,
	"is_synced" boolean DEFAULT false,
	"auto_sync_disabled" boolean DEFAULT false,
	"last_synced_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "issue_types" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"buyer_reseller_id" varchar NOT NULL,
	"seller_reseller_id" varchar NOT NULL,
	"status" "marketplace_order_status" DEFAULT 'pending' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"shipping_cost" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"payment_method" "b2b_payment_method" DEFAULT 'bank_transfer',
	"payment_reference" text,
	"payment_confirmed_at" timestamp,
	"payment_confirmed_by" varchar,
	"buyer_notes" text,
	"seller_notes" text,
	"rejection_reason" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"shipped_at" timestamp,
	"shipped_by" varchar,
	"tracking_number" text,
	"tracking_carrier" text,
	"received_at" timestamp,
	"warehouse_transfer_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "marketplace_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "mobilesentrix_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"consumer_name" text NOT NULL,
	"consumer_key" text NOT NULL,
	"consumer_secret" text NOT NULL,
	"environment" text DEFAULT 'production' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp,
	"last_test_at" timestamp,
	"test_status" text,
	"test_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobilesentrix_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"mobilesentrix_order_id" text NOT NULL,
	"order_number" text,
	"status" text NOT NULL,
	"total_amount" integer NOT NULL,
	"currency" text DEFAULT 'USD',
	"shipping_method" text,
	"tracking_number" text,
	"order_data" text,
	"mobilesentrix_created_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"purchase_order_id" varchar,
	"product_id" varchar,
	"part_name" text NOT NULL,
	"part_number" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_cost" integer,
	"supplier" text,
	"status" "parts_order_status" DEFAULT 'ordered' NOT NULL,
	"ordered_at" timestamp DEFAULT now() NOT NULL,
	"expected_arrival" timestamp,
	"received_at" timestamp,
	"ordered_by" varchar NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "parts_purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"order_number" text NOT NULL,
	"destination_type" "parts_purchase_destination" NOT NULL,
	"supplier_name" text,
	"supplier_id" varchar,
	"source_warehouse_id" varchar,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"status" "parts_purchase_order_status" DEFAULT 'draft' NOT NULL,
	"expected_arrival" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "parts_purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "product_device_compatibilities" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"device_brand_id" varchar NOT NULL,
	"device_model_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_prices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"price_cents" integer NOT NULL,
	"cost_price_cents" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"supplier_id" varchar NOT NULL,
	"supplier_code" text,
	"supplier_name" text,
	"purchase_price" integer,
	"min_order_qty" integer DEFAULT 1,
	"pack_size" integer DEFAULT 1,
	"lead_time_days" integer,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "promotions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_b2b_return_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" varchar NOT NULL,
	"order_item_id" varchar,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer NOT NULL,
	"unit_price" real NOT NULL,
	"return_reason" text,
	"condition" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rc_b2b_returns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_number" text NOT NULL,
	"order_id" varchar NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"status" "rc_b2b_return_status" DEFAULT 'requested' NOT NULL,
	"reason" "rc_b2b_return_reason" NOT NULL,
	"reason_details" text,
	"total_amount" real DEFAULT 0 NOT NULL,
	"credit_amount" real,
	"tracking_number" text,
	"carrier" text,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"completed_at" timestamp,
	"repair_center_notes" text,
	"reseller_notes" text,
	"rejection_reason" text,
	"inspection_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rc_b2b_returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "remote_repair_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" text NOT NULL,
	"customer_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"sub_reseller_id" varchar,
	"requested_center_id" varchar,
	"assigned_center_id" varchar,
	"device_type" text NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"device_model_id" varchar,
	"imei" text,
	"serial" text,
	"issue_description" text NOT NULL,
	"photos" text[],
	"status" "remote_repair_request_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"forwarded_from" varchar,
	"forward_reason" text,
	"customer_address" text,
	"customer_city" text,
	"customer_cap" text,
	"customer_province" text,
	"courier_name" text,
	"tracking_number" text,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"repair_order_id" varchar,
	"customer_notes" text,
	"center_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "remote_repair_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "repair_acceptance" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"declared_defects" text[],
	"aesthetic_condition" text,
	"aesthetic_notes" text,
	"aesthetic_photos_mandatory" boolean DEFAULT false NOT NULL,
	"accessories" text[],
	"lock_code" text,
	"lock_pattern" text,
	"has_lock_code" boolean,
	"accessories_removed" boolean,
	"accepted_by" varchar NOT NULL,
	"accepted_at" timestamp DEFAULT now() NOT NULL,
	"label_document_url" text,
	CONSTRAINT "repair_acceptance_repair_order_id_unique" UNIQUE("repair_order_id")
);
--> statement-breakpoint
CREATE TABLE "repair_attachments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_type" text NOT NULL,
	"file_size" integer NOT NULL,
	"uploaded_by" varchar NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_center_availability" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"weekday" integer NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"slot_duration_minutes" integer DEFAULT 30 NOT NULL,
	"capacity_per_slot" integer DEFAULT 1 NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_center_blackouts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"date" text NOT NULL,
	"start_time" text,
	"end_time" text,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_center_purchase_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_center_purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"status" "reseller_purchase_order_status" DEFAULT 'pending' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"shipping_cost" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"payment_method" "b2b_payment_method" DEFAULT 'bank_transfer',
	"payment_reference" text,
	"payment_confirmed_at" timestamp,
	"notes" text,
	"rejection_reason" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"shipped_at" timestamp,
	"tracking_number" text,
	"carrier" text,
	"delivered_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repair_center_purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "repair_delivery" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"delivered_to" text NOT NULL,
	"delivery_method" text DEFAULT 'in_store' NOT NULL,
	"signature_data" text,
	"id_document_type" text,
	"id_document_number" text,
	"id_document_photo" text,
	"notes" text,
	"customer_signature" text,
	"customer_signer_name" text,
	"customer_signed_at" timestamp,
	"technician_signature" text,
	"technician_signer_name" text,
	"technician_signed_at" timestamp,
	"delivered_by" varchar NOT NULL,
	"delivered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repair_delivery_repair_order_id_unique" UNIQUE("repair_order_id")
);
--> statement-breakpoint
CREATE TABLE "repair_diagnostics" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"technical_diagnosis" text NOT NULL,
	"damaged_components" text[],
	"estimated_repair_time" real,
	"requires_external_parts" boolean DEFAULT false NOT NULL,
	"diagnosis_notes" text,
	"photos" text[],
	"skip_photos" boolean DEFAULT false NOT NULL,
	"finding_ids" text[],
	"component_ids" text[],
	"estimated_repair_time_id" varchar,
	"diagnosis_outcome" "diagnosis_outcome" DEFAULT 'riparabile',
	"unrepairable_reason_id" varchar,
	"unrepairable_reason_other" text,
	"customer_data_important" boolean DEFAULT false,
	"suggested_promotion_ids" text[],
	"suggested_device_ids" text[],
	"data_recovery_requested" boolean DEFAULT false,
	"diagnosed_by" varchar NOT NULL,
	"diagnosed_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repair_diagnostics_repair_order_id_unique" UNIQUE("repair_order_id")
);
--> statement-breakpoint
CREATE TABLE "repair_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"log_type" "repair_log_type" NOT NULL,
	"description" text NOT NULL,
	"technician_id" varchar NOT NULL,
	"hours_worked" integer,
	"parts_used" text,
	"test_results" text,
	"photos" text[],
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "repair_order_state_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"status" "repair_status" NOT NULL,
	"entered_at" timestamp DEFAULT now() NOT NULL,
	"exited_at" timestamp,
	"duration_minutes" integer,
	"changed_by" varchar
);
--> statement-breakpoint
CREATE TABLE "repair_quotes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"quote_number" text NOT NULL,
	"parts" text,
	"labor_cost" integer DEFAULT 0 NOT NULL,
	"total_amount" integer NOT NULL,
	"status" "quote_status" DEFAULT 'draft' NOT NULL,
	"valid_until" timestamp,
	"notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repair_quotes_repair_order_id_unique" UNIQUE("repair_order_id"),
	CONSTRAINT "repair_quotes_quote_number_unique" UNIQUE("quote_number")
);
--> statement-breakpoint
CREATE TABLE "repair_test_checklist" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_order_id" varchar NOT NULL,
	"display_test" boolean,
	"touch_test" boolean,
	"battery_test" boolean,
	"audio_test" boolean,
	"camera_test" boolean,
	"connectivity_test" boolean,
	"buttons_test" boolean,
	"sensors_test" boolean,
	"charging_test" boolean,
	"software_test" boolean,
	"overall_result" boolean,
	"notes" text,
	"tested_by" varchar NOT NULL,
	"tested_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "repair_test_checklist_repair_order_id_unique" UNIQUE("repair_order_id")
);
--> statement-breakpoint
CREATE TABLE "reseller_device_brands" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"name" text NOT NULL,
	"logo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reseller_device_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"model_name" text NOT NULL,
	"brand_id" varchar,
	"reseller_brand_id" varchar,
	"brand_name" text,
	"type_id" varchar,
	"photo_url" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reseller_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"custom_price_cents" integer,
	"b2b_price_cents" integer,
	"minimum_order_quantity" integer DEFAULT 1,
	"inherited_from" varchar,
	"can_override_price" boolean DEFAULT true NOT NULL,
	"can_unpublish" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reseller_purchase_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"product_image" text,
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"shipped_quantity" integer,
	"received_quantity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reseller_purchase_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"reseller_id" varchar NOT NULL,
	"status" "reseller_purchase_order_status" DEFAULT 'draft' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"shipping_cost" integer DEFAULT 0 NOT NULL,
	"total" integer DEFAULT 0 NOT NULL,
	"payment_method" "b2b_payment_method" DEFAULT 'bank_transfer',
	"payment_reference" text,
	"payment_confirmed_at" timestamp,
	"payment_confirmed_by" varchar,
	"reseller_notes" text,
	"admin_notes" text,
	"rejection_reason" text,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"shipped_at" timestamp,
	"shipped_by" varchar,
	"tracking_number" text,
	"tracking_carrier" text,
	"received_at" timestamp,
	"warehouse_transfer_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "reseller_purchase_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "reseller_staff_permissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"module" "staff_module" NOT NULL,
	"can_read" boolean DEFAULT false NOT NULL,
	"can_create" boolean DEFAULT false NOT NULL,
	"can_update" boolean DEFAULT false NOT NULL,
	"can_delete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" text,
	"product_image" text,
	"quantity" integer NOT NULL,
	"unit_price" real NOT NULL,
	"discount" real DEFAULT 0 NOT NULL,
	"total_price" real NOT NULL,
	"inventory_reserved" boolean DEFAULT false NOT NULL,
	"inventory_deducted" boolean DEFAULT false NOT NULL,
	"product_snapshot" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_payments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"order_type" "payment_order_type" DEFAULT 'b2c' NOT NULL,
	"order_number" text,
	"method" "payment_method" NOT NULL,
	"status" "sales_payment_status" DEFAULT 'pending' NOT NULL,
	"amount" real NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"transaction_id" text,
	"gateway_reference" text,
	"gateway_response" text,
	"paid_at" timestamp,
	"failed_at" timestamp,
	"refunded_at" timestamp,
	"refund_amount" real,
	"refund_reason" text,
	"notes" text,
	"confirmed_by" varchar,
	"reseller_id" varchar,
	"reseller_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_return_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_id" varchar NOT NULL,
	"order_item_id" varchar,
	"product_id" varchar,
	"product_name" text NOT NULL,
	"product_sku" text,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" real NOT NULL,
	"refund_amount" real,
	"reason" text,
	"condition" "return_item_condition",
	"condition_notes" text,
	"restocked" boolean DEFAULT false,
	"restocked_at" timestamp,
	"restocked_quantity" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_returns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_number" text NOT NULL,
	"order_id" varchar NOT NULL,
	"reseller_id" varchar,
	"customer_id" varchar,
	"status" "sales_return_status" DEFAULT 'requested' NOT NULL,
	"reason" "sales_return_reason" NOT NULL,
	"reason_details" text,
	"total_amount" real DEFAULT 0 NOT NULL,
	"refund_amount" real,
	"refund_method" "refund_method",
	"tracking_number" text,
	"carrier" "carrier",
	"shipping_cost" real,
	"customer_pays_shipping" boolean DEFAULT false,
	"requested_at" timestamp DEFAULT now() NOT NULL,
	"approved_at" timestamp,
	"rejected_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"inspected_at" timestamp,
	"refunded_at" timestamp,
	"customer_notes" text,
	"internal_notes" text,
	"rejection_reason" text,
	"inspection_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_order_returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "sales_order_shipments" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"status" "shipment_status" DEFAULT 'pending' NOT NULL,
	"carrier" "carrier",
	"carrier_name" text,
	"tracking_number" text,
	"tracking_url" text,
	"weight" real,
	"length" real,
	"width" real,
	"height" real,
	"shipping_cost" real,
	"insurance_value" real,
	"prepared_at" timestamp,
	"picked_up_at" timestamp,
	"delivered_at" timestamp,
	"estimated_delivery" timestamp,
	"delivery_signature" text,
	"delivery_photo" text,
	"delivery_notes" text,
	"label_url" text,
	"manifest_id" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_order_state_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"from_status" text,
	"to_status" text NOT NULL,
	"changed_by" varchar,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"branch_id" varchar,
	"status" "sales_order_status" DEFAULT 'pending' NOT NULL,
	"delivery_type" "delivery_type" DEFAULT 'shipping' NOT NULL,
	"subtotal" real NOT NULL,
	"discount_amount" real DEFAULT 0 NOT NULL,
	"discount_code" text,
	"shipping_cost" real DEFAULT 0 NOT NULL,
	"tax_amount" real DEFAULT 0 NOT NULL,
	"total" real NOT NULL,
	"shipping_address_id" varchar,
	"shipping_recipient" text,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_province" text,
	"shipping_postal_code" text,
	"shipping_country" text DEFAULT 'IT',
	"shipping_phone" text,
	"billing_address_id" varchar,
	"billing_recipient" text,
	"billing_address" text,
	"billing_city" text,
	"billing_province" text,
	"billing_postal_code" text,
	"billing_country" text DEFAULT 'IT',
	"customer_notes" text,
	"internal_notes" text,
	"estimated_delivery" timestamp,
	"confirmed_at" timestamp,
	"shipped_at" timestamp,
	"delivered_at" timestamp,
	"cancelled_at" timestamp,
	"cancellation_reason" text,
	"source" text DEFAULT 'web',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sales_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "service_item_prices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"service_item_id" varchar NOT NULL,
	"reseller_id" varchar,
	"repair_center_id" varchar,
	"price_cents" integer NOT NULL,
	"labor_minutes" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "service_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" text NOT NULL,
	"device_type_id" varchar,
	"default_price_cents" integer NOT NULL,
	"default_labor_minutes" integer DEFAULT 60 NOT NULL,
	"created_by" varchar,
	"repair_center_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_items_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "service_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"customer_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"repair_center_id" varchar,
	"service_item_id" varchar NOT NULL,
	"price_cents" integer NOT NULL,
	"device_type" text,
	"device_model_id" varchar,
	"brand" text,
	"model" text,
	"imei" text,
	"serial" text,
	"issue_description" text,
	"customer_notes" text,
	"internal_notes" text,
	"status" "service_order_status" DEFAULT 'pending' NOT NULL,
	"payment_method" "service_order_payment_method" NOT NULL,
	"payment_status" "service_order_payment_status" DEFAULT 'pending' NOT NULL,
	"delivery_method" text,
	"shipping_address" text,
	"shipping_city" text,
	"shipping_cap" text,
	"shipping_province" text,
	"courier_name" text,
	"tracking_number" text,
	"shipped_at" timestamp,
	"device_received_at" timestamp,
	"ddt_url" text,
	"repair_order_id" varchar,
	"accepted_at" timestamp,
	"scheduled_at" timestamp,
	"completed_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "service_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "shipment_tracking_events" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shipment_id" varchar NOT NULL,
	"status" text NOT NULL,
	"status_code" text,
	"description" text,
	"location" text,
	"event_at" timestamp NOT NULL,
	"raw_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sifar_carts" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"store_id" varchar NOT NULL,
	"status" "sifar_cart_status" DEFAULT 'active' NOT NULL,
	"items_count" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"cart_data" text,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sifar_catalog" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_articolo" text NOT NULL,
	"ean" text,
	"descrizione" text NOT NULL,
	"marca" text,
	"modello" text,
	"categoria" text,
	"gruppo" text,
	"prezzo_netto" integer,
	"aliquota_iva" integer DEFAULT 22,
	"disponibile" boolean DEFAULT false NOT NULL,
	"giacenza" integer,
	"contatta_per_ordinare" boolean DEFAULT false,
	"image_url" text,
	"qualita" text,
	"mesi_garanzia" integer DEFAULT 0,
	"last_sync_at" timestamp DEFAULT now() NOT NULL,
	"raw_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sifar_catalog_codice_articolo_unique" UNIQUE("codice_articolo")
);
--> statement-breakpoint
CREATE TABLE "sifar_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"client_key" text NOT NULL,
	"allowed_ip" text,
	"partner_code" text,
	"environment" "sifar_environment" DEFAULT 'collaudo' NOT NULL,
	"default_courier_id" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_test_at" timestamp,
	"last_test_result" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sifar_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"codice_modello" text NOT NULL,
	"descrizione" text NOT NULL,
	"codice_marca" text NOT NULL,
	"nome_marca" text,
	"image_url" text,
	"last_sync_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sifar_models_codice_modello_unique" UNIQUE("codice_modello")
);
--> statement-breakpoint
CREATE TABLE "sifar_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"store_id" varchar NOT NULL,
	"sifar_order_id" text,
	"sifar_order_number" text,
	"subtotal_cents" integer NOT NULL,
	"shipping_cents" integer DEFAULT 0,
	"tax_cents" integer DEFAULT 0,
	"total_cents" integer NOT NULL,
	"courier_id" text,
	"courier_name" text,
	"tracking_number" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"order_data" text,
	"supplier_order_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sifar_product_compatibility" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"catalog_id" varchar NOT NULL,
	"model_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sifar_stores" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"store_code" text NOT NULL,
	"store_name" text NOT NULL,
	"branch_id" varchar,
	"repair_center_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "smartphone_specs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" varchar NOT NULL,
	"storage" "smartphone_storage",
	"ram" text,
	"screen_size" text,
	"battery_health" text,
	"grade" "smartphone_grade",
	"network_lock" "network_lock" DEFAULT 'unlocked',
	"imei" text,
	"imei2" text,
	"serial_number" text,
	"original_box" boolean DEFAULT false NOT NULL,
	"accessories" text[],
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "smartphone_specs_product_id_unique" UNIQUE("product_id")
);
--> statement-breakpoint
CREATE TABLE "staff_repair_centers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" varchar NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_repair_centers_staff_id_repair_center_id_unique" UNIQUE("staff_id","repair_center_id")
);
--> statement-breakpoint
CREATE TABLE "staff_sub_resellers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"staff_id" varchar NOT NULL,
	"sub_reseller_id" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "staff_sub_resellers_staff_id_sub_reseller_id_unique" UNIQUE("staff_id","sub_reseller_id")
);
--> statement-breakpoint
CREATE TABLE "stock_reservations" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"order_item_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"reseller_id" varchar NOT NULL,
	"repair_center_id" varchar,
	"quantity" integer NOT NULL,
	"status" text DEFAULT 'reserved' NOT NULL,
	"reserved_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"committed_at" timestamp,
	"released_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "supplier_catalog_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"external_sku" text NOT NULL,
	"external_ean" text,
	"external_artcode" text,
	"title" text NOT NULL,
	"description" text,
	"category" text,
	"brand" text,
	"model_brand" text,
	"model_codes" text,
	"suitable_for" text,
	"quality" text,
	"price_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR',
	"in_stock" boolean DEFAULT false NOT NULL,
	"stock_quantity" integer,
	"image_url" text,
	"thumbnail_url" text,
	"raw_data" text,
	"last_sync_at" timestamp DEFAULT now() NOT NULL,
	"linked_product_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_communication_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"communication_type" "communication_type" NOT NULL,
	"channel" "supplier_communication_channel" NOT NULL,
	"entity_type" text,
	"entity_id" varchar,
	"subject" text,
	"content" text NOT NULL,
	"sent_at" timestamp,
	"delivered_at" timestamp,
	"read_at" timestamp,
	"failed_at" timestamp,
	"failure_reason" text,
	"response_content" text,
	"response_received_at" timestamp,
	"metadata" text,
	"created_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_order_id" varchar NOT NULL,
	"product_id" varchar,
	"supplier_code" text,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"quantity_received" integer DEFAULT 0 NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"supplier_id" varchar NOT NULL,
	"owner_type" "supplier_order_owner_type" DEFAULT 'repair_center',
	"owner_id" varchar,
	"repair_center_id" varchar,
	"target_warehouse_id" varchar,
	"status" "supplier_order_status" DEFAULT 'draft' NOT NULL,
	"subtotal" integer DEFAULT 0 NOT NULL,
	"shipping_cost" integer DEFAULT 0,
	"tax_amount" integer DEFAULT 0,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"expected_delivery" timestamp,
	"sent_at" timestamp,
	"confirmed_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"tracking_number" text,
	"tracking_carrier" text,
	"repair_order_id" varchar,
	"notes" text,
	"internal_notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_orders_order_number_unique" UNIQUE("order_number")
);
--> statement-breakpoint
CREATE TABLE "supplier_return_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_return_id" varchar NOT NULL,
	"product_id" varchar,
	"supplier_order_item_id" varchar,
	"supplier_code" text,
	"description" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" integer NOT NULL,
	"total_price" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "supplier_return_state_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_return_id" varchar NOT NULL,
	"status" text NOT NULL,
	"entered_at" timestamp DEFAULT now() NOT NULL,
	"exited_at" timestamp,
	"duration_minutes" integer,
	"changed_by" varchar
);
--> statement-breakpoint
CREATE TABLE "supplier_returns" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"return_number" text NOT NULL,
	"supplier_id" varchar NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"supplier_order_id" varchar,
	"status" "supplier_return_status" DEFAULT 'draft' NOT NULL,
	"reason" "return_reason" NOT NULL,
	"reason_details" text,
	"total_amount" integer DEFAULT 0 NOT NULL,
	"refund_amount" integer,
	"requested_at" timestamp,
	"approved_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"refunded_at" timestamp,
	"tracking_number" text,
	"tracking_carrier" text,
	"rma_number" text,
	"notes" text,
	"internal_notes" text,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supplier_returns_return_number_unique" UNIQUE("return_number")
);
--> statement-breakpoint
CREATE TABLE "supplier_sync_logs" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"status" "supplier_sync_status" NOT NULL,
	"products_total" integer DEFAULT 0,
	"products_created" integer DEFAULT 0,
	"products_updated" integer DEFAULT 0,
	"products_failed" integer DEFAULT 0,
	"duration_ms" integer,
	"error_message" text,
	"error_details" text,
	"triggered_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"created_by" varchar,
	"email" text,
	"phone" text,
	"whatsapp" text,
	"website" text,
	"address" text,
	"city" text,
	"zip_code" text,
	"country" text DEFAULT 'IT',
	"vat_number" text,
	"fiscal_code" text,
	"communication_channel" "supplier_communication_channel" DEFAULT 'email' NOT NULL,
	"api_type" "supplier_api_type",
	"api_endpoint" text,
	"api_secret_name" text,
	"api_auth_method" "supplier_api_auth_method" DEFAULT 'bearer_token',
	"api_format" text DEFAULT 'json',
	"api_products_endpoint" text,
	"api_orders_endpoint" text,
	"api_cart_endpoint" text,
	"api_invoices_endpoint" text,
	"catalog_sync_enabled" boolean DEFAULT false,
	"catalog_sync_status" "supplier_sync_status",
	"catalog_last_sync_at" timestamp,
	"catalog_products_count" integer DEFAULT 0,
	"order_email_template" text,
	"return_email_template" text,
	"payment_terms" "supplier_payment_terms" DEFAULT 'bank_transfer_30',
	"delivery_days" integer DEFAULT 3,
	"min_order_amount" integer,
	"shipping_cost" integer,
	"free_shipping_threshold" integer,
	"internal_notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "transfer_request_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"requested_quantity" integer NOT NULL,
	"approved_quantity" integer,
	"shipped_quantity" integer,
	"received_quantity" integer
);
--> statement-breakpoint
CREATE TABLE "transfer_requests" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_number" text NOT NULL,
	"requester_type" "transfer_requester_type" NOT NULL,
	"requester_id" varchar NOT NULL,
	"requester_warehouse_id" varchar NOT NULL,
	"source_warehouse_id" varchar NOT NULL,
	"target_reseller_id" varchar,
	"status" "transfer_request_status" DEFAULT 'pending' NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejection_reason" text,
	"shipped_at" timestamp,
	"shipped_by" varchar,
	"tracking_number" text,
	"tracking_carrier" text,
	"ddt_number" text,
	"received_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "transfer_requests_request_number_unique" UNIQUE("request_number")
);
--> statement-breakpoint
CREATE TABLE "trovausati_coupons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"shop_id" varchar,
	"coupon_code" text NOT NULL,
	"barcode" text,
	"value_cents" integer NOT NULL,
	"status" "trovausati_coupon_status" DEFAULT 'issued' NOT NULL,
	"brand" text,
	"model" text,
	"imei_or_sn" text,
	"consumed_at" timestamp,
	"consumed_shop_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trovausati_credentials" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reseller_id" varchar NOT NULL,
	"api_type" "trovausati_api_type" DEFAULT 'resellers' NOT NULL,
	"api_key" text,
	"marketplace_api_key" text,
	"marketplace_id" text,
	"stores_api_key" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"last_test_at" timestamp,
	"last_test_result" text,
	"stores_is_active" boolean DEFAULT false NOT NULL,
	"stores_last_test_at" timestamp,
	"stores_last_test_result" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trovausati_models" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"external_id" integer NOT NULL,
	"brand" text NOT NULL,
	"model" text NOT NULL,
	"model_base" text,
	"variant" text,
	"device_type" text,
	"label" text,
	"image_url" text,
	"price_never_used" integer,
	"price_great" integer,
	"price_good" integer,
	"price_average" integer,
	"price_shop" integer,
	"price_public" integer,
	"last_sync_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trovausati_orders" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"external_order_id" text NOT NULL,
	"reference" text,
	"status" "trovausati_order_status" DEFAULT 'pending' NOT NULL,
	"total_products" integer DEFAULT 0 NOT NULL,
	"total_cents" integer DEFAULT 0 NOT NULL,
	"carrier_code" text,
	"tracking_code" text,
	"shipping_pdf_url" text,
	"address_data" text,
	"products_data" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trovausati_shops" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"shop_id" text NOT NULL,
	"shop_name" text NOT NULL,
	"branch_id" varchar,
	"repair_center_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "unrepairable_reasons" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"device_type_id" varchar,
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_categories" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"icon" text,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "utility_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "utility_commissions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"period_month" integer NOT NULL,
	"period_year" integer NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" "utility_commission_status" DEFAULT 'pending' NOT NULL,
	"accrued_at" timestamp,
	"invoiced_at" timestamp,
	"paid_at" timestamp,
	"approved_by" varchar,
	"approved_at" timestamp,
	"rejected_by" varchar,
	"rejected_at" timestamp,
	"rejected_reason" text,
	"invoice_number" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practice_documents" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"object_key" text NOT NULL,
	"file_name" text NOT NULL,
	"file_size" integer NOT NULL,
	"mime_type" text,
	"category" "utility_document_category" DEFAULT 'altro' NOT NULL,
	"description" text,
	"uploaded_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practice_notes" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"body" text NOT NULL,
	"visibility" "utility_note_visibility" DEFAULT 'internal' NOT NULL,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practice_products" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price_cents" integer NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practice_state_history" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"from_status" "utility_practice_status",
	"to_status" "utility_practice_status" NOT NULL,
	"reason" text,
	"changed_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practice_tasks" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"status" "utility_practice_task_status" DEFAULT 'da_fare' NOT NULL,
	"assigned_to" varchar,
	"due_date" timestamp,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_by" varchar NOT NULL,
	"completed_at" timestamp,
	"completed_by" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practice_timeline" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" varchar NOT NULL,
	"event_type" "utility_practice_event_type" NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"payload" jsonb,
	"created_by" varchar NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_practices" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_number" text NOT NULL,
	"item_type" text DEFAULT 'service' NOT NULL,
	"service_id" varchar,
	"custom_service_name" text,
	"product_id" varchar,
	"supplier_id" varchar,
	"temporary_supplier_name" text,
	"customer_id" varchar,
	"temporary_customer_name" text,
	"temporary_customer_email" text,
	"temporary_customer_phone" text,
	"reseller_id" varchar,
	"repair_center_id" varchar,
	"status" "utility_practice_status" DEFAULT 'bozza' NOT NULL,
	"priority" "utility_practice_priority" DEFAULT 'normale' NOT NULL,
	"assigned_to" varchar,
	"supplier_reference" text,
	"external_identifiers" jsonb,
	"communication_channel" text,
	"submitted_at" timestamp,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"expected_activation_date" timestamp,
	"go_live_date" timestamp,
	"contract_end_date" timestamp,
	"sla_due_at" timestamp,
	"price_type" text DEFAULT 'mensile' NOT NULL,
	"monthly_price_cents" integer,
	"flat_price_cents" integer,
	"activation_fee_cents" integer,
	"commission_amount_cents" integer,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "utility_practices_practice_number_unique" UNIQUE("practice_number")
);
--> statement-breakpoint
CREATE TABLE "utility_services" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"supplier_id" varchar NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"category" "utility_category" NOT NULL,
	"price_type" text DEFAULT 'mensile',
	"monthly_price_cents" integer,
	"flat_price_cents" integer,
	"activation_fee_cents" integer,
	"commission_percent" real,
	"commission_fixed" integer,
	"commission_one_time" integer,
	"contract_months" integer DEFAULT 24,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "utility_suppliers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" text NOT NULL,
	"name" text NOT NULL,
	"reseller_id" varchar,
	"category" "utility_category" NOT NULL,
	"email" text,
	"phone" text,
	"referent_name" text,
	"referent_phone" text,
	"referent_email" text,
	"portal_url" text,
	"portal_username" text,
	"default_commission_percent" real,
	"default_commission_fixed" integer,
	"payment_terms_days" integer DEFAULT 30,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "utility_suppliers_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "warehouse_movements" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"movement_type" "warehouse_movement_type" NOT NULL,
	"quantity" integer NOT NULL,
	"reference_type" text,
	"reference_id" varchar,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"created_by" varchar NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouse_stock" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"warehouse_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"quantity" integer DEFAULT 0 NOT NULL,
	"min_stock" integer DEFAULT 0,
	"location" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_stock_warehouse_id_product_id_unique" UNIQUE("warehouse_id","product_id")
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfer_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"requested_quantity" integer NOT NULL,
	"shipped_quantity" integer,
	"received_quantity" integer
);
--> statement-breakpoint
CREATE TABLE "warehouse_transfers" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transfer_number" text NOT NULL,
	"source_warehouse_id" varchar NOT NULL,
	"destination_warehouse_id" varchar NOT NULL,
	"status" "warehouse_transfer_status" DEFAULT 'pending' NOT NULL,
	"requested_by" varchar NOT NULL,
	"approved_by" varchar,
	"approved_at" timestamp,
	"shipped_at" timestamp,
	"received_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "warehouse_transfers_transfer_number_unique" UNIQUE("transfer_number")
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "warehouse_owner_type" NOT NULL,
	"owner_id" varchar NOT NULL,
	"name" text NOT NULL,
	"address" text,
	"notes" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "repair_order_state_history" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "repair_orders" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "repair_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::text;--> statement-breakpoint
DROP TYPE "public"."repair_status";--> statement-breakpoint
CREATE TYPE "public"."repair_status" AS ENUM('pending', 'ingressato', 'in_diagnosi', 'preventivo_emesso', 'preventivo_accettato', 'preventivo_rifiutato', 'attesa_ricambi', 'in_riparazione', 'in_test', 'pronto_ritiro', 'consegnato', 'cancelled');--> statement-breakpoint
ALTER TABLE "repair_order_state_history" ALTER COLUMN "status" SET DATA TYPE "public"."repair_status" USING "status"::"public"."repair_status";--> statement-breakpoint
ALTER TABLE "repair_orders" ALTER COLUMN "status" SET DEFAULT 'pending'::"public"."repair_status";--> statement-breakpoint
ALTER TABLE "repair_orders" ALTER COLUMN "status" SET DATA TYPE "public"."repair_status" USING "status"::"public"."repair_status";--> statement-breakpoint
ALTER TABLE "billing_data" ADD COLUMN "customer_type" "customer_type" DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "billing_data" ADD COLUMN "pec" text;--> statement-breakpoint
ALTER TABLE "billing_data" ADD COLUMN "codice_univoco" text;--> statement-breakpoint
ALTER TABLE "billing_data" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "billing_data" ADD COLUMN "google_place_id" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "product_type" "product_type" DEFAULT 'ricambio' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "device_type_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "compatible_models" text[];--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "color" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "cost_price" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "condition" "product_condition" DEFAULT 'nuovo' NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "warranty_months" integer DEFAULT 3;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "supplier" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "supplier_code" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "min_stock" integer DEFAULT 5;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "created_by" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "repair_center_id" varchar;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "image_url" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_visible_in_shop" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_marketplace_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "marketplace_price_cents" integer;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "marketplace_min_quantity" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "cap" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "provincia" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "reseller_id" varchar;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "sub_reseller_id" varchar;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "ragione_sociale" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "partita_iva" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "codice_fiscale" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "codice_univoco" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "pec" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "hourly_rate_cents" integer;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "website_url" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "public_phone" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "public_email" text;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "accepts_walk_ins" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "opening_hours" jsonb;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "social_links" jsonb;--> statement-breakpoint
ALTER TABLE "repair_centers" ADD COLUMN "notes" text;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "branch_id" varchar;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "brand" text;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "device_model_id" varchar;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "imei" text;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "serial" text;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "imei_not_readable" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "imei_not_present" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "serial_only" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "priority" "repair_priority";--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "ingressato_at" timestamp;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "quote_bypass_reason" "quote_bypass_reason";--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "quote_bypassed_at" timestamp;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "skip_diagnosis" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD COLUMN "skip_diagnosis_reason" text;--> statement-breakpoint
ALTER TABLE "ticket_messages" ADD COLUMN "attachments" jsonb DEFAULT '[]'::jsonb;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "ticket_type" "ticket_type" DEFAULT 'support' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "initiator_id" varchar;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "initiator_role" varchar;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "target_type" "ticket_target_type" DEFAULT 'admin';--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "target_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reseller_category" "reseller_category" DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "parent_reseller_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reseller_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "sub_reseller_id" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "partita_iva" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "codice_fiscale" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "ragione_sociale" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "indirizzo" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cap" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "citta" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "provincia" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "codice_univoco" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pec" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "accessory_specs" ADD CONSTRAINT "accessory_specs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "accessory_types" ADD CONSTRAINT "accessory_types_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_staff_permissions" ADD CONSTRAINT "admin_staff_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admin_staff_permissions" ADD CONSTRAINT "admin_staff_permissions_admin_id_users_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aesthetic_defects" ADD CONSTRAINT "aesthetic_defects_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_repair_centers" ADD CONSTRAINT "customer_repair_centers_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer_repair_centers" ADD CONSTRAINT "customer_repair_centers_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "damaged_component_types" ADD CONSTRAINT "damaged_component_types_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_recovery_events" ADD CONSTRAINT "data_recovery_events_data_recovery_job_id_data_recovery_jobs_id_fk" FOREIGN KEY ("data_recovery_job_id") REFERENCES "public"."data_recovery_jobs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_recovery_jobs" ADD CONSTRAINT "data_recovery_jobs_parent_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("parent_repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_recovery_jobs" ADD CONSTRAINT "data_recovery_jobs_diagnosis_id_repair_diagnostics_id_fk" FOREIGN KEY ("diagnosis_id") REFERENCES "public"."repair_diagnostics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_recovery_jobs" ADD CONSTRAINT "data_recovery_jobs_external_lab_id_external_labs_id_fk" FOREIGN KEY ("external_lab_id") REFERENCES "public"."external_labs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_appointments" ADD CONSTRAINT "delivery_appointments_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_appointments" ADD CONSTRAINT "delivery_appointments_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_appointments" ADD CONSTRAINT "delivery_appointments_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "delivery_appointments" ADD CONSTRAINT "delivery_appointments_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_brand_id_device_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."device_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_type_id_device_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device_models" ADD CONSTRAINT "device_models_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "diagnostic_findings" ADD CONSTRAINT "diagnostic_findings_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "estimated_repair_times" ADD CONSTRAINT "estimated_repair_times_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foneday_credentials" ADD CONSTRAINT "foneday_credentials_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foneday_orders" ADD CONSTRAINT "foneday_orders_credential_id_foneday_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."foneday_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "foneday_products_cache" ADD CONSTRAINT "foneday_products_cache_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_absences" ADD CONSTRAINT "hr_absences_related_clock_event_id_hr_clock_events_id_fk" FOREIGN KEY ("related_clock_event_id") REFERENCES "public"."hr_clock_events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_audit_logs" ADD CONSTRAINT "hr_audit_logs_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_audit_logs" ADD CONSTRAINT "hr_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_audit_logs" ADD CONSTRAINT "hr_audit_logs_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_certificates" ADD CONSTRAINT "hr_certificates_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_certificates" ADD CONSTRAINT "hr_certificates_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_certificates" ADD CONSTRAINT "hr_certificates_related_sick_leave_id_hr_sick_leaves_id_fk" FOREIGN KEY ("related_sick_leave_id") REFERENCES "public"."hr_sick_leaves"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_certificates" ADD CONSTRAINT "hr_certificates_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_clock_events" ADD CONSTRAINT "hr_clock_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_clock_events" ADD CONSTRAINT "hr_clock_events_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_clock_events" ADD CONSTRAINT "hr_clock_events_policy_id_hr_clocking_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."hr_clocking_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_clock_events" ADD CONSTRAINT "hr_clock_events_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_clocking_policies" ADD CONSTRAINT "hr_clocking_policies_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_expense_items" ADD CONSTRAINT "hr_expense_items_expense_report_id_hr_expense_reports_id_fk" FOREIGN KEY ("expense_report_id") REFERENCES "public"."hr_expense_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_expense_reports" ADD CONSTRAINT "hr_expense_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_expense_reports" ADD CONSTRAINT "hr_expense_reports_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_expense_reports" ADD CONSTRAINT "hr_expense_reports_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_justifications" ADD CONSTRAINT "hr_justifications_absence_id_hr_absences_id_fk" FOREIGN KEY ("absence_id") REFERENCES "public"."hr_absences"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_justifications" ADD CONSTRAINT "hr_justifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_justifications" ADD CONSTRAINT "hr_justifications_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_leave_balances" ADD CONSTRAINT "hr_leave_balances_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_leave_balances" ADD CONSTRAINT "hr_leave_balances_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_leave_requests" ADD CONSTRAINT "hr_leave_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_notifications" ADD CONSTRAINT "hr_notifications_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_notifications" ADD CONSTRAINT "hr_notifications_recipient_id_users_id_fk" FOREIGN KEY ("recipient_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_sick_leaves" ADD CONSTRAINT "hr_sick_leaves_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_sick_leaves" ADD CONSTRAINT "hr_sick_leaves_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_sick_leaves" ADD CONSTRAINT "hr_sick_leaves_validated_by_users_id_fk" FOREIGN KEY ("validated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_profile_assignments" ADD CONSTRAINT "hr_work_profile_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_profile_assignments" ADD CONSTRAINT "hr_work_profile_assignments_work_profile_id_hr_work_profiles_id_fk" FOREIGN KEY ("work_profile_id") REFERENCES "public"."hr_work_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_profile_assignments" ADD CONSTRAINT "hr_work_profile_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_profile_versions" ADD CONSTRAINT "hr_work_profile_versions_work_profile_id_hr_work_profiles_id_fk" FOREIGN KEY ("work_profile_id") REFERENCES "public"."hr_work_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_profile_versions" ADD CONSTRAINT "hr_work_profile_versions_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hr_work_profiles" ADD CONSTRAINT "hr_work_profiles_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "issue_types" ADD CONSTRAINT "issue_types_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_order_id_marketplace_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."marketplace_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_order_items" ADD CONSTRAINT "marketplace_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_buyer_reseller_id_users_id_fk" FOREIGN KEY ("buyer_reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_seller_reseller_id_users_id_fk" FOREIGN KEY ("seller_reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_payment_confirmed_by_users_id_fk" FOREIGN KEY ("payment_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_shipped_by_users_id_fk" FOREIGN KEY ("shipped_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_orders" ADD CONSTRAINT "marketplace_orders_warehouse_transfer_id_warehouse_transfers_id_fk" FOREIGN KEY ("warehouse_transfer_id") REFERENCES "public"."warehouse_transfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobilesentrix_credentials" ADD CONSTRAINT "mobilesentrix_credentials_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobilesentrix_orders" ADD CONSTRAINT "mobilesentrix_orders_credential_id_mobilesentrix_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."mobilesentrix_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_purchase_order_id_parts_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."parts_purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_orders" ADD CONSTRAINT "parts_orders_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_purchase_orders" ADD CONSTRAINT "parts_purchase_orders_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_purchase_orders" ADD CONSTRAINT "parts_purchase_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts_purchase_orders" ADD CONSTRAINT "parts_purchase_orders_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_device_compatibilities" ADD CONSTRAINT "product_device_compatibilities_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_device_compatibilities" ADD CONSTRAINT "product_device_compatibilities_device_brand_id_device_brands_id_fk" FOREIGN KEY ("device_brand_id") REFERENCES "public"."device_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_device_compatibilities" ADD CONSTRAINT "product_device_compatibilities_device_model_id_device_models_id_fk" FOREIGN KEY ("device_model_id") REFERENCES "public"."device_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_prices" ADD CONSTRAINT "product_prices_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_suppliers" ADD CONSTRAINT "product_suppliers_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rc_b2b_return_items" ADD CONSTRAINT "rc_b2b_return_items_return_id_rc_b2b_returns_id_fk" FOREIGN KEY ("return_id") REFERENCES "public"."rc_b2b_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_sub_reseller_id_users_id_fk" FOREIGN KEY ("sub_reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_requested_center_id_users_id_fk" FOREIGN KEY ("requested_center_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_assigned_center_id_users_id_fk" FOREIGN KEY ("assigned_center_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_forwarded_from_users_id_fk" FOREIGN KEY ("forwarded_from") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "remote_repair_requests" ADD CONSTRAINT "remote_repair_requests_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_acceptance" ADD CONSTRAINT "repair_acceptance_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_availability" ADD CONSTRAINT "repair_center_availability_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_blackouts" ADD CONSTRAINT "repair_center_blackouts_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_purchase_order_items" ADD CONSTRAINT "repair_center_purchase_order_items_order_id_repair_center_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."repair_center_purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_purchase_order_items" ADD CONSTRAINT "repair_center_purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_purchase_orders" ADD CONSTRAINT "repair_center_purchase_orders_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_purchase_orders" ADD CONSTRAINT "repair_center_purchase_orders_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_center_purchase_orders" ADD CONSTRAINT "repair_center_purchase_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_delivery" ADD CONSTRAINT "repair_delivery_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_diagnostics" ADD CONSTRAINT "repair_diagnostics_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_diagnostics" ADD CONSTRAINT "repair_diagnostics_unrepairable_reason_id_unrepairable_reasons_id_fk" FOREIGN KEY ("unrepairable_reason_id") REFERENCES "public"."unrepairable_reasons"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_logs" ADD CONSTRAINT "repair_logs_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_order_state_history" ADD CONSTRAINT "repair_order_state_history_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_quotes" ADD CONSTRAINT "repair_quotes_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_test_checklist" ADD CONSTRAINT "repair_test_checklist_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_device_brands" ADD CONSTRAINT "reseller_device_brands_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_device_models" ADD CONSTRAINT "reseller_device_models_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_device_models" ADD CONSTRAINT "reseller_device_models_brand_id_device_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."device_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_device_models" ADD CONSTRAINT "reseller_device_models_reseller_brand_id_reseller_device_brands_id_fk" FOREIGN KEY ("reseller_brand_id") REFERENCES "public"."reseller_device_brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_device_models" ADD CONSTRAINT "reseller_device_models_type_id_device_types_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_products" ADD CONSTRAINT "reseller_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_products" ADD CONSTRAINT "reseller_products_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_products" ADD CONSTRAINT "reseller_products_inherited_from_users_id_fk" FOREIGN KEY ("inherited_from") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_order_items" ADD CONSTRAINT "reseller_purchase_order_items_order_id_reseller_purchase_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."reseller_purchase_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_order_items" ADD CONSTRAINT "reseller_purchase_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_orders" ADD CONSTRAINT "reseller_purchase_orders_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_orders" ADD CONSTRAINT "reseller_purchase_orders_payment_confirmed_by_users_id_fk" FOREIGN KEY ("payment_confirmed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_orders" ADD CONSTRAINT "reseller_purchase_orders_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_orders" ADD CONSTRAINT "reseller_purchase_orders_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_orders" ADD CONSTRAINT "reseller_purchase_orders_shipped_by_users_id_fk" FOREIGN KEY ("shipped_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_purchase_orders" ADD CONSTRAINT "reseller_purchase_orders_warehouse_transfer_id_warehouse_transfers_id_fk" FOREIGN KEY ("warehouse_transfer_id") REFERENCES "public"."warehouse_transfers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_staff_permissions" ADD CONSTRAINT "reseller_staff_permissions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reseller_staff_permissions" ADD CONSTRAINT "reseller_staff_permissions_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_item_prices" ADD CONSTRAINT "service_item_prices_service_item_id_service_items_id_fk" FOREIGN KEY ("service_item_id") REFERENCES "public"."service_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_item_prices" ADD CONSTRAINT "service_item_prices_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_item_prices" ADD CONSTRAINT "service_item_prices_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_items" ADD CONSTRAINT "service_items_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_service_item_id_service_items_id_fk" FOREIGN KEY ("service_item_id") REFERENCES "public"."service_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_device_model_id_device_models_id_fk" FOREIGN KEY ("device_model_id") REFERENCES "public"."device_models"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_carts" ADD CONSTRAINT "sifar_carts_credential_id_sifar_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."sifar_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_carts" ADD CONSTRAINT "sifar_carts_store_id_sifar_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sifar_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_credentials" ADD CONSTRAINT "sifar_credentials_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_orders" ADD CONSTRAINT "sifar_orders_credential_id_sifar_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."sifar_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_orders" ADD CONSTRAINT "sifar_orders_store_id_sifar_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."sifar_stores"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_orders" ADD CONSTRAINT "sifar_orders_supplier_order_id_supplier_orders_id_fk" FOREIGN KEY ("supplier_order_id") REFERENCES "public"."supplier_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_product_compatibility" ADD CONSTRAINT "sifar_product_compatibility_catalog_id_sifar_catalog_id_fk" FOREIGN KEY ("catalog_id") REFERENCES "public"."sifar_catalog"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_product_compatibility" ADD CONSTRAINT "sifar_product_compatibility_model_id_sifar_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."sifar_models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_stores" ADD CONSTRAINT "sifar_stores_credential_id_sifar_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."sifar_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_stores" ADD CONSTRAINT "sifar_stores_branch_id_customer_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."customer_branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sifar_stores" ADD CONSTRAINT "sifar_stores_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "smartphone_specs" ADD CONSTRAINT "smartphone_specs_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_repair_centers" ADD CONSTRAINT "staff_repair_centers_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_repair_centers" ADD CONSTRAINT "staff_repair_centers_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_sub_resellers" ADD CONSTRAINT "staff_sub_resellers_staff_id_users_id_fk" FOREIGN KEY ("staff_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "staff_sub_resellers" ADD CONSTRAINT "staff_sub_resellers_sub_reseller_id_users_id_fk" FOREIGN KEY ("sub_reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_catalog_products" ADD CONSTRAINT "supplier_catalog_products_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_catalog_products" ADD CONSTRAINT "supplier_catalog_products_linked_product_id_products_id_fk" FOREIGN KEY ("linked_product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_communication_logs" ADD CONSTRAINT "supplier_communication_logs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_order_items" ADD CONSTRAINT "supplier_order_items_supplier_order_id_supplier_orders_id_fk" FOREIGN KEY ("supplier_order_id") REFERENCES "public"."supplier_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_order_items" ADD CONSTRAINT "supplier_order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_target_warehouse_id_warehouses_id_fk" FOREIGN KEY ("target_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_orders" ADD CONSTRAINT "supplier_orders_repair_order_id_repair_orders_id_fk" FOREIGN KEY ("repair_order_id") REFERENCES "public"."repair_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_supplier_return_id_supplier_returns_id_fk" FOREIGN KEY ("supplier_return_id") REFERENCES "public"."supplier_returns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_return_items" ADD CONSTRAINT "supplier_return_items_supplier_order_item_id_supplier_order_items_id_fk" FOREIGN KEY ("supplier_order_item_id") REFERENCES "public"."supplier_order_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_return_state_history" ADD CONSTRAINT "supplier_return_state_history_supplier_return_id_supplier_returns_id_fk" FOREIGN KEY ("supplier_return_id") REFERENCES "public"."supplier_returns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_returns" ADD CONSTRAINT "supplier_returns_supplier_order_id_supplier_orders_id_fk" FOREIGN KEY ("supplier_order_id") REFERENCES "public"."supplier_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_sync_logs" ADD CONSTRAINT "supplier_sync_logs_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_request_items" ADD CONSTRAINT "transfer_request_items_request_id_transfer_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."transfer_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_request_items" ADD CONSTRAINT "transfer_request_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_requester_warehouse_id_warehouses_id_fk" FOREIGN KEY ("requester_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_source_warehouse_id_warehouses_id_fk" FOREIGN KEY ("source_warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_target_reseller_id_users_id_fk" FOREIGN KEY ("target_reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfer_requests" ADD CONSTRAINT "transfer_requests_shipped_by_users_id_fk" FOREIGN KEY ("shipped_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_coupons" ADD CONSTRAINT "trovausati_coupons_credential_id_trovausati_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."trovausati_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_coupons" ADD CONSTRAINT "trovausati_coupons_shop_id_trovausati_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."trovausati_shops"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_credentials" ADD CONSTRAINT "trovausati_credentials_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_models" ADD CONSTRAINT "trovausati_models_credential_id_trovausati_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."trovausati_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_orders" ADD CONSTRAINT "trovausati_orders_credential_id_trovausati_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."trovausati_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_shops" ADD CONSTRAINT "trovausati_shops_credential_id_trovausati_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."trovausati_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_shops" ADD CONSTRAINT "trovausati_shops_branch_id_customer_branches_id_fk" FOREIGN KEY ("branch_id") REFERENCES "public"."customer_branches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trovausati_shops" ADD CONSTRAINT "trovausati_shops_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "unrepairable_reasons" ADD CONSTRAINT "unrepairable_reasons_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_commissions" ADD CONSTRAINT "utility_commissions_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_commissions" ADD CONSTRAINT "utility_commissions_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_commissions" ADD CONSTRAINT "utility_commissions_rejected_by_users_id_fk" FOREIGN KEY ("rejected_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_documents" ADD CONSTRAINT "utility_practice_documents_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_documents" ADD CONSTRAINT "utility_practice_documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_notes" ADD CONSTRAINT "utility_practice_notes_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_notes" ADD CONSTRAINT "utility_practice_notes_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_products" ADD CONSTRAINT "utility_practice_products_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_products" ADD CONSTRAINT "utility_practice_products_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_state_history" ADD CONSTRAINT "utility_practice_state_history_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_state_history" ADD CONSTRAINT "utility_practice_state_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_tasks" ADD CONSTRAINT "utility_practice_tasks_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_tasks" ADD CONSTRAINT "utility_practice_tasks_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_tasks" ADD CONSTRAINT "utility_practice_tasks_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_tasks" ADD CONSTRAINT "utility_practice_tasks_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_timeline" ADD CONSTRAINT "utility_practice_timeline_practice_id_utility_practices_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."utility_practices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practice_timeline" ADD CONSTRAINT "utility_practice_timeline_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_service_id_utility_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."utility_services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_supplier_id_utility_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."utility_suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_practices" ADD CONSTRAINT "utility_practices_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_services" ADD CONSTRAINT "utility_services_supplier_id_utility_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."utility_suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "utility_suppliers" ADD CONSTRAINT "utility_suppliers_reseller_id_users_id_fk" FOREIGN KEY ("reseller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_device_type_id_device_types_id_fk" FOREIGN KEY ("device_type_id") REFERENCES "public"."device_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "repair_orders" ADD CONSTRAINT "repair_orders_device_model_id_device_models_id_fk" FOREIGN KEY ("device_model_id") REFERENCES "public"."device_models"("id") ON DELETE no action ON UPDATE no action;