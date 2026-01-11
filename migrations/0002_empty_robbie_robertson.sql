CREATE TYPE "public"."pos_payment_method" AS ENUM('cash', 'card', 'pos_terminal', 'satispay', 'mixed');--> statement-breakpoint
CREATE TYPE "public"."pos_session_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."pos_transaction_status" AS ENUM('completed', 'refunded', 'partial_refund', 'voided');--> statement-breakpoint
CREATE TABLE "mobilesentrix_cart_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"credential_id" varchar NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"price" integer NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mobilesentrix_order_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" varchar NOT NULL,
	"product_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"brand" text,
	"model" text,
	"price" integer NOT NULL,
	"quantity" integer NOT NULL,
	"image_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_sessions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"operator_id" varchar NOT NULL,
	"status" "pos_session_status" DEFAULT 'open' NOT NULL,
	"opened_at" timestamp DEFAULT now() NOT NULL,
	"closed_at" timestamp,
	"opening_cash" integer DEFAULT 0 NOT NULL,
	"closing_cash" integer,
	"expected_cash" integer,
	"cash_difference" integer,
	"total_sales" integer DEFAULT 0 NOT NULL,
	"total_transactions" integer DEFAULT 0 NOT NULL,
	"total_cash_sales" integer DEFAULT 0 NOT NULL,
	"total_card_sales" integer DEFAULT 0 NOT NULL,
	"total_refunds" integer DEFAULT 0 NOT NULL,
	"opening_notes" text,
	"closing_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_transaction_items" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" varchar NOT NULL,
	"product_id" varchar NOT NULL,
	"product_name" text NOT NULL,
	"product_sku" varchar(100),
	"product_barcode" varchar(100),
	"quantity" integer NOT NULL,
	"unit_price" integer NOT NULL,
	"discount" integer DEFAULT 0 NOT NULL,
	"total_price" integer NOT NULL,
	"inventory_deducted" boolean DEFAULT false NOT NULL,
	"warehouse_id" varchar,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pos_transactions" (
	"id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_number" varchar(50) NOT NULL,
	"repair_center_id" varchar NOT NULL,
	"session_id" varchar,
	"customer_id" varchar,
	"operator_id" varchar NOT NULL,
	"subtotal" integer NOT NULL,
	"discount_amount" integer DEFAULT 0 NOT NULL,
	"discount_percent" real,
	"tax_rate" real DEFAULT 22 NOT NULL,
	"tax_amount" integer DEFAULT 0 NOT NULL,
	"total" integer NOT NULL,
	"payment_method" "pos_payment_method" NOT NULL,
	"cash_received" integer,
	"change_given" integer,
	"card_last_four" varchar(4),
	"payment_reference" varchar(100),
	"status" "pos_transaction_status" DEFAULT 'completed' NOT NULL,
	"refunded_amount" integer DEFAULT 0,
	"refund_reason" text,
	"refunded_at" timestamp,
	"refunded_by" varchar,
	"notes" text,
	"customer_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pos_transactions_transaction_number_unique" UNIQUE("transaction_number")
);
--> statement-breakpoint
ALTER TABLE "mobilesentrix_credentials" ADD COLUMN "access_token" text;--> statement-breakpoint
ALTER TABLE "mobilesentrix_credentials" ADD COLUMN "access_token_secret" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "barcode" text;--> statement-breakpoint
ALTER TABLE "mobilesentrix_cart_items" ADD CONSTRAINT "mobilesentrix_cart_items_credential_id_mobilesentrix_credentials_id_fk" FOREIGN KEY ("credential_id") REFERENCES "public"."mobilesentrix_credentials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mobilesentrix_order_items" ADD CONSTRAINT "mobilesentrix_order_items_order_id_mobilesentrix_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."mobilesentrix_orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_sessions" ADD CONSTRAINT "pos_sessions_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_transaction_id_pos_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."pos_transactions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transaction_items" ADD CONSTRAINT "pos_transaction_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_repair_center_id_repair_centers_id_fk" FOREIGN KEY ("repair_center_id") REFERENCES "public"."repair_centers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_session_id_pos_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."pos_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_customer_id_users_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_operator_id_users_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pos_transactions" ADD CONSTRAINT "pos_transactions_refunded_by_users_id_fk" FOREIGN KEY ("refunded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_barcode_unique" UNIQUE("barcode");