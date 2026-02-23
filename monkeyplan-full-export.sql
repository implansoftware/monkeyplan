--
-- PostgreSQL database dump
--

\restrict iBtL797lQxA1rIU8cWYIXfOgbphQwDish4smJ4Z3buL995P8MA2k0LDcsLWYEnf

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public.utility_suppliers DROP CONSTRAINT IF EXISTS utility_suppliers_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_services DROP CONSTRAINT IF EXISTS utility_services_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_service_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_timeline DROP CONSTRAINT IF EXISTS utility_practice_timeline_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_timeline DROP CONSTRAINT IF EXISTS utility_practice_timeline_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_tasks DROP CONSTRAINT IF EXISTS utility_practice_tasks_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_tasks DROP CONSTRAINT IF EXISTS utility_practice_tasks_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_tasks DROP CONSTRAINT IF EXISTS utility_practice_tasks_completed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_tasks DROP CONSTRAINT IF EXISTS utility_practice_tasks_assigned_to_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_state_history DROP CONSTRAINT IF EXISTS utility_practice_state_history_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_state_history DROP CONSTRAINT IF EXISTS utility_practice_state_history_changed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_products DROP CONSTRAINT IF EXISTS utility_practice_products_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_products DROP CONSTRAINT IF EXISTS utility_practice_products_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_notes DROP CONSTRAINT IF EXISTS utility_practice_notes_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_notes DROP CONSTRAINT IF EXISTS utility_practice_notes_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_documents DROP CONSTRAINT IF EXISTS utility_practice_documents_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_documents DROP CONSTRAINT IF EXISTS utility_practice_documents_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_commissions DROP CONSTRAINT IF EXISTS utility_commissions_rejected_by_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_commissions DROP CONSTRAINT IF EXISTS utility_commissions_practice_id_fkey;
ALTER TABLE IF EXISTS ONLY public.utility_commissions DROP CONSTRAINT IF EXISTS utility_commissions_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.unrepairable_reasons DROP CONSTRAINT IF EXISTS unrepairable_reasons_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_shops DROP CONSTRAINT IF EXISTS trovausati_shops_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_shops DROP CONSTRAINT IF EXISTS trovausati_shops_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_shops DROP CONSTRAINT IF EXISTS trovausati_shops_branch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_orders DROP CONSTRAINT IF EXISTS trovausati_orders_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_models DROP CONSTRAINT IF EXISTS trovausati_models_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_credentials DROP CONSTRAINT IF EXISTS trovausati_credentials_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_coupons DROP CONSTRAINT IF EXISTS trovausati_coupons_shop_id_fkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_coupons DROP CONSTRAINT IF EXISTS trovausati_coupons_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_target_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_source_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_shipped_by_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_requester_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_rejected_by_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_request_items DROP CONSTRAINT IF EXISTS transfer_request_items_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.transfer_request_items DROP CONSTRAINT IF EXISTS transfer_request_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_sync_logs DROP CONSTRAINT IF EXISTS supplier_sync_logs_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_supplier_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_return_state_history DROP CONSTRAINT IF EXISTS supplier_return_state_history_supplier_return_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_supplier_return_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_supplier_order_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_target_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_order_items DROP CONSTRAINT IF EXISTS supplier_order_items_supplier_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_order_items DROP CONSTRAINT IF EXISTS supplier_order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_communication_logs DROP CONSTRAINT IF EXISTS supplier_communication_logs_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_catalog_products DROP CONSTRAINT IF EXISTS supplier_catalog_products_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.supplier_catalog_products DROP CONSTRAINT IF EXISTS supplier_catalog_products_linked_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quote_items DROP CONSTRAINT IF EXISTS standalone_quote_items_service_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quote_items DROP CONSTRAINT IF EXISTS standalone_quote_items_quote_id_fkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quote_items DROP CONSTRAINT IF EXISTS standalone_quote_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_sub_resellers DROP CONSTRAINT IF EXISTS staff_sub_resellers_sub_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_sub_resellers DROP CONSTRAINT IF EXISTS staff_sub_resellers_staff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_repair_centers DROP CONSTRAINT IF EXISTS staff_repair_centers_staff_id_fkey;
ALTER TABLE IF EXISTS ONLY public.staff_repair_centers DROP CONSTRAINT IF EXISTS staff_repair_centers_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.smartphone_specs DROP CONSTRAINT IF EXISTS smartphone_specs_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_stores DROP CONSTRAINT IF EXISTS sifar_stores_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_stores DROP CONSTRAINT IF EXISTS sifar_stores_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_stores DROP CONSTRAINT IF EXISTS sifar_stores_branch_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_product_compatibility DROP CONSTRAINT IF EXISTS sifar_product_compatibility_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_product_compatibility DROP CONSTRAINT IF EXISTS sifar_product_compatibility_catalog_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_orders DROP CONSTRAINT IF EXISTS sifar_orders_supplier_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_orders DROP CONSTRAINT IF EXISTS sifar_orders_store_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_orders DROP CONSTRAINT IF EXISTS sifar_orders_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_credentials DROP CONSTRAINT IF EXISTS sifar_credentials_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_carts DROP CONSTRAINT IF EXISTS sifar_carts_store_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sifar_carts DROP CONSTRAINT IF EXISTS sifar_carts_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_transactions DROP CONSTRAINT IF EXISTS sibill_transactions_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_transactions DROP CONSTRAINT IF EXISTS sibill_transactions_matched_document_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_transactions DROP CONSTRAINT IF EXISTS sibill_transactions_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_transactions DROP CONSTRAINT IF EXISTS sibill_transactions_account_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_documents DROP CONSTRAINT IF EXISTS sibill_documents_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_documents DROP CONSTRAINT IF EXISTS sibill_documents_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_credentials DROP CONSTRAINT IF EXISTS sibill_credentials_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_companies DROP CONSTRAINT IF EXISTS sibill_companies_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_companies DROP CONSTRAINT IF EXISTS sibill_companies_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_categories DROP CONSTRAINT IF EXISTS sibill_categories_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_categories DROP CONSTRAINT IF EXISTS sibill_categories_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_accounts DROP CONSTRAINT IF EXISTS sibill_accounts_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.sibill_accounts DROP CONSTRAINT IF EXISTS sibill_accounts_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shipping_methods DROP CONSTRAINT IF EXISTS shipping_methods_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.shipping_methods DROP CONSTRAINT IF EXISTS shipping_methods_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_service_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_device_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_item_prices DROP CONSTRAINT IF EXISTS service_item_prices_service_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_item_prices DROP CONSTRAINT IF EXISTS service_item_prices_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.service_item_prices DROP CONSTRAINT IF EXISTS service_item_prices_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.self_diagnosis_sessions DROP CONSTRAINT IF EXISTS self_diagnosis_sessions_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_staff_permissions DROP CONSTRAINT IF EXISTS reseller_staff_permissions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_staff_permissions DROP CONSTRAINT IF EXISTS reseller_staff_permissions_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_warehouse_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_shipped_by_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_rejected_by_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_payment_confirmed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_order_items DROP CONSTRAINT IF EXISTS reseller_purchase_order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_order_items DROP CONSTRAINT IF EXISTS reseller_purchase_order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_products DROP CONSTRAINT IF EXISTS reseller_products_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_products DROP CONSTRAINT IF EXISTS reseller_products_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_products DROP CONSTRAINT IF EXISTS reseller_products_inherited_from_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_models DROP CONSTRAINT IF EXISTS reseller_device_models_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_models DROP CONSTRAINT IF EXISTS reseller_device_models_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_models DROP CONSTRAINT IF EXISTS reseller_device_models_reseller_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_models DROP CONSTRAINT IF EXISTS reseller_device_models_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_brands DROP CONSTRAINT IF EXISTS reseller_device_brands_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_test_checklist DROP CONSTRAINT IF EXISTS repair_test_checklist_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_quotes DROP CONSTRAINT IF EXISTS repair_quotes_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_orders DROP CONSTRAINT IF EXISTS repair_orders_device_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_order_state_history DROP CONSTRAINT IF EXISTS repair_order_state_history_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_logs DROP CONSTRAINT IF EXISTS repair_logs_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_diagnostics DROP CONSTRAINT IF EXISTS repair_diagnostics_unrepairable_reason_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_diagnostics DROP CONSTRAINT IF EXISTS repair_diagnostics_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_delivery DROP CONSTRAINT IF EXISTS repair_delivery_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_settings DROP CONSTRAINT IF EXISTS repair_center_settings_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_orders DROP CONSTRAINT IF EXISTS repair_center_purchase_orders_shipping_method_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_orders DROP CONSTRAINT IF EXISTS repair_center_purchase_orders_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_orders DROP CONSTRAINT IF EXISTS repair_center_purchase_orders_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_orders DROP CONSTRAINT IF EXISTS repair_center_purchase_orders_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_order_items DROP CONSTRAINT IF EXISTS repair_center_purchase_order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_order_items DROP CONSTRAINT IF EXISTS repair_center_purchase_order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_blackouts DROP CONSTRAINT IF EXISTS repair_center_blackouts_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_availability DROP CONSTRAINT IF EXISTS repair_center_availability_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_sub_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_requested_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_forwarded_from_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_assigned_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_request_devices DROP CONSTRAINT IF EXISTS remote_repair_request_devices_request_id_fkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_request_devices DROP CONSTRAINT IF EXISTS remote_repair_request_devices_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_prices DROP CONSTRAINT IF EXISTS product_prices_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_prices DROP CONSTRAINT IF EXISTS product_prices_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_device_compatibilities DROP CONSTRAINT IF EXISTS product_device_compatibilities_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_device_compatibilities DROP CONSTRAINT IF EXISTS product_device_compatibilities_device_model_id_fkey;
ALTER TABLE IF EXISTS ONLY public.product_device_compatibilities DROP CONSTRAINT IF EXISTS product_device_compatibilities_device_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.price_lists DROP CONSTRAINT IF EXISTS price_lists_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.price_lists DROP CONSTRAINT IF EXISTS price_lists_owner_id_fkey;
ALTER TABLE IF EXISTS ONLY public.price_list_items DROP CONSTRAINT IF EXISTS price_list_items_warranty_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.price_list_items DROP CONSTRAINT IF EXISTS price_list_items_service_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.price_list_items DROP CONSTRAINT IF EXISTS price_list_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.price_list_items DROP CONSTRAINT IF EXISTS price_list_items_price_list_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_voided_by_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_session_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_register_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_refunded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_items DROP CONSTRAINT IF EXISTS pos_transaction_items_warranty_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_items DROP CONSTRAINT IF EXISTS pos_transaction_items_warehouse_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_items DROP CONSTRAINT IF EXISTS pos_transaction_items_transaction_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_items DROP CONSTRAINT IF EXISTS pos_transaction_items_service_item_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_items DROP CONSTRAINT IF EXISTS pos_transaction_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_register_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_operator_id_fkey;
ALTER TABLE IF EXISTS ONLY public.pos_registers DROP CONSTRAINT IF EXISTS pos_registers_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_purchase_orders DROP CONSTRAINT IF EXISTS parts_purchase_orders_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_orders DROP CONSTRAINT IF EXISTS parts_orders_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_orders DROP CONSTRAINT IF EXISTS parts_orders_purchase_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_orders DROP CONSTRAINT IF EXISTS parts_orders_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_items DROP CONSTRAINT IF EXISTS parts_load_items_parts_load_document_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_items DROP CONSTRAINT IF EXISTS parts_load_items_matched_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_items DROP CONSTRAINT IF EXISTS parts_load_items_matched_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_items DROP CONSTRAINT IF EXISTS parts_load_items_matched_parts_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_documents DROP CONSTRAINT IF EXISTS parts_load_documents_supplier_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_documents DROP CONSTRAINT IF EXISTS parts_load_documents_supplier_id_fkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_documents DROP CONSTRAINT IF EXISTS parts_load_documents_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_orders DROP CONSTRAINT IF EXISTS mobilesentrix_orders_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_order_items DROP CONSTRAINT IF EXISTS mobilesentrix_order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_credentials DROP CONSTRAINT IF EXISTS mobilesentrix_credentials_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_cart_items DROP CONSTRAINT IF EXISTS mobilesentrix_cart_items_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_warehouse_transfer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_shipped_by_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_seller_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_rejected_by_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_payment_confirmed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_buyer_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_order_items DROP CONSTRAINT IF EXISTS marketplace_order_items_product_id_fkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_order_items DROP CONSTRAINT IF EXISTS marketplace_order_items_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.issue_types DROP CONSTRAINT IF EXISTS issue_types_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profiles DROP CONSTRAINT IF EXISTS hr_work_profiles_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_versions DROP CONSTRAINT IF EXISTS hr_work_profile_versions_work_profile_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_versions DROP CONSTRAINT IF EXISTS hr_work_profile_versions_changed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_assignments DROP CONSTRAINT IF EXISTS hr_work_profile_assignments_work_profile_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_assignments DROP CONSTRAINT IF EXISTS hr_work_profile_assignments_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_assignments DROP CONSTRAINT IF EXISTS hr_work_profile_assignments_assigned_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_sick_leaves DROP CONSTRAINT IF EXISTS hr_sick_leaves_validated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_sick_leaves DROP CONSTRAINT IF EXISTS hr_sick_leaves_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_sick_leaves DROP CONSTRAINT IF EXISTS hr_sick_leaves_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_notifications DROP CONSTRAINT IF EXISTS hr_notifications_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_notifications DROP CONSTRAINT IF EXISTS hr_notifications_recipient_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_requests DROP CONSTRAINT IF EXISTS hr_leave_requests_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_requests DROP CONSTRAINT IF EXISTS hr_leave_requests_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_requests DROP CONSTRAINT IF EXISTS hr_leave_requests_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_balances DROP CONSTRAINT IF EXISTS hr_leave_balances_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_balances DROP CONSTRAINT IF EXISTS hr_leave_balances_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_justifications DROP CONSTRAINT IF EXISTS hr_justifications_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_justifications DROP CONSTRAINT IF EXISTS hr_justifications_reviewed_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_justifications DROP CONSTRAINT IF EXISTS hr_justifications_absence_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_reports DROP CONSTRAINT IF EXISTS hr_expense_reports_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_reports DROP CONSTRAINT IF EXISTS hr_expense_reports_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_reports DROP CONSTRAINT IF EXISTS hr_expense_reports_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_reports DROP CONSTRAINT IF EXISTS hr_expense_reports_approved_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_items DROP CONSTRAINT IF EXISTS hr_expense_items_expense_report_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_clocking_policies DROP CONSTRAINT IF EXISTS hr_clocking_policies_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_clock_events DROP CONSTRAINT IF EXISTS hr_clock_events_validated_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_clock_events DROP CONSTRAINT IF EXISTS hr_clock_events_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_clock_events DROP CONSTRAINT IF EXISTS hr_clock_events_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_clock_events DROP CONSTRAINT IF EXISTS hr_clock_events_policy_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificates DROP CONSTRAINT IF EXISTS hr_certificates_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificates DROP CONSTRAINT IF EXISTS hr_certificates_uploaded_by_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificates DROP CONSTRAINT IF EXISTS hr_certificates_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificates DROP CONSTRAINT IF EXISTS hr_certificates_related_sick_leave_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_audit_logs DROP CONSTRAINT IF EXISTS hr_audit_logs_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_audit_logs DROP CONSTRAINT IF EXISTS hr_audit_logs_target_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_audit_logs DROP CONSTRAINT IF EXISTS hr_audit_logs_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_absences DROP CONSTRAINT IF EXISTS hr_absences_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_absences DROP CONSTRAINT IF EXISTS hr_absences_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.hr_absences DROP CONSTRAINT IF EXISTS hr_absences_related_clock_event_id_fkey;
ALTER TABLE IF EXISTS ONLY public.foneday_products_cache DROP CONSTRAINT IF EXISTS foneday_products_cache_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.foneday_orders DROP CONSTRAINT IF EXISTS foneday_orders_credential_id_fkey;
ALTER TABLE IF EXISTS ONLY public.foneday_credentials DROP CONSTRAINT IF EXISTS foneday_credentials_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.estimated_repair_times DROP CONSTRAINT IF EXISTS estimated_repair_times_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.diagnostic_findings DROP CONSTRAINT IF EXISTS diagnostic_findings_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_brand_id_fkey;
ALTER TABLE IF EXISTS ONLY public.delivery_appointments DROP CONSTRAINT IF EXISTS delivery_appointments_reseller_id_fkey;
ALTER TABLE IF EXISTS ONLY public.delivery_appointments DROP CONSTRAINT IF EXISTS delivery_appointments_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.delivery_appointments DROP CONSTRAINT IF EXISTS delivery_appointments_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.delivery_appointments DROP CONSTRAINT IF EXISTS delivery_appointments_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.data_recovery_jobs DROP CONSTRAINT IF EXISTS data_recovery_jobs_parent_repair_order_id_fkey;
ALTER TABLE IF EXISTS ONLY public.data_recovery_jobs DROP CONSTRAINT IF EXISTS data_recovery_jobs_external_lab_id_fkey;
ALTER TABLE IF EXISTS ONLY public.data_recovery_jobs DROP CONSTRAINT IF EXISTS data_recovery_jobs_diagnosis_id_fkey;
ALTER TABLE IF EXISTS ONLY public.data_recovery_events DROP CONSTRAINT IF EXISTS data_recovery_events_data_recovery_job_id_fkey;
ALTER TABLE IF EXISTS ONLY public.dashboard_preferences DROP CONSTRAINT IF EXISTS dashboard_preferences_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.damaged_component_types DROP CONSTRAINT IF EXISTS damaged_component_types_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_repair_centers DROP CONSTRAINT IF EXISTS customer_repair_centers_repair_center_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_repair_centers DROP CONSTRAINT IF EXISTS customer_repair_centers_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_relationships DROP CONSTRAINT IF EXISTS customer_relationships_related_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_relationships DROP CONSTRAINT IF EXISTS customer_relationships_customer_id_fkey;
ALTER TABLE IF EXISTS ONLY public.customer_relationships DROP CONSTRAINT IF EXISTS customer_relationships_created_by_fkey;
ALTER TABLE IF EXISTS ONLY public.aesthetic_defects DROP CONSTRAINT IF EXISTS aesthetic_defects_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_staff_permissions DROP CONSTRAINT IF EXISTS admin_staff_permissions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.admin_staff_permissions DROP CONSTRAINT IF EXISTS admin_staff_permissions_admin_id_fkey;
ALTER TABLE IF EXISTS ONLY public.accessory_types DROP CONSTRAINT IF EXISTS accessory_types_device_type_id_fkey;
ALTER TABLE IF EXISTS ONLY public.accessory_specs DROP CONSTRAINT IF EXISTS accessory_specs_product_id_fkey;
DROP INDEX IF EXISTS public.reseller_settings_reseller_key_idx;
DROP INDEX IF EXISTS public.repair_center_settings_rc_key_idx;
DROP INDEX IF EXISTS public.idx_warranty_products_reseller_id;
DROP INDEX IF EXISTS public.idx_supplier_returns_supplier;
DROP INDEX IF EXISTS public.idx_supplier_returns_status;
DROP INDEX IF EXISTS public.idx_supplier_return_state_history_status;
DROP INDEX IF EXISTS public.idx_supplier_return_state_history_return;
DROP INDEX IF EXISTS public.idx_supplier_orders_supplier;
DROP INDEX IF EXISTS public.idx_supplier_orders_status;
DROP INDEX IF EXISTS public.idx_supplier_orders_repair_center;
DROP INDEX IF EXISTS public.idx_repair_warranties_status;
DROP INDEX IF EXISTS public.idx_repair_warranties_seller_id;
DROP INDEX IF EXISTS public.idx_repair_warranties_customer_id;
DROP INDEX IF EXISTS public.idx_repair_warranties_created_at;
DROP INDEX IF EXISTS public.idx_repair_order_state_history_status;
DROP INDEX IF EXISTS public.idx_repair_order_state_history_order;
DROP INDEX IF EXISTS public.idx_product_suppliers_supplier;
DROP INDEX IF EXISTS public.idx_product_suppliers_product;
DROP INDEX IF EXISTS public.idx_price_lists_owner;
DROP INDEX IF EXISTS public.idx_price_list_items_service;
DROP INDEX IF EXISTS public.idx_price_list_items_product;
DROP INDEX IF EXISTS public.idx_price_list_items_list;
DROP INDEX IF EXISTS public.idx_pos_transactions_session;
DROP INDEX IF EXISTS public.idx_pos_transactions_repair_center;
DROP INDEX IF EXISTS public.idx_pos_transactions_created;
DROP INDEX IF EXISTS public.idx_pos_transaction_items_transaction;
DROP INDEX IF EXISTS public.idx_pos_sessions_status;
DROP INDEX IF EXISTS public.idx_pos_sessions_repair_center;
DROP INDEX IF EXISTS public.idx_pos_sessions_operator;
DROP INDEX IF EXISTS public.idx_payment_config_entity;
DROP INDEX IF EXISTS public.idx_entity_fiscal_config_entity;
DROP INDEX IF EXISTS public.idx_device_models_unique;
DROP INDEX IF EXISTS public."IDX_session_expire";
ALTER TABLE IF EXISTS ONLY public.warranty_products DROP CONSTRAINT IF EXISTS warranty_products_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouses DROP CONSTRAINT IF EXISTS warehouses_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouse_transfers DROP CONSTRAINT IF EXISTS warehouse_transfers_transfer_number_key;
ALTER TABLE IF EXISTS ONLY public.warehouse_transfers DROP CONSTRAINT IF EXISTS warehouse_transfers_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouse_transfer_items DROP CONSTRAINT IF EXISTS warehouse_transfer_items_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouse_stock DROP CONSTRAINT IF EXISTS warehouse_stock_warehouse_id_product_id_key;
ALTER TABLE IF EXISTS ONLY public.warehouse_stock DROP CONSTRAINT IF EXISTS warehouse_stock_pkey;
ALTER TABLE IF EXISTS ONLY public.warehouse_movements DROP CONSTRAINT IF EXISTS warehouse_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_suppliers DROP CONSTRAINT IF EXISTS utility_suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_suppliers DROP CONSTRAINT IF EXISTS utility_suppliers_code_key;
ALTER TABLE IF EXISTS ONLY public.utility_services DROP CONSTRAINT IF EXISTS utility_services_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_practice_number_key;
ALTER TABLE IF EXISTS ONLY public.utility_practices DROP CONSTRAINT IF EXISTS utility_practices_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_timeline DROP CONSTRAINT IF EXISTS utility_practice_timeline_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_tasks DROP CONSTRAINT IF EXISTS utility_practice_tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_state_history DROP CONSTRAINT IF EXISTS utility_practice_state_history_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_products DROP CONSTRAINT IF EXISTS utility_practice_products_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_notes DROP CONSTRAINT IF EXISTS utility_practice_notes_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_practice_documents DROP CONSTRAINT IF EXISTS utility_practice_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_commissions DROP CONSTRAINT IF EXISTS utility_commissions_pkey;
ALTER TABLE IF EXISTS ONLY public.utility_categories DROP CONSTRAINT IF EXISTS utility_categories_slug_key;
ALTER TABLE IF EXISTS ONLY public.utility_categories DROP CONSTRAINT IF EXISTS utility_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_username_unique;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE IF EXISTS ONLY public.unrepairable_reasons DROP CONSTRAINT IF EXISTS unrepairable_reasons_pkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_shops DROP CONSTRAINT IF EXISTS trovausati_shops_pkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_orders DROP CONSTRAINT IF EXISTS trovausati_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_models DROP CONSTRAINT IF EXISTS trovausati_models_pkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_credentials DROP CONSTRAINT IF EXISTS trovausati_credentials_pkey;
ALTER TABLE IF EXISTS ONLY public.trovausati_coupons DROP CONSTRAINT IF EXISTS trovausati_coupons_pkey;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_request_number_key;
ALTER TABLE IF EXISTS ONLY public.transfer_requests DROP CONSTRAINT IF EXISTS transfer_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.transfer_request_items DROP CONSTRAINT IF EXISTS transfer_request_items_pkey;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_ticket_number_unique;
ALTER TABLE IF EXISTS ONLY public.tickets DROP CONSTRAINT IF EXISTS tickets_pkey;
ALTER TABLE IF EXISTS ONLY public.ticket_messages DROP CONSTRAINT IF EXISTS ticket_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.suppliers DROP CONSTRAINT IF EXISTS suppliers_code_key;
ALTER TABLE IF EXISTS ONLY public.supplier_sync_logs DROP CONSTRAINT IF EXISTS supplier_sync_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_return_number_key;
ALTER TABLE IF EXISTS ONLY public.supplier_returns DROP CONSTRAINT IF EXISTS supplier_returns_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_return_state_history DROP CONSTRAINT IF EXISTS supplier_return_state_history_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_return_items DROP CONSTRAINT IF EXISTS supplier_return_items_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_orders DROP CONSTRAINT IF EXISTS supplier_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.supplier_order_items DROP CONSTRAINT IF EXISTS supplier_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_communication_logs DROP CONSTRAINT IF EXISTS supplier_communication_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.supplier_catalog_products DROP CONSTRAINT IF EXISTS supplier_catalog_products_pkey;
ALTER TABLE IF EXISTS ONLY public.stock_reservations DROP CONSTRAINT IF EXISTS stock_reservations_pkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_quote_number_key;
ALTER TABLE IF EXISTS ONLY public.standalone_quotes DROP CONSTRAINT IF EXISTS standalone_quotes_pkey;
ALTER TABLE IF EXISTS ONLY public.standalone_quote_items DROP CONSTRAINT IF EXISTS standalone_quote_items_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_sub_resellers DROP CONSTRAINT IF EXISTS staff_sub_resellers_staff_id_sub_reseller_id_key;
ALTER TABLE IF EXISTS ONLY public.staff_sub_resellers DROP CONSTRAINT IF EXISTS staff_sub_resellers_pkey;
ALTER TABLE IF EXISTS ONLY public.staff_repair_centers DROP CONSTRAINT IF EXISTS staff_repair_centers_staff_id_repair_center_id_key;
ALTER TABLE IF EXISTS ONLY public.staff_repair_centers DROP CONSTRAINT IF EXISTS staff_repair_centers_pkey;
ALTER TABLE IF EXISTS ONLY public.smartphone_specs DROP CONSTRAINT IF EXISTS smartphone_specs_product_id_key;
ALTER TABLE IF EXISTS ONLY public.smartphone_specs DROP CONSTRAINT IF EXISTS smartphone_specs_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_stores DROP CONSTRAINT IF EXISTS sifar_stores_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_product_compatibility DROP CONSTRAINT IF EXISTS sifar_product_compatibility_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_orders DROP CONSTRAINT IF EXISTS sifar_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_models DROP CONSTRAINT IF EXISTS sifar_models_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_models DROP CONSTRAINT IF EXISTS sifar_models_codice_modello_key;
ALTER TABLE IF EXISTS ONLY public.sifar_credentials DROP CONSTRAINT IF EXISTS sifar_credentials_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_catalog DROP CONSTRAINT IF EXISTS sifar_catalog_pkey;
ALTER TABLE IF EXISTS ONLY public.sifar_catalog DROP CONSTRAINT IF EXISTS sifar_catalog_codice_articolo_key;
ALTER TABLE IF EXISTS ONLY public.sifar_carts DROP CONSTRAINT IF EXISTS sifar_carts_pkey;
ALTER TABLE IF EXISTS ONLY public.sibill_transactions DROP CONSTRAINT IF EXISTS sibill_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.sibill_documents DROP CONSTRAINT IF EXISTS sibill_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.sibill_credentials DROP CONSTRAINT IF EXISTS sibill_credentials_pkey;
ALTER TABLE IF EXISTS ONLY public.sibill_companies DROP CONSTRAINT IF EXISTS sibill_companies_pkey;
ALTER TABLE IF EXISTS ONLY public.sibill_categories DROP CONSTRAINT IF EXISTS sibill_categories_pkey;
ALTER TABLE IF EXISTS ONLY public.sibill_accounts DROP CONSTRAINT IF EXISTS sibill_accounts_pkey;
ALTER TABLE IF EXISTS ONLY public.shipping_methods DROP CONSTRAINT IF EXISTS shipping_methods_pkey;
ALTER TABLE IF EXISTS ONLY public.shipment_tracking_events DROP CONSTRAINT IF EXISTS shipment_tracking_events_pkey;
ALTER TABLE IF EXISTS ONLY public.session DROP CONSTRAINT IF EXISTS session_pkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.service_orders DROP CONSTRAINT IF EXISTS service_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_pkey;
ALTER TABLE IF EXISTS ONLY public.service_items DROP CONSTRAINT IF EXISTS service_items_code_key;
ALTER TABLE IF EXISTS ONLY public.service_item_prices DROP CONSTRAINT IF EXISTS service_item_prices_pkey;
ALTER TABLE IF EXISTS ONLY public.self_diagnosis_sessions DROP CONSTRAINT IF EXISTS self_diagnosis_sessions_token_key;
ALTER TABLE IF EXISTS ONLY public.self_diagnosis_sessions DROP CONSTRAINT IF EXISTS self_diagnosis_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_orders DROP CONSTRAINT IF EXISTS sales_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.sales_order_state_history DROP CONSTRAINT IF EXISTS sales_order_state_history_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_shipments DROP CONSTRAINT IF EXISTS sales_order_shipments_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_payments DROP CONSTRAINT IF EXISTS sales_order_payments_pkey;
ALTER TABLE IF EXISTS ONLY public.sales_order_items DROP CONSTRAINT IF EXISTS sales_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_staff_permissions DROP CONSTRAINT IF EXISTS reseller_staff_permissions_user_id_module_key;
ALTER TABLE IF EXISTS ONLY public.reseller_staff_permissions DROP CONSTRAINT IF EXISTS reseller_staff_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_settings DROP CONSTRAINT IF EXISTS reseller_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_orders DROP CONSTRAINT IF EXISTS reseller_purchase_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.reseller_purchase_order_items DROP CONSTRAINT IF EXISTS reseller_purchase_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_products DROP CONSTRAINT IF EXISTS reseller_products_product_id_reseller_id_key;
ALTER TABLE IF EXISTS ONLY public.reseller_products DROP CONSTRAINT IF EXISTS reseller_products_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_models DROP CONSTRAINT IF EXISTS reseller_device_models_pkey;
ALTER TABLE IF EXISTS ONLY public.reseller_device_brands DROP CONSTRAINT IF EXISTS reseller_device_brands_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_warranties DROP CONSTRAINT IF EXISTS repair_warranties_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_test_checklist DROP CONSTRAINT IF EXISTS repair_test_checklist_repair_order_id_key;
ALTER TABLE IF EXISTS ONLY public.repair_test_checklist DROP CONSTRAINT IF EXISTS repair_test_checklist_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_quotes DROP CONSTRAINT IF EXISTS repair_quotes_repair_order_id_key;
ALTER TABLE IF EXISTS ONLY public.repair_quotes DROP CONSTRAINT IF EXISTS repair_quotes_quote_number_key;
ALTER TABLE IF EXISTS ONLY public.repair_quotes DROP CONSTRAINT IF EXISTS repair_quotes_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_orders DROP CONSTRAINT IF EXISTS repair_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_orders DROP CONSTRAINT IF EXISTS repair_orders_order_number_unique;
ALTER TABLE IF EXISTS ONLY public.repair_order_state_history DROP CONSTRAINT IF EXISTS repair_order_state_history_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_logs DROP CONSTRAINT IF EXISTS repair_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_diagnostics DROP CONSTRAINT IF EXISTS repair_diagnostics_repair_order_id_key;
ALTER TABLE IF EXISTS ONLY public.repair_diagnostics DROP CONSTRAINT IF EXISTS repair_diagnostics_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_delivery DROP CONSTRAINT IF EXISTS repair_delivery_repair_order_id_key;
ALTER TABLE IF EXISTS ONLY public.repair_delivery DROP CONSTRAINT IF EXISTS repair_delivery_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_centers DROP CONSTRAINT IF EXISTS repair_centers_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_settings DROP CONSTRAINT IF EXISTS repair_center_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_orders DROP CONSTRAINT IF EXISTS repair_center_purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_orders DROP CONSTRAINT IF EXISTS repair_center_purchase_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.repair_center_purchase_order_items DROP CONSTRAINT IF EXISTS repair_center_purchase_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_blackouts DROP CONSTRAINT IF EXISTS repair_center_blackouts_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_center_availability DROP CONSTRAINT IF EXISTS repair_center_availability_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_attachments DROP CONSTRAINT IF EXISTS repair_attachments_pkey;
ALTER TABLE IF EXISTS ONLY public.repair_acceptance DROP CONSTRAINT IF EXISTS repair_acceptance_repair_order_id_key;
ALTER TABLE IF EXISTS ONLY public.repair_acceptance DROP CONSTRAINT IF EXISTS repair_acceptance_pkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_request_number_key;
ALTER TABLE IF EXISTS ONLY public.remote_repair_requests DROP CONSTRAINT IF EXISTS remote_repair_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.remote_repair_request_devices DROP CONSTRAINT IF EXISTS remote_repair_request_devices_pkey;
ALTER TABLE IF EXISTS ONLY public.push_notification_log DROP CONSTRAINT IF EXISTS push_notification_log_pkey;
ALTER TABLE IF EXISTS ONLY public.promotions DROP CONSTRAINT IF EXISTS promotions_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_sku_unique;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_pkey;
ALTER TABLE IF EXISTS ONLY public.products DROP CONSTRAINT IF EXISTS products_barcode_key;
ALTER TABLE IF EXISTS ONLY public.product_suppliers DROP CONSTRAINT IF EXISTS product_suppliers_pkey;
ALTER TABLE IF EXISTS ONLY public.product_prices DROP CONSTRAINT IF EXISTS product_prices_pkey;
ALTER TABLE IF EXISTS ONLY public.product_device_compatibilities DROP CONSTRAINT IF EXISTS product_device_compatibilities_pkey;
ALTER TABLE IF EXISTS ONLY public.price_lists DROP CONSTRAINT IF EXISTS price_lists_pkey;
ALTER TABLE IF EXISTS ONLY public.price_list_items DROP CONSTRAINT IF EXISTS price_list_items_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_transaction_number_key;
ALTER TABLE IF EXISTS ONLY public.pos_transactions DROP CONSTRAINT IF EXISTS pos_transactions_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_transaction_items DROP CONSTRAINT IF EXISTS pos_transaction_items_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_sessions DROP CONSTRAINT IF EXISTS pos_sessions_pkey;
ALTER TABLE IF EXISTS ONLY public.pos_registers DROP CONSTRAINT IF EXISTS pos_registers_pkey;
ALTER TABLE IF EXISTS ONLY public.platform_fiscal_config DROP CONSTRAINT IF EXISTS platform_fiscal_config_pkey;
ALTER TABLE IF EXISTS ONLY public.payment_configurations DROP CONSTRAINT IF EXISTS payment_configurations_pkey;
ALTER TABLE IF EXISTS ONLY public.parts_purchase_orders DROP CONSTRAINT IF EXISTS parts_purchase_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.parts_purchase_orders DROP CONSTRAINT IF EXISTS parts_purchase_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.parts_orders DROP CONSTRAINT IF EXISTS parts_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_items DROP CONSTRAINT IF EXISTS parts_load_items_pkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_documents DROP CONSTRAINT IF EXISTS parts_load_documents_pkey;
ALTER TABLE IF EXISTS ONLY public.parts_load_documents DROP CONSTRAINT IF EXISTS parts_load_documents_load_number_key;
ALTER TABLE IF EXISTS ONLY public.notifications DROP CONSTRAINT IF EXISTS notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_user_id_key;
ALTER TABLE IF EXISTS ONLY public.notification_preferences DROP CONSTRAINT IF EXISTS notification_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_orders DROP CONSTRAINT IF EXISTS mobilesentrix_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_order_items DROP CONSTRAINT IF EXISTS mobilesentrix_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_credentials DROP CONSTRAINT IF EXISTS mobilesentrix_credentials_pkey;
ALTER TABLE IF EXISTS ONLY public.mobilesentrix_cart_items DROP CONSTRAINT IF EXISTS mobilesentrix_cart_items_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.marketplace_orders DROP CONSTRAINT IF EXISTS marketplace_orders_order_number_key;
ALTER TABLE IF EXISTS ONLY public.marketplace_order_items DROP CONSTRAINT IF EXISTS marketplace_order_items_pkey;
ALTER TABLE IF EXISTS ONLY public.licenses DROP CONSTRAINT IF EXISTS licenses_pkey;
ALTER TABLE IF EXISTS ONLY public.license_plans DROP CONSTRAINT IF EXISTS license_plans_pkey;
ALTER TABLE IF EXISTS ONLY public.issue_types DROP CONSTRAINT IF EXISTS issue_types_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_pkey;
ALTER TABLE IF EXISTS ONLY public.invoices DROP CONSTRAINT IF EXISTS invoices_invoice_number_unique;
ALTER TABLE IF EXISTS ONLY public.inventory_stock DROP CONSTRAINT IF EXISTS inventory_stock_pkey;
ALTER TABLE IF EXISTS ONLY public.inventory_movements DROP CONSTRAINT IF EXISTS inventory_movements_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profiles DROP CONSTRAINT IF EXISTS hr_work_profiles_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_versions DROP CONSTRAINT IF EXISTS hr_work_profile_versions_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_work_profile_assignments DROP CONSTRAINT IF EXISTS hr_work_profile_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_sick_leaves DROP CONSTRAINT IF EXISTS hr_sick_leaves_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_notifications DROP CONSTRAINT IF EXISTS hr_notifications_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_requests DROP CONSTRAINT IF EXISTS hr_leave_requests_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_leave_balances DROP CONSTRAINT IF EXISTS hr_leave_balances_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_justifications DROP CONSTRAINT IF EXISTS hr_justifications_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_reports DROP CONSTRAINT IF EXISTS hr_expense_reports_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_expense_items DROP CONSTRAINT IF EXISTS hr_expense_items_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_clocking_policies DROP CONSTRAINT IF EXISTS hr_clocking_policies_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_clock_events DROP CONSTRAINT IF EXISTS hr_clock_events_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_certificates DROP CONSTRAINT IF EXISTS hr_certificates_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_audit_logs DROP CONSTRAINT IF EXISTS hr_audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.hr_absences DROP CONSTRAINT IF EXISTS hr_absences_pkey;
ALTER TABLE IF EXISTS ONLY public.foneday_products_cache DROP CONSTRAINT IF EXISTS foneday_products_cache_pkey;
ALTER TABLE IF EXISTS ONLY public.foneday_orders DROP CONSTRAINT IF EXISTS foneday_orders_pkey;
ALTER TABLE IF EXISTS ONLY public.foneday_credentials DROP CONSTRAINT IF EXISTS foneday_credentials_pkey;
ALTER TABLE IF EXISTS ONLY public.external_labs DROP CONSTRAINT IF EXISTS external_labs_pkey;
ALTER TABLE IF EXISTS ONLY public.external_labs DROP CONSTRAINT IF EXISTS external_labs_code_key;
ALTER TABLE IF EXISTS ONLY public.external_integrations DROP CONSTRAINT IF EXISTS external_integrations_pkey;
ALTER TABLE IF EXISTS ONLY public.external_integrations DROP CONSTRAINT IF EXISTS external_integrations_code_key;
ALTER TABLE IF EXISTS ONLY public.expo_push_tokens DROP CONSTRAINT IF EXISTS expo_push_tokens_token_key;
ALTER TABLE IF EXISTS ONLY public.expo_push_tokens DROP CONSTRAINT IF EXISTS expo_push_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.estimated_repair_times DROP CONSTRAINT IF EXISTS estimated_repair_times_pkey;
ALTER TABLE IF EXISTS ONLY public.entity_fiscal_config DROP CONSTRAINT IF EXISTS entity_fiscal_config_pkey;
ALTER TABLE IF EXISTS ONLY public.diagnostic_findings DROP CONSTRAINT IF EXISTS diagnostic_findings_pkey;
ALTER TABLE IF EXISTS ONLY public.device_types DROP CONSTRAINT IF EXISTS device_types_pkey;
ALTER TABLE IF EXISTS ONLY public.device_types DROP CONSTRAINT IF EXISTS device_types_name_key;
ALTER TABLE IF EXISTS ONLY public.device_models DROP CONSTRAINT IF EXISTS device_models_pkey;
ALTER TABLE IF EXISTS ONLY public.device_brands DROP CONSTRAINT IF EXISTS device_brands_pkey;
ALTER TABLE IF EXISTS ONLY public.device_brands DROP CONSTRAINT IF EXISTS device_brands_name_key;
ALTER TABLE IF EXISTS ONLY public.delivery_appointments DROP CONSTRAINT IF EXISTS delivery_appointments_pkey;
ALTER TABLE IF EXISTS ONLY public.data_recovery_jobs DROP CONSTRAINT IF EXISTS data_recovery_jobs_pkey;
ALTER TABLE IF EXISTS ONLY public.data_recovery_jobs DROP CONSTRAINT IF EXISTS data_recovery_jobs_job_number_key;
ALTER TABLE IF EXISTS ONLY public.data_recovery_events DROP CONSTRAINT IF EXISTS data_recovery_events_pkey;
ALTER TABLE IF EXISTS ONLY public.dashboard_preferences DROP CONSTRAINT IF EXISTS dashboard_preferences_pkey;
ALTER TABLE IF EXISTS ONLY public.damaged_component_types DROP CONSTRAINT IF EXISTS damaged_component_types_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_repair_centers DROP CONSTRAINT IF EXISTS customer_repair_centers_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_repair_centers DROP CONSTRAINT IF EXISTS customer_repair_centers_customer_id_repair_center_id_key;
ALTER TABLE IF EXISTS ONLY public.customer_relationships DROP CONSTRAINT IF EXISTS customer_relationships_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_branches DROP CONSTRAINT IF EXISTS customer_branches_pkey;
ALTER TABLE IF EXISTS ONLY public.customer_addresses DROP CONSTRAINT IF EXISTS customer_addresses_pkey;
ALTER TABLE IF EXISTS ONLY public.chat_messages DROP CONSTRAINT IF EXISTS chat_messages_pkey;
ALTER TABLE IF EXISTS ONLY public.carts DROP CONSTRAINT IF EXISTS carts_pkey;
ALTER TABLE IF EXISTS ONLY public.cart_items DROP CONSTRAINT IF EXISTS cart_items_pkey;
ALTER TABLE IF EXISTS ONLY public.billing_data DROP CONSTRAINT IF EXISTS billing_data_user_id_unique;
ALTER TABLE IF EXISTS ONLY public.billing_data DROP CONSTRAINT IF EXISTS billing_data_pkey;
ALTER TABLE IF EXISTS ONLY public.b2b_returns DROP CONSTRAINT IF EXISTS b2b_returns_return_number_key;
ALTER TABLE IF EXISTS ONLY public.b2b_returns DROP CONSTRAINT IF EXISTS b2b_returns_pkey;
ALTER TABLE IF EXISTS ONLY public.b2b_return_items DROP CONSTRAINT IF EXISTS b2b_return_items_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_cache DROP CONSTRAINT IF EXISTS analytics_cache_pkey;
ALTER TABLE IF EXISTS ONLY public.analytics_cache DROP CONSTRAINT IF EXISTS analytics_cache_key_key;
ALTER TABLE IF EXISTS ONLY public.aesthetic_defects DROP CONSTRAINT IF EXISTS aesthetic_defects_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_staff_permissions DROP CONSTRAINT IF EXISTS admin_staff_permissions_user_id_module_key;
ALTER TABLE IF EXISTS ONLY public.admin_staff_permissions DROP CONSTRAINT IF EXISTS admin_staff_permissions_pkey;
ALTER TABLE IF EXISTS ONLY public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_setting_key_key;
ALTER TABLE IF EXISTS ONLY public.admin_settings DROP CONSTRAINT IF EXISTS admin_settings_pkey;
ALTER TABLE IF EXISTS ONLY public.activity_logs DROP CONSTRAINT IF EXISTS activity_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.accessory_types DROP CONSTRAINT IF EXISTS accessory_types_pkey;
ALTER TABLE IF EXISTS ONLY public.accessory_specs DROP CONSTRAINT IF EXISTS accessory_specs_product_id_key;
ALTER TABLE IF EXISTS ONLY public.accessory_specs DROP CONSTRAINT IF EXISTS accessory_specs_pkey;
ALTER TABLE IF EXISTS ONLY drizzle.__drizzle_migrations DROP CONSTRAINT IF EXISTS __drizzle_migrations_pkey;
ALTER TABLE IF EXISTS drizzle.__drizzle_migrations ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.warranty_products;
DROP TABLE IF EXISTS public.warehouses;
DROP TABLE IF EXISTS public.warehouse_transfers;
DROP TABLE IF EXISTS public.warehouse_transfer_items;
DROP TABLE IF EXISTS public.warehouse_stock;
DROP TABLE IF EXISTS public.warehouse_movements;
DROP TABLE IF EXISTS public.utility_suppliers;
DROP TABLE IF EXISTS public.utility_services;
DROP TABLE IF EXISTS public.utility_practices;
DROP TABLE IF EXISTS public.utility_practice_timeline;
DROP TABLE IF EXISTS public.utility_practice_tasks;
DROP TABLE IF EXISTS public.utility_practice_state_history;
DROP TABLE IF EXISTS public.utility_practice_products;
DROP TABLE IF EXISTS public.utility_practice_notes;
DROP TABLE IF EXISTS public.utility_practice_documents;
DROP TABLE IF EXISTS public.utility_commissions;
DROP TABLE IF EXISTS public.utility_categories;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.unrepairable_reasons;
DROP TABLE IF EXISTS public.trovausati_shops;
DROP TABLE IF EXISTS public.trovausati_orders;
DROP TABLE IF EXISTS public.trovausati_models;
DROP TABLE IF EXISTS public.trovausati_credentials;
DROP TABLE IF EXISTS public.trovausati_coupons;
DROP TABLE IF EXISTS public.transfer_requests;
DROP TABLE IF EXISTS public.transfer_request_items;
DROP TABLE IF EXISTS public.tickets;
DROP TABLE IF EXISTS public.ticket_messages;
DROP TABLE IF EXISTS public.suppliers;
DROP TABLE IF EXISTS public.supplier_sync_logs;
DROP TABLE IF EXISTS public.supplier_returns;
DROP TABLE IF EXISTS public.supplier_return_state_history;
DROP TABLE IF EXISTS public.supplier_return_items;
DROP TABLE IF EXISTS public.supplier_orders;
DROP TABLE IF EXISTS public.supplier_order_items;
DROP TABLE IF EXISTS public.supplier_communication_logs;
DROP TABLE IF EXISTS public.supplier_catalog_products;
DROP TABLE IF EXISTS public.stock_reservations;
DROP TABLE IF EXISTS public.standalone_quotes;
DROP TABLE IF EXISTS public.standalone_quote_items;
DROP TABLE IF EXISTS public.staff_sub_resellers;
DROP TABLE IF EXISTS public.staff_repair_centers;
DROP TABLE IF EXISTS public.smartphone_specs;
DROP TABLE IF EXISTS public.sifar_stores;
DROP TABLE IF EXISTS public.sifar_product_compatibility;
DROP TABLE IF EXISTS public.sifar_orders;
DROP TABLE IF EXISTS public.sifar_models;
DROP TABLE IF EXISTS public.sifar_credentials;
DROP TABLE IF EXISTS public.sifar_catalog;
DROP TABLE IF EXISTS public.sifar_carts;
DROP TABLE IF EXISTS public.sibill_transactions;
DROP TABLE IF EXISTS public.sibill_documents;
DROP TABLE IF EXISTS public.sibill_credentials;
DROP TABLE IF EXISTS public.sibill_companies;
DROP TABLE IF EXISTS public.sibill_categories;
DROP TABLE IF EXISTS public.sibill_accounts;
DROP TABLE IF EXISTS public.shipping_methods;
DROP TABLE IF EXISTS public.shipment_tracking_events;
DROP TABLE IF EXISTS public.session;
DROP TABLE IF EXISTS public.service_orders;
DROP TABLE IF EXISTS public.service_items;
DROP TABLE IF EXISTS public.service_item_prices;
DROP TABLE IF EXISTS public.self_diagnosis_sessions;
DROP TABLE IF EXISTS public.sales_orders;
DROP TABLE IF EXISTS public.sales_order_state_history;
DROP TABLE IF EXISTS public.sales_order_shipments;
DROP TABLE IF EXISTS public.sales_order_payments;
DROP TABLE IF EXISTS public.sales_order_items;
DROP TABLE IF EXISTS public.reseller_staff_permissions;
DROP TABLE IF EXISTS public.reseller_settings;
DROP TABLE IF EXISTS public.reseller_purchase_orders;
DROP TABLE IF EXISTS public.reseller_purchase_order_items;
DROP TABLE IF EXISTS public.reseller_products;
DROP TABLE IF EXISTS public.reseller_device_models;
DROP TABLE IF EXISTS public.reseller_device_brands;
DROP TABLE IF EXISTS public.repair_warranties;
DROP TABLE IF EXISTS public.repair_test_checklist;
DROP TABLE IF EXISTS public.repair_quotes;
DROP TABLE IF EXISTS public.repair_orders;
DROP TABLE IF EXISTS public.repair_order_state_history;
DROP TABLE IF EXISTS public.repair_logs;
DROP TABLE IF EXISTS public.repair_diagnostics;
DROP TABLE IF EXISTS public.repair_delivery;
DROP TABLE IF EXISTS public.repair_centers;
DROP TABLE IF EXISTS public.repair_center_settings;
DROP TABLE IF EXISTS public.repair_center_purchase_orders;
DROP TABLE IF EXISTS public.repair_center_purchase_order_items;
DROP TABLE IF EXISTS public.repair_center_blackouts;
DROP TABLE IF EXISTS public.repair_center_availability;
DROP TABLE IF EXISTS public.repair_attachments;
DROP TABLE IF EXISTS public.repair_acceptance;
DROP TABLE IF EXISTS public.remote_repair_requests;
DROP TABLE IF EXISTS public.remote_repair_request_devices;
DROP TABLE IF EXISTS public.push_notification_log;
DROP TABLE IF EXISTS public.promotions;
DROP TABLE IF EXISTS public.products;
DROP TABLE IF EXISTS public.product_suppliers;
DROP TABLE IF EXISTS public.product_prices;
DROP TABLE IF EXISTS public.product_device_compatibilities;
DROP TABLE IF EXISTS public.price_lists;
DROP TABLE IF EXISTS public.price_list_items;
DROP TABLE IF EXISTS public.pos_transactions;
DROP TABLE IF EXISTS public.pos_transaction_items;
DROP TABLE IF EXISTS public.pos_sessions;
DROP TABLE IF EXISTS public.pos_registers;
DROP TABLE IF EXISTS public.platform_fiscal_config;
DROP TABLE IF EXISTS public.payment_configurations;
DROP TABLE IF EXISTS public.parts_purchase_orders;
DROP TABLE IF EXISTS public.parts_orders;
DROP TABLE IF EXISTS public.parts_load_items;
DROP TABLE IF EXISTS public.parts_load_documents;
DROP TABLE IF EXISTS public.notifications;
DROP TABLE IF EXISTS public.notification_preferences;
DROP TABLE IF EXISTS public.mobilesentrix_orders;
DROP TABLE IF EXISTS public.mobilesentrix_order_items;
DROP TABLE IF EXISTS public.mobilesentrix_credentials;
DROP TABLE IF EXISTS public.mobilesentrix_cart_items;
DROP TABLE IF EXISTS public.marketplace_orders;
DROP TABLE IF EXISTS public.marketplace_order_items;
DROP TABLE IF EXISTS public.licenses;
DROP TABLE IF EXISTS public.license_plans;
DROP TABLE IF EXISTS public.issue_types;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.inventory_stock;
DROP TABLE IF EXISTS public.inventory_movements;
DROP TABLE IF EXISTS public.hr_work_profiles;
DROP TABLE IF EXISTS public.hr_work_profile_versions;
DROP TABLE IF EXISTS public.hr_work_profile_assignments;
DROP TABLE IF EXISTS public.hr_sick_leaves;
DROP TABLE IF EXISTS public.hr_notifications;
DROP TABLE IF EXISTS public.hr_leave_requests;
DROP TABLE IF EXISTS public.hr_leave_balances;
DROP TABLE IF EXISTS public.hr_justifications;
DROP TABLE IF EXISTS public.hr_expense_reports;
DROP TABLE IF EXISTS public.hr_expense_items;
DROP TABLE IF EXISTS public.hr_clocking_policies;
DROP TABLE IF EXISTS public.hr_clock_events;
DROP TABLE IF EXISTS public.hr_certificates;
DROP TABLE IF EXISTS public.hr_audit_logs;
DROP TABLE IF EXISTS public.hr_absences;
DROP TABLE IF EXISTS public.foneday_products_cache;
DROP TABLE IF EXISTS public.foneday_orders;
DROP TABLE IF EXISTS public.foneday_credentials;
DROP TABLE IF EXISTS public.external_labs;
DROP TABLE IF EXISTS public.external_integrations;
DROP TABLE IF EXISTS public.expo_push_tokens;
DROP TABLE IF EXISTS public.estimated_repair_times;
DROP TABLE IF EXISTS public.entity_fiscal_config;
DROP TABLE IF EXISTS public.diagnostic_findings;
DROP TABLE IF EXISTS public.device_types;
DROP TABLE IF EXISTS public.device_models;
DROP TABLE IF EXISTS public.device_brands;
DROP TABLE IF EXISTS public.delivery_appointments;
DROP TABLE IF EXISTS public.data_recovery_jobs;
DROP TABLE IF EXISTS public.data_recovery_events;
DROP TABLE IF EXISTS public.dashboard_preferences;
DROP TABLE IF EXISTS public.damaged_component_types;
DROP TABLE IF EXISTS public.customer_repair_centers;
DROP TABLE IF EXISTS public.customer_relationships;
DROP TABLE IF EXISTS public.customer_branches;
DROP TABLE IF EXISTS public.customer_addresses;
DROP TABLE IF EXISTS public.chat_messages;
DROP TABLE IF EXISTS public.carts;
DROP TABLE IF EXISTS public.cart_items;
DROP TABLE IF EXISTS public.billing_data;
DROP TABLE IF EXISTS public.b2b_returns;
DROP TABLE IF EXISTS public.b2b_return_items;
DROP TABLE IF EXISTS public.analytics_cache;
DROP TABLE IF EXISTS public.aesthetic_defects;
DROP TABLE IF EXISTS public.admin_staff_permissions;
DROP TABLE IF EXISTS public.admin_settings;
DROP TABLE IF EXISTS public.activity_logs;
DROP TABLE IF EXISTS public.accessory_types;
DROP TABLE IF EXISTS public.accessory_specs;
DROP SEQUENCE IF EXISTS drizzle.__drizzle_migrations_id_seq;
DROP TABLE IF EXISTS drizzle.__drizzle_migrations;
DROP TYPE IF EXISTS public.warranty_seller_type;
DROP TYPE IF EXISTS public.warranty_offer_status;
DROP TYPE IF EXISTS public.warranty_coverage_type;
DROP TYPE IF EXISTS public.warehouse_transfer_status;
DROP TYPE IF EXISTS public.warehouse_owner_type;
DROP TYPE IF EXISTS public.warehouse_movement_type;
DROP TYPE IF EXISTS public.utility_practice_task_status;
DROP TYPE IF EXISTS public.utility_practice_status;
DROP TYPE IF EXISTS public.utility_practice_priority;
DROP TYPE IF EXISTS public.utility_practice_event_type;
DROP TYPE IF EXISTS public.utility_note_visibility;
DROP TYPE IF EXISTS public.utility_document_category;
DROP TYPE IF EXISTS public.utility_commission_status;
DROP TYPE IF EXISTS public.utility_category;
DROP TYPE IF EXISTS public.user_role;
DROP TYPE IF EXISTS public.trovausati_order_status;
DROP TYPE IF EXISTS public.trovausati_coupon_status;
DROP TYPE IF EXISTS public.trovausati_api_type;
DROP TYPE IF EXISTS public.transfer_requester_type;
DROP TYPE IF EXISTS public.transfer_request_status;
DROP TYPE IF EXISTS public.ticket_type;
DROP TYPE IF EXISTS public.ticket_target_type;
DROP TYPE IF EXISTS public.ticket_status;
DROP TYPE IF EXISTS public.ticket_priority;
DROP TYPE IF EXISTS public.supplier_sync_status;
DROP TYPE IF EXISTS public.supplier_return_status;
DROP TYPE IF EXISTS public.supplier_payment_terms;
DROP TYPE IF EXISTS public.supplier_order_status;
DROP TYPE IF EXISTS public.supplier_order_owner_type;
DROP TYPE IF EXISTS public.supplier_communication_channel;
DROP TYPE IF EXISTS public.supplier_api_type;
DROP TYPE IF EXISTS public.supplier_api_auth_method;
DROP TYPE IF EXISTS public.stripe_account_status;
DROP TYPE IF EXISTS public.standalone_quote_status;
DROP TYPE IF EXISTS public.staff_module;
DROP TYPE IF EXISTS public.smartphone_storage;
DROP TYPE IF EXISTS public.smartphone_grade;
DROP TYPE IF EXISTS public.sla_severity;
DROP TYPE IF EXISTS public.sifar_environment;
DROP TYPE IF EXISTS public.sifar_cart_status;
DROP TYPE IF EXISTS public.shipment_status;
DROP TYPE IF EXISTS public.service_order_status;
DROP TYPE IF EXISTS public.service_order_payment_status;
DROP TYPE IF EXISTS public.service_order_payment_method;
DROP TYPE IF EXISTS public.self_diagnosis_status;
DROP TYPE IF EXISTS public.sales_payment_status;
DROP TYPE IF EXISTS public.sales_order_status;
DROP TYPE IF EXISTS public.return_reason;
DROP TYPE IF EXISTS public.reseller_purchase_order_status;
DROP TYPE IF EXISTS public.reseller_category;
DROP TYPE IF EXISTS public.repair_status;
DROP TYPE IF EXISTS public.repair_priority;
DROP TYPE IF EXISTS public.repair_log_type;
DROP TYPE IF EXISTS public.remote_repair_request_status;
DROP TYPE IF EXISTS public.quote_status;
DROP TYPE IF EXISTS public.quote_bypass_reason;
DROP TYPE IF EXISTS public.push_notification_status;
DROP TYPE IF EXISTS public.product_type;
DROP TYPE IF EXISTS public.product_condition;
DROP TYPE IF EXISTS public.price_list_target_audience;
DROP TYPE IF EXISTS public.price_list_owner_type;
DROP TYPE IF EXISTS public.pos_transaction_status;
DROP TYPE IF EXISTS public.pos_session_status;
DROP TYPE IF EXISTS public.pos_payment_method;
DROP TYPE IF EXISTS public.payment_status;
DROP TYPE IF EXISTS public.payment_order_type;
DROP TYPE IF EXISTS public.payment_method;
DROP TYPE IF EXISTS public.payment_config_entity_type;
DROP TYPE IF EXISTS public.parts_purchase_status;
DROP TYPE IF EXISTS public.parts_purchase_destination;
DROP TYPE IF EXISTS public.parts_order_status;
DROP TYPE IF EXISTS public.parts_load_status;
DROP TYPE IF EXISTS public.parts_load_item_status;
DROP TYPE IF EXISTS public.parts_load_document_type;
DROP TYPE IF EXISTS public.notification_type;
DROP TYPE IF EXISTS public.network_lock;
DROP TYPE IF EXISTS public.movement_type;
DROP TYPE IF EXISTS public.marketplace_order_status;
DROP TYPE IF EXISTS public.license_status;
DROP TYPE IF EXISTS public.license_plan_target;
DROP TYPE IF EXISTS public.license_payment_method;
DROP TYPE IF EXISTS public.invoice_source;
DROP TYPE IF EXISTS public.hr_sick_leave_status;
DROP TYPE IF EXISTS public.hr_notification_channel;
DROP TYPE IF EXISTS public.hr_leave_type;
DROP TYPE IF EXISTS public.hr_leave_request_status;
DROP TYPE IF EXISTS public.hr_justification_status;
DROP TYPE IF EXISTS public.hr_expense_status;
DROP TYPE IF EXISTS public.hr_clock_event_type;
DROP TYPE IF EXISTS public.hr_clock_event_status;
DROP TYPE IF EXISTS public.hr_certificate_type;
DROP TYPE IF EXISTS public.hr_audit_action;
DROP TYPE IF EXISTS public.hr_absence_type;
DROP TYPE IF EXISTS public.diagnosis_severity;
DROP TYPE IF EXISTS public.diagnosis_outcome;
DROP TYPE IF EXISTS public.delivery_type;
DROP TYPE IF EXISTS public.data_recovery_trigger;
DROP TYPE IF EXISTS public.data_recovery_status;
DROP TYPE IF EXISTS public.data_recovery_handling;
DROP TYPE IF EXISTS public.data_recovery_event_type;
DROP TYPE IF EXISTS public.customer_type;
DROP TYPE IF EXISTS public.customer_relationship_type;
DROP TYPE IF EXISTS public.company_category;
DROP TYPE IF EXISTS public.communication_type;
DROP TYPE IF EXISTS public.carrier;
DROP TYPE IF EXISTS public.b2b_return_status;
DROP TYPE IF EXISTS public.b2b_return_reason;
DROP TYPE IF EXISTS public.b2b_payment_method;
DROP TYPE IF EXISTS public.appointment_status;
DROP TYPE IF EXISTS public.admin_module;
DROP TYPE IF EXISTS public.accessory_type;
DROP SCHEMA IF EXISTS drizzle;
--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


--
-- Name: accessory_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.accessory_type AS ENUM (
    'cover',
    'pellicola',
    'caricatore',
    'cavo',
    'powerbank',
    'auricolari',
    'supporto',
    'adattatore',
    'memoria',
    'altro'
);


--
-- Name: admin_module; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.admin_module AS ENUM (
    'users',
    'resellers',
    'repair_centers',
    'repairs',
    'products',
    'inventory',
    'suppliers',
    'supplier_orders',
    'invoices',
    'tickets',
    'utility',
    'reports',
    'settings',
    'service_catalog'
);


--
-- Name: appointment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.appointment_status AS ENUM (
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show'
);


--
-- Name: b2b_payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.b2b_payment_method AS ENUM (
    'bank_transfer',
    'stripe',
    'credit',
    'paypal'
);


--
-- Name: b2b_return_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.b2b_return_reason AS ENUM (
    'defective',
    'wrong_item',
    'not_as_described',
    'damaged_in_transit',
    'excess_stock',
    'quality_issue',
    'other'
);


--
-- Name: b2b_return_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.b2b_return_status AS ENUM (
    'requested',
    'approved',
    'rejected',
    'awaiting_shipment',
    'shipped',
    'received',
    'inspecting',
    'completed',
    'cancelled'
);


--
-- Name: carrier; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.carrier AS ENUM (
    'brt',
    'gls',
    'dhl',
    'ups',
    'fedex',
    'poste_italiane',
    'sda',
    'tnt',
    'other'
);


--
-- Name: communication_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.communication_type AS ENUM (
    'order',
    'return_request',
    'inquiry',
    'tracking_update',
    'confirmation'
);


--
-- Name: company_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.company_category AS ENUM (
    'standard',
    'franchising',
    'gdo'
);


--
-- Name: customer_relationship_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.customer_relationship_type AS ENUM (
    'genitore',
    'figlio',
    'coniuge',
    'fratello',
    'cugino',
    'zio',
    'nipote',
    'nonno',
    'altro'
);


--
-- Name: customer_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.customer_type AS ENUM (
    'private',
    'company'
);


--
-- Name: data_recovery_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_recovery_event_type AS ENUM (
    'created',
    'assigned',
    'status_change',
    'note_added',
    'document_generated',
    'shipped',
    'tracking_update',
    'completed',
    'failed'
);


--
-- Name: data_recovery_handling; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_recovery_handling AS ENUM (
    'internal',
    'external'
);


--
-- Name: data_recovery_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_recovery_status AS ENUM (
    'pending',
    'assigned',
    'in_progress',
    'awaiting_shipment',
    'shipped',
    'at_lab',
    'completed',
    'partial',
    'failed',
    'cancelled'
);


--
-- Name: data_recovery_trigger; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.data_recovery_trigger AS ENUM (
    'manual',
    'automatic'
);


--
-- Name: delivery_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.delivery_type AS ENUM (
    'pickup',
    'shipping',
    'express'
);


--
-- Name: diagnosis_outcome; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.diagnosis_outcome AS ENUM (
    'riparabile',
    'non_conveniente',
    'irriparabile'
);


--
-- Name: diagnosis_severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.diagnosis_severity AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);


--
-- Name: hr_absence_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_absence_type AS ENUM (
    'ritardo',
    'uscita_anticipata',
    'assenza_ingiustificata',
    'assenza_giustificata'
);


--
-- Name: hr_audit_action; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_audit_action AS ENUM (
    'create',
    'update',
    'delete',
    'approve',
    'reject',
    'clock_in',
    'clock_out',
    'validate'
);


--
-- Name: hr_certificate_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_certificate_type AS ENUM (
    'malattia',
    'infortunio',
    'maternita',
    'altro'
);


--
-- Name: hr_clock_event_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_clock_event_status AS ENUM (
    'valid',
    'pending_validation',
    'validated',
    'rejected'
);


--
-- Name: hr_clock_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_clock_event_type AS ENUM (
    'entrata',
    'uscita',
    'pausa_inizio',
    'pausa_fine'
);


--
-- Name: hr_expense_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_expense_status AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'paid'
);


--
-- Name: hr_justification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_justification_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: hr_leave_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_leave_request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'cancelled'
);


--
-- Name: hr_leave_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_leave_type AS ENUM (
    'ferie',
    'permesso_rol',
    'permesso_studio',
    'permesso_medico',
    'permesso_lutto',
    'permesso_matrimonio',
    'congedo_parentale',
    'altro'
);


--
-- Name: hr_notification_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_notification_channel AS ENUM (
    'in_app',
    'email',
    'sms'
);


--
-- Name: hr_sick_leave_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.hr_sick_leave_status AS ENUM (
    'pending',
    'confirmed',
    'closed'
);


--
-- Name: invoice_source; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.invoice_source AS ENUM (
    'repair',
    'pos',
    'marketplace',
    'b2b',
    'other',
    'remote_repair'
);


--
-- Name: license_payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.license_payment_method AS ENUM (
    'stripe',
    'paypal',
    'manual',
    'free'
);


--
-- Name: license_plan_target; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.license_plan_target AS ENUM (
    'all',
    'standard',
    'franchising',
    'gdo'
);


--
-- Name: license_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.license_status AS ENUM (
    'active',
    'expired',
    'cancelled',
    'pending'
);


--
-- Name: marketplace_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.marketplace_order_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'processing',
    'shipped',
    'received',
    'cancelled'
);


--
-- Name: movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.movement_type AS ENUM (
    'in',
    'out',
    'adjustment'
);


--
-- Name: network_lock; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.network_lock AS ENUM (
    'unlocked',
    'locked',
    'icloud_locked'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'repair_update',
    'sla_warning',
    'review_request',
    'message',
    'system',
    'b2b_order_received'
);


--
-- Name: parts_load_document_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parts_load_document_type AS ENUM (
    'ddt',
    'fattura'
);


--
-- Name: parts_load_item_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parts_load_item_status AS ENUM (
    'pending',
    'matched',
    'stock',
    'error'
);


--
-- Name: parts_load_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parts_load_status AS ENUM (
    'draft',
    'processing',
    'completed',
    'partial',
    'cancelled'
);


--
-- Name: parts_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parts_order_status AS ENUM (
    'ordered',
    'in_transit',
    'received',
    'cancelled'
);


--
-- Name: parts_purchase_destination; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parts_purchase_destination AS ENUM (
    'external_supplier',
    'internal_warehouse'
);


--
-- Name: parts_purchase_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.parts_purchase_status AS ENUM (
    'draft',
    'submitted',
    'processing',
    'shipped',
    'received',
    'cancelled'
);


--
-- Name: payment_config_entity_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_config_entity_type AS ENUM (
    'reseller',
    'sub_reseller',
    'repair_center',
    'admin'
);


--
-- Name: payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_method AS ENUM (
    'cash',
    'card',
    'bank_transfer',
    'paypal',
    'stripe',
    'satispay',
    'pos',
    'credit'
);


--
-- Name: payment_order_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_order_type AS ENUM (
    'b2c',
    'b2b',
    'marketplace'
);


--
-- Name: payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.payment_status AS ENUM (
    'pending',
    'paid',
    'overdue',
    'cancelled'
);


--
-- Name: pos_payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pos_payment_method AS ENUM (
    'cash',
    'card',
    'pos_terminal',
    'satispay',
    'mixed',
    'stripe_link',
    'paypal'
);


--
-- Name: pos_session_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pos_session_status AS ENUM (
    'open',
    'closed'
);


--
-- Name: pos_transaction_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.pos_transaction_status AS ENUM (
    'completed',
    'refunded',
    'partial_refund',
    'voided',
    'pending',
    'expired'
);


--
-- Name: price_list_owner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.price_list_owner_type AS ENUM (
    'admin',
    'reseller',
    'sub_reseller',
    'repair_center'
);


--
-- Name: price_list_target_audience; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.price_list_target_audience AS ENUM (
    'sub_reseller',
    'repair_center',
    'customer',
    'all',
    'reseller'
);


--
-- Name: product_condition; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_condition AS ENUM (
    'nuovo',
    'ricondizionato',
    'usato',
    'compatibile'
);


--
-- Name: product_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.product_type AS ENUM (
    'ricambio',
    'accessorio',
    'dispositivo',
    'consumabile'
);


--
-- Name: push_notification_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.push_notification_status AS ENUM (
    'pending',
    'sent',
    'delivered',
    'failed',
    'device_not_registered'
);


--
-- Name: quote_bypass_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quote_bypass_reason AS ENUM (
    'garanzia',
    'omaggio'
);


--
-- Name: quote_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.quote_status AS ENUM (
    'draft',
    'sent',
    'accepted',
    'rejected'
);


--
-- Name: remote_repair_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.remote_repair_request_status AS ENUM (
    'pending',
    'assigned',
    'accepted',
    'rejected',
    'quoted',
    'quote_accepted',
    'quote_declined',
    'awaiting_shipment',
    'in_transit',
    'received',
    'repair_created',
    'cancelled'
);


--
-- Name: repair_log_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repair_log_type AS ENUM (
    'status_change',
    'technician_note',
    'parts_installed',
    'test_result',
    'customer_contact'
);


--
-- Name: repair_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repair_priority AS ENUM (
    'low',
    'medium',
    'high',
    'urgent'
);


--
-- Name: repair_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.repair_status AS ENUM (
    'pending',
    'in_progress',
    'waiting_parts',
    'completed',
    'delivered',
    'cancelled',
    'ingressato',
    'in_diagnosi',
    'preventivo_emesso',
    'preventivo_accettato',
    'preventivo_rifiutato',
    'attesa_ricambi',
    'in_riparazione',
    'in_test',
    'pronto_ritiro',
    'consegnato'
);


--
-- Name: reseller_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reseller_category AS ENUM (
    'standard',
    'franchising',
    'gdo'
);


--
-- Name: reseller_purchase_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.reseller_purchase_order_status AS ENUM (
    'draft',
    'pending',
    'approved',
    'rejected',
    'processing',
    'shipped',
    'received',
    'cancelled'
);


--
-- Name: return_reason; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.return_reason AS ENUM (
    'defective',
    'wrong_item',
    'damaged',
    'not_as_described',
    'excess_stock',
    'other'
);


--
-- Name: sales_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sales_order_status AS ENUM (
    'pending',
    'confirmed',
    'processing',
    'ready_to_ship',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'refunded'
);


--
-- Name: sales_payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sales_payment_status AS ENUM (
    'pending',
    'processing',
    'completed',
    'failed',
    'refunded',
    'partially_refunded'
);


--
-- Name: self_diagnosis_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.self_diagnosis_status AS ENUM (
    'pending',
    'in_progress',
    'completed',
    'expired'
);


--
-- Name: service_order_payment_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_order_payment_method AS ENUM (
    'in_person',
    'bank_transfer',
    'card',
    'paypal'
);


--
-- Name: service_order_payment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_order_payment_status AS ENUM (
    'pending',
    'paid',
    'cancelled'
);


--
-- Name: service_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.service_order_status AS ENUM (
    'pending',
    'accepted',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled'
);


--
-- Name: shipment_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.shipment_status AS ENUM (
    'pending',
    'preparing',
    'ready',
    'picked_up',
    'in_transit',
    'out_for_delivery',
    'delivered',
    'failed_delivery',
    'returned'
);


--
-- Name: sifar_cart_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sifar_cart_status AS ENUM (
    'active',
    'submitted',
    'expired'
);


--
-- Name: sifar_environment; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sifar_environment AS ENUM (
    'collaudo',
    'produzione'
);


--
-- Name: sla_severity; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.sla_severity AS ENUM (
    'in_time',
    'late',
    'urgent'
);


--
-- Name: smartphone_grade; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.smartphone_grade AS ENUM (
    'A+',
    'A',
    'B',
    'C',
    'D'
);


--
-- Name: smartphone_storage; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.smartphone_storage AS ENUM (
    '16GB',
    '32GB',
    '64GB',
    '128GB',
    '256GB',
    '512GB',
    '1TB',
    '2TB'
);


--
-- Name: staff_module; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.staff_module AS ENUM (
    'repairs',
    'customers',
    'products',
    'inventory',
    'repair_centers',
    'services',
    'suppliers',
    'supplier_orders',
    'appointments',
    'invoices',
    'tickets'
);


--
-- Name: standalone_quote_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.standalone_quote_status AS ENUM (
    'draft',
    'sent',
    'accepted',
    'rejected',
    'expired'
);


--
-- Name: stripe_account_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.stripe_account_status AS ENUM (
    'pending',
    'onboarding',
    'active',
    'restricted',
    'disabled'
);


--
-- Name: supplier_api_auth_method; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_api_auth_method AS ENUM (
    'bearer_token',
    'api_key_header',
    'api_key_query',
    'basic_auth',
    'oauth2',
    'none'
);


--
-- Name: supplier_api_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_api_type AS ENUM (
    'foneday',
    'ifixit',
    'mobilax',
    'generic_rest',
    'custom',
    'sifar'
);


--
-- Name: supplier_communication_channel; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_communication_channel AS ENUM (
    'api',
    'email',
    'whatsapp',
    'manual'
);


--
-- Name: supplier_order_owner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_order_owner_type AS ENUM (
    'admin',
    'reseller',
    'sub_reseller',
    'repair_center'
);


--
-- Name: supplier_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_order_status AS ENUM (
    'draft',
    'sent',
    'confirmed',
    'partially_shipped',
    'shipped',
    'partially_received',
    'received',
    'cancelled'
);


--
-- Name: supplier_payment_terms; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_payment_terms AS ENUM (
    'immediate',
    'cod',
    'bank_transfer_15',
    'bank_transfer_30',
    'bank_transfer_60',
    'bank_transfer_90',
    'riba_30',
    'riba_60',
    'credit_card',
    'paypal',
    'custom'
);


--
-- Name: supplier_return_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_return_status AS ENUM (
    'draft',
    'requested',
    'approved',
    'shipped',
    'received',
    'refunded',
    'rejected',
    'cancelled'
);


--
-- Name: supplier_sync_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.supplier_sync_status AS ENUM (
    'pending',
    'syncing',
    'success',
    'partial',
    'failed'
);


--
-- Name: ticket_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_priority AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: ticket_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_status AS ENUM (
    'open',
    'in_progress',
    'closed'
);


--
-- Name: ticket_target_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_target_type AS ENUM (
    'admin',
    'reseller',
    'repair_center'
);


--
-- Name: ticket_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ticket_type AS ENUM (
    'support',
    'internal'
);


--
-- Name: transfer_request_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transfer_request_status AS ENUM (
    'pending',
    'approved',
    'rejected',
    'shipped',
    'received',
    'cancelled'
);


--
-- Name: transfer_requester_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.transfer_requester_type AS ENUM (
    'repair_center',
    'sub_reseller'
);


--
-- Name: trovausati_api_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trovausati_api_type AS ENUM (
    'resellers',
    'stores'
);


--
-- Name: trovausati_coupon_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trovausati_coupon_status AS ENUM (
    'issued',
    'used',
    'cancelled',
    'expired'
);


--
-- Name: trovausati_order_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.trovausati_order_status AS ENUM (
    'pending',
    'confirmed',
    'shipped',
    'delivered',
    'cancelled'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'admin',
    'reseller',
    'repair_center',
    'customer',
    'reseller_staff',
    'admin_staff',
    'repair_center_staff'
);


--
-- Name: utility_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_category AS ENUM (
    'fisso',
    'mobile',
    'centralino',
    'luce',
    'gas',
    'altro'
);


--
-- Name: utility_commission_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_commission_status AS ENUM (
    'pending',
    'accrued',
    'invoiced',
    'paid',
    'cancelled'
);


--
-- Name: utility_document_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_document_category AS ENUM (
    'contratto',
    'documento_identita',
    'codice_fiscale',
    'bolletta',
    'conferma_fornitore',
    'fattura',
    'altro'
);


--
-- Name: utility_note_visibility; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_note_visibility AS ENUM (
    'internal',
    'customer'
);


--
-- Name: utility_practice_event_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_practice_event_type AS ENUM (
    'created',
    'status_change',
    'document_uploaded',
    'document_deleted',
    'task_created',
    'task_completed',
    'note_added',
    'assigned',
    'comment',
    'commissione_maturata',
    'commissione_approvata',
    'commissione_rifiutata'
);


--
-- Name: utility_practice_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_practice_priority AS ENUM (
    'bassa',
    'normale',
    'alta',
    'urgente'
);


--
-- Name: utility_practice_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_practice_status AS ENUM (
    'bozza',
    'inviata',
    'in_lavorazione',
    'attesa_documenti',
    'completata',
    'rifiutata',
    'annullata'
);


--
-- Name: utility_practice_task_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.utility_practice_task_status AS ENUM (
    'da_fare',
    'in_corso',
    'completato',
    'annullato'
);


--
-- Name: warehouse_movement_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warehouse_movement_type AS ENUM (
    'carico',
    'scarico',
    'trasferimento_in',
    'trasferimento_out',
    'rettifica'
);


--
-- Name: warehouse_owner_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warehouse_owner_type AS ENUM (
    'admin',
    'reseller',
    'sub_reseller',
    'repair_center'
);


--
-- Name: warehouse_transfer_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warehouse_transfer_status AS ENUM (
    'pending',
    'approved',
    'shipped',
    'received',
    'cancelled'
);


--
-- Name: warranty_coverage_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warranty_coverage_type AS ENUM (
    'basic',
    'extended',
    'full'
);


--
-- Name: warranty_offer_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warranty_offer_status AS ENUM (
    'offered',
    'accepted',
    'declined',
    'expired'
);


--
-- Name: warranty_seller_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.warranty_seller_type AS ENUM (
    'admin',
    'reseller',
    'sub_reseller',
    'repair_center'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: accessory_specs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessory_specs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    accessory_type public.accessory_type NOT NULL,
    is_universal boolean DEFAULT false NOT NULL,
    compatible_brands text[],
    compatible_models text[],
    material text,
    color text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: accessory_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.accessory_types (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    device_type_id character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    action text NOT NULL,
    entity_type text,
    entity_id character varying,
    changes text,
    ip_address text,
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_by character varying,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: admin_staff_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_staff_permissions (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    user_id character varying NOT NULL,
    admin_id character varying NOT NULL,
    module public.admin_module NOT NULL,
    can_read boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_update boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: aesthetic_defects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.aesthetic_defects (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    device_type_id character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: analytics_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.analytics_cache (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    key text NOT NULL,
    data text NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: b2b_return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.b2b_return_items (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    return_id character varying NOT NULL,
    order_item_id character varying,
    product_id character varying NOT NULL,
    product_name text NOT NULL,
    product_sku text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price real NOT NULL,
    total_price real NOT NULL,
    reason text,
    condition text,
    condition_notes text,
    restocked boolean DEFAULT false,
    restocked_at timestamp without time zone,
    restocked_quantity integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: b2b_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.b2b_returns (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    return_number text NOT NULL,
    order_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    status public.b2b_return_status DEFAULT 'requested'::public.b2b_return_status NOT NULL,
    reason public.b2b_return_reason NOT NULL,
    reason_details text,
    total_amount real DEFAULT 0 NOT NULL,
    credit_amount real,
    tracking_number text,
    carrier text,
    requested_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_at timestamp without time zone,
    rejected_at timestamp without time zone,
    shipped_at timestamp without time zone,
    received_at timestamp without time zone,
    completed_at timestamp without time zone,
    reseller_notes text,
    admin_notes text,
    rejection_reason text,
    inspection_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    shipping_label_path text,
    ddt_path text,
    documents_generated_at timestamp without time zone
);


--
-- Name: billing_data; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.billing_data (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    company_name text,
    vat_number text,
    fiscal_code text,
    address text NOT NULL,
    city text NOT NULL,
    zip_code text NOT NULL,
    country text DEFAULT 'IT'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    customer_type public.customer_type DEFAULT 'private'::public.customer_type NOT NULL,
    pec text,
    codice_univoco text,
    iban text,
    google_place_id text,
    has_autonomous_invoicing boolean DEFAULT false NOT NULL
);


--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    cart_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price real NOT NULL,
    total_price real NOT NULL,
    discount real DEFAULT 0 NOT NULL,
    product_snapshot text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.carts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying,
    reseller_id character varying NOT NULL,
    session_id character varying,
    status text DEFAULT 'active'::text NOT NULL,
    subtotal real DEFAULT 0 NOT NULL,
    discount real DEFAULT 0 NOT NULL,
    shipping_cost real DEFAULT 0 NOT NULL,
    total real DEFAULT 0 NOT NULL,
    coupon_code text,
    notes text,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    sender_id character varying NOT NULL,
    receiver_id character varying NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_addresses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_addresses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    label text,
    recipient_name text NOT NULL,
    phone text,
    address text NOT NULL,
    city text NOT NULL,
    province text NOT NULL,
    postal_code text NOT NULL,
    country text DEFAULT 'IT'::text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    is_billing boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_branches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_branches (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    parent_customer_id character varying NOT NULL,
    branch_code text NOT NULL,
    branch_name text NOT NULL,
    address text,
    city text,
    province text,
    postal_code text,
    contact_name text,
    contact_phone text,
    contact_email text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_relationships; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_relationships (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying NOT NULL,
    related_customer_id character varying NOT NULL,
    relationship_type public.customer_relationship_type NOT NULL,
    notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: customer_repair_centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.customer_repair_centers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying NOT NULL,
    repair_center_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: damaged_component_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.damaged_component_types (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    device_type_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: dashboard_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.dashboard_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    role text NOT NULL,
    layout jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: data_recovery_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_recovery_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    data_recovery_job_id character varying NOT NULL,
    event_type public.data_recovery_event_type NOT NULL,
    title text NOT NULL,
    description text,
    metadata text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: data_recovery_jobs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.data_recovery_jobs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    job_number text NOT NULL,
    parent_repair_order_id character varying NOT NULL,
    diagnosis_id character varying,
    trigger_type public.data_recovery_trigger DEFAULT 'manual'::public.data_recovery_trigger NOT NULL,
    handling_type public.data_recovery_handling NOT NULL,
    status public.data_recovery_status DEFAULT 'pending'::public.data_recovery_status NOT NULL,
    device_description text NOT NULL,
    assigned_to_user_id character varying,
    assigned_to_group_id character varying,
    external_lab_id character varying,
    external_lab_job_ref text,
    shipping_document_url text,
    shipping_label_url text,
    tracking_number text,
    tracking_carrier text,
    shipped_at timestamp without time zone,
    received_at_lab_at timestamp without time zone,
    recovery_outcome text,
    recovered_data_description text,
    recovered_data_size text,
    recovered_data_media_type text,
    estimated_cost integer,
    final_cost integer,
    internal_notes text,
    customer_notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone
);


--
-- Name: delivery_appointments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.delivery_appointments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    repair_center_id character varying NOT NULL,
    reseller_id character varying,
    customer_id character varying,
    date text NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    status public.appointment_status DEFAULT 'scheduled'::public.appointment_status NOT NULL,
    notes text,
    confirmed_by character varying,
    confirmed_at timestamp without time zone,
    cancelled_by character varying,
    cancelled_at timestamp without time zone,
    cancel_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: device_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_brands (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    logo_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: device_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_models (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    model_name text NOT NULL,
    brand text,
    device_class text,
    market_code text,
    photo_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    brand_id character varying,
    type_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reseller_id character varying,
    market_codes text[]
);


--
-- Name: device_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.device_types (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: diagnostic_findings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.diagnostic_findings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    category text,
    device_type_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: entity_fiscal_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entity_fiscal_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    entity_type character varying(30) NOT NULL,
    entity_id character varying NOT NULL,
    rt_enabled boolean DEFAULT false NOT NULL,
    rt_api_key text,
    rt_api_secret text,
    rt_endpoint text,
    use_own_credentials boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    rt_entity_id character varying(200),
    rt_system_id character varying(200)
);


--
-- Name: estimated_repair_times; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.estimated_repair_times (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    hours_min real NOT NULL,
    hours_max real NOT NULL,
    device_type_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: expo_push_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expo_push_tokens (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token character varying(255) NOT NULL,
    device_name character varying(255),
    platform character varying(20),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: external_integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_integrations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    is_active boolean DEFAULT false NOT NULL,
    config_fields text,
    default_api_endpoint text,
    default_auth_method text,
    supports_catalog boolean DEFAULT false,
    supports_ordering boolean DEFAULT false,
    supports_cart boolean DEFAULT false,
    docs_url text,
    display_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    supports_invoicing boolean DEFAULT false,
    supports_reconciliation boolean DEFAULT false,
    supports_accounts boolean DEFAULT false
);


--
-- Name: external_labs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.external_labs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    phone text,
    email text NOT NULL,
    contact_person text,
    api_endpoint text,
    api_key text,
    supports_api_integration boolean DEFAULT false NOT NULL,
    tracking_prefix text,
    avg_turnaround_days integer DEFAULT 7,
    base_cost integer,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: foneday_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.foneday_credentials (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    api_token text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_sync_at timestamp without time zone,
    last_test_at timestamp without time zone,
    test_status text,
    test_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: foneday_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.foneday_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    foneday_order_number text NOT NULL,
    status text NOT NULL,
    shipment_method text,
    tracking_number text,
    total_incl_vat integer NOT NULL,
    paid boolean DEFAULT false NOT NULL,
    invoice_number text,
    amount_of_products integer DEFAULT 0 NOT NULL,
    total_products integer DEFAULT 0 NOT NULL,
    order_data text,
    foneday_created_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: foneday_products_cache; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.foneday_products_cache (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    products_data text NOT NULL,
    total_products integer DEFAULT 0 NOT NULL,
    last_sync_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    sync_duration_ms integer,
    sync_status text DEFAULT 'success'::text NOT NULL,
    sync_error text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_absences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_absences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    absence_type public.hr_absence_type NOT NULL,
    absence_date timestamp without time zone NOT NULL,
    expected_time character varying(5),
    actual_time character varying(5),
    minutes_lost integer,
    is_justified boolean DEFAULT false,
    auto_detected boolean DEFAULT true,
    related_clock_event_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_audit_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    user_id character varying,
    target_user_id character varying,
    action public.hr_audit_action NOT NULL,
    entity_type character varying(50) NOT NULL,
    entity_id character varying NOT NULL,
    previous_data jsonb,
    new_data jsonb,
    ip_address character varying(45),
    user_agent text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_certificates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_certificates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    certificate_type public.hr_certificate_type NOT NULL,
    related_sick_leave_id character varying,
    file_name character varying(255) NOT NULL,
    file_url text NOT NULL,
    file_size integer,
    mime_type character varying(100),
    valid_from timestamp without time zone NOT NULL,
    valid_to timestamp without time zone,
    uploaded_by character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_clock_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_clock_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    event_type public.hr_clock_event_type NOT NULL,
    event_time timestamp without time zone NOT NULL,
    latitude real,
    longitude real,
    accuracy real,
    device_info text,
    policy_id character varying,
    distance_from_location real,
    status public.hr_clock_event_status DEFAULT 'valid'::public.hr_clock_event_status NOT NULL,
    validated_by character varying,
    validated_at timestamp without time zone,
    validation_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_clocking_policies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_clocking_policies (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    location_name character varying(200) NOT NULL,
    latitude real NOT NULL,
    longitude real NOT NULL,
    radius_meters integer DEFAULT 100 NOT NULL,
    requires_geolocation boolean DEFAULT true,
    allow_manual_entry boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_expense_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_expense_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    expense_report_id character varying NOT NULL,
    expense_date timestamp without time zone NOT NULL,
    category character varying(100) NOT NULL,
    description text NOT NULL,
    amount real NOT NULL,
    receipt_url text,
    receipt_file_name character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_expense_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_expense_reports (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    report_number character varying(50),
    title character varying(200) NOT NULL,
    description text,
    total_amount real DEFAULT 0 NOT NULL,
    status public.hr_expense_status DEFAULT 'draft'::public.hr_expense_status NOT NULL,
    submitted_at timestamp without time zone,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejection_reason text,
    paid_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    receipt_url text,
    receipt_file_name character varying(255),
    repair_center_id character varying
);


--
-- Name: hr_justifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_justifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    absence_id character varying NOT NULL,
    user_id character varying NOT NULL,
    justification_text text NOT NULL,
    status public.hr_justification_status DEFAULT 'pending'::public.hr_justification_status NOT NULL,
    reviewed_by character varying,
    reviewed_at timestamp without time zone,
    review_note text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_leave_balances; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_leave_balances (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    leave_type public.hr_leave_type NOT NULL,
    year integer NOT NULL,
    accrued real DEFAULT 0 NOT NULL,
    used real DEFAULT 0 NOT NULL,
    pending real DEFAULT 0 NOT NULL,
    carried_over real DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_leave_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_leave_requests (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    leave_type public.hr_leave_type NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    start_time character varying(5),
    end_time character varying(5),
    is_full_day boolean DEFAULT true NOT NULL,
    total_hours real NOT NULL,
    total_days real NOT NULL,
    reason text,
    status public.hr_leave_request_status DEFAULT 'pending'::public.hr_leave_request_status NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    recipient_id character varying,
    channel public.hr_notification_channel NOT NULL,
    subject character varying(255) NOT NULL,
    message text NOT NULL,
    is_broadcast boolean DEFAULT false,
    target_filters jsonb,
    sent_at timestamp without time zone,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_sick_leaves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_sick_leaves (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone,
    protocol_number character varying(50),
    certificate_required boolean DEFAULT true,
    certificate_uploaded boolean DEFAULT false,
    certificate_deadline timestamp without time zone,
    validated_by character varying,
    validated_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    status public.hr_sick_leave_status DEFAULT 'pending'::public.hr_sick_leave_status NOT NULL
);


--
-- Name: hr_work_profile_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_work_profile_assignments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    work_profile_id character varying NOT NULL,
    valid_from timestamp without time zone DEFAULT now() NOT NULL,
    valid_to timestamp without time zone,
    assigned_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_work_profile_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_work_profile_versions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    work_profile_id character varying NOT NULL,
    version_number integer NOT NULL,
    weekly_hours real NOT NULL,
    daily_hours real NOT NULL,
    work_days jsonb NOT NULL,
    break_minutes integer,
    tolerance_minutes integer,
    valid_from timestamp without time zone NOT NULL,
    valid_to timestamp without time zone,
    changed_by character varying,
    change_reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: hr_work_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hr_work_profiles (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    weekly_hours real NOT NULL,
    daily_hours real NOT NULL,
    work_days jsonb NOT NULL,
    break_minutes integer DEFAULT 60,
    tolerance_minutes integer DEFAULT 15,
    is_default boolean DEFAULT false,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    start_time character varying(5),
    end_time character varying(5),
    source_type character varying(20),
    source_entity_id character varying,
    is_synced boolean DEFAULT false,
    last_synced_at timestamp without time zone,
    auto_sync_disabled boolean DEFAULT false
);


--
-- Name: inventory_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_movements (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    repair_center_id character varying NOT NULL,
    movement_type public.movement_type NOT NULL,
    quantity integer NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying NOT NULL
);


--
-- Name: inventory_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventory_stock (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    repair_center_id character varying NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    invoice_number text NOT NULL,
    repair_order_id character varying,
    customer_id character varying,
    amount integer NOT NULL,
    tax integer DEFAULT 0 NOT NULL,
    total integer NOT NULL,
    payment_status public.payment_status DEFAULT 'pending'::public.payment_status NOT NULL,
    payment_method text DEFAULT 'bank_transfer'::text,
    due_date timestamp without time zone,
    paid_date timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    pos_transaction_id character varying,
    repair_center_id character varying,
    reseller_id character varying,
    marketplace_order_id character varying,
    source public.invoice_source DEFAULT 'other'::public.invoice_source,
    vat_rate real DEFAULT 22 NOT NULL,
    remote_repair_request_id character varying
);


--
-- Name: issue_types; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.issue_types (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    device_type_id character varying,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: license_plans; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.license_plans (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    target_category public.license_plan_target DEFAULT 'all'::public.license_plan_target NOT NULL,
    duration_months integer NOT NULL,
    price_cents integer NOT NULL,
    features text,
    max_staff_users integer,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: licenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.licenses (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    license_plan_id character varying NOT NULL,
    status public.license_status DEFAULT 'pending'::public.license_status NOT NULL,
    start_date timestamp without time zone NOT NULL,
    end_date timestamp without time zone NOT NULL,
    payment_method public.license_payment_method DEFAULT 'manual'::public.license_payment_method NOT NULL,
    payment_id character varying,
    auto_renew boolean DEFAULT false NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: marketplace_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity integer NOT NULL,
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    product_name text NOT NULL,
    product_sku text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    vat_rate integer DEFAULT 22 NOT NULL
);


--
-- Name: marketplace_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.marketplace_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    buyer_reseller_id character varying NOT NULL,
    seller_reseller_id character varying NOT NULL,
    status public.marketplace_order_status DEFAULT 'pending'::public.marketplace_order_status NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    discount_amount integer DEFAULT 0 NOT NULL,
    shipping_cost integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    payment_method public.b2b_payment_method DEFAULT 'bank_transfer'::public.b2b_payment_method,
    payment_reference text,
    payment_confirmed_at timestamp without time zone,
    payment_confirmed_by character varying,
    buyer_notes text,
    seller_notes text,
    rejection_reason text,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejected_by character varying,
    rejected_at timestamp without time zone,
    shipped_at timestamp without time zone,
    shipped_by character varying,
    tracking_number text,
    tracking_carrier text,
    received_at timestamp without time zone,
    warehouse_transfer_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    shipping_method_id character varying
);


--
-- Name: mobilesentrix_cart_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mobilesentrix_cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    product_id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    brand text,
    model text,
    price integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mobilesentrix_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mobilesentrix_credentials (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    consumer_name text NOT NULL,
    consumer_key text NOT NULL,
    consumer_secret text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    last_sync_at timestamp without time zone,
    last_test_at timestamp without time zone,
    test_status text,
    test_message text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    environment text DEFAULT 'production'::text NOT NULL,
    access_token text,
    access_token_secret text
);


--
-- Name: mobilesentrix_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mobilesentrix_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id text NOT NULL,
    sku text NOT NULL,
    name text NOT NULL,
    brand text,
    model text,
    price integer NOT NULL,
    quantity integer NOT NULL,
    image_url text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: mobilesentrix_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mobilesentrix_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    mobilesentrix_order_id text NOT NULL,
    order_number text,
    status text NOT NULL,
    total_amount integer NOT NULL,
    currency text DEFAULT 'USD'::text,
    shipping_method text,
    tracking_number text,
    order_data text,
    mobilesentrix_created_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notification_preferences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_preferences (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    types text[] DEFAULT ARRAY['repair_update'::text, 'sla_warning'::text, 'review_request'::text, 'message'::text, 'system'::text] NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    type public.notification_type NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    data text,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parts_load_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_load_documents (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    load_number text NOT NULL,
    document_type public.parts_load_document_type NOT NULL,
    document_number text NOT NULL,
    document_date timestamp without time zone NOT NULL,
    supplier_id character varying NOT NULL,
    supplier_order_id character varying,
    repair_center_id character varying NOT NULL,
    status public.parts_load_status DEFAULT 'draft'::public.parts_load_status NOT NULL,
    total_items integer DEFAULT 0 NOT NULL,
    total_quantity integer DEFAULT 0 NOT NULL,
    total_amount integer DEFAULT 0 NOT NULL,
    matched_items integer DEFAULT 0 NOT NULL,
    stock_items integer DEFAULT 0 NOT NULL,
    error_items integer DEFAULT 0 NOT NULL,
    processed_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    is_auto_import boolean DEFAULT false NOT NULL,
    import_source text,
    import_metadata text,
    session_id character varying,
    session_sequence integer,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parts_load_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_load_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    parts_load_document_id character varying NOT NULL,
    part_code text NOT NULL,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    status public.parts_load_item_status DEFAULT 'pending'::public.parts_load_item_status NOT NULL,
    matched_parts_order_id character varying,
    matched_repair_order_id character varying,
    matched_product_id character varying,
    stock_location_suggested text,
    stock_location_confirmed text,
    added_to_inventory boolean DEFAULT false NOT NULL,
    inventory_movement_id character varying,
    error_message text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: parts_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    part_name text NOT NULL,
    part_number text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_cost integer,
    supplier text,
    status public.parts_order_status DEFAULT 'ordered'::public.parts_order_status NOT NULL,
    ordered_at timestamp without time zone DEFAULT now() NOT NULL,
    expected_arrival timestamp without time zone,
    received_at timestamp without time zone,
    ordered_by character varying NOT NULL,
    notes text,
    product_id character varying,
    purchase_order_id character varying(36)
);


--
-- Name: parts_purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parts_purchase_orders (
    id character varying(36) DEFAULT (gen_random_uuid())::text NOT NULL,
    repair_order_id character varying(36) NOT NULL,
    order_number character varying(50) NOT NULL,
    destination_type public.parts_purchase_destination DEFAULT 'external_supplier'::public.parts_purchase_destination NOT NULL,
    supplier_name character varying(255),
    supplier_id character varying(36),
    source_warehouse_id character varying(36),
    total_amount integer DEFAULT 0,
    status public.parts_purchase_status DEFAULT 'draft'::public.parts_purchase_status NOT NULL,
    expected_arrival timestamp without time zone,
    shipped_at timestamp without time zone,
    received_at timestamp without time zone,
    notes text,
    created_by character varying(36) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: payment_configurations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.payment_configurations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    entity_type public.payment_config_entity_type NOT NULL,
    entity_id character varying NOT NULL,
    use_parent_config boolean DEFAULT false NOT NULL,
    bank_transfer_enabled boolean DEFAULT false NOT NULL,
    iban character varying(34),
    bank_name character varying(100),
    account_holder character varying(200),
    bic character varying(11),
    stripe_enabled boolean DEFAULT false NOT NULL,
    stripe_account_id character varying(50),
    stripe_account_status public.stripe_account_status,
    stripe_onboarding_complete boolean DEFAULT false NOT NULL,
    stripe_details_submitted boolean DEFAULT false NOT NULL,
    stripe_charges_enabled boolean DEFAULT false NOT NULL,
    stripe_payouts_enabled boolean DEFAULT false NOT NULL,
    paypal_enabled boolean DEFAULT false NOT NULL,
    paypal_email character varying(254),
    paypal_merchant_id character varying(50),
    satispay_enabled boolean DEFAULT false NOT NULL,
    satispay_shop_id character varying(50),
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    paypal_client_id character varying(100),
    paypal_client_secret character varying(500),
    stripe_publishable_key character varying(200),
    stripe_secret_key character varying(500)
);


--
-- Name: platform_fiscal_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.platform_fiscal_config (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    default_rt_provider character varying(30) DEFAULT 'sandbox'::character varying NOT NULL,
    rt_api_key text,
    rt_api_secret text,
    rt_endpoint text,
    allow_override boolean DEFAULT true NOT NULL,
    sandbox_mode boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    rt_entity_id character varying(200),
    rt_system_id character varying(200)
);


--
-- Name: pos_registers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_registers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_center_id character varying NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    default_payment_method character varying(20) DEFAULT 'cash'::character varying,
    enabled_payment_methods text[],
    auto_print_receipt boolean DEFAULT false NOT NULL,
    rt_provider character varying(30) DEFAULT 'none'::character varying,
    rt_enabled boolean DEFAULT false NOT NULL,
    rt_api_key text,
    rt_api_secret text,
    rt_endpoint text,
    rt_device_id character varying(100),
    rt_uses_platform_config boolean DEFAULT true NOT NULL
);


--
-- Name: pos_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_center_id character varying NOT NULL,
    operator_id character varying NOT NULL,
    status public.pos_session_status DEFAULT 'open'::public.pos_session_status NOT NULL,
    opened_at timestamp without time zone DEFAULT now() NOT NULL,
    closed_at timestamp without time zone,
    opening_cash integer DEFAULT 0 NOT NULL,
    closing_cash integer,
    expected_cash integer,
    cash_difference integer,
    total_sales integer DEFAULT 0 NOT NULL,
    total_transactions integer DEFAULT 0 NOT NULL,
    total_cash_sales integer DEFAULT 0 NOT NULL,
    total_card_sales integer DEFAULT 0 NOT NULL,
    total_refunds integer DEFAULT 0 NOT NULL,
    opening_notes text,
    closing_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    register_id character varying,
    daily_report_generated boolean DEFAULT false NOT NULL,
    totals_by_vat_rate jsonb
);


--
-- Name: pos_transaction_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_transaction_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    transaction_id character varying NOT NULL,
    product_id character varying,
    product_name text NOT NULL,
    product_sku character varying(100),
    product_barcode character varying(100),
    quantity integer NOT NULL,
    unit_price integer NOT NULL,
    discount integer DEFAULT 0 NOT NULL,
    total_price integer NOT NULL,
    inventory_deducted boolean DEFAULT false NOT NULL,
    warehouse_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    is_temporary boolean DEFAULT false NOT NULL,
    service_item_id character varying,
    is_service boolean DEFAULT false NOT NULL,
    vat_rate real DEFAULT 22 NOT NULL,
    warranty_product_id character varying,
    is_warranty boolean DEFAULT false NOT NULL
);


--
-- Name: pos_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pos_transactions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    transaction_number character varying(50) NOT NULL,
    repair_center_id character varying NOT NULL,
    session_id character varying,
    customer_id character varying,
    operator_id character varying NOT NULL,
    subtotal integer NOT NULL,
    discount_amount integer DEFAULT 0 NOT NULL,
    discount_percent real,
    tax_rate real DEFAULT 22 NOT NULL,
    tax_amount integer DEFAULT 0 NOT NULL,
    total integer NOT NULL,
    payment_method public.pos_payment_method NOT NULL,
    cash_received integer,
    change_given integer,
    card_last_four character varying(4),
    payment_reference character varying(100),
    status public.pos_transaction_status DEFAULT 'completed'::public.pos_transaction_status NOT NULL,
    refunded_amount integer DEFAULT 0,
    refund_reason text,
    refunded_at timestamp without time zone,
    refunded_by character varying,
    notes text,
    customer_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    invoice_requested boolean DEFAULT false NOT NULL,
    invoice_id character varying,
    register_id character varying,
    void_reason text,
    voided_at timestamp without time zone,
    voided_by character varying,
    stripe_session_id character varying,
    stripe_payment_url text,
    stripe_payment_expires_at timestamp without time zone,
    paypal_order_id character varying,
    paypal_approval_url text,
    lottery_code character varying(8),
    document_type character varying(20) DEFAULT 'receipt'::character varying NOT NULL,
    daily_number integer,
    rt_status character varying(20) DEFAULT 'not_required'::character varying,
    rt_submission_id character varying(200),
    rt_submitted_at timestamp without time zone,
    rt_error_message text,
    rt_document_url text,
    rt_provider_used character varying(30),
    rt_retry_count integer DEFAULT 0
);


--
-- Name: price_list_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_list_items (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    price_list_id character varying NOT NULL,
    product_id character varying,
    service_item_id character varying,
    price_cents integer NOT NULL,
    cost_price_cents integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    vat_rate real,
    warranty_product_id character varying
);


--
-- Name: price_lists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.price_lists (
    id character varying DEFAULT (gen_random_uuid())::character varying NOT NULL,
    name text NOT NULL,
    description text,
    owner_id character varying NOT NULL,
    owner_type public.price_list_owner_type NOT NULL,
    repair_center_id character varying,
    parent_list_id character varying,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    target_audience public.price_list_target_audience DEFAULT 'all'::public.price_list_target_audience NOT NULL,
    target_customer_type public.customer_type,
    default_vat_rate real DEFAULT 22 NOT NULL
);


--
-- Name: product_device_compatibilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_device_compatibilities (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    device_brand_id character varying NOT NULL,
    device_model_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: product_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_prices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    price_cents integer NOT NULL,
    cost_price_cents integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: product_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product_suppliers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    supplier_id character varying NOT NULL,
    supplier_code text,
    supplier_name text,
    purchase_price integer,
    min_order_qty integer DEFAULT 1,
    pack_size integer DEFAULT 1,
    lead_time_days integer,
    is_preferred boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    sku text NOT NULL,
    category text NOT NULL,
    description text,
    unit_price integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    product_type public.product_type DEFAULT 'ricambio'::public.product_type NOT NULL,
    brand text,
    compatible_models text[],
    color text,
    cost_price integer,
    condition public.product_condition DEFAULT 'nuovo'::public.product_condition NOT NULL,
    warranty_months integer DEFAULT 3,
    supplier text,
    supplier_code text,
    min_stock integer DEFAULT 5,
    location text,
    is_active boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying,
    device_type_id character varying,
    image_url text,
    is_visible_in_shop boolean DEFAULT true NOT NULL,
    is_marketplace_enabled boolean DEFAULT false NOT NULL,
    marketplace_price_cents integer,
    marketplace_min_quantity integer DEFAULT 1,
    repair_center_id character varying,
    barcode character varying(255),
    vat_rate real DEFAULT 22 NOT NULL,
    is_courtesy_phone boolean DEFAULT false NOT NULL
);


--
-- Name: promotions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.promotions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: push_notification_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_notification_log (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    token_id character varying NOT NULL,
    expo_ticket_id character varying,
    status public.push_notification_status DEFAULT 'pending'::public.push_notification_status NOT NULL,
    title text NOT NULL,
    body text NOT NULL,
    data text,
    error_message text,
    retry_count integer DEFAULT 0 NOT NULL,
    next_retry_at timestamp without time zone,
    receipt_checked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: remote_repair_request_devices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remote_repair_request_devices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    request_id character varying NOT NULL,
    device_type text NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    device_model_id character varying,
    imei text,
    serial text,
    quantity integer DEFAULT 1 NOT NULL,
    issue_description text NOT NULL,
    photos text[],
    status public.remote_repair_request_status DEFAULT 'pending'::public.remote_repair_request_status NOT NULL,
    repair_order_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: remote_repair_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remote_repair_requests (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    request_number text NOT NULL,
    customer_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    sub_reseller_id character varying,
    requested_center_id character varying,
    assigned_center_id character varying,
    status public.remote_repair_request_status DEFAULT 'pending'::public.remote_repair_request_status NOT NULL,
    rejection_reason text,
    forwarded_from character varying,
    forward_reason text,
    customer_address text,
    customer_city text,
    customer_cap text,
    customer_province text,
    courier_name text,
    tracking_number text,
    shipped_at timestamp without time zone,
    received_at timestamp without time zone,
    customer_notes text,
    center_notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    quote_amount integer,
    quote_description text,
    quote_valid_until timestamp without time zone,
    quoted_at timestamp without time zone,
    quote_response_at timestamp without time zone,
    payment_method text,
    payment_status text,
    stripe_payment_intent_id text,
    paypal_order_id text
);


--
-- Name: repair_acceptance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_acceptance (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    declared_defects text[],
    aesthetic_condition text,
    aesthetic_notes text,
    aesthetic_photos_mandatory boolean DEFAULT false NOT NULL,
    accessories text[],
    lock_code text,
    lock_pattern text,
    has_lock_code boolean,
    accessories_removed boolean,
    accepted_by character varying NOT NULL,
    accepted_at timestamp without time zone DEFAULT now() NOT NULL,
    label_document_url text
);


--
-- Name: repair_attachments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_attachments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying,
    object_key text NOT NULL,
    file_name text NOT NULL,
    file_type text NOT NULL,
    file_size integer NOT NULL,
    uploaded_by character varying NOT NULL,
    uploaded_at timestamp without time zone DEFAULT now() NOT NULL,
    upload_session_id text
);


--
-- Name: repair_center_availability; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_center_availability (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_center_id character varying NOT NULL,
    weekday integer NOT NULL,
    start_time text NOT NULL,
    end_time text NOT NULL,
    slot_duration_minutes integer DEFAULT 30 NOT NULL,
    capacity_per_slot integer DEFAULT 1 NOT NULL,
    is_closed boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_center_blackouts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_center_blackouts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_center_id character varying NOT NULL,
    date text NOT NULL,
    start_time text,
    end_time text,
    reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_center_purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_center_purchase_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying NOT NULL,
    product_name text NOT NULL,
    product_sku text,
    quantity integer NOT NULL,
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_center_purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_center_purchase_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    repair_center_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    discount_amount integer DEFAULT 0 NOT NULL,
    shipping_cost integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    payment_method text DEFAULT 'bank_transfer'::text,
    payment_reference text,
    payment_confirmed_at timestamp without time zone,
    notes text,
    rejection_reason text,
    approved_by character varying,
    approved_at timestamp without time zone,
    shipped_at timestamp without time zone,
    tracking_number text,
    carrier text,
    delivered_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    shipping_method_id character varying,
    tax integer DEFAULT 0 NOT NULL
);


--
-- Name: repair_center_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_center_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_center_id character varying NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_centers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    reseller_id character varying,
    cap text,
    provincia text,
    ragione_sociale text,
    partita_iva text,
    codice_fiscale text,
    iban text,
    codice_univoco text,
    pec text,
    hourly_rate_cents integer,
    description text,
    website_url text,
    logo_url text,
    public_phone text,
    public_email text,
    accepts_walk_ins boolean DEFAULT false,
    opening_hours jsonb,
    social_links jsonb,
    notes text,
    sub_reseller_id character varying,
    has_autonomous_invoicing boolean DEFAULT false NOT NULL
);


--
-- Name: repair_delivery; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_delivery (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    delivered_to text NOT NULL,
    delivery_method text DEFAULT 'in_store'::text NOT NULL,
    signature_data text,
    id_document_type text,
    id_document_number text,
    notes text,
    delivered_by character varying NOT NULL,
    delivered_at timestamp without time zone DEFAULT now() NOT NULL,
    id_document_photo text,
    customer_signature text,
    customer_signer_name text,
    customer_signed_at timestamp without time zone,
    technician_signature text,
    technician_signer_name text,
    technician_signed_at timestamp without time zone
);


--
-- Name: repair_diagnostics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_diagnostics (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    technical_diagnosis text,
    damaged_components text[],
    estimated_repair_time real,
    requires_external_parts boolean DEFAULT false NOT NULL,
    diagnosis_notes text,
    photos text[],
    diagnosed_by character varying NOT NULL,
    diagnosed_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    finding_ids text[],
    component_ids text[],
    estimated_repair_time_id character varying,
    diagnosis_outcome public.diagnosis_outcome DEFAULT 'riparabile'::public.diagnosis_outcome,
    unrepairable_reason_id character varying,
    unrepairable_reason_other text,
    customer_data_important boolean DEFAULT false,
    suggested_promotion_ids text[],
    data_recovery_requested boolean DEFAULT false,
    skip_photos boolean DEFAULT false NOT NULL,
    suggested_device_ids text[]
);


--
-- Name: repair_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    log_type public.repair_log_type NOT NULL,
    description text NOT NULL,
    technician_id character varying NOT NULL,
    hours_worked integer,
    parts_used text,
    test_results text,
    photos text[],
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_order_state_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_order_state_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    status public.repair_status NOT NULL,
    entered_at timestamp without time zone DEFAULT now() NOT NULL,
    exited_at timestamp without time zone,
    duration_minutes integer,
    changed_by character varying
);


--
-- Name: repair_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    customer_id character varying NOT NULL,
    reseller_id character varying,
    repair_center_id character varying,
    device_type text NOT NULL,
    device_model text NOT NULL,
    issue_description text,
    status public.repair_status DEFAULT 'pending'::public.repair_status NOT NULL,
    estimated_cost integer,
    final_cost integer,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    brand text,
    imei text,
    serial text,
    imei_not_readable boolean DEFAULT false NOT NULL,
    imei_not_present boolean DEFAULT false NOT NULL,
    serial_only boolean DEFAULT false NOT NULL,
    ingressato_at timestamp without time zone,
    device_model_id character varying,
    priority public.repair_priority,
    quote_bypass_reason public.quote_bypass_reason,
    quote_bypassed_at timestamp without time zone,
    branch_id character varying,
    skip_diagnosis boolean DEFAULT false,
    skip_diagnosis_reason text,
    warranty_supplier text,
    warranty_purchase_date timestamp without time zone,
    warranty_purchase_price integer,
    warranty_proof_attachment_id character varying,
    is_return boolean DEFAULT false NOT NULL,
    parent_repair_order_id character varying,
    return_reason text,
    courtesy_phone_product_id character varying,
    courtesy_phone_assigned_at timestamp without time zone,
    courtesy_phone_returned_at timestamp without time zone,
    courtesy_phone_notes text
);


--
-- Name: repair_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_quotes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    quote_number text NOT NULL,
    parts text,
    labor_cost integer DEFAULT 0 NOT NULL,
    total_amount integer NOT NULL,
    status public.quote_status DEFAULT 'draft'::public.quote_status NOT NULL,
    valid_until timestamp without time zone,
    notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_test_checklist; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_test_checklist (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    repair_order_id character varying NOT NULL,
    display_test boolean,
    touch_test boolean,
    battery_test boolean,
    audio_test boolean,
    camera_test boolean,
    connectivity_test boolean,
    buttons_test boolean,
    sensors_test boolean,
    charging_test boolean,
    software_test boolean,
    overall_result boolean,
    notes text,
    tested_by character varying NOT NULL,
    tested_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: repair_warranties; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.repair_warranties (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    repair_order_id character varying(255),
    customer_id character varying(255) NOT NULL,
    warranty_product_id character varying(255) NOT NULL,
    seller_type public.warranty_seller_type NOT NULL,
    seller_id character varying(255) NOT NULL,
    status public.warranty_offer_status DEFAULT 'offered'::public.warranty_offer_status NOT NULL,
    price_snapshot integer NOT NULL,
    duration_months_snapshot integer NOT NULL,
    coverage_type_snapshot text NOT NULL,
    product_name_snapshot text NOT NULL,
    starts_at timestamp without time zone,
    ends_at timestamp without time zone,
    invoice_id character varying(255),
    notes text,
    offered_at timestamp without time zone DEFAULT now() NOT NULL,
    accepted_at timestamp without time zone,
    declined_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_device_brands; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_device_brands (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    name text NOT NULL,
    logo_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_device_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_device_models (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    model_name text NOT NULL,
    brand_id character varying,
    reseller_brand_id character varying,
    brand_name text,
    type_id character varying,
    photo_url text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    is_published boolean DEFAULT false NOT NULL,
    custom_price_cents integer,
    inherited_from character varying,
    can_override_price boolean DEFAULT true NOT NULL,
    can_unpublish boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    b2b_price_cents integer,
    minimum_order_quantity integer DEFAULT 1
);


--
-- Name: reseller_purchase_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_purchase_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying NOT NULL,
    product_name text NOT NULL,
    product_sku text,
    product_image text,
    quantity integer NOT NULL,
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    shipped_quantity integer,
    received_quantity integer,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_purchase_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_purchase_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    reseller_id character varying NOT NULL,
    status public.reseller_purchase_order_status DEFAULT 'draft'::public.reseller_purchase_order_status NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    discount_amount integer DEFAULT 0 NOT NULL,
    shipping_cost integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    payment_method public.b2b_payment_method DEFAULT 'bank_transfer'::public.b2b_payment_method,
    payment_reference text,
    payment_confirmed_at timestamp without time zone,
    payment_confirmed_by character varying,
    reseller_notes text,
    admin_notes text,
    rejection_reason text,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejected_by character varying,
    rejected_at timestamp without time zone,
    shipped_at timestamp without time zone,
    shipped_by character varying,
    tracking_number text,
    tracking_carrier text,
    received_at timestamp without time zone,
    warehouse_transfer_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    shipping_method_id character varying
);


--
-- Name: reseller_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_settings (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    setting_key text NOT NULL,
    setting_value text NOT NULL,
    description text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: reseller_staff_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reseller_staff_permissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    module public.staff_module NOT NULL,
    can_read boolean DEFAULT false NOT NULL,
    can_create boolean DEFAULT false NOT NULL,
    can_update boolean DEFAULT false NOT NULL,
    can_delete boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    product_id character varying NOT NULL,
    product_name text NOT NULL,
    product_sku text,
    product_image text,
    quantity integer NOT NULL,
    unit_price real NOT NULL,
    discount real DEFAULT 0 NOT NULL,
    total_price real NOT NULL,
    inventory_reserved boolean DEFAULT false NOT NULL,
    inventory_deducted boolean DEFAULT false NOT NULL,
    product_snapshot text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_order_payments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_order_payments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    method public.payment_method NOT NULL,
    status public.sales_payment_status DEFAULT 'pending'::public.sales_payment_status NOT NULL,
    amount real NOT NULL,
    currency text DEFAULT 'EUR'::text NOT NULL,
    transaction_id text,
    gateway_reference text,
    gateway_response text,
    paid_at timestamp without time zone,
    failed_at timestamp without time zone,
    refunded_at timestamp without time zone,
    refund_amount real,
    refund_reason text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    order_type public.payment_order_type DEFAULT 'b2c'::public.payment_order_type,
    order_number text,
    confirmed_by character varying,
    reseller_id character varying,
    reseller_name text
);


--
-- Name: sales_order_shipments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_order_shipments (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    status public.shipment_status DEFAULT 'pending'::public.shipment_status NOT NULL,
    carrier public.carrier,
    carrier_name text,
    tracking_number text,
    tracking_url text,
    weight real,
    length real,
    width real,
    height real,
    shipping_cost real,
    insurance_value real,
    prepared_at timestamp without time zone,
    picked_up_at timestamp without time zone,
    delivered_at timestamp without time zone,
    estimated_delivery timestamp without time zone,
    delivery_signature text,
    delivery_photo text,
    delivery_notes text,
    label_url text,
    manifest_id text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_order_state_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_order_state_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    from_status text,
    to_status text NOT NULL,
    changed_by character varying,
    reason text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sales_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sales_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    customer_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    branch_id character varying,
    status public.sales_order_status DEFAULT 'pending'::public.sales_order_status NOT NULL,
    delivery_type public.delivery_type DEFAULT 'shipping'::public.delivery_type NOT NULL,
    subtotal real NOT NULL,
    discount_amount real DEFAULT 0 NOT NULL,
    discount_code text,
    shipping_cost real DEFAULT 0 NOT NULL,
    tax_amount real DEFAULT 0 NOT NULL,
    total real NOT NULL,
    shipping_address_id character varying,
    shipping_recipient text,
    shipping_address text,
    shipping_city text,
    shipping_province text,
    shipping_postal_code text,
    shipping_country text DEFAULT 'IT'::text,
    shipping_phone text,
    billing_address_id character varying,
    billing_recipient text,
    billing_address text,
    billing_city text,
    billing_province text,
    billing_postal_code text,
    billing_country text DEFAULT 'IT'::text,
    customer_notes text,
    internal_notes text,
    estimated_delivery timestamp without time zone,
    confirmed_at timestamp without time zone,
    shipped_at timestamp without time zone,
    delivered_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    cancellation_reason text,
    source text DEFAULT 'web'::text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    vat_rate real DEFAULT 22 NOT NULL
);


--
-- Name: self_diagnosis_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.self_diagnosis_sessions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    token character varying(64) NOT NULL,
    repair_order_id character varying,
    created_by character varying NOT NULL,
    status public.self_diagnosis_status DEFAULT 'pending'::public.self_diagnosis_status NOT NULL,
    display_test boolean,
    touch_test boolean,
    battery_test boolean,
    audio_test boolean,
    camera_front_test boolean,
    camera_rear_test boolean,
    microphone_test boolean,
    speaker_test boolean,
    vibration_test boolean,
    connectivity_test boolean,
    sensors_test boolean,
    buttons_test boolean,
    device_info jsonb,
    battery_level integer,
    notes text,
    expires_at timestamp without time zone NOT NULL,
    started_at timestamp without time zone,
    completed_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: service_item_prices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_item_prices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    service_item_id character varying NOT NULL,
    reseller_id character varying,
    repair_center_id character varying,
    price_cents integer NOT NULL,
    labor_minutes integer,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: service_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    device_type_id character varying,
    default_price_cents integer NOT NULL,
    default_labor_minutes integer DEFAULT 60 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying,
    repair_center_id character varying,
    brand_id character varying,
    model_id character varying,
    vat_rate real DEFAULT 22 NOT NULL
);


--
-- Name: service_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.service_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    customer_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    repair_center_id character varying,
    service_item_id character varying NOT NULL,
    price_cents integer NOT NULL,
    device_type text,
    device_model_id character varying,
    brand text,
    model text,
    imei text,
    serial text,
    issue_description text,
    customer_notes text,
    internal_notes text,
    status public.service_order_status DEFAULT 'pending'::public.service_order_status NOT NULL,
    repair_order_id character varying,
    accepted_at timestamp without time zone,
    scheduled_at timestamp without time zone,
    completed_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    delivery_method text,
    shipping_address text,
    shipping_city text,
    shipping_cap text,
    shipping_province text,
    courier_name text,
    tracking_number text,
    shipped_at timestamp without time zone,
    device_received_at timestamp without time zone,
    ddt_url text,
    payment_method public.service_order_payment_method DEFAULT 'in_person'::public.service_order_payment_method NOT NULL,
    payment_status public.service_order_payment_status DEFAULT 'pending'::public.service_order_payment_status NOT NULL
);


--
-- Name: session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session (
    sid character varying NOT NULL,
    sess json NOT NULL,
    expire timestamp(6) without time zone NOT NULL
);


--
-- Name: shipment_tracking_events; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipment_tracking_events (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    shipment_id character varying NOT NULL,
    status text NOT NULL,
    status_code text,
    description text,
    location text,
    event_at timestamp without time zone NOT NULL,
    raw_data text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: shipping_methods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.shipping_methods (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    price_cents integer DEFAULT 0 NOT NULL,
    estimated_days integer,
    is_pickup boolean DEFAULT false NOT NULL,
    created_by character varying,
    repair_center_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    is_template boolean DEFAULT false NOT NULL,
    copied_from_id character varying
);


--
-- Name: sibill_accounts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sibill_accounts (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying(255) NOT NULL,
    reseller_id character varying(255) NOT NULL,
    external_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    iban character varying(50),
    bank_name character varying(255),
    account_type character varying(50),
    balance integer,
    currency character varying(10) DEFAULT 'EUR'::character varying,
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sibill_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sibill_categories (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying(255) NOT NULL,
    reseller_id character varying(255) NOT NULL,
    external_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    parent_id character varying(255),
    category_type character varying(50),
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sibill_companies; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sibill_companies (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying(255) NOT NULL,
    reseller_id character varying(255) NOT NULL,
    external_id character varying(255) NOT NULL,
    name character varying(500) NOT NULL,
    vat_number character varying(50),
    fiscal_code character varying(50),
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sibill_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sibill_credentials (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying(255) NOT NULL,
    api_key text NOT NULL,
    environment character varying(20) DEFAULT 'production'::character varying,
    company_id character varying(255),
    is_active boolean DEFAULT true,
    last_test_at timestamp without time zone,
    last_test_result character varying(50),
    last_sync_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    api_token text DEFAULT ''::text NOT NULL,
    selected_company_id character varying(255),
    selected_company_name text,
    test_status text,
    test_message text
);


--
-- Name: sibill_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sibill_documents (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying(255) NOT NULL,
    reseller_id character varying(255) NOT NULL,
    external_id character varying(255) NOT NULL,
    document_number character varying(100),
    document_type character varying(50),
    status character varying(50),
    issue_date date,
    due_date date,
    total_amount integer,
    currency character varying(10) DEFAULT 'EUR'::character varying,
    counterparty_name character varying(500),
    counterparty_vat character varying(50),
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sibill_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sibill_transactions (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying(255) NOT NULL,
    reseller_id character varying(255) NOT NULL,
    account_id character varying(255),
    external_id character varying(255) NOT NULL,
    amount integer NOT NULL,
    currency character varying(10) DEFAULT 'EUR'::character varying,
    transaction_date timestamp without time zone NOT NULL,
    value_date timestamp without time zone,
    description text,
    counterparty_name character varying(500),
    counterparty_iban character varying(50),
    category_id character varying(255),
    status character varying(50) DEFAULT 'pending'::character varying,
    matched_document_id character varying(255),
    raw_data jsonb,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: sifar_carts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_carts (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    store_id character varying NOT NULL,
    status public.sifar_cart_status DEFAULT 'active'::public.sifar_cart_status NOT NULL,
    items_count integer DEFAULT 0 NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    cart_data text,
    last_sync_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sifar_catalog; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_catalog (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    codice_articolo text NOT NULL,
    ean text,
    descrizione text NOT NULL,
    marca text,
    modello text,
    categoria text,
    gruppo text,
    prezzo_netto integer,
    aliquota_iva integer DEFAULT 22,
    disponibile boolean DEFAULT false NOT NULL,
    giacenza integer,
    contatta_per_ordinare boolean DEFAULT false,
    image_url text,
    qualita text,
    mesi_garanzia integer DEFAULT 0,
    last_sync_at timestamp without time zone DEFAULT now() NOT NULL,
    raw_data text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sifar_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_credentials (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    client_key text NOT NULL,
    allowed_ip text,
    partner_code text,
    environment public.sifar_environment DEFAULT 'collaudo'::public.sifar_environment NOT NULL,
    default_courier_id text,
    is_active boolean DEFAULT true NOT NULL,
    last_test_at timestamp without time zone,
    last_test_result text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sifar_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_models (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    codice_modello text NOT NULL,
    descrizione text NOT NULL,
    codice_marca text NOT NULL,
    nome_marca text,
    image_url text,
    last_sync_at timestamp without time zone DEFAULT now() NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sifar_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    store_id character varying NOT NULL,
    sifar_order_id text,
    sifar_order_number text,
    subtotal_cents integer NOT NULL,
    shipping_cents integer DEFAULT 0,
    tax_cents integer DEFAULT 0,
    total_cents integer NOT NULL,
    courier_id text,
    courier_name text,
    tracking_number text,
    status text DEFAULT 'pending'::text NOT NULL,
    order_data text,
    supplier_order_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sifar_product_compatibility; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_product_compatibility (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    catalog_id character varying NOT NULL,
    model_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: sifar_stores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sifar_stores (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    store_code text NOT NULL,
    store_name text NOT NULL,
    branch_id character varying,
    repair_center_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: smartphone_specs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.smartphone_specs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying NOT NULL,
    storage public.smartphone_storage,
    ram text,
    screen_size text,
    battery_health text,
    grade public.smartphone_grade,
    network_lock public.network_lock DEFAULT 'unlocked'::public.network_lock,
    imei text,
    imei2 text,
    serial_number text,
    original_box boolean DEFAULT false NOT NULL,
    accessories text[],
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: staff_repair_centers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_repair_centers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    staff_id character varying NOT NULL,
    repair_center_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: staff_sub_resellers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.staff_sub_resellers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    staff_id character varying NOT NULL,
    sub_reseller_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: standalone_quote_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.standalone_quote_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    quote_id character varying NOT NULL,
    service_item_id character varying,
    name text NOT NULL,
    description text,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price_cents integer NOT NULL,
    vat_rate real DEFAULT 22 NOT NULL,
    total_cents integer NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    product_id character varying,
    item_type text DEFAULT 'service'::text NOT NULL
);


--
-- Name: standalone_quotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.standalone_quotes (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    quote_number text NOT NULL,
    customer_id character varying,
    customer_name text,
    customer_email text,
    customer_phone text,
    device_type_id character varying,
    brand_id character varying,
    model_id character varying,
    device_description text,
    subtotal_cents integer DEFAULT 0 NOT NULL,
    vat_amount_cents integer DEFAULT 0 NOT NULL,
    total_amount_cents integer DEFAULT 0 NOT NULL,
    status public.standalone_quote_status DEFAULT 'draft'::public.standalone_quote_status NOT NULL,
    valid_until timestamp without time zone,
    notes text,
    created_by character varying NOT NULL,
    reseller_id character varying,
    repair_center_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: stock_reservations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.stock_reservations (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying NOT NULL,
    order_item_id character varying NOT NULL,
    product_id character varying NOT NULL,
    reseller_id character varying NOT NULL,
    repair_center_id character varying,
    quantity integer NOT NULL,
    status text DEFAULT 'reserved'::text NOT NULL,
    reserved_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp without time zone,
    committed_at timestamp without time zone,
    released_at timestamp without time zone
);


--
-- Name: supplier_catalog_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_catalog_products (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    supplier_id character varying(255) NOT NULL,
    external_sku text NOT NULL,
    external_ean text,
    external_artcode text,
    title text NOT NULL,
    description text,
    category text,
    brand text,
    model_brand text,
    model_codes text,
    suitable_for text,
    quality text,
    price_cents integer NOT NULL,
    currency text DEFAULT 'EUR'::text,
    in_stock boolean DEFAULT false NOT NULL,
    stock_quantity integer,
    image_url text,
    thumbnail_url text,
    raw_data text,
    linked_product_id character varying(255),
    linked_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: supplier_communication_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_communication_logs (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    supplier_id character varying NOT NULL,
    communication_type public.communication_type NOT NULL,
    channel public.supplier_communication_channel NOT NULL,
    entity_type text,
    entity_id character varying,
    subject text,
    content text NOT NULL,
    sent_at timestamp without time zone,
    delivered_at timestamp without time zone,
    read_at timestamp without time zone,
    failed_at timestamp without time zone,
    failure_reason text,
    response_content text,
    response_received_at timestamp without time zone,
    metadata text,
    created_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: supplier_order_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    supplier_order_id character varying NOT NULL,
    product_id character varying,
    supplier_code text,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    quantity_received integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: supplier_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_number text NOT NULL,
    supplier_id character varying NOT NULL,
    repair_center_id character varying,
    status public.supplier_order_status DEFAULT 'draft'::public.supplier_order_status NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    shipping_cost integer DEFAULT 0,
    tax_amount integer DEFAULT 0,
    total_amount integer DEFAULT 0 NOT NULL,
    expected_delivery timestamp without time zone,
    sent_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    shipped_at timestamp without time zone,
    received_at timestamp without time zone,
    tracking_number text,
    tracking_carrier text,
    repair_order_id character varying,
    notes text,
    internal_notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    owner_type text DEFAULT 'repair_center'::text,
    owner_id text,
    target_warehouse_id character varying
);


--
-- Name: supplier_return_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_return_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    supplier_return_id character varying NOT NULL,
    product_id character varying,
    supplier_order_item_id character varying,
    supplier_code text,
    description text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price integer NOT NULL,
    total_price integer NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: supplier_return_state_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_return_state_history (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    supplier_return_id character varying NOT NULL,
    status text NOT NULL,
    entered_at timestamp without time zone DEFAULT now() NOT NULL,
    exited_at timestamp without time zone,
    duration_minutes integer,
    changed_by character varying
);


--
-- Name: supplier_returns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_returns (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    return_number text NOT NULL,
    supplier_id character varying NOT NULL,
    repair_center_id character varying NOT NULL,
    supplier_order_id character varying,
    status public.supplier_return_status DEFAULT 'draft'::public.supplier_return_status NOT NULL,
    reason public.return_reason NOT NULL,
    reason_details text,
    total_amount integer DEFAULT 0 NOT NULL,
    refund_amount integer,
    requested_at timestamp without time zone,
    approved_at timestamp without time zone,
    shipped_at timestamp without time zone,
    received_at timestamp without time zone,
    refunded_at timestamp without time zone,
    tracking_number text,
    tracking_carrier text,
    rma_number text,
    notes text,
    internal_notes text,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: supplier_sync_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_sync_logs (
    id character varying(255) DEFAULT gen_random_uuid() NOT NULL,
    supplier_id character varying(255) NOT NULL,
    status character varying(50) NOT NULL,
    products_total integer DEFAULT 0,
    products_created integer DEFAULT 0,
    products_updated integer DEFAULT 0,
    products_failed integer DEFAULT 0,
    duration_ms integer,
    error_message text,
    error_details text,
    triggered_by character varying(255),
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.suppliers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    whatsapp text,
    website text,
    address text,
    city text,
    zip_code text,
    country text DEFAULT 'IT'::text,
    vat_number text,
    fiscal_code text,
    communication_channel public.supplier_communication_channel DEFAULT 'email'::public.supplier_communication_channel NOT NULL,
    api_endpoint text,
    api_key text,
    api_format text,
    order_email_template text,
    return_email_template text,
    payment_terms public.supplier_payment_terms DEFAULT 'bank_transfer_30'::public.supplier_payment_terms,
    delivery_days integer DEFAULT 3,
    min_order_amount integer,
    shipping_cost integer,
    free_shipping_threshold integer,
    notes text,
    internal_notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    api_type public.supplier_api_type,
    api_secret_name text,
    api_auth_method public.supplier_api_auth_method DEFAULT 'bearer_token'::public.supplier_api_auth_method,
    api_products_endpoint text,
    api_orders_endpoint text,
    api_cart_endpoint text,
    api_invoices_endpoint text,
    catalog_sync_enabled boolean DEFAULT false,
    catalog_sync_status public.supplier_sync_status,
    catalog_last_sync_at timestamp without time zone,
    catalog_products_count integer DEFAULT 0,
    created_by character varying
);


--
-- Name: ticket_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ticket_messages (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    ticket_id character varying NOT NULL,
    user_id character varying NOT NULL,
    message text NOT NULL,
    is_internal boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    attachments jsonb DEFAULT '[]'::jsonb
);


--
-- Name: tickets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tickets (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    ticket_number text NOT NULL,
    customer_id character varying NOT NULL,
    subject text NOT NULL,
    description text NOT NULL,
    status public.ticket_status DEFAULT 'open'::public.ticket_status NOT NULL,
    priority public.ticket_priority DEFAULT 'medium'::public.ticket_priority NOT NULL,
    assigned_to character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    ticket_type public.ticket_type DEFAULT 'support'::public.ticket_type NOT NULL,
    initiator_id character varying,
    initiator_role character varying,
    target_type public.ticket_target_type DEFAULT 'admin'::public.ticket_target_type,
    target_id character varying
);


--
-- Name: transfer_request_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfer_request_items (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    request_id character varying NOT NULL,
    product_id character varying NOT NULL,
    requested_quantity integer NOT NULL,
    approved_quantity integer,
    shipped_quantity integer,
    received_quantity integer
);


--
-- Name: transfer_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transfer_requests (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    request_number text NOT NULL,
    requester_type public.transfer_requester_type NOT NULL,
    requester_id character varying NOT NULL,
    requester_warehouse_id character varying NOT NULL,
    source_warehouse_id character varying NOT NULL,
    target_reseller_id character varying,
    status public.transfer_request_status DEFAULT 'pending'::public.transfer_request_status NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejected_by character varying,
    rejected_at timestamp without time zone,
    rejection_reason text,
    shipped_at timestamp without time zone,
    shipped_by character varying,
    received_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    tracking_number text,
    tracking_carrier text,
    ddt_number text
);


--
-- Name: trovausati_coupons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trovausati_coupons (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    shop_id character varying,
    coupon_code text NOT NULL,
    barcode text,
    value_cents integer NOT NULL,
    status public.trovausati_coupon_status DEFAULT 'issued'::public.trovausati_coupon_status NOT NULL,
    brand text,
    model text,
    imei_or_sn text,
    consumed_at timestamp without time zone,
    consumed_shop_id text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trovausati_credentials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trovausati_credentials (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    reseller_id character varying NOT NULL,
    api_type public.trovausati_api_type DEFAULT 'resellers'::public.trovausati_api_type NOT NULL,
    api_key text,
    marketplace_id text,
    is_active boolean DEFAULT true NOT NULL,
    last_test_at timestamp without time zone,
    last_test_result text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    marketplace_api_key text,
    stores_api_key text,
    stores_is_active boolean DEFAULT false NOT NULL,
    stores_last_test_at timestamp without time zone,
    stores_last_test_result text
);


--
-- Name: trovausati_models; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trovausati_models (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    external_id integer NOT NULL,
    brand text NOT NULL,
    model text NOT NULL,
    model_base text,
    variant text,
    device_type text,
    label text,
    image_url text,
    price_never_used integer,
    price_great integer,
    price_good integer,
    price_average integer,
    price_shop integer,
    price_public integer,
    last_sync_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trovausati_orders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trovausati_orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    external_order_id text NOT NULL,
    reference text,
    status public.trovausati_order_status DEFAULT 'pending'::public.trovausati_order_status NOT NULL,
    total_products integer DEFAULT 0 NOT NULL,
    total_cents integer DEFAULT 0 NOT NULL,
    carrier_code text,
    tracking_code text,
    shipping_pdf_url text,
    address_data text,
    products_data text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: trovausati_shops; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trovausati_shops (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    credential_id character varying NOT NULL,
    shop_id text NOT NULL,
    shop_name text NOT NULL,
    branch_id character varying,
    repair_center_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: unrepairable_reasons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.unrepairable_reasons (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    device_type_id character varying,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    icon text
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    username text NOT NULL,
    password text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    role public.user_role DEFAULT 'customer'::public.user_role NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    repair_center_id character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    phone text,
    reseller_id character varying,
    reseller_category public.reseller_category DEFAULT 'standard'::public.reseller_category,
    parent_reseller_id character varying,
    partita_iva text,
    codice_fiscale text,
    ragione_sociale text,
    indirizzo text,
    cap text,
    citta text,
    provincia text,
    iban text,
    codice_univoco text,
    pec text,
    sub_reseller_id character varying,
    logo_url text,
    has_autonomous_invoicing boolean DEFAULT false NOT NULL
);


--
-- Name: utility_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_categories (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    slug text NOT NULL,
    name text NOT NULL,
    description text,
    icon text,
    color text,
    sort_order integer DEFAULT 0 NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_commissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_commissions (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    practice_id character varying NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    amount_cents integer NOT NULL,
    status public.utility_commission_status DEFAULT 'pending'::public.utility_commission_status NOT NULL,
    accrued_at timestamp without time zone,
    invoiced_at timestamp without time zone,
    paid_at timestamp without time zone,
    invoice_number text,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    rejected_by character varying,
    rejected_at timestamp without time zone,
    rejected_reason text
);


--
-- Name: utility_practice_documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practice_documents (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    practice_id character varying NOT NULL,
    object_key text NOT NULL,
    file_name text NOT NULL,
    file_size integer NOT NULL,
    mime_type text,
    category public.utility_document_category DEFAULT 'altro'::public.utility_document_category NOT NULL,
    description text,
    uploaded_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_practice_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practice_notes (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    practice_id character varying NOT NULL,
    body text NOT NULL,
    visibility public.utility_note_visibility DEFAULT 'internal'::public.utility_note_visibility NOT NULL,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_practice_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practice_products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    practice_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price_cents integer NOT NULL,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_practice_state_history; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practice_state_history (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    practice_id character varying NOT NULL,
    from_status public.utility_practice_status,
    to_status public.utility_practice_status NOT NULL,
    reason text,
    changed_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_practice_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practice_tasks (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    practice_id character varying NOT NULL,
    title text NOT NULL,
    description text,
    status public.utility_practice_task_status DEFAULT 'da_fare'::public.utility_practice_task_status NOT NULL,
    assigned_to character varying,
    due_date timestamp without time zone,
    sort_order integer DEFAULT 0 NOT NULL,
    created_by character varying NOT NULL,
    completed_at timestamp without time zone,
    completed_by character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_practice_timeline; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practice_timeline (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    practice_id character varying NOT NULL,
    event_type public.utility_practice_event_type NOT NULL,
    title text NOT NULL,
    description text,
    payload jsonb,
    created_by character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: utility_practices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_practices (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    practice_number text NOT NULL,
    service_id character varying,
    supplier_id character varying,
    customer_id character varying NOT NULL,
    reseller_id character varying,
    status public.utility_practice_status DEFAULT 'bozza'::public.utility_practice_status NOT NULL,
    supplier_reference text,
    submitted_at timestamp without time zone,
    activated_at timestamp without time zone,
    expires_at timestamp without time zone,
    monthly_price_cents integer,
    activation_fee_cents integer,
    commission_amount_cents integer,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    priority public.utility_practice_priority DEFAULT 'normale'::public.utility_practice_priority,
    assigned_to character varying,
    external_identifiers jsonb,
    communication_channel text,
    expected_activation_date timestamp without time zone,
    go_live_date timestamp without time zone,
    contract_end_date timestamp without time zone,
    sla_due_at timestamp without time zone,
    item_type text DEFAULT 'service'::text NOT NULL,
    product_id character varying,
    price_type text DEFAULT 'mensile'::text NOT NULL,
    flat_price_cents integer,
    custom_service_name text,
    temporary_supplier_name text,
    temporary_customer_name text,
    temporary_customer_email text,
    temporary_customer_phone text,
    repair_center_id character varying
);


--
-- Name: utility_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_services (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    supplier_id character varying NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    description text,
    category public.utility_category NOT NULL,
    monthly_price_cents integer,
    activation_fee_cents integer,
    commission_percent real,
    commission_fixed integer,
    commission_one_time integer,
    contract_months integer DEFAULT 24,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    price_type text DEFAULT 'mensile'::text,
    flat_price_cents integer,
    cover_image_url text
);


--
-- Name: utility_suppliers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utility_suppliers (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    category public.utility_category NOT NULL,
    email text,
    phone text,
    referent_name text,
    referent_phone text,
    referent_email text,
    portal_url text,
    portal_username text,
    default_commission_percent real,
    default_commission_fixed integer,
    payment_terms_days integer DEFAULT 30,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    reseller_id character varying,
    logo_url text
);


--
-- Name: warehouse_movements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_movements (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    warehouse_id character varying NOT NULL,
    product_id character varying NOT NULL,
    movement_type public.warehouse_movement_type NOT NULL,
    quantity integer NOT NULL,
    reference_type text,
    reference_id character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    created_by character varying NOT NULL
);


--
-- Name: warehouse_stock; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_stock (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    warehouse_id character varying NOT NULL,
    product_id character varying NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    min_stock integer DEFAULT 0,
    location text,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: warehouse_transfer_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_transfer_items (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    transfer_id character varying NOT NULL,
    product_id character varying NOT NULL,
    requested_quantity integer NOT NULL,
    shipped_quantity integer,
    received_quantity integer
);


--
-- Name: warehouse_transfers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouse_transfers (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    transfer_number text NOT NULL,
    source_warehouse_id character varying NOT NULL,
    destination_warehouse_id character varying NOT NULL,
    status public.warehouse_transfer_status DEFAULT 'pending'::public.warehouse_transfer_status NOT NULL,
    requested_by character varying NOT NULL,
    approved_by character varying,
    approved_at timestamp without time zone,
    shipped_at timestamp without time zone,
    received_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: warehouses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warehouses (
    id character varying DEFAULT (gen_random_uuid())::text NOT NULL,
    owner_type public.warehouse_owner_type NOT NULL,
    owner_id character varying NOT NULL,
    name text NOT NULL,
    address text,
    notes text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL
);


--
-- Name: warranty_products; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.warranty_products (
    id character varying(255) DEFAULT (gen_random_uuid())::text NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    duration_months integer DEFAULT 12 NOT NULL,
    price_in_cents integer DEFAULT 0 NOT NULL,
    coverage_type public.warranty_coverage_type DEFAULT 'basic'::public.warranty_coverage_type NOT NULL,
    max_claim_amount integer,
    deductible_amount integer DEFAULT 0 NOT NULL,
    terms_and_conditions text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    device_categories text[],
    reseller_id character varying(255)
);


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: accessory_specs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_specs (id, product_id, accessory_type, is_universal, compatible_brands, compatible_models, material, color, notes, created_at, updated_at) FROM stdin;
d51065e9-a028-40d0-9b34-769a5d07f54d	daf22961-9f49-4a27-9f06-2447185c9c26	cover	f	\N	\N	Tessuto	Oro	\N	2026-01-22 10:50:27.640212	2026-01-22 12:43:40.931
077a14d2-e16e-494a-b053-5e292a8e6e5a	8cdd0ece-9366-4127-83fb-8e1fdb949817	cover	f	\N	\N	Legno	Marrone		2026-01-26 23:43:07.853874	2026-01-26 23:43:07.853874
\.


--
-- Data for Name: accessory_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.accessory_types (id, name, description, device_type_id, is_active, sort_order, created_at, updated_at) FROM stdin;
15286b93-f620-4557-a424-27ee7144f74d	Nessun accessorio	Nessun accessorio consegnato	\N	t	0	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
5f46cd38-9ad8-452e-b404-067b88bbd2bc	Scatola originale	Confezione originale del produttore	\N	t	1	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
495452db-c6f6-4895-a365-808aa2aa3444	Manuale istruzioni	Libretto delle istruzioni	\N	t	2	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
24f80094-57a5-4211-a740-31802664cfa2	Cavo di ricarica	Cavo USB per ricarica	\N	t	3	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
5eec356f-0a4b-4521-b8ff-cd56a67aaa37	Alimentatore	Alimentatore/caricatore da parete	\N	t	4	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
40dc02b1-38b5-4fe7-ae47-84e5c5004a57	Custodia/Cover	Cover protettiva per smartphone	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
4d40860c-d616-40f8-bea1-ea88f0331915	Pellicola protettiva	Pellicola schermo applicata	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
40004ee4-85db-49ef-ac47-6b53ea746549	Auricolari	Auricolari/cuffie inclusi	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
eb7e0455-cb15-4fa7-9a5f-f56d8940417e	SIM Card	Scheda SIM inserita	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	13	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
9628a78b-3e87-403b-8580-af0746a20ca5	MicroSD	Scheda di memoria microSD inserita	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	14	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
02aae7d4-d414-4cc8-a8ec-9120a4dd2881	Strumento rimozione SIM	Spilletta per rimozione SIM	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	15	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
a3fee1a3-70c5-45aa-bf36-7314f506a1bf	Caricatore wireless	Base di ricarica wireless	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	16	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
14f57c47-08c8-45b1-b436-d3c906a1f910	Custodia/Smart Cover	Custodia con coperchio magnetico	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
ce67c67b-9418-4a2e-abf4-b99b78e5d92c	Penna/Stylus	Penna capacitiva o stylus	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
2e2da985-2f7b-4cf9-8589-3dac7965fc98	Tastiera esterna	Tastiera Bluetooth o cover con tastiera	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
7a6a10a5-37da-42c1-8d10-9affb078ec3a	Supporto/Stand	Supporto da tavolo	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	13	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
4c926676-d14b-43fc-be90-1006169aa5be	Borsa/Custodia	Borsa o custodia per trasporto	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
6ffd7b6c-ec32-4a61-a7bc-61bc1f3029c0	Mouse esterno	Mouse USB o Bluetooth	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
8dad5211-42d4-4bb0-96ee-82e96653a390	Docking station	Hub o docking station	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
a6a54b2a-6c8c-4f86-8c20-8fe0559cfb56	Cavo HDMI	Cavo per collegamento video esterno	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	13	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
02a98162-76bb-4d4f-a415-834835468748	SSD/HDD esterno	Disco esterno per backup	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	14	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
5a7b34d0-f0e0-4a5c-8ee8-fec0f06d6ba8	Webcam esterna	Webcam USB esterna	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	15	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
0b25b33d-e4f0-45cf-aec1-644c50a7ff88	Tastiera esterna	Tastiera USB o Bluetooth	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	16	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
e1ad7c32-6e23-406c-b598-69177ef41f72	Monitor	Monitor incluso	7c151c62-6ff0-47c7-a619-23323067b1e6	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
0e4ddbbc-f127-4654-b3ae-fd7a7fe60287	Tastiera	Tastiera inclusa	7c151c62-6ff0-47c7-a619-23323067b1e6	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
944ce05f-6a5d-4e1d-8d9e-be1a8ed91052	Mouse	Mouse incluso	7c151c62-6ff0-47c7-a619-23323067b1e6	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
738b2589-825e-4243-a044-98c24d135d2c	Cavo VGA/HDMI/DP	Cavo video incluso	7c151c62-6ff0-47c7-a619-23323067b1e6	t	13	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
97700d9f-8cb5-4a82-aaa0-61f27e0c981b	Casse audio	Altoparlanti esterni	7c151c62-6ff0-47c7-a619-23323067b1e6	t	14	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
408ad8c0-ec8c-4bdc-8e84-8bd2def76edf	Webcam	Webcam esterna	7c151c62-6ff0-47c7-a619-23323067b1e6	t	15	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
9aa9dc68-193b-46f8-890c-36ff78b0710d	Controller	Controller/gamepad incluso	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
aa647b1f-ec19-4819-aeb9-4d9d60f6de43	Cavo HDMI	Cavo HDMI per collegamento TV	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
28198ced-a678-484a-afae-c5a20baf2498	Cuffie gaming	Cuffie o headset per gaming	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
3f7bc8be-0ea2-4fbb-a6c5-b562f5ce2a4a	Disco giochi	Disco di gioco inserito	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	13	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
6db85e06-0342-4762-86b6-2378ca4548b1	Base di ricarica	Base per ricarica controller	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	14	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
0a1e8331-ef34-4a1f-8a92-f3e2bad333bc	HDD esterno	Hard disk esterno per giochi	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	15	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
06e987bc-ce90-4b1d-805e-3fdd19a3b665	Telecomando	Telecomando originale	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
a43fd6dc-fc1f-4a3d-941e-a2f8baffa1d1	Piedistallo/Supporto	Piedistallo o supporto da parete	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
977672f1-8bc6-4ac6-9233-58f87a27373d	Cavo antenna	Cavo coassiale per antenna	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
3f5b7c75-d725-4ac2-87c8-8bb4c2a780a8	Viti montaggio	Viti e minuteria per montaggio a parete	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	13	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
adabd000-1202-498d-adb9-7015171da914	Cinturino aggiuntivo	Cinturino di ricambio	7b4db345-71b3-4332-8223-57c1f5df76f0	t	10	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
e3efc344-50b3-4283-80fc-959ba1c1473e	Base di ricarica	Caricatore magnetico/dock	7b4db345-71b3-4332-8223-57c1f5df76f0	t	11	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
0b64e5d3-4e68-44d0-bfe5-b0872700531e	Custodia protettiva	Cover protettiva per cassa	7b4db345-71b3-4332-8223-57c1f5df76f0	t	12	2025-11-25 13:48:44.05849	2025-11-25 13:48:44.05849
\.


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, created_at) FROM stdin;
e6493a90-855f-4dc0-ba95-63c64a76469c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"POST","path":"/api/reseller/products"}	10.83.10.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 10:33:57.642129
bcde2de0-f3e0-468d-b807-ce1fdc1420db	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"POST","path":"/api/reseller/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf/image"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 10:33:59.948035
a5232192-8caf-4771-a26f-bc974255b6c9	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	products	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"PATCH","path":"/api/reseller/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf/marketplace"}	10.83.2.135	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 10:49:41.844146
9b201c40-5591-4fee-b89f-6d40854405d7	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	{"method":"POST","path":"/api/reseller/products/07e44d0c-fc41-4e3f-b57d-9b55b53efa94/stock"}	10.83.7.79	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 12:43:08.091573
563cf52b-b693-4ef9-bf75-e057b377489d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	products	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"PATCH","path":"/api/reseller/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 12:43:20.188038
328482b5-0f8c-44a1-80e9-2ea350f1e5af	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"POST","path":"/api/reseller/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf/stock"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 12:43:21.555579
d82b2eb3-0f20-4da4-984e-204237995104	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	daf22961-9f49-4a27-9f06-2447185c9c26	{"method":"POST","path":"/api/reseller/products/daf22961-9f49-4a27-9f06-2447185c9c26/stock"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 12:43:42.394309
9430d347-694b-43ab-a42a-a14be5945380	9985f30d-610e-4172-a39f-8ae614996edb	CREATE	sub-reseller	dbbcce61-afb1-4e46-8503-44257f7e9a39	{"method":"POST","path":"/api/reseller/sub-reseller/transfer-requests"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 14:01:35.326346
05a09ad3-9f3f-4f1a-8798-7a69e76e67d8	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	transfer-requests	0a1eb0a6-563b-4456-97c6-53211d3af368	{"method":"POST","path":"/api/repair-center/transfer-requests"}	10.83.0.186	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 14:02:14.741969
189ad729-4194-47f6-9d89-388e6adab01e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	incoming-transfer-requests	dbbcce61-afb1-4e46-8503-44257f7e9a39	{"method":"PATCH","path":"/api/reseller/incoming-transfer-requests/dbbcce61-afb1-4e46-8503-44257f7e9a39/decide"}	10.83.10.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 14:10:04.960696
f663ada2-79ca-4cc3-956d-7759e6473a01	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	incoming-transfer-requests	0a1eb0a6-563b-4456-97c6-53211d3af368	{"method":"PATCH","path":"/api/reseller/incoming-transfer-requests/0a1eb0a6-563b-4456-97c6-53211d3af368/decide"}	10.83.10.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 14:10:10.114595
393ee79e-ee50-4023-b7c7-353a6ef6d2ac	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	incoming-transfer-requests	dbbcce61-afb1-4e46-8503-44257f7e9a39	{"method":"PATCH","path":"/api/reseller/incoming-transfer-requests/dbbcce61-afb1-4e46-8503-44257f7e9a39/ship"}	10.83.10.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 14:10:20.216325
e863315c-b6f6-4c52-ad62-e9d5e9b2e6ed	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	4ac347c1-0e62-4628-b3e4-6dae184db146	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.5.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 14:52:41.792202
299f8b1c-313b-444d-9dad-967e2f00b1ab	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	{"method":"POST","path":"/api/reseller/products/07e44d0c-fc41-4e3f-b57d-9b55b53efa94/stock"}	10.83.7.79	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:41:01.704487
e48dd9d4-e86f-4ba1-aedb-1be9a99406a8	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	4ac347c1-0e62-4628-b3e4-6dae184db146	{"method":"POST","path":"/api/reseller/marketplace/orders/4ac347c1-0e62-4628-b3e4-6dae184db146/approve"}	10.83.7.79	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:41:06.746098
0682f081-dc98-4e13-9566-15f3e46f176d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	4ac347c1-0e62-4628-b3e4-6dae184db146	{"method":"POST","path":"/api/reseller/marketplace/orders/4ac347c1-0e62-4628-b3e4-6dae184db146/ship"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:41:18.788092
9e6ed150-302f-4386-aa56-1666fea25c97	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	4ac347c1-0e62-4628-b3e4-6dae184db146	{"method":"POST","path":"/api/reseller/marketplace/orders/4ac347c1-0e62-4628-b3e4-6dae184db146/receive"}	10.83.5.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:43:33.768149
aa858dd7-5276-48d4-b269-66bc52ef6bc1	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	95cb6c28-6e9f-4575-ad30-153afcda1d15	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.5.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:52:14.97552
97d7b6a1-ddc8-4b18-837e-7eb242b6d61f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	30ea137c-2746-423c-8f0a-af9dc77f5708	{"method":"PATCH","path":"/api/notifications/30ea137c-2746-423c-8f0a-af9dc77f5708/read"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:52:24.883322
2bb12aa9-e266-4c5e-9f9a-4fb0401c4fa9	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	95cb6c28-6e9f-4575-ad30-153afcda1d15	{"method":"POST","path":"/api/reseller/marketplace/orders/95cb6c28-6e9f-4575-ad30-153afcda1d15/approve"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:52:37.834775
d2dbaff7-d5de-4829-8eb8-602eecfe0f9a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	DELETE	context	\N	{"method":"DELETE","path":"/api/reseller/context"}	10.83.1.161	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 14:48:14.104539
56dd2dbd-67ec-4b04-a932-89b5b035da28	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	95cb6c28-6e9f-4575-ad30-153afcda1d15	{"method":"POST","path":"/api/reseller/marketplace/orders/95cb6c28-6e9f-4575-ad30-153afcda1d15/ship"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 15:52:43.358934
54a6e8d8-7e29-4103-986d-fe0d8d968004	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	1d0db182-be36-4334-a5ab-b0b40d8efcdd	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 16:02:12.633318
7d985464-b3e3-4c20-8f8a-4012280de780	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	1d0db182-be36-4334-a5ab-b0b40d8efcdd	{"method":"POST","path":"/api/reseller/marketplace/orders/1d0db182-be36-4334-a5ab-b0b40d8efcdd/approve"}	10.83.9.52	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 16:02:28.53163
48099e2d-e04f-4b79-b385-dcc92aa132d6	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	67b34c9b-3626-4c21-9124-7dad143301da	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.2.135	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 17:24:40.543793
cbe8a6b2-31b8-48a6-9efe-4377af2406ef	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	rc-b2b-orders	67b34c9b-3626-4c21-9124-7dad143301da	{"method":"POST","path":"/api/reseller/rc-b2b-orders/67b34c9b-3626-4c21-9124-7dad143301da/approve"}	10.83.4.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 17:44:42.928943
7540650b-673e-4ede-b118-6c6aff872574	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	rc-b2b-orders	67b34c9b-3626-4c21-9124-7dad143301da	{"method":"POST","path":"/api/reseller/rc-b2b-orders/67b34c9b-3626-4c21-9124-7dad143301da/ship"}	10.83.4.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 17:44:51.223491
95f3c20c-268a-4b93-9a70-83a0418f641d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	8e487e54-8a28-4ee4-8105-2e793e0f34e0	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.10.113	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 19:20:46.065509
d4b29816-4d4a-403d-abef-1f16ed82150b	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	b2b-orders	8e487e54-8a28-4ee4-8105-2e793e0f34e0	{"method":"POST","path":"/api/admin/b2b-orders/8e487e54-8a28-4ee4-8105-2e793e0f34e0/approve"}	10.83.0.186	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 19:24:53.392822
4986a98e-c673-4430-a193-e4b7335fed36	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	b2b-orders	8e487e54-8a28-4ee4-8105-2e793e0f34e0	{"method":"POST","path":"/api/admin/b2b-orders/8e487e54-8a28-4ee4-8105-2e793e0f34e0/ship"}	10.83.1.135	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-22 19:25:01.535881
a34a6a45-dfa5-4a99-9e7b-03e139f6bd90	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	14f36c8d-fa8d-4573-999d-9ca018c141e5	{"method":"POST","path":"/api/repair-center/marketplace/orders"}	10.83.2.153	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 09:47:11.207514
4690b763-3544-4433-902f-317646c05539	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	030cd5b0-6be2-4957-8be6-a1c82a1eb860	{"method":"POST","path":"/api/repair-center/pos/registers"}	10.83.2.153	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 09:56:32.613527
9a6ae374-d333-423d-85e6-0bab466988a3	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	e61fc803-e08d-4ca7-9927-f65fac9d6510	{"method":"POST","path":"/api/repair-center/pos/session/open"}	10.83.5.136	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 09:56:58.726874
8b7c9318-0b5e-45e0-9e87-c327b460a680	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	e61fc803-e08d-4ca7-9927-f65fac9d6510	{"method":"POST","path":"/api/repair-center/pos/session/e61fc803-e08d-4ca7-9927-f65fac9d6510/close"}	10.83.12.152	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 09:57:13.396871
2f23fed6-cfec-4f32-b7c0-1f4be11e5ec3	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	hr	939fc972-c9f4-4baf-ac88-4cdfd0028a48	{"method":"POST","path":"/api/repair-center/hr/clock-events"}	10.83.5.136	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 10:48:08.874123
fe962242-df8a-420e-a384-b2b8cd3ec6d4	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	hr	4ea90b9d-4365-439f-b68b-124fdaec5ac5	{"method":"POST","path":"/api/repair-center/hr/leave-requests"}	10.83.7.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 10:53:17.344899
2391b897-3630-4e8c-b18e-5fb0406bc5d7	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	hr	4ea90b9d-4365-439f-b68b-124fdaec5ac5	{"method":"PATCH","path":"/api/repair-center/hr/leave-requests/4ea90b9d-4365-439f-b68b-124fdaec5ac5"}	10.83.7.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 10:54:16.492672
b94581c3-0a01-45ef-9028-cf304bb927ff	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	users	7e413aba-8495-4f15-98b5-b5b757a36565	{"method":"POST","path":"/api/reseller/team"}	10.83.2.153	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 11:24:12.138192
8d591b4f-bd0f-48b8-8cba-b27b8f60b60f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	warranty-products	7b71af46-c9a8-407d-9697-2062e1890ba8	{"method":"POST","path":"/api/reseller/warranty-products"}	10.83.2.153	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 11:30:23.271815
6269bb9e-25ab-414a-a0ba-c4475e753d94	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	context	9985f30d-610e-4172-a39f-8ae614996edb	{"method":"POST","path":"/api/reseller/context"}	10.83.13.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 14:39:34.920602
09437c21-5012-4d25-82a8-52ace975f815	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	DELETE	context	\N	{"method":"DELETE","path":"/api/reseller/context"}	10.83.0.5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 14:39:39.799534
fe02a0d8-2c95-4ddd-91d7-430544597710	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	context	9985f30d-610e-4172-a39f-8ae614996edb	{"method":"POST","path":"/api/reseller/context"}	10.83.8.88	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 14:45:21.25499
13480dee-26c6-4073-9e1e-84470507bdbf	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	context	c0f233d9-e60b-452c-8423-f8eb70dc10dc	{"method":"POST","path":"/api/reseller/context"}	10.83.0.5	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 14:45:26.157742
162054ac-720c-44bc-b5cf-7944b56bff42	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	ticket	81ce9d96-763d-42cd-b1f5-b1b266542a6a	{"method":"POST","path":"/api/internal-tickets"}	10.83.4.141	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 14:49:15.55233
bfc7ab11-db0c-4a12-b89a-663ddab86d2e	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	122155a9-2d6e-414f-a9e8-e7d7b873a4c5	{"method":"POST","path":"/api/repair-center/pos/session/open"}	10.83.13.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 16:50:51.465349
38ee1e63-5d0e-42b2-98a3-2bd147c123fd	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	pos	030cd5b0-6be2-4957-8be6-a1c82a1eb860	{"method":"PATCH","path":"/api/reseller/pos/registers/030cd5b0-6be2-4957-8be6-a1c82a1eb860"}	10.83.13.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 16:52:18.367648
894b6446-bc9c-4774-afd2-7ef4ad0bdc6d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	pos	030cd5b0-6be2-4957-8be6-a1c82a1eb860	{"method":"PATCH","path":"/api/reseller/pos/registers/030cd5b0-6be2-4957-8be6-a1c82a1eb860"}	10.83.13.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 16:52:21.306776
6face41f-199a-4bce-89bd-83155659b944	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	pos	030cd5b0-6be2-4957-8be6-a1c82a1eb860	{"method":"PATCH","path":"/api/reseller/pos/registers/030cd5b0-6be2-4957-8be6-a1c82a1eb860"}	10.83.13.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 16:52:23.529518
a6a9d559-2ccf-4f83-aa4d-c95601df01d9	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	pos	\N	{"method":"POST","path":"/api/reseller/pos/transaction"}	10.83.3.11	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-23 17:29:23.552321
0bb50879-5895-4032-b67b-f586b2bacd62	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	service-items	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	{"method":"POST","path":"/api/reseller/service-items"}	10.83.12.152	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-24 12:43:43.224176
5b29799b-e803-4572-9fee-d768ff879432	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	users	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	{"method":"POST","path":"/api/reseller/customers"}	10.83.5.136	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-24 12:52:19.76694
630f0584-bf0c-4141-acf7-43ccf2793fa2	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	pos	030cd5b0-6be2-4957-8be6-a1c82a1eb860	{"method":"PATCH","path":"/api/reseller/pos/registers/030cd5b0-6be2-4957-8be6-a1c82a1eb860"}	10.83.7.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-24 13:44:28.092491
95e8753f-a2c0-4233-9d49-7ff51797af63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	pos	122155a9-2d6e-414f-a9e8-e7d7b873a4c5	{"method":"POST","path":"/api/reseller/pos/session/122155a9-2d6e-414f-a9e8-e7d7b873a4c5/close"}	10.83.7.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-24 13:44:33.903094
aa1cbfaf-4afa-4e60-97a1-f66794d71c32	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	pos	896e7582-5938-43ff-888e-a5daa5339d11	{"method":"POST","path":"/api/reseller/pos/session/open"}	10.83.8.88	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-24 13:44:51.031794
d4b5b0f6-e07d-4af9-bd48-8ea4ecb2502d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	pos	896e7582-5938-43ff-888e-a5daa5339d11	{"method":"POST","path":"/api/reseller/pos/session/896e7582-5938-43ff-888e-a5daa5339d11/close"}	10.83.8.88	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-24 13:44:57.453738
e112ff7e-aad6-4224-be9b-0ff469b58275	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	users	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	{"method":"PATCH","path":"/api/reseller/customers/77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	10.83.1.161	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-25 17:27:38.302596
5e20383f-f59f-4e37-b11b-9dfb3b3ac9f6	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	service_orders	2a698b91-f685-4ea9-b0e0-819cea44a0d4	{"method":"PATCH","path":"/api/reseller/service-orders/2a698b91-f685-4ea9-b0e0-819cea44a0d4/accept"}	10.83.10.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-25 23:44:38.200999
6cb470c8-4c5e-4b4d-9d1c-0d550c143d4a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	device_model	4ce29d04-91af-491a-818e-25aee235483e	{"method":"POST","path":"/api/reseller/device-models"}	10.83.2.153	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 17:38:44.949503
06ed8a45-6cd8-4586-ad1c-95f208558119	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	DELETE	reseller_device_model	4ce29d04-91af-491a-818e-25aee235483e	{"method":"DELETE","path":"/api/reseller/device-models/4ce29d04-91af-491a-818e-25aee235483e"}	10.83.2.153	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 17:48:57.36012
80dd8b2e-f8ac-4839-932d-2b2a3a838b0f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	device_model	007c6f7c-98d5-44b4-b779-0f9149ced0d7	{"method":"POST","path":"/api/reseller/device-models"}	10.83.8.88	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 17:56:28.696972
6ae18d75-4e66-40bb-a8c9-07a2d0c54348	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	40f69565-9103-42f7-979e-e1a60d2a8c0c	{"method":"POST","path":"/api/admin/device-models"}	10.83.10.199	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 23:29:04.077682
826f4244-880b-4723-9d58-ac48ef73ea53	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	product	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"PATCH","path":"/api/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf"}	10.83.10.199	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-26 23:29:52.459971
d1e0631f-da3b-411c-9023-526693433e87	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	fd4820ca-d826-462b-a90a-c2f3fb52281f	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.9.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 08:11:12.797376
83e29552-1d0b-4e8a-a36b-2b23cadf9c13	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	fd4820ca-d826-462b-a90a-c2f3fb52281f	{"method":"POST","path":"/api/reseller/marketplace/orders/fd4820ca-d826-462b-a90a-c2f3fb52281f/reject"}	10.83.9.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 08:29:30.626395
6abf71ff-e852-49a5-873c-ef74e8431b6d	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	3246dc7a-a7f9-4852-8924-66f350a1e868	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.7.210	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 08:29:49.949823
38a0e618-2ee1-40b1-8bbb-af7a613c3103	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	device-models	6adca1dc-f1da-4460-8537-fe4ef6d087ad	{"method":"PATCH","path":"/api/admin/device-models/6adca1dc-f1da-4460-8537-fe4ef6d087ad"}	10.83.7.210	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 10:16:44.27732
f9fe1c84-6dd4-4497-8b6c-1297d9469de2	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.5.220	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:13:11.394543
1c4174df-18a0-4af7-bf1d-2da2915edb3f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.12.241	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:13:28.37164
f5599111-3c32-4190-9b45-519de845f429	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.0.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:13:54.667892
10874e6d-cc73-4fce-8545-efd7ee6f5c9f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.0.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:19:20.106853
73c8730f-8732-4d66-873f-699484973de4	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.6.48	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:19:34.531061
df1f99d1-ac5c-491a-81db-400984a63e57	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.6.48	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:19:54.524244
e68f4b59-e493-4672-a0e1-b94ac3b9bd19	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.0.167	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:20:07.986848
2d2e6510-3ad1-4ac4-84a7-abeebf42eba5	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.7.210	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:20:18.626297
8bd901e8-de42-495d-a065-adb85f3bb2c4	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.7.210	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:20:39.808596
ebea0174-6163-46e0-bc90-9334393e6f92	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.10.200	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:21:03.724527
9c807ad1-533f-4550-ab6f-fc81feb0a710	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.9.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:21:29.617231
2e2946fd-f59e-4caf-86c5-5ed5db713d4b	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	device-models	\N	{"method":"POST","path":"/api/admin/device-models/import-excel"}	10.83.10.200	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-27 13:22:14.919366
b28df12f-ea5e-4920-98af-a428b10250b9	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	1498ae29-ee5c-4dcb-be6e-cbd31f583d98	{"method":"PATCH","path":"/api/notifications/1498ae29-ee5c-4dcb-be6e-cbd31f583d98/read"}	10.83.2.229	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 10:06:49.744928
86c44ddf-3323-48d1-b537-0e9d6058bab2	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	82073803-5c51-49e4-aaae-6ff77d93f336	{"method":"PATCH","path":"/api/notifications/82073803-5c51-49e4-aaae-6ff77d93f336/read"}	10.83.1.84	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 10:06:49.844463
e4c28114-dc04-4f85-bbc6-8af74c1020f2	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	82073803-5c51-49e4-aaae-6ff77d93f336	{"method":"PATCH","path":"/api/notifications/82073803-5c51-49e4-aaae-6ff77d93f336/read"}	10.83.10.200	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 10:06:50.381382
c2afb819-eb1b-4f9f-a510-7f6a08cfa92d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	1498ae29-ee5c-4dcb-be6e-cbd31f583d98	{"method":"PATCH","path":"/api/notifications/1498ae29-ee5c-4dcb-be6e-cbd31f583d98/read"}	10.83.2.229	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 10:06:50.468569
1283c688-7f5b-447e-bc7e-f404d45c928f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	hr	22c32969-7d3f-47ee-83f0-e36ff588aeba	{"method":"POST","path":"/api/reseller/hr/sick-leaves"}	10.83.1.84	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-28 18:06:03.794135
6d06f9ae-797d-4be5-8cba-f9abef1a860e	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	a576fe27-fd3f-40b9-b7d3-c0caf671f750	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.6.98	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 14:18:46.323268
a5c02b97-b08f-4cf0-bb45-f8b219ebc6ff	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	8c01ef6e-fb14-4656-88df-ca52585c91b0	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.5.220	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 16:04:10.615216
696df6d0-d0ae-455f-8c51-1b3dc14604b4	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	hr	4ea90b9d-4365-439f-b68b-124fdaec5ac5	{"method":"PATCH","path":"/api/reseller/hr/leave-requests/4ea90b9d-4365-439f-b68b-124fdaec5ac5"}	10.83.1.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 16:16:13.362228
a9e53d4c-9ca0-4943-aabd-6048be2e3d93	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	hr	2f2ec6bf-5dd8-4e2c-b3d6-92a158c5237f	{"method":"POST","path":"/api/reseller/hr/sick-leaves"}	10.83.2.26	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 16:26:18.085896
aa05bbd4-2f05-47bb-8e82-287506f13870	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	hr	2f2ec6bf-5dd8-4e2c-b3d6-92a158c5237f	{"method":"PATCH","path":"/api/reseller/hr/sick-leaves/2f2ec6bf-5dd8-4e2c-b3d6-92a158c5237f"}	10.83.13.77	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 22:35:58.754983
a678c4fe-1615-43ec-a564-590233ddb5f4	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	hr	2f2ec6bf-5dd8-4e2c-b3d6-92a158c5237f	{"method":"PATCH","path":"/api/reseller/hr/sick-leaves/2f2ec6bf-5dd8-4e2c-b3d6-92a158c5237f"}	10.83.1.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 22:41:49.576472
f1cd0c9e-4d16-43e5-905a-3f29a5d9efa8	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	hr	6dd3aacb-2ebb-4942-b3c4-c68388f17b1e	{"method":"POST","path":"/api/reseller/hr/expense-reports"}	10.83.9.155	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 22:42:46.985065
31c8efb0-5e29-4d21-847f-05c11732fcc5	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	hr	6dd3aacb-2ebb-4942-b3c4-c68388f17b1e	{"method":"PATCH","path":"/api/reseller/hr/expense-reports/6dd3aacb-2ebb-4942-b3c4-c68388f17b1e"}	10.83.9.155	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-29 22:42:51.895361
4de09b65-ddbf-4671-9a73-ce65136c8f27	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	repair-centers	c0f233d9-e60b-452c-8423-f8eb70dc10dc	{"method":"PATCH","path":"/api/reseller/repair-centers/c0f233d9-e60b-452c-8423-f8eb70dc10dc"}	10.83.1.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 08:57:25.184908
a9a00408-adaf-4e2b-9753-958b4c782d66	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	repair_centers	c0f233d9-e60b-452c-8423-f8eb70dc10dc	{"method":"PATCH","path":"/api/repair-center/settings"}	10.83.0.225	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 09:27:46.995868
e0dcf971-e7dd-4afa-a48a-3754d4430148	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	users	9985f30d-610e-4172-a39f-8ae614996edb	{"method":"PATCH","path":"/api/reseller/sub-resellers/9985f30d-610e-4172-a39f-8ae614996edb"}	10.83.1.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 10:10:29.056947
3a36fd5d-1988-45e6-bc2f-d9aaab376cd0	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	transfer-immediate	\N	{"method":"POST","path":"/api/warehouses/transfer-immediate"}	10.83.13.77	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 10:13:59.692716
9b67515e-2a0e-49c1-91af-5e6310daec4e	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	25d79597-a97c-4166-9daf-178d53005793	{"method":"POST","path":"/api/repair-center/pos/customers"}	10.83.9.155	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 10:47:11.498919
060dc3c0-ffc2-44a7-bb5f-85f49840e624	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	users	3d7c8ab4-eba1-4878-860c-3f005e0d6118	{"method":"POST","path":"/api/repair-center/customers"}	10.83.11.32	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-01-30 14:11:46.289132
9339e651-56ee-4659-a040-f098eb6abfa1	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	9e3bdb34-1fc5-4de4-9da6-05862899a488	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.11.55	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-01 10:14:08.270407
b26dbf06-5153-49ae-ad29-8f3285139a12	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	d56c470a-c03b-42a4-89da-68f12fdb789a	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.5.30	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-01 10:22:05.372157
ba889049-d506-471d-a67c-0202be60188b	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	51b67546-5853-4b3b-83e2-5edeb97b3685	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.3.34	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-01 18:02:53.569023
c91f0f09-07d4-4113-87d1-e83d6b60d3fe	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	settings	\N	{"method":"PATCH","path":"/api/reseller/settings/hourly-rate"}	10.83.9.45	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 10:39:52.743391
55b24fa0-dc91-49f9-b0c0-7b294eedc0a1	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	shipping-methods	8ee66c39-dc1f-4911-804a-4bdf301e9a61	{"method":"POST","path":"/api/reseller/shipping-methods"}	10.83.9.45	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 10:40:27.599555
95465a6d-1b23-43cd-ac62-e6273173a439	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	settings	\N	{"method":"PATCH","path":"/api/reseller/settings/hourly-rate"}	10.83.9.45	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 11:08:54.998878
ac387b26-6209-491d-8b16-517d77f3841a	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	d07b2115-13d5-4b6d-bf3d-acfa8c8d3744	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.12.127	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 11:29:37.125922
83bf6e7c-b6c3-458e-bb70-185b6d599e55	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	143c2c8a-16c4-4b8d-ba7f-77328113c0ef	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.12.127	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 11:29:46.137221
d910878a-1aaf-46d1-826a-85f303e72ee2	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	8b78741e-87ac-480d-a6ba-3f0aaaf8efa1	{"method":"PATCH","path":"/api/notifications/8b78741e-87ac-480d-a6ba-3f0aaaf8efa1/read"}	10.83.0.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 12:22:09.041453
aa801494-014b-4cad-b168-a89f9f97bff4	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	045441eb-c675-4d94-88b8-1af3229ef5a2	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.3.91	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 12:37:00.833725
b5ffb992-7bce-4b13-8295-32bb8f8d010b	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	473aede7-7392-4e4d-b88f-e1a8b02e1490	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.0.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 13:06:54.091675
692975cd-fb92-4714-8c54-d2324440e389	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	95bbbef3-633c-4693-bf6e-18cef558b797	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.10.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 13:34:15.858319
d541b02f-a2cc-4900-acb5-0269ae063e12	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	b4b65355-5db2-49fc-b1cc-e59fd372fa09	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.0.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:07:16.791263
47c66673-1884-4815-85b9-6f2d679822eb	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	notifications	b948f93e-d232-41cd-839a-3918db2e298f	{"method":"PATCH","path":"/api/notifications/b948f93e-d232-41cd-839a-3918db2e298f/read"}	10.83.0.104	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:07:25.3633
ed0ed03f-b599-4940-a477-070b83d3a7c3	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	4489c3d1-38f6-4a74-ba9a-934fbbf79cc2	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.12.127	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:14:05.348475
6217010f-10cb-4797-b71c-c43f10ba5504	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	1350a181-1515-4736-8b74-ec4511e2c6b9	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.12.127	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:14:18.719304
9eb7db56-e902-421a-a9f9-003cb5fd29a2	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	1311216d-a4c0-40ee-a674-bf0e9345acbf	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.8.129	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:48:02.188676
63ec7851-6885-4d1e-97c4-dfd303d0b869	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	6d6975f0-09db-41ec-9e33-21230f36efe4	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.10.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:57:20.762819
0c504e70-487c-4337-96df-53375d735ea2	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	rc-b2b-orders	6d6975f0-09db-41ec-9e33-21230f36efe4	{"method":"POST","path":"/api/reseller/rc-b2b-orders/6d6975f0-09db-41ec-9e33-21230f36efe4/approve"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 14:57:39.044118
11bc7598-4863-4f86-b5e3-2f46bd5a2946	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	{"method":"POST","path":"/api/reseller/products/13382a3f-b4c0-4d5e-b5c3-890dac0405a7/stock"}	10.83.3.91	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 15:25:39.988302
16f56b8e-4bd7-4c20-93b8-3f9a64440888	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	{"method":"POST","path":"/api/reseller/products/13382a3f-b4c0-4d5e-b5c3-890dac0405a7/stock"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 15:42:26.140913
90ff517b-5aef-4bb7-b9a7-38ea6729e41e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	{"method":"POST","path":"/api/reseller/products/07e44d0c-fc41-4e3f-b57d-9b55b53efa94/stock"}	10.83.1.10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 15:51:23.532935
fb090521-964b-40ad-907d-ba70d10af037	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	1350a181-1515-4736-8b74-ec4511e2c6b9	{"method":"POST","path":"/api/reseller/marketplace/orders/1350a181-1515-4736-8b74-ec4511e2c6b9/approve"}	10.83.1.10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 15:58:18.471099
52b6b020-44c4-4d4d-ac73-350a4e6d144e	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	b2b-orders	4489c3d1-38f6-4a74-ba9a-934fbbf79cc2	{"method":"POST","path":"/api/admin/b2b-orders/4489c3d1-38f6-4a74-ba9a-934fbbf79cc2/approve"}	10.83.1.10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 15:58:42.207833
783892aa-0362-4ffe-a3c5-035e0fb30775	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	24e24217-e1a0-4360-b18d-435fdfcffffb	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.5.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:40:19.50708
4cea4d37-4aae-4ad8-8804-0bffd5d7fcfa	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	b2b-orders	24e24217-e1a0-4360-b18d-435fdfcffffb	{"method":"POST","path":"/api/admin/b2b-orders/24e24217-e1a0-4360-b18d-435fdfcffffb/approve"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:40:42.727184
cfedc571-5e00-46d1-8b1b-8be76d0114a4	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	b2b-orders	24e24217-e1a0-4360-b18d-435fdfcffffb	{"method":"POST","path":"/api/admin/b2b-orders/24e24217-e1a0-4360-b18d-435fdfcffffb/ship"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:40:51.420189
7ceb770d-221e-4b8a-9ccc-c8311c4d9fd5	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	e339ba4c-08ab-4a93-a2f0-8893637f9245	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.5.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:57:59.525056
70f7ceae-2bd9-41a6-bdc8-2624e796c62f	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	e17df8a6-5b2f-4489-8717-3b8f98b4f17f	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.1.10	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:58:11.004369
c45a4525-8e3c-42e9-b30a-b0ea0bf57dde	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	e339ba4c-08ab-4a93-a2f0-8893637f9245	{"method":"POST","path":"/api/reseller/marketplace/orders/e339ba4c-08ab-4a93-a2f0-8893637f9245/approve"}	10.83.5.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:58:45.647493
12efbfc1-18e0-402f-b56c-774c3ce0394d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-payment-intent"}	10.83.11.214	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:01:03.653486
46dfa990-6921-4ff4-a385-1d06b4c09c79	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	marketplace	e339ba4c-08ab-4a93-a2f0-8893637f9245	{"method":"POST","path":"/api/reseller/marketplace/orders/e339ba4c-08ab-4a93-a2f0-8893637f9245/ship"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:58:51.602929
54878240-d283-4d70-927a-a74c61e67fe0	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	rc-b2b-orders	e17df8a6-5b2f-4489-8717-3b8f98b4f17f	{"method":"POST","path":"/api/reseller/rc-b2b-orders/e17df8a6-5b2f-4489-8717-3b8f98b4f17f/approve"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:58:57.891923
18c44f96-6bbe-4b58-b520-b3eca33e3e8b	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	rc-b2b-orders	e17df8a6-5b2f-4489-8717-3b8f98b4f17f	{"method":"POST","path":"/api/reseller/rc-b2b-orders/e17df8a6-5b2f-4489-8717-3b8f98b4f17f/ship"}	10.83.7.63	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-02 16:59:04.963233
871f63b9-eac0-4bbd-b88e-5a15f439dbee	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	3TX40815LL7586341	3TX40815LL7586341	{"method":"POST","path":"/paypal/order/3TX40815LL7586341/capture"}	10.83.8.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:00:04.218736
51052bac-6475-4da8-a89a-2b88ad499769	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	c3d6a839-b302-400e-8eae-8754fcc90f97	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.8.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:00:05.909213
59aa074c-7aee-4c4e-918d-fd18b0c62055	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	20Y03666F3745354B	20Y03666F3745354B	{"method":"POST","path":"/paypal/order/20Y03666F3745354B/capture"}	10.83.13.101	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:11:28.815332
71efe739-d8bd-4a5c-a114-d6b81f455788	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	9UV926564G418131D	9UV926564G418131D	{"method":"POST","path":"/paypal/order/9UV926564G418131D/capture"}	10.83.9.101	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:17:26.904324
77f1266a-b991-4ede-a02d-fcfbbb4f180b	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	27a3cdd5-389a-4889-a6e7-3c677e76f370	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.9.101	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:17:28.915186
3bc0add5-250f-45fb-9765-fa523a74d898	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	0Y644949KB774763P	0Y644949KB774763P	{"method":"POST","path":"/paypal/order/0Y644949KB774763P/capture"}	10.83.0.169	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:40:13.091344
7423f865-202c-440b-a804-b66b1756f3b1	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	d6781c0a-2bb5-4640-b0cc-8991245dcaf2	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.0.169	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:40:14.4448
3d8f6dcb-2d5a-4e86-94e5-b56c785ceba5	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	21427607UG5267437	21427607UG5267437	{"method":"POST","path":"/paypal/order/21427607UG5267437/capture"}	10.83.7.128	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 13:58:34.202995
9f78cf3d-ba62-4cf2-a013-692daefeaa38	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	1GB44929KT0691134	1GB44929KT0691134	{"method":"POST","path":"/paypal/order/1GB44929KT0691134/capture"}	10.83.8.142	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 14:14:22.826331
a8033d1b-d739-45f9-b8e9-98f8bdaa1ce9	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	6N103088T9728110P	6N103088T9728110P	{"method":"POST","path":"/paypal/order/6N103088T9728110P/capture"}	10.83.13.101	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 14:25:32.198898
257f6a95-ef17-43b4-8895-b1fc689330b0	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	76S80303U67202331	76S80303U67202331	{"method":"POST","path":"/paypal/order/76S80303U67202331/capture"}	10.83.11.131	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 14:33:30.524154
c07358e1-d696-492f-aeea-85c2b2f1db0c	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	59G07318430498838	59G07318430498838	{"method":"POST","path":"/paypal/order/59G07318430498838/capture"}	10.83.1.67	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 14:38:59.642513
96bbdcfd-1281-41b3-ade9-038fa521088b	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	41N1062482702443M	41N1062482702443M	{"method":"POST","path":"/paypal/order/41N1062482702443M/capture"}	10.83.7.128	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 14:43:40.208029
c2935a99-69c0-4173-b70b-59efaea6c1ee	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	5acac918-6de6-4139-9974-baf88f3e5d47	{"method":"POST","path":"/api/repair-center/marketplace/orders"}	10.83.7.128	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-03 14:43:41.33955
4044d3a4-e720-47ff-808e-975ba1750f33	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-payment-intent"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 09:05:45.367465
17176a68-d861-40ce-b933-2586375aaf8e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-checkout"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:08:49.390457
e4b64580-78c9-4f4b-97e0-bbbc8ee6dda7	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-payment-intent"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:15:00.458886
beb488fa-7697-4226-a6ac-9270b2fa6ecd	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-payment-intent"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:18:16.167584
6748cb8e-b402-42b9-8abc-8b4499e571b5	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	75e96764-655a-4fab-80fb-3526a1369efc	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:18:26.622151
0ded549b-1849-432c-9375-73de775b4f7c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-payment-intent"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:25:51.095901
ece6e1aa-41ee-4574-8404-7ea57799d057	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	b2b-orders	7b06ff0b-f7f1-4063-ac61-5d968db41f13	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:26:04.19315
d7b3a37f-66cc-4260-8302-7609107821be	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 10:50:13.432333
83e955f5-9b0a-42d9-ae49-b8e114941d88	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/reseller/b2b-orders/stripe-payment-intent"}	10.83.6.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:08:12.600875
e2df2095-b5f7-48da-bb4d-a71cd03ed0da	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	b2b-orders	66d44b07-c50a-428b-a174-29f9c7ce395a	{"method":"POST","path":"/api/reseller/b2b-orders"}	10.83.6.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:08:24.178493
c8875568-41b2-4773-8e1f-d56641978b0b	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.11.214	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:09:15.184155
2ea922ff-bc6e-4d63-8ad3-f65c7fefe0c3	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:12:46.493494
25a47d64-05c3-4002-a061-f70d780a4584	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:16:48.987929
3f4eef16-2e90-43d8-9234-81ef1d7198b4	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:20:42.622047
88894807-e53e-4cb0-a473-e123265af7db	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	e495c7c7-b8a8-4914-99db-69db210b8b87	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:20:56.031127
124e1c2c-fb1f-4440-a6cc-f61ab69bc5f2	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:33:55.321822
82661b09-1a33-4652-a928-9cdd1648e49d	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:38:18.84388
deff6c9f-b7be-4a62-af83-0f10274c1652	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:38:28.129039
70ad1b29-723d-4465-bf3b-eccb324e04a2	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:44:07.546423
f8e63d35-7f0a-4a9c-945f-fecf95225502	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	\N	{"method":"POST","path":"/api/reseller/marketplace/orders/stripe-payment-intent"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:47:38.673152
c4774ecf-a219-4b90-bc63-13b1f4e0866a	3af078a6-01ce-4d7e-9268-1db16b60b82c	CREATE	marketplace	d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	{"method":"POST","path":"/api/reseller/marketplace/orders"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 13:47:48.01803
ac114a53-b197-477b-ba82-e4272c9589e0	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	paypal	3TT25290S13285445	{"method":"POST","path":"/api/repair-center/paypal/order"}	10.83.0.7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:23:57.102823
ef62bc31-72ad-457d-b426-f7ffacf38535	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	paypal	3TT25290S13285445	{"method":"POST","path":"/api/repair-center/paypal/order/3TT25290S13285445/capture"}	10.83.0.7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:24:12.550256
32ef96dd-4d2b-40ff-b190-92a2c0ef0a45	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	paypal	7F209645UH975471M	{"method":"POST","path":"/api/repair-center/paypal/order"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:27:46.817839
4d41848b-edeb-4f98-8027-0130ba49d426	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	paypal	7F209645UH975471M	{"method":"POST","path":"/api/repair-center/paypal/order/7F209645UH975471M/capture"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:27:53.403476
bd0b27c4-b8b5-4ac6-bedd-44addd815c4e	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	e4b00f3f-2507-4ef2-bb37-ad5fc50a63af	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:27:54.941703
23e7f3cc-ae3f-4ef4-9179-6363302d29bb	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	paypal	1L244735YL862900E	{"method":"POST","path":"/api/repair-center/paypal/order"}	10.83.6.19	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:41:39.404976
ece3539c-9c39-4a38-9b1f-a3820ad28e33	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	paypal	1L244735YL862900E	{"method":"POST","path":"/api/repair-center/paypal/order/1L244735YL862900E/capture"}	10.83.6.19	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:42:43.929235
bd56e65b-1050-4b77-a61d-04754a311483	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	9e924fa5-106f-4f7d-8a8e-80aa585d3413	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.6.19	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:42:45.493361
be1c1531-aadb-44ca-8d87-d9f835438af2	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/repair-center/b2b-orders/stripe-payment-intent"}	10.83.6.19	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:47:45.143163
cf3733f9-7764-4377-9e68-a803be246dba	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	f692ea14-fd08-4782-b4a1-2accb303e4a5	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.6.19	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:47:53.265615
5996ca43-75f6-459c-8f74-645c14e8a6a7	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/repair-center/b2b-orders/stripe-payment-intent"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:53:03.518431
db2b7c6c-ae2d-4a43-91e0-c306b9ed448d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	abcb3038-2573-4040-a93a-20e7029b6a59	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 14:53:12.798521
387879e3-baf0-4899-958b-2e7ddafd7c23	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	11B53202GJ343574S	11B53202GJ343574S	{"method":"POST","path":"/paypal/order/11B53202GJ343574S/capture"}	10.83.11.214	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:04:27.260819
6e641533-cefb-4d5c-87f5-04dffcaa026d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	5BL14336MS5898928	5BL14336MS5898928	{"method":"POST","path":"/paypal/order/5BL14336MS5898928/capture"}	10.83.11.214	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:04:46.544167
af4619cb-df7f-48aa-b4ec-b96c2a3a4af4	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	9RR36204M25335316	9RR36204M25335316	{"method":"POST","path":"/paypal/order/9RR36204M25335316/capture"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:09:33.148855
f4343461-168c-4c45-86aa-7fdb4effa1bf	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	cb55cb1c-c1ed-4831-89b2-90fff491c02f	{"method":"POST","path":"/api/repair-center/marketplace/orders"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:09:34.100401
24460f9b-7393-4f35-910a-2ac38abf26b5	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	\N	{"method":"POST","path":"/api/repair-center/marketplace/orders/stripe-payment-intent"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:09:40.49364
31deb20e-d6ad-42c6-a16f-75250b1f4f13	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	1754e5e6-fb10-4894-aa0e-e83e4815a01f	{"method":"POST","path":"/api/repair-center/marketplace/orders"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:09:48.161106
063b2aa1-34ae-4b75-b48f-15f2b5db2594	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	\N	{"method":"POST","path":"/api/repair-center/marketplace/orders/stripe-payment-intent"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:48:22.349138
c1508694-a7e9-4ae0-8dd9-eb28397ad6a5	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	marketplace	6d120e15-8a7c-4a0b-8f65-cbf697e48d2d	{"method":"POST","path":"/api/repair-center/marketplace/orders"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:48:31.161076
d6ff22d6-1ae5-4821-a3c8-700c4a7407b5	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	\N	{"method":"POST","path":"/api/repair-center/b2b-orders/stripe-payment-intent"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:50:00.711093
ad7f2224-a10c-49e5-8301-1bfd7a3a81e9	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	b2b-orders	2cfde78b-49be-4449-8de2-ea6ace8efc22	{"method":"POST","path":"/api/repair-center/b2b-orders"}	10.83.7.177	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 15:50:09.119616
f23d231e-e54c-465a-844c-b321ed43a489	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:29:52.480434
ebd90d8d-6b3f-4d08-8665-24a8e1ed6afa	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	service-orders	2a698b91-f685-4ea9-b0e0-819cea44a0d4	{"method":"PATCH","path":"/api/repair-center/service-orders/2a698b91-f685-4ea9-b0e0-819cea44a0d4/start"}	10.83.11.214	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 17:51:57.210494
09f4a770-8b4f-420e-8188-13a8c470a40e	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	DELETE	unrepairable-reasons	82baecd2-1d7f-463b-904f-62ead03c50d1	{"method":"DELETE","path":"/api/admin/unrepairable-reasons/82baecd2-1d7f-463b-904f-62ead03c50d1"}	10.83.4.11	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 18:55:20.980611
da8c014a-2d69-4ebd-a089-71c31d3c07a8	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	DELETE	unrepairable-reasons	eb7e7260-1736-4bf6-80b8-c680da068dfe	{"method":"DELETE","path":"/api/admin/unrepairable-reasons/eb7e7260-1736-4bf6-80b8-c680da068dfe"}	10.83.6.19	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-04 18:55:26.110363
1bb66e5d-e401-4ff6-b55a-a813f0036558	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:17:04.532431
8e39801d-d8eb-4140-a369-2e2a0ae5a331	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:20:52.197098
cf0d2668-b579-44c8-8129-0e23118ed125	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:31:25.858698
f26ef05b-9c4a-43b4-af75-3c27f64719bd	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.0.56	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:31:27.197399
0f2cecda-9790-4bc7-903d-cc2c0066f318	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:37:44.432554
18a22299-fbb7-4190-b46e-62207a8bb9a0	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:37:45.731751
430ef5ce-3bf8-4314-815b-acc3c6e51a2c	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.0.56	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:42:55.850807
15dc18fd-4a9a-4af9-92d1-1d628007439e	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.0.56	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:42:57.184241
08a17de6-569c-4371-92c5-05c295317f3d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:49:08.792149
b08c6768-c40a-4e11-80e2-fcaf37a33e6b	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:49:10.205921
509f0081-9436-40ac-82a9-8655b6a895f1	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:52:59.728699
4d7ed30c-9534-456b-a063-3e70c2db34d6	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:53:06.878878
4fa59b76-9244-46d2-b331-03c52bc2a6e7	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.0.56	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:56:52.702635
bcb264d5-89e3-4135-a194-88750858b5be	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.12.172	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 09:56:54.083627
3d7cd4bb-9ab6-4770-95b2-12e67bc93475	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:00:15.196481
5e57a20d-422b-4f53-a4dc-1e8a4a08aefb	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:00:16.506148
93762332-79bd-4d32-b0a5-c516ce1eaa64	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:25:09.137031
56d8ab40-de8e-4038-b02e-e99fb98b194a	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:25:10.51071
9c6a3fad-f29a-4df8-b033-0beba942d2af	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:26:02.604039
d91e3792-6be9-48b0-98e8-19f0422ff6b3	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:27:04.038734
6f0425e2-7aba-458a-8ce0-4ea8e3baac5a	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:27:15.599342
3f44bdab-d3ed-4bde-b0fa-ed75c3bbfcd0	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:29:53.922451
d1523450-781b-4c78-b76e-3d758bf7a745	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:42:18.719824
e26af752-59fd-4c6e-ba8f-e3aa97291f48	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-payment-link"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 10:42:20.027521
c2e481ef-42c2-46fd-9dfc-ac6dc93a1aca	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:19:38.079284
853bbc14-1d84-4f93-89cd-1dae0cdd5709	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:19:39.844937
b1836b1b-8501-4fc9-869c-725c68bf793c	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:27:17.788821
59a64807-35a8-4212-9537-18b1ac783f81	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:27:20.21206
faf1165b-b637-41e6-879c-06e87a61b548	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:37:10.832213
ad5bde70-502f-4444-9fea-81111c6ccb56	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:37:12.84509
e326c600-baac-4e4e-80ac-43e5159214ff	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:40:21.185962
69f706bc-759d-481e-95a9-9eb3c454d1e9	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:40:22.795228
e14744ea-d53f-4b42-b467-f1f325203ff4	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:55:00.92232
8717d6c9-5691-4c90-8109-84695f48683b	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 11:55:02.944676
f9c53018-1e10-4943-a55a-45fbb484b89d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.0.56	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 12:02:41.157051
cc1780d6-e532-497b-b1af-ae1ccdda1276	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 12:02:42.736397
629595c3-189c-4e8d-afce-dcdc02acf161	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 12:07:19.661902
ec552dc0-cea2-4bb6-91c0-0e30514e2ce7	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 12:07:21.249342
fffbb6a1-da06-490d-b05d-4e1f67210e28	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 12:12:45.505323
cbeb5070-f324-48aa-8a6b-e4e41d7491d4	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/create-paypal-order"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 12:12:47.434139
0766b600-4ae4-4108-b3fb-5e5b0d00e4e7	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	pos	030cd5b0-6be2-4957-8be6-a1c82a1eb860	{"method":"PATCH","path":"/api/repair-center/pos/registers/030cd5b0-6be2-4957-8be6-a1c82a1eb860"}	10.83.7.199	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 13:21:17.111501
d89710ff-0770-4c00-b38b-cb28b46c7073	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	users	3d7c8ab4-eba1-4878-860c-3f005e0d6118	{"method":"PATCH","path":"/api/reseller/customers/3d7c8ab4-eba1-4878-860c-3f005e0d6118"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:26:41.388452
57a0093e-884c-4267-8a88-69fd4e4ebaf8	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	users	65d3739f-9ebd-4809-ba4e-b3f1d1c3a6c8	{"method":"POST","path":"/api/customers/quick"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:31:25.293568
d1c5f914-c039-4ef2-b87c-d583342c8f8a	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	unrepairable-reasons	b42908f3-2323-410e-80c0-6d855adb3fb4	{"method":"POST","path":"/api/admin/unrepairable-reasons"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:54:30.515757
a9011a45-c4ae-4395-8ec1-a1ee2dbd77fb	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	DELETE	unrepairable-reasons	b42908f3-2323-410e-80c0-6d855adb3fb4	{"method":"DELETE","path":"/api/admin/unrepairable-reasons/b42908f3-2323-410e-80c0-6d855adb3fb4"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 14:54:34.600402
7e91d775-d0c5-4743-adf1-964101066674	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	repair_order	da8a3b5f-dfb6-4882-b62c-a9434f748054	{"method":"POST","path":"/api/repair-orders"}	10.83.10.187	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 18:19:26.679036
ec786c97-e31d-4458-b85a-197f2e54ba5f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	repair_diagnostics	fa409163-2861-4475-a078-35983ebed0c2	{"method":"POST","path":"/api/repair-orders/da8a3b5f-dfb6-4882-b62c-a9434f748054/diagnostics"}	10.83.5.86	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 18:19:48.204029
434272a4-6876-4982-b5ab-5a32447857b5	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	user	65d3739f-9ebd-4809-ba4e-b3f1d1c3a6c8	{"method":"PATCH","path":"/api/users/65d3739f-9ebd-4809-ba4e-b3f1d1c3a6c8"}	10.83.9.123	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-05 21:10:37.486328
f5cc3378-8101-4390-b9f2-19db5d93faa3	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	remote_repair_requests	bc1694b8-0fab-44fc-ba21-93937232a715	{"method":"PATCH","path":"/api/reseller/remote-requests/bc1694b8-0fab-44fc-ba21-93937232a715/assign"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 07:01:44.922584
aa71ffd4-60a6-4439-9c84-1847785e3eae	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	remote_repair_requests	bc1694b8-0fab-44fc-ba21-93937232a715	{"method":"PATCH","path":"/api/repair-center/remote-requests/bc1694b8-0fab-44fc-ba21-93937232a715/accept"}	10.83.13.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 07:02:08.724921
d8759de8-9be4-4ccb-920a-d5270f7362c3	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	users	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	{"method":"PATCH","path":"/api/reseller/customers/77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 07:47:11.010699
799830fe-bf37-4e3d-83c6-b9b9e3256e8a	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	remote_repair_requests	bb11d1fb-6dbe-4be9-bcae-b91a6ffa1a02	{"method":"PATCH","path":"/api/repair-center/remote-requests/bb11d1fb-6dbe-4be9-bcae-b91a6ffa1a02/accept"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 09:04:45.168619
0307756e-8c78-499a-b465-e260065b751b	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	remote_repair_requests	bb11d1fb-6dbe-4be9-bcae-b91a6ffa1a02	{"method":"PATCH","path":"/api/repair-center/remote-requests/bb11d1fb-6dbe-4be9-bcae-b91a6ffa1a02/quote"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 09:04:53.579637
a0696852-c22e-4b89-89b5-1026e4b076bb	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	remote_repair_requests	7ac04ca0-25fe-461a-bd83-e35051d45e61	{"method":"PATCH","path":"/api/repair-center/remote-requests/7ac04ca0-25fe-461a-bd83-e35051d45e61/accept"}	10.83.8.28	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 10:02:55.683038
c030d29d-a3df-4428-861b-ef5b9cc4ba59	9cc5d774-98cb-421b-bb88-d1a9a5346977	UPDATE	remote_repair_requests	7ac04ca0-25fe-461a-bd83-e35051d45e61	{"method":"PATCH","path":"/api/repair-center/remote-requests/7ac04ca0-25fe-461a-bd83-e35051d45e61/quote"}	10.83.8.28	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 10:03:02.22061
cefb9d35-3712-4ab0-af3e-7cfda0e495aa	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	products	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	{"method":"POST","path":"/api/reseller/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf/stock"}	10.83.2.42	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 12:37:19.86179
754c3ba3-5807-4de8-b8f6-09b0aff22063	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.10.36	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 13:28:32.167899
f17413db-833a-4b0c-b687-997ce7240a70	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.6.58	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 13:44:13.393732
86419fa9-73b0-4e9a-bff3-bc863010ac5d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.9.4	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 14:01:44.743333
c2c96c41-b104-4fb0-8cf3-ede61ada2359	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.0.7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:18:50.158621
2aa9fa9b-eaca-49a3-a79a-af51b11c18f9	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.0.7	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:19:11.665783
c0b35257-ea74-4781-ad1a-3f87ae034e31	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.6.58	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:34:16.244909
20769ffc-dcf9-4060-8321-d4f68f092e24	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.6.58	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:34:20.617345
75e63081-1e97-4e53-bb46-616c86ab7d18	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.6.58	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:34:26.015068
a6b23283-2133-4279-9694-e2af418477fb	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:43:16.39189
0d563822-a123-4a4f-b435-5850d384dd5f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.11.46	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:45:49.419218
de1401cc-0e95-4344-8dce-ae187ac01de9	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	fiscal	\N	{"method":"POST","path":"/api/admin/fiscal/test-connection"}	10.83.1.126	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:49:21.810039
9a33ea89-cd25-4ee4-9bea-a4ba2891b06f	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.11.46	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:50:50.869765
be7326f5-afd5-4146-8c51-d5acb3b0c94a	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.8.28	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 15:55:33.97641
37845b2e-c311-48da-b0f1-e811ca138abd	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.11.46	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-06 16:01:12.551495
c4351f72-1222-46fa-ba61-a9e684384309	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	license-plans	3a05301f-d6d2-483a-be2f-332bae33d5d5	{"method":"POST","path":"/api/admin/license-plans"}	10.83.10.125	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:26:05.85959
e9b84536-f575-4cc3-ad29-fe9b9525a889	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	license-plans	0e330f26-5b15-4c5d-aff2-5d2dce147cfc	{"method":"POST","path":"/api/admin/license-plans"}	10.83.10.125	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:26:06.311997
3bfaf426-bf06-4a0d-a87c-242620e5501e	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	DELETE	license-plans	0e330f26-5b15-4c5d-aff2-5d2dce147cfc	{"method":"DELETE","path":"/api/admin/license-plans/0e330f26-5b15-4c5d-aff2-5d2dce147cfc"}	10.83.4.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:26:10.184905
270397f0-a2fb-4ab1-9b2c-21503fe4f64e	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	licenses	bb24e428-2423-4f9a-b3f8-2095f5bd060d	{"method":"POST","path":"/api/admin/licenses/grant"}	10.83.9.102	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:26:21.562496
6a050aad-09fa-4175-8414-1b6c45fc7662	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	activate	27370c58-16b0-436c-9e07-4f6b2e821f09	{"method":"POST","path":"/api/licenses/activate"}	10.83.2.42	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:26:55.644651
f91714ab-1f38-4bcb-a3a9-80a45607a32e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	activate	\N	{"method":"POST","path":"/api/licenses/activate"}	10.83.4.99	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:46:01.690315
f76bfa9c-93f6-4251-9b9c-cedf5673a599	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	activate	\N	{"method":"POST","path":"/api/licenses/activate"}	10.83.5.21	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-09 22:54:21.258556
63c6e926-8d1a-4486-83d9-0c59bbf13ad4	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	licenses	32b0c7d0-bd46-41b2-878c-87c2ba4af9bb	{"method":"POST","path":"/api/admin/licenses/grant"}	10.83.9.115	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 13:26:38.430085
e0e67a05-fb35-44b9-a825-e599bbbe5b80	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	practices	11c3be32-1676-453b-a214-1293f925231e	{"method":"POST","path":"/api/utility/practices"}	10.83.6.112	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-10 18:48:49.194492
37b2d350-7549-4335-a9b8-5886ffc000bf	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	8227167b-1ac8-4a84-8973-6953c0efc712	{"method":"PATCH","path":"/api/notifications/8227167b-1ac8-4a84-8973-6953c0efc712/read"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 13:58:13.324459
4736b166-cb99-4108-a7ba-e28b5f395978	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	87fe9867-1bbc-40f8-96d1-07c6235a171e	{"method":"PATCH","path":"/api/notifications/87fe9867-1bbc-40f8-96d1-07c6235a171e/read"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 13:58:16.354878
b567a9d3-3a50-4617-af82-7ff20224412c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	e09612ac-c15c-4851-b863-3bad33321761	{"method":"PATCH","path":"/api/notifications/e09612ac-c15c-4851-b863-3bad33321761/read"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 13:58:16.903962
57b6134a-798f-4f76-b7a9-2cf5db7db6d0	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	6fc5f18a-a830-4eaf-8c54-1e7ae1a693b8	{"method":"PATCH","path":"/api/notifications/6fc5f18a-a830-4eaf-8c54-1e7ae1a693b8/read"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 13:58:18.501831
a79952a6-bfeb-4d6e-b081-6f7117217182	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	notifications	e454deb5-1a04-4f7a-b958-95774c946add	{"method":"PATCH","path":"/api/notifications/e454deb5-1a04-4f7a-b958-95774c946add/read"}	10.83.7.154	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 13:58:19.038792
47f2556f-eb1a-4d74-9256-b9ba1e11bec1	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	read-all	\N	{"method":"PATCH","path":"/api/notifications/read-all"}	10.83.11.157	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 14:11:59.084768
3490f0a8-d8b2-4f46-a049-1f72dc99bc78	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	users	3d7c8ab4-eba1-4878-860c-3f005e0d6118	{"method":"PATCH","path":"/api/reseller/customers/3d7c8ab4-eba1-4878-860c-3f005e0d6118"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-11 14:23:59.242686
9203d411-2088-4028-98ac-bd635b96a153	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	repair_order	1b09ea3e-af94-4999-b97c-bb3b421482fb	{"method":"POST","path":"/api/repair-orders"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 08:19:14.285388
c9c992f4-2773-4145-b3a3-ed00aea1fa39	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	repairs	1b09ea3e-af94-4999-b97c-bb3b421482fb	{"method":"POST","path":"/api/reseller/repairs/1b09ea3e-af94-4999-b97c-bb3b421482fb/skip-diagnosis"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 08:19:21.934686
3730fec2-3a67-4aa4-afbf-f34b43adf7bc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	repair_quote	2a491b86-d6a9-410b-89d4-06edc6dca671	{"method":"POST","path":"/api/repair-orders/1b09ea3e-af94-4999-b97c-bb3b421482fb/quote"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 08:19:38.113002
fbe326a2-17c6-4d4a-b5d6-d1ffefc86430	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	repair_quote	2a491b86-d6a9-410b-89d4-06edc6dca671	{"method":"PATCH","path":"/api/repair-orders/1b09ea3e-af94-4999-b97c-bb3b421482fb/quote"}	10.83.2.145	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 08:19:47.57755
5d423197-cef3-4b1d-a9d0-5b7cf14110c8	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	repair_order	fbbab9a3-8861-481e-94d4-f6a2e01bb86a	{"method":"POST","path":"/api/repair-orders"}	10.83.1.38	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 09:12:16.77215
b3880a58-742a-4f7e-b517-2890fa1c3e77	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	ticket	81ce9d96-763d-42cd-b1f5-b1b266542a6a	{"method":"PATCH","path":"/api/tickets/81ce9d96-763d-42cd-b1f5-b1b266542a6a/status"}	10.83.4.179	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 09:37:26.224799
41b3ad1a-905c-4df7-affc-bb324ef3766e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	practices	11c3be32-1676-453b-a214-1293f925231e	{"method":"PATCH","path":"/api/utility/practices/11c3be32-1676-453b-a214-1293f925231e/status"}	10.83.1.38	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 09:37:48.686643
4b8e46bb-7bb1-4d1c-adeb-8019efd92b02	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	commissions	c0eccba8-0286-4f42-92cb-4354715831fb	{"method":"POST","path":"/api/utility/commissions/c0eccba8-0286-4f42-92cb-4354715831fb/approve"}	10.83.11.157	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 11:03:59.969602
845cc253-d5b6-4251-9a6d-48a671b89002	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	commissions	c0eccba8-0286-4f42-92cb-4354715831fb	{"method":"PATCH","path":"/api/utility/commissions/c0eccba8-0286-4f42-92cb-4354715831fb"}	10.83.11.157	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 11:04:13.77631
0336e024-1ade-482c-b41d-f2ee7aeb7636	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	warranties	2efd0277-0d53-4f97-a425-0c937a4b8200	{"method":"POST","path":"/api/repair-center/warranties"}	10.83.0.46	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-12 13:10:22.914969
c830e350-2629-47fa-a323-152f15e982e4	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	service-items	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	{"method":"PATCH","path":"/api/reseller/service-items/eccfaab5-1219-48d7-a1ab-ec897c1c7d45"}	10.83.11.157	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-13 14:54:02.154879
6bd01727-c395-4c39-ab35-048c61e2b8bc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.6.82	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 10:47:49.000197
48d3a273-8c9d-4e53-a35b-9593d078665a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.9.17	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 10:51:33.580407
73acfebf-15a2-4547-8046-3fc03875efc9	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.9.17	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 10:54:47.350711
997eabff-86ad-4146-9406-22803483f813	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.12.84	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 11:29:29.397104
c5e94672-9033-4d21-bfb4-622ecc07454a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.12.84	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 11:30:11.41236
f813b31e-22ba-4908-b4b4-81b3b1c95d95	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	service-items	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	{"method":"PATCH","path":"/api/reseller/service-items/eccfaab5-1219-48d7-a1ab-ec897c1c7d45"}	10.83.12.84	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 11:32:51.855765
badce605-106d-474a-ac63-9935910ca08d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.6.82	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 11:33:01.040728
19076c47-aaae-4ca1-b93e-56ad7f597034	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	service-items	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	{"method":"PATCH","path":"/api/reseller/service-items/eccfaab5-1219-48d7-a1ab-ec897c1c7d45"}	10.83.4.15	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:22:23.129151
c311387e-d368-454e-8b3e-a65a73609fb5	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.4.15	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:22:37.529588
7e51329f-6ed6-450a-8c32-91808e164899	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.2.8	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:28:15.117089
dd5611e9-991b-43bb-93f6-1cfff2d6e3e5	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.3.33	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:41:21.44245
99839c1b-1aa3-47b8-a2ca-075fc7557579	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.11.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:49:19.954029
a74ee187-a103-43c1-a0c6-626633f5b58d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	read-all	\N	{"method":"PATCH","path":"/api/notifications/read-all"}	10.83.6.82	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-16 12:49:58.001995
eda020ad-4978-4b2f-a860-c9173e31e15b	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.12.128	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:00:42.82825
b6836c49-bf4a-4820-bb08-977a4a30982b	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.4.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:03:53.210938
f8eb53d3-6cee-4240-9af2-8f3bdbf9819d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.1.101	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:06:11.856747
29abfabb-136d-482d-86c4-411e0b1384d2	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.4.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:11:15.294732
27901f95-de6f-4920-ae3b-dd60bde17f28	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.4.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:13:02.273497
2ec3ad2f-283c-4be4-9813-ff0620132dc2	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.4.97	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:13:09.368634
7543fbeb-0225-4f56-991c-eab2f5a56b1b	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.5.124	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:16:18.108478
d4318779-4be6-4605-b956-f05551c426b8	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.3.102	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:17:36.098076
97ccf1e9-7474-4ed1-9e8d-8f28361b8e63	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.11.147	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:20:06.393123
107d59fd-3458-4c68-9a8e-0beda675f140	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	pos	\N	{"method":"POST","path":"/api/repair-center/pos/transaction"}	10.83.11.147	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 11:38:42.555486
e61c95d5-6efa-4a0b-b04b-8b123d7cd9b2	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	users	7e413aba-8495-4f15-98b5-b5b757a36565	{"method":"POST","path":"/api/reseller/team/7e413aba-8495-4f15-98b5-b5b757a36565/reset-password"}	10.83.5.128	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-18 13:30:08.939787
225feb0b-c496-40ef-a269-61fd8a31e9c2	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	repair_order	96e2f962-0720-4aa4-83a9-86e63f0c9f7d	{"method":"POST","path":"/api/repair-orders"}	10.83.1.210	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-20 13:41:04.666906
4a29972e-852f-4163-a387-4f34b3471ddb	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	create	3d05e6c8-27c7-4b32-b54a-d7c4c6cbcfe2	{"method":"POST","path":"/api/self-diagnosis/create"}	10.83.4.36	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-20 13:47:43.505081
b39a03b7-4cf2-4ccf-b1e2-559e3f2899cd	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	repair_order	9ffd7072-2269-4d91-972d-2741229f6f0c	{"method":"POST","path":"/api/repair-orders"}	10.83.3.180	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-20 14:01:29.591671
1f0f02cd-6969-4346-8437-83e2416ca66d	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	create	c5852255-f5a4-4899-9ec3-29994ee0fee4	{"method":"POST","path":"/api/self-diagnosis/create"}	10.83.3.180	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-20 14:01:32.002359
9c115b49-d79b-4889-a8af-c55d58ee3656	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	repair_order	e06992de-0638-44b1-a396-27c9fd2bd9e9	{"method":"POST","path":"/api/repair-orders"}	10.83.3.180	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-20 14:07:43.526571
d924fa86-c595-4824-820e-c6d9a4f04924	9cc5d774-98cb-421b-bb88-d1a9a5346977	CREATE	create	51c6ffd4-fae3-4988-b8e1-995f04962510	{"method":"POST","path":"/api/self-diagnosis/create"}	10.83.11.222	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-20 14:07:45.470382
76f2dfee-99fc-4b34-922d-23518ec1eb2b	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	services	5e02a782-ff96-41f7-b8f1-8aa25547503b	{"method":"PATCH","path":"/api/utility/services/5e02a782-ff96-41f7-b8f1-8aa25547503b"}	10.83.0.96	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-22 23:28:25.551682
4ec013ff-8d9d-4a55-a52c-f4b8e40e840d	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	services	5e02a782-ff96-41f7-b8f1-8aa25547503b	{"method":"POST","path":"/api/utility/services/5e02a782-ff96-41f7-b8f1-8aa25547503b/cover-image"}	10.83.0.96	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-22 23:28:27.344566
39230353-459a-402d-9aff-0f0b93bbb273	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	services	5e02a782-ff96-41f7-b8f1-8aa25547503b	{"method":"PATCH","path":"/api/utility/services/5e02a782-ff96-41f7-b8f1-8aa25547503b"}	10.83.4.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-22 23:28:57.524633
0d47efcf-6772-4a09-ad06-b9009872f42d	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	suppliers	5939d4e6-c7a7-4152-bbeb-7b5740f86620	{"method":"PATCH","path":"/api/utility/suppliers/5939d4e6-c7a7-4152-bbeb-7b5740f86620"}	10.83.8.45	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-22 23:45:46.547803
995bf94e-1dc7-489a-b062-47c8d89ef385	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	suppliers	5939d4e6-c7a7-4152-bbeb-7b5740f86620	{"method":"POST","path":"/api/utility/suppliers/5939d4e6-c7a7-4152-bbeb-7b5740f86620/logo"}	10.83.8.45	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-22 23:45:48.49862
e8740efc-a177-41e9-8ea6-68f7c95461be	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	warranties	6b362da0-854f-4421-a6aa-d782d8cbdc23	{"method":"POST","path":"/api/reseller/warranties"}	10.83.14.136	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-22 23:49:46.333258
60ae2b08-3763-48b4-8de2-34789582912a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	warranties	79e7fd25-9a58-480d-8fb9-fa2371a9a471	{"method":"POST","path":"/api/reseller/warranties"}	10.83.4.121	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 00:01:10.193541
8c2e5284-4d29-4bc6-9efb-14020da3cade	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.10.68	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 00:09:06.685842
852ff73b-f2cc-4b31-93c9-6e97bf73ae33	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	chat	\N	{"method":"POST","path":"/api/ai/chat"}	10.83.10.68	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 00:09:14.776451
8fbf6ff4-7988-49da-b40d-648ae364fc0a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	CREATE	customers	\N	{"method":"POST","path":"/api/reseller/customers/import-csv"}	10.83.0.96	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 11:22:32.51368
05848bb1-a910-4170-972b-86114df9f78f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	CREATE	repairs	e06992de-0638-44b1-a396-27c9fd2bd9e9	{"method":"POST","path":"/api/admin/repairs/e06992de-0638-44b1-a396-27c9fd2bd9e9/skip-diagnosis"}	10.83.4.140	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 12:24:32.128903
40966a3b-72c9-4e8e-9cab-5edc6d78ab6a	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	UPDATE	messages	\N	{"method":"PATCH","path":"/api/chat/messages/read/9cc5d774-98cb-421b-bb88-d1a9a5346977"}	10.83.11.28	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 14:28:19.389162
e15590a1-91f8-41c7-ab42-9c729861ccdd	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	service_orders	b62db49f-b696-4c24-8989-c8c11dc8cf55	{"method":"PATCH","path":"/api/reseller/service-orders/b62db49f-b696-4c24-8989-c8c11dc8cf55/confirm-receipt"}	10.83.9.200	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 15:02:40.833443
23e0425c-433a-4595-85e9-83c060f898b5	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	UPDATE	service_orders	b62db49f-b696-4c24-8989-c8c11dc8cf55	{"method":"PATCH","path":"/api/reseller/service-orders/b62db49f-b696-4c24-8989-c8c11dc8cf55/complete"}	10.83.9.200	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36	2026-02-23 15:02:49.379275
\.


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_settings (id, setting_key, setting_value, description, updated_by, updated_at) FROM stdin;
f3d437a8-067d-483b-bc0d-8ff720cd9fa0	hourly_rate	3500	Tariffa oraria manodopera in centesimi	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	2025-11-25 14:35:42.202
8332ca95-b016-408f-b220-031ea22508c6	sla_thresholds	{\n  "ingressato": {"warning": 24, "critical": 48},\n  "in_diagnosi": {"warning": 24, "critical": 48},\n  "preventivo_emesso": {"warning": 48, "critical": 72},\n  "attesa_ricambi": {"warning": 72, "critical": 120},\n  "in_riparazione": {"warning": 24, "critical": 48},\n  "in_test": {"warning": 8, "critical": 24},\n  "pronto_ritiro": {"warning": 48, "critical": 72},\n  "supplier_return_draft": {"warning": 24, "critical": 48},\n  "supplier_return_requested": {"warning": 48, "critical": 96},\n  "supplier_return_approved": {"warning": 24, "critical": 48},\n  "supplier_return_shipped": {"warning": 72, "critical": 120}\n}	Soglie SLA per stati riparazioni e resi (valori in ore)	\N	2025-11-29 23:12:14.350663
\.


--
-- Data for Name: admin_staff_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_staff_permissions (id, user_id, admin_id, module, can_read, can_create, can_update, can_delete, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: aesthetic_defects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.aesthetic_defects (id, name, description, device_type_id, is_active, sort_order, created_at, updated_at) FROM stdin;
857d2451-538d-4377-b458-a09afe9af16d	Nessun difetto	Dispositivo in condizioni estetiche perfette	\N	t	0	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
c20d2107-ef28-432a-88b6-2a54e1bc693f	Graffi lievi	Piccoli graffi superficiali non visibili a distanza	\N	t	1	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
7d3d2868-b117-414a-a1fa-75409f0735b7	Graffi profondi	Graffi profondi visibili a occhio nudo	\N	t	2	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
806cde14-78f6-46d2-bf67-131045de4d63	Ammaccature	Ammaccature sulla scocca o cornice	\N	t	3	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
2060f3ca-bc6f-4435-bdc5-9ec8075fd6cc	Segni di usura	Segni generici di usura da utilizzo normale	\N	t	4	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
12b924e5-38d3-439f-8723-56636638d5c3	Schermo incrinato	Crepe o incrinature sul vetro/display	\N	t	5	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
9d822766-f6d8-432e-bc05-efc6b8560e25	Schermo danneggiato	Schermo rotto o con danni visibili	\N	t	6	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
9d0dc308-da08-43c0-9750-857c337aac9b	Scolorimento	Scolorimento o macchie sul dispositivo	\N	t	7	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
49b13574-1f10-455d-8180-782a1c7fbbb7	Sporcizia/Polvere	Accumulo di polvere e sporcizia	\N	t	8	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
76bdb61c-300c-4cc9-ac45-1f425e94ef73	Cornice allentata	Cornice o bordo leggermente staccato	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
b00f0f5f-6cb0-47fd-bf0e-b609a49d0385	Vetro posteriore incrinato	Crepe sul retro del dispositivo	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
90220472-d3e4-42dc-b7e2-3202d4649e15	Tasto volume danneggiato	Pulsante del volume graffiato o incassato	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
3d2423c0-d100-46ff-9700-72c6cca6d3c9	Tasto accensione danneggiato	Pulsante di accensione graffiato o incassato	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	13	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
8323b3cf-1c41-4600-ad2a-afbf4c958a28	Porta di ricarica ossidata	Ossidazione visibile nella porta di ricarica	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	14	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
e6dfb40e-6d1f-4701-83b6-989a01ff7a35	Fotocamera graffiata	Graffi sul vetro della fotocamera	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	15	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
8b0339c1-7462-4c03-8a47-90e6cdd6c3f1	Angoli ammaccati	Ammaccature sugli angoli del tablet	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
e5f5065e-b797-46b0-833d-15f9c561d39e	Bordo scrostato	Vernice o rivestimento scrostato sui bordi	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
d4a4de71-5d69-45ba-9d72-2e5a39f57891	Penna stylus mancante	Stylus/penna inclusa mancante	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
f8a9210e-715a-44c5-a176-a6790f898654	Scocca graffiata	Graffi sulla scocca esterna	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
1ae2d74d-873f-4c6f-8b3f-36b94192247f	Cerniera allentata	Cerniera del display allentata o rigida	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
95b00e26-6f00-41d4-a937-636a76b0021c	Tastiera consumata	Tasti consumati o sbiaditi	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
e7c1e7ad-af8d-4cf9-beac-205b2c3dfa50	Touchpad graffiato	Graffi sul touchpad	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	13	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
4b82df15-2daf-4639-a943-56a9106b2a37	Porte USB danneggiate	Porte USB visibilmente danneggiate	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	14	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
1d13904f-d62e-440d-a6ad-54e706920b21	Adesivi residui	Residui di adesivi o etichette	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	15	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
1155731a-601a-4ba5-9b6f-ea5d073d6985	Case ammaccato	Ammaccature sul case/chassis	7c151c62-6ff0-47c7-a619-23323067b1e6	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
18e575c7-0aed-4ab1-93c6-6bfe42db082d	Pannello laterale graffiato	Graffi sul pannello laterale	7c151c62-6ff0-47c7-a619-23323067b1e6	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
0a9ed4ce-c756-42be-9309-8d0d6405b3b6	Ventole polverose	Accumulo di polvere visibile nelle ventole	7c151c62-6ff0-47c7-a619-23323067b1e6	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
6402ff45-2641-4914-abde-fef62757d427	LED non funzionanti	LED decorativi o di stato non funzionanti	7c151c62-6ff0-47c7-a619-23323067b1e6	t	13	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
17ffab27-8b90-4381-8f35-f7a235f63fff	Scocca ingiallita	Plastica ingiallita dal tempo	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
309ff86a-b559-42f2-bd7e-1c2ac89daaf4	Fessure polvere	Accumulo di polvere nelle fessure di ventilazione	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
42129570-5f98-4d76-aa7b-aeda49c5af36	Pulsante consumato	Pulsanti di accensione/espulsione consumati	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
c73ac743-0576-4d6a-b329-18e95a9d8dc6	Cornice graffiata	Graffi sulla cornice del televisore	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
6ed81aaf-60db-4fb5-8eba-13c205f9a53e	Piedistallo danneggiato	Danni al piedistallo/supporto	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
aa36d59b-c2e0-4970-9dd9-b6dafa9bacb5	Retro graffiato	Graffi sulla parte posteriore	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
5140ece0-7b65-45bd-b4a9-93d98e66871b	Cassa graffiata	Graffi sulla cassa dell'orologio	7b4db345-71b3-4332-8223-57c1f5df76f0	t	10	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
6ca0e34b-dd19-42c6-a3a3-bd0afe46f89c	Cinturino danneggiato	Cinturino usurato o danneggiato	7b4db345-71b3-4332-8223-57c1f5df76f0	t	11	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
f029e73d-f491-4a22-adcb-f3e456cfb1f0	Corona rigida	Corona/rotella digitale rigida o graffiata	7b4db345-71b3-4332-8223-57c1f5df76f0	t	12	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
9fd4f10b-e7e4-4453-b233-48cf13e285db	Sensori sporchi	Sensori posteriori con residui	7b4db345-71b3-4332-8223-57c1f5df76f0	t	13	2025-11-25 13:48:00.231417	2025-11-25 13:48:00.231417
\.


--
-- Data for Name: analytics_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.analytics_cache (id, key, data, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: b2b_return_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.b2b_return_items (id, return_id, order_item_id, product_id, product_name, product_sku, quantity, unit_price, total_price, reason, condition, condition_notes, restocked, restocked_at, restocked_quantity, created_at) FROM stdin;
\.


--
-- Data for Name: b2b_returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.b2b_returns (id, return_number, order_id, reseller_id, status, reason, reason_details, total_amount, credit_amount, tracking_number, carrier, requested_at, approved_at, rejected_at, shipped_at, received_at, completed_at, reseller_notes, admin_notes, rejection_reason, inspection_notes, created_at, updated_at, shipping_label_path, ddt_path, documents_generated_at) FROM stdin;
\.


--
-- Data for Name: billing_data; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.billing_data (id, user_id, company_name, vat_number, fiscal_code, address, city, zip_code, country, created_at, updated_at, customer_type, pec, codice_univoco, iban, google_place_id, has_autonomous_invoicing) FROM stdin;
e7743c04-9b2b-4868-906c-3d44d945d6f3	65d3739f-9ebd-4809-ba4e-b3f1d1c3a6c8	\N	\N	\N				IT	2026-02-05 21:10:38.031064	2026-02-05 21:10:38.031064	private	\N	\N	\N	\N	f
b63ca7cb-4599-49bb-9c0f-4848a5fe82b4	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	IMPLAN GROUP SRLS	IT07188110824	FRLGLI25P18Z999F	via gaetano daita 15	Palemo	90100	IT	2026-01-25 17:27:37.839769	2026-02-06 07:47:10.506	company	prova@pec.it			\N	f
\.


--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cart_items (id, cart_id, product_id, quantity, unit_price, total_price, discount, product_snapshot, created_at, updated_at) FROM stdin;
97d739a5-8dd1-424a-8a86-b20f41ba0b24	2d7354d3-61e0-4dd0-bf72-a6ead391a676	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	2	2	0	\N	2026-01-26 14:51:39.557083	2026-01-26 14:51:39.557083
b57359e3-ead3-491e-9bc5-47c80ab49a40	2d7354d3-61e0-4dd0-bf72-a6ead391a676	daf22961-9f49-4a27-9f06-2447185c9c26	1	1	1	0	\N	2026-01-26 14:51:31.736774	2026-01-26 14:51:31.736774
c70e3882-83fb-48b4-9b6a-f2c375d67494	a96165ba-ebd1-49f8-8836-532596e2ffda	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	3	3	9	0	\N	2026-01-29 12:59:39.16041	2026-02-01 18:23:33.936
0e1fdf30-9a9d-4fd1-9875-1647d9ccd48d	a96165ba-ebd1-49f8-8836-532596e2ffda	daf22961-9f49-4a27-9f06-2447185c9c26	1	5	5	0	\N	2026-02-02 20:30:18.508714	2026-02-02 20:30:18.508714
14f42b81-f13f-4a0f-ae01-2612f1130272	020d5fee-4884-4c18-918c-ccc0d4965a62	daf22961-9f49-4a27-9f06-2447185c9c26	1	5	5	0	\N	2026-02-02 20:42:58.543655	2026-02-02 20:42:58.543655
14aec9fc-3aa7-4535-b1e7-a5d8a2b0d69c	2455bbf6-114b-4da5-9b86-64ec1e66b950	daf22961-9f49-4a27-9f06-2447185c9c26	1	1	1	0	\N	2026-02-02 21:04:10.933176	2026-02-02 21:04:10.933176
3c4ac613-1ec4-4477-ae39-12322126e0c7	c89a60f2-dced-4865-af51-b10a6a3dd905	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	2	2	0	\N	2026-02-03 14:44:27.333765	2026-02-03 14:44:27.333765
72bb605a-795e-47b1-a51c-e7d62747cae5	e594602c-5527-40f2-8622-e7fc0c070a30	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	2	2	0	\N	2026-02-03 14:55:49.099188	2026-02-03 14:55:49.099188
3bffa1bb-517e-4c96-8058-ab6b55bb28f3	7e6a8822-8ffa-495f-8eec-b844112a5189	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	0	\N	2026-02-03 15:03:23.095989	2026-02-03 15:03:23.095989
0aa352fd-31dc-41b3-a0b1-f7a55c88d16e	dcddbf4b-06a2-4ebd-9610-603f1253ec46	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	0	\N	2026-02-03 15:11:18.365676	2026-02-03 18:47:12.907
396cc297-c44e-467e-b593-178a99205ace	3c7e294c-58f4-480e-a9d3-33532a6be06d	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	0	\N	2026-02-03 19:20:50.806641	2026-02-04 15:53:29.738
92eb87e6-ccc8-41ed-a672-86921c9a08dd	3c7e294c-58f4-480e-a9d3-33532a6be06d	daf22961-9f49-4a27-9f06-2447185c9c26	1	500	500	0	\N	2026-02-04 16:03:01.120806	2026-02-04 16:03:01.120806
43865186-1b16-4f81-a71e-bd05ddb63162	05fed81b-21d9-4e62-bef6-712710031c46	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	1	1200	1200	0	\N	2026-02-11 22:31:00.881145	2026-02-11 22:31:00.881145
a651e59d-dc8b-44a3-88cb-3b94589c6a98	ca5817e7-53e1-4d58-8706-02af3a9cd594	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	0	\N	2026-02-11 22:37:54.309269	2026-02-11 22:37:54.309269
527098a1-d9fa-4451-8777-ca9a9afb5c8d	ca5817e7-53e1-4d58-8706-02af3a9cd594	daf22961-9f49-4a27-9f06-2447185c9c26	1	500	500	0	\N	2026-02-11 22:54:45.919478	2026-02-11 22:54:45.919478
\.


--
-- Data for Name: carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.carts (id, customer_id, reseller_id, session_id, status, subtotal, discount, shipping_cost, total, coupon_code, notes, expires_at, created_at, updated_at) FROM stdin;
2455bbf6-114b-4da5-9b86-64ec1e66b950	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	278W92lQyWfOAFUrDtlxO8pOtBrpRgNU	active	1	0	0	1	\N	\N	2026-02-09 21:04:10.669	2026-02-02 21:04:10.705672	2026-02-02 21:04:11.278
020d5fee-4884-4c18-918c-ccc0d4965a62	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	5	0	0	5	\N	\N	2026-02-09 20:30:35.076	2026-02-02 20:30:35.109241	2026-02-02 21:05:18.081
2d7354d3-61e0-4dd0-bf72-a6ead391a676	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	0	0	0	0	\N	\N	2026-02-02 14:06:14.658	2026-01-26 14:06:14.692348	2026-01-26 15:43:12.908
eba37f45-644e-49c8-8377-9538abddc462	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	admin	\N	active	0	0	0	0	\N	\N	2026-02-10 14:44:23.945	2026-02-03 14:44:23.979083	2026-02-03 14:44:23.979083
217686e4-cd83-43e7-a23a-263f0e03836a	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	izT0MKbFQS5RMZyrYAu8myTIpPptWzt5	active	0	0	0	0	\N	\N	2026-02-02 14:55:41.198	2026-01-26 14:55:41.236266	2026-01-26 14:55:41.236266
047ab26a-0c1a-4257-9ca5-a71814740337	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	7TxRdCD9EfSQPwZaW6q4jFFcqyeT2XQw	active	0	0	0	0	\N	\N	2026-02-02 15:06:21.887	2026-01-26 15:06:21.922388	2026-01-26 15:06:21.922388
850433c3-74cf-4247-a1cd-bb7c9911dd6d	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	bZPDlVGyCb19j2nt-64PQ3-HVEBx8VEH	active	0	0	0	0	\N	\N	2026-02-02 16:04:39.424	2026-01-26 16:04:39.457919	2026-01-26 16:04:39.457919
551b4cc2-4429-411c-877b-c2bae246dec4	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	1	0	0	1	\N	\N	2026-02-02 15:43:13.701	2026-01-26 15:43:13.735536	2026-01-26 16:14:27.095
c89a60f2-dced-4865-af51-b10a6a3dd905	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	2	0	0	2	\N	\N	2026-02-10 14:44:26.933	2026-02-03 14:44:26.966047	2026-02-03 14:52:09.362
05fed81b-21d9-4e62-bef6-712710031c46	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	McJ3t4-Wtx7Pe4jy6_UW3o-gI14YiQGN	active	1200	0	0	1200	\N	\N	2026-02-18 22:31:00.601	2026-02-11 22:31:00.635843	2026-02-11 22:31:01.228
e594602c-5527-40f2-8622-e7fc0c070a30	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	2	0	0	2	\N	\N	2026-02-10 14:52:09.962	2026-02-03 14:52:09.996536	2026-02-03 14:56:07.066
4cd8d11f-5250-4509-b9d8-4a467e116687	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	SlW9FyUihK8vEVZSjJax8KCSljXpSAtm	active	0	0	0	0	\N	\N	2026-02-10 15:05:30.164	2026-02-03 15:05:30.198928	2026-02-03 15:05:30.198928
7e6a8822-8ffa-495f-8eec-b844112a5189	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	200	0	0	200	\N	\N	2026-02-10 14:56:07.685	2026-02-03 14:56:07.719751	2026-02-03 15:11:08.945
ca5817e7-53e1-4d58-8706-02af3a9cd594	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	active	700	0	0	700	\N	\N	2026-02-11 16:11:05.052	2026-02-04 16:11:05.084268	2026-02-11 22:54:46.266
a96165ba-ebd1-49f8-8836-532596e2ffda	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	14	0	0	14	\N	\N	2026-02-02 16:14:28.033	2026-01-26 16:14:28.068045	2026-02-02 20:30:34.403
dcddbf4b-06a2-4ebd-9610-603f1253ec46	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	200	0	0	200	\N	\N	2026-02-10 15:11:09.537	2026-02-03 15:11:09.570526	2026-02-03 18:48:43.011
3c7e294c-58f4-480e-a9d3-33532a6be06d	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	converted	700	0	0	700	\N	\N	2026-02-10 18:48:43.629	2026-02-03 18:48:43.662653	2026-02-04 16:11:04.423
\.


--
-- Data for Name: chat_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.chat_messages (id, sender_id, receiver_id, message, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: customer_addresses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_addresses (id, customer_id, reseller_id, label, recipient_name, phone, address, city, province, postal_code, country, is_default, is_billing, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_branches; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_branches (id, parent_customer_id, branch_code, branch_name, address, city, province, postal_code, contact_name, contact_phone, contact_email, notes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: customer_relationships; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_relationships (id, customer_id, related_customer_id, relationship_type, notes, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: customer_repair_centers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.customer_repair_centers (id, customer_id, repair_center_id, created_at) FROM stdin;
\.


--
-- Data for Name: damaged_component_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.damaged_component_types (id, name, description, device_type_id, is_active, sort_order, created_at, updated_at) FROM stdin;
dct-display-glass	Vetro display	\N	\N	t	1	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-display-lcd	Pannello LCD	\N	\N	t	2	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-display-oled	Pannello OLED	\N	\N	t	3	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-display-digitizer	Digitalizzatore touch	\N	\N	t	4	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-display-frame	Cornice display	\N	\N	t	5	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-display-backlight	Retroilluminazione	\N	\N	t	6	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-battery-cell	Cella batteria	\N	\N	t	10	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-battery-connector	Connettore batteria	\N	\N	t	11	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-battery-flex	Flex batteria	\N	\N	t	12	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-charge-port	Porta di ricarica	\N	\N	t	20	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-charge-flex	Flex ricarica	\N	\N	t	21	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-charge-ic	IC ricarica	\N	\N	t	22	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-charge-coil	Bobina ricarica wireless	\N	\N	t	23	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-speaker-ear	Altoparlante auricolare	\N	\N	t	30	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-speaker-main	Altoparlante principale	\N	\N	t	31	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-mic-main	Microfono principale	\N	\N	t	32	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-mic-secondary	Microfono secondario	\N	\N	t	33	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-audio-jack	Jack audio	\N	\N	t	34	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cam-rear-main	Fotocamera posteriore principale	\N	\N	t	40	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cam-rear-wide	Fotocamera grandangolare	\N	\N	t	41	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cam-rear-tele	Fotocamera teleobiettivo	\N	\N	t	42	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cam-front	Fotocamera anteriore	\N	\N	t	43	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cam-flash	Modulo flash	\N	\N	t	44	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cam-lens-cover	Copertura lente	\N	\N	t	45	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-btn-power	Pulsante accensione	\N	\N	t	50	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-btn-volume-up	Pulsante volume su	\N	\N	t	51	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-btn-volume-down	Pulsante volume giù	\N	\N	t	52	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-btn-home	Tasto Home	\N	\N	t	53	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-btn-mute	Interruttore silenzioso	\N	\N	t	54	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-btn-flex	Flex pulsanti	\N	\N	t	55	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-wifi-antenna	Antenna WiFi	\N	\N	t	60	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-bluetooth-module	Modulo Bluetooth	\N	\N	t	61	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-cellular-antenna	Antenna cellulare	\N	\N	t	62	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-gps-antenna	Antenna GPS	\N	\N	t	63	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-nfc-antenna	Antenna NFC	\N	\N	t	64	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sim-tray	Carrello SIM	\N	\N	t	65	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sim-reader	Lettore SIM	\N	\N	t	66	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-prox	Sensore prossimità	\N	\N	t	70	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-ambient	Sensore luce ambientale	\N	\N	t	71	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-accel	Accelerometro	\N	\N	t	72	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-gyro	Giroscopio	\N	\N	t	73	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-compass	Bussola/Magnetometro	\N	\N	t	74	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-baro	Barometro	\N	\N	t	75	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-face-id	Sensore Face ID	\N	\N	t	76	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-sensor-touch-id	Sensore Touch ID	\N	\N	t	77	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-logic-board	Scheda madre/Logic board	\N	\N	t	80	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-logic-cpu	CPU/Processore	\N	\N	t	81	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-logic-ram	RAM	\N	\N	t	82	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-logic-storage	Storage/NAND	\N	\N	t	83	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-logic-power-ic	IC gestione alimentazione	\N	\N	t	84	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-logic-audio-ic	IC audio	\N	\N	t	85	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-frame-back	Scocca posteriore	\N	\N	t	90	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-frame-mid	Frame centrale	\N	\N	t	91	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-frame-sim-slot	Slot SIM/SD	\N	\N	t	92	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-frame-screws	Viti	\N	\N	t	93	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-frame-adhesive	Adesivo/Guarnizioni	\N	\N	t	94	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
dct-other	Altro componente (specificare)	\N	\N	t	999	2025-11-25 14:03:54.48475	2025-11-25 14:03:54.48475
4ff609d1-893a-4631-8ff1-434638a0f8b0	Display LCD/OLED	Pannello display completo (LCD o OLED)	\N	t	1	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
0566be12-da01-4759-94e3-53fffed62227	Vetro touch/digitizer	Vetro touch screen / digitizer	\N	t	2	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
077318f1-f619-4762-9470-857289a1da10	Batteria	Batteria interna del dispositivo	\N	t	3	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
10829538-959c-4c4c-b836-4bbcbd985d9e	Connettore di ricarica	Porta di ricarica (Lightning, USB-C, Micro USB)	\N	t	4	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
9922fc92-a9b3-4e2f-b268-7fb5844e71a5	Altoparlante principale	Altoparlante per chiamate e media	\N	t	5	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
a4f703a4-5f37-42e7-b4c8-7aae1b2f17ce	Altoparlante auricolare	Altoparlante superiore per le chiamate	\N	t	6	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
9f78d500-59c8-4020-ac1e-74ac44c4926a	Microfono	Microfono principale del dispositivo	\N	t	7	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
5da9024b-da24-4b91-8818-a6f24db0c36d	Microfono secondario	Microfono secondario per cancellazione rumore	\N	t	8	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
74d293b7-863c-4676-a659-ab1c4176c211	Fotocamera posteriore	Modulo fotocamera posteriore	\N	t	9	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
e055b22f-1894-4ff7-8b8a-5d30a908fa2e	Fotocamera anteriore	Modulo fotocamera frontale/selfie	\N	t	10	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
87723d15-11dd-4cce-a4b5-6db56ad5baf8	Scheda madre (motherboard)	Scheda logica principale del dispositivo	\N	t	11	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
5137ab0a-4af5-453b-9936-8d4e3d7ff3ff	Chip di ricarica (IC)	Circuito integrato di gestione ricarica	\N	t	12	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
9217a6ab-24d5-4221-aad3-5c465eb59d30	Sensore di prossimità	Sensore di prossimità e luminosità	\N	t	13	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
20734bab-9945-4572-a1f5-535d4bf66940	Sensore Face ID / IR	Modulo sensore Face ID o sensore infrarossi	\N	t	14	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
cec100a2-b476-4846-b5d0-9e9dc7effdc6	Tasto Home / Touch ID	Pulsante Home con sensore Touch ID	\N	t	15	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
09ba6483-4935-487a-b756-c653eb3343f1	Tasto accensione/spegnimento	Pulsante power del dispositivo	\N	t	16	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
9ef35847-dc12-4e53-ae01-521e08958037	Tasti volume	Pulsanti regolazione volume	\N	t	17	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
145cf4ab-e40a-4065-82d0-2a9ce2a67d5a	Motorino vibrazione (Taptic Engine)	Motore per la vibrazione e feedback aptico	\N	t	18	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
a2380a45-3e10-4cfb-94b4-319d2a3c5d73	Antenna WiFi	Antenna per connessione WiFi	\N	t	19	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
5311eb38-336d-457a-9c91-6e5f3bd5c9eb	Antenna Bluetooth	Antenna per connessione Bluetooth	\N	t	20	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
75001626-dc4d-4f01-8787-0a04c40155dd	Antenna cellulare	Antenna per rete mobile/cellulare	\N	t	21	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
228b1e7e-8eb8-4659-9d48-ab666ad70774	Antenna GPS	Antenna per localizzazione GPS	\N	t	22	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
d3b9c649-01b1-454f-bccd-c1508ab261e6	Modulo NFC	Chip NFC per pagamenti contactless	\N	t	23	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
3303581b-36d9-4573-b704-b8c5b1d8dc48	Jack audio 3.5mm	Porta jack cuffie	\N	t	24	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
203bbbd5-9f0f-474c-9f27-253835eed80c	Flat/Cavo flex display	Cavo flessibile di connessione display	\N	t	25	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
5de6847e-bba8-437e-a4c1-9f634bbf33c5	Flat/Cavo flex fotocamera	Cavo flessibile per fotocamera	\N	t	26	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
18d6aa87-f56b-4a5a-a99c-a72dd3cd4859	Scocca posteriore (back cover)	Cover posteriore del dispositivo	\N	t	27	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
f46978d2-b29d-4147-b9db-259e9968f4a2	Cornice/Frame centrale	Struttura centrale del telaio	\N	t	28	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
962d5e21-04ac-4cc0-904f-df5578c8375f	Vassoi SIM	Slot per scheda SIM	\N	t	29	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
a3999abe-cf7d-46ac-bd5b-d35e34bf39e1	Vetro fotocamera	Lente protettiva fotocamera posteriore	\N	t	30	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
d45eec01-f0df-4498-88c0-6f11b81a33a3	Guarnizioni impermeabilità	Guarnizioni per la resistenza all'acqua	\N	t	31	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
eaed6d11-b888-4106-98aa-e77ec24cc820	Dissipatore termico	Sistema di dissipazione del calore	\N	t	32	2026-02-20 14:34:32.299667	2026-02-20 14:34:32.299667
\.


--
-- Data for Name: dashboard_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.dashboard_preferences (id, user_id, role, layout, created_at, updated_at) FROM stdin;
acd39d55-7652-4412-bff2-7edd3e8b1c4a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	reseller	{"widgets": [{"id": "urgent-actions", "order": 1, "visible": false}, {"id": "stats-users", "order": 2, "visible": false}, {"id": "stats-repairs", "order": 3, "visible": false}, {"id": "stats-inventory", "order": 4, "visible": true}, {"id": "stats-invoices", "order": 5, "visible": true}, {"id": "stats-tickets", "order": 6, "visible": true}, {"id": "stats-b2b-orders", "order": 7, "visible": true}, {"id": "stats-pos", "order": 8, "visible": true}, {"id": "stats-network", "order": 9, "visible": true}, {"id": "activity-sales", "order": 10, "visible": false}, {"id": "management-quick-actions", "order": 11, "visible": true}, {"id": "activity-repairs", "order": 12, "visible": false}, {"id": "activity-recent-repairs", "order": 13, "visible": false}, {"id": "chart-repairs-status", "order": 14, "visible": true}, {"id": "chart-work-status", "order": 15, "visible": true}]}	2026-01-28 17:47:40.495262	2026-01-28 17:48:00.574
\.


--
-- Data for Name: data_recovery_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_recovery_events (id, data_recovery_job_id, event_type, title, description, metadata, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: data_recovery_jobs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.data_recovery_jobs (id, job_number, parent_repair_order_id, diagnosis_id, trigger_type, handling_type, status, device_description, assigned_to_user_id, assigned_to_group_id, external_lab_id, external_lab_job_ref, shipping_document_url, shipping_label_url, tracking_number, tracking_carrier, shipped_at, received_at_lab_at, recovery_outcome, recovered_data_description, recovered_data_size, recovered_data_media_type, estimated_cost, final_cost, internal_notes, customer_notes, created_by, created_at, updated_at, completed_at) FROM stdin;
\.


--
-- Data for Name: delivery_appointments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.delivery_appointments (id, repair_order_id, repair_center_id, reseller_id, customer_id, date, start_time, end_time, status, notes, confirmed_by, confirmed_at, cancelled_by, cancelled_at, cancel_reason, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: device_brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_brands (id, name, logo_url, is_active, created_at, updated_at) FROM stdin;
ad777972-7eba-47f8-a471-c41659da0514	Apple	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	Samsung	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
9058ab00-9307-4371-8930-8a822cc7082e	Huawei	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
7937fb6e-7866-45c2-b8a2-13963a0408eb	Xiaomi	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
c939d4bd-c11e-42a2-b7d3-29ac6d77c336	OnePlus	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
c9d61691-fe87-4617-9a0c-829dea058770	Google	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
cbe016ed-2862-495f-9b8d-1c1db1341548	Sony	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
050177fa-4bd0-4724-b0d7-c9de54932cd9	LG	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
de941763-a469-42e1-8709-fbbc71444668	Asus	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
f8bba6d5-02e1-467d-a5cc-681dabe77e89	Lenovo	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	HP	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
79127b7e-4b20-47a9-99b2-c06bd6ac37ff	Dell	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
e918ff0b-5d39-483d-a905-0e353d1dba8a	Acer	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
b3fc3d98-679d-4748-a37a-02852f6c31d3	Microsoft	\N	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
d1d59d85-50f3-4e4f-994b-10d7703dd66f	Prova	\N	t	2025-12-23 22:51:03.610651	2025-12-23 22:51:03.610651
5c5ebccc-71cd-44de-b8be-37af1b92a515	Motorola	\N	t	2026-01-27 13:13:00.35042	2026-01-27 13:13:00.35042
f31d071e-c5d7-4562-a4b0-21e1292e5484	ZTE	\N	t	2026-01-27 13:13:48.935255	2026-01-27 13:13:48.935255
d571bd0b-5d65-4770-8381-8f2c1d612302	vivo	\N	t	2026-01-27 13:20:14.099652	2026-01-27 13:20:14.099652
160062cd-5316-43cf-96de-69c595f6403a	realme	\N	t	2026-01-27 13:20:30.462956	2026-01-27 13:20:30.462956
ee33f1e3-c363-416d-a216-51e1ea12362c	OPPO	\N	t	2026-01-27 13:20:50.731743	2026-01-27 13:20:50.731743
\.


--
-- Data for Name: device_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_models (id, model_name, brand, device_class, market_code, photo_url, created_at, brand_id, type_id, is_active, updated_at, reseller_id, market_codes) FROM stdin;
9ac94c2d-b46f-4320-80f2-5b66986b5342	MacBook Air M2	Apple	Laptop	\N	\N	2025-11-25 00:13:13.761317	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 00:13:13.761317	\N	\N
7b40e800-f049-4535-9681-913b25ab4f2e	MacBook Pro 14"	Apple	Laptop	\N	\N	2025-11-25 00:13:13.835077	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 00:13:13.835077	\N	\N
516b2996-ff32-48c5-8fac-97255fec7511	XPS 13	Dell	Laptop	\N	\N	2025-11-25 00:13:13.908802	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 00:13:13.908802	\N	\N
a49697ca-4f3c-4fe8-887d-71c23a38b5ea	iPad Pro 12.9"	Apple	Tablet	\N	\N	2025-11-25 00:13:13.982611	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 00:13:13.982611	\N	\N
8c3fb360-2e50-4e5c-bfc1-a7b9ad7fecb4	iPad Air	Apple	Tablet	\N	\N	2025-11-25 00:13:14.057163	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 00:13:14.057163	\N	\N
5b6fbe80-a6b6-400c-8057-cf7afa16acc5	Galaxy Tab S9	Samsung	Tablet	\N	\N	2025-11-25 00:13:14.130995	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 00:13:14.130995	\N	\N
80c63f7b-0c77-4c27-9560-3917480bc73f	iPhone SE (2022)	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:12.128888	\N	\N
59f9eb52-ffca-445c-917b-2f53d75777c4	iPhone SE (2020)	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:12.128888	\N	\N
3e96017b-f7f9-442c-b674-64c86b079833	iPhone 8	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:12.128888	\N	\N
59624efd-2e90-4125-a5d4-b4cc55e1c697	iPhone 8 Plus	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:12.128888	\N	\N
309b81d2-3292-4ad9-9f7e-7acfc907bbad	Galaxy S23	Samsung	Smartphone	\N	\N	2025-11-25 00:13:13.6867	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.647	\N	{SM-S911B}
88ffb2f6-b702-4e40-89a9-3649b09c1088	Galaxy S23+	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.793	\N	{SM-S916B}
73fca812-ec7e-478e-bb95-86f170223f22	Galaxy S24	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.081	\N	{SM-S921B}
a1fdc414-5bbb-4ff5-99f2-824f60075971	Galaxy S24+	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.226	\N	{SM-S926B}
22c62f1f-3548-425f-9a88-4dd638908bf9	Galaxy S24 Ultra	Samsung	Smartphone	\N	\N	2025-11-25 00:13:13.611521	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.371	\N	{SM-S928B}
c05fc0a4-8f81-4963-b7b1-5dc3a66ec678	iPhone X	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:44.175	\N	{A1865,A1901,A1902}
36de00c3-cf0b-4a50-a52f-5e7f3d37e8e1	Galaxy S21	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
b134a1f9-193b-4fbb-a585-c79fe50a64b2	Galaxy S21+	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
8cf0398b-c72c-4530-89f3-c19f3394738d	Galaxy S21 Ultra	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
0b3d2006-30aa-45d8-9769-9b3d496a165b	Galaxy S21 FE	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
8e1b924f-4749-4f48-8266-fc02b8d1e3f2	Galaxy S20 Ultra	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
aa9f0b56-acf4-448d-929a-1b54ec4f1727	Galaxy A54	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
6ca81f76-d503-480a-bdf9-f317d7d85a4a	Galaxy A34	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
d2a81161-3837-443f-be5e-3b10b5ab0457	Galaxy A53	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
1a56eaa9-bd24-46c4-8461-98ff526af72f	Galaxy A33	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
3373d680-f455-4efd-946c-977b11d07e9d	Galaxy Note 20 Ultra	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:23:34.003245	\N	\N
f047718d-5140-4ffd-98c7-9a56c9166b81	Xiaomi 14	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
61007403-06a3-435c-831f-de4d17b04bd7	Xiaomi 14 Pro	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
c4f90097-2ff1-4225-9b7d-2a311124447a	Xiaomi 13	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
78615061-6685-4df0-8d04-d8745102c25a	Xiaomi 13 Pro	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
51dca992-3436-4110-b5ae-9ee91ff32aa1	Xiaomi 12	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
d66d2095-fceb-435f-b80a-be2690cbd9df	Redmi Note 13 Pro	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
5cb4127a-a91a-47fc-b931-a8559e9447b9	Redmi Note 12 Pro	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
7f6863d1-47c0-49db-bd5f-3931f1e1ddbe	Redmi Note 11	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
a0bdbe02-019b-43aa-b069-1c08041a633a	POCO F5	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
fc2ffac2-5963-40c8-a905-5e0388caa497	POCO X5 Pro	Xiaomi	Smartphone	\N	\N	2025-11-25 13:24:01.53726	7937fb6e-7866-45c2-b8a2-13963a0408eb	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
2f5019b9-8bdc-416c-84bf-f2ec521be673	Huawei P60 Pro	Huawei	Smartphone	\N	\N	2025-11-25 13:24:01.53726	9058ab00-9307-4371-8930-8a822cc7082e	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
a2d3a3a6-b8b0-46cb-9a32-0474187d2a64	Huawei P50 Pro	Huawei	Smartphone	\N	\N	2025-11-25 13:24:01.53726	9058ab00-9307-4371-8930-8a822cc7082e	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
78300031-1089-4e03-82ff-798b3405385c	Huawei P40 Pro	Huawei	Smartphone	\N	\N	2025-11-25 13:24:01.53726	9058ab00-9307-4371-8930-8a822cc7082e	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
32bf4abb-ab86-4558-b34d-ae149d1bfd53	Huawei Mate 60 Pro	Huawei	Smartphone	\N	\N	2025-11-25 13:24:01.53726	9058ab00-9307-4371-8930-8a822cc7082e	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
9d1f6e9b-a062-4685-b859-26ac842c010f	Huawei Mate 50 Pro	Huawei	Smartphone	\N	\N	2025-11-25 13:24:01.53726	9058ab00-9307-4371-8930-8a822cc7082e	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
5b3ba579-d70c-48d3-a286-d2e39ec0813d	Huawei Nova 11	Huawei	Smartphone	\N	\N	2025-11-25 13:24:01.53726	9058ab00-9307-4371-8930-8a822cc7082e	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
f1f3cca3-80f6-4bc9-9d0d-31b5931a1d43	OnePlus 12	OnePlus	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c939d4bd-c11e-42a2-b7d3-29ac6d77c336	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
3c9188e4-ac38-4683-8199-3c9fd572e7d3	OnePlus 11	OnePlus	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c939d4bd-c11e-42a2-b7d3-29ac6d77c336	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
3b591f00-94a3-47b1-961c-08032f255bfa	Galaxy Z Fold5	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.602	\N	{SM-F946B}
2a0efbac-448a-4aa6-96f7-b733c1a5b133	Galaxy Z Flip4	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.471	\N	{SM-F721B}
048f6541-a022-41f4-b630-a621a0305108	Galaxy Z Flip5	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.614	\N	{SM-F731B}
8aaf396b-791a-4cde-880c-c4705c704f6e	Galaxy S20+	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.344	\N	{SM-G985F}
2961db1c-77c6-4ac3-8566-09bf252f1251	Galaxy S22+	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.358	\N	{SM-S906B}
edc472dd-aca5-4e56-becb-9f5de266b958	Galaxy S22 Ultra	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.502	\N	{SM-S908B}
f06c2748-0712-44b2-b184-170861a001d7	Galaxy S20 FE	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.95	\N	{SM-G780F}
a9285d23-ac09-424f-8dd9-7b196a8b495a	Galaxy A14	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:24.544	\N	{SM-A145F}
0892df04-7137-4880-b5af-98385b0cfbe0	OnePlus 10 Pro	OnePlus	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c939d4bd-c11e-42a2-b7d3-29ac6d77c336	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
e3a0c7e4-8f3b-4085-850b-21bcd47dcf98	OnePlus Nord 3	OnePlus	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c939d4bd-c11e-42a2-b7d3-29ac6d77c336	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
790812d6-ca1c-47f7-abf2-904fc9e3880c	OnePlus Nord CE 3	OnePlus	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c939d4bd-c11e-42a2-b7d3-29ac6d77c336	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
e8ffaa65-322c-4333-bff7-425be642707f	Pixel 8 Pro	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
4991eee7-30e3-4cc7-a82f-d7e05d29b8e8	Pixel 8	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
7e1c518c-1f27-4f17-9b77-8f8a3feb623c	Pixel 7 Pro	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
e8d7d42b-46f2-422c-8f67-7930a0ef416d	Pixel 7	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
e2fb7365-6a20-4f21-a6a9-09f7956b6510	Pixel 7a	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
70186b5a-f1dc-4fa6-93d3-311006f2d677	Pixel 6 Pro	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
f7ff1902-0dbe-4200-8d9c-a1270e885470	Pixel 6	Google	Smartphone	\N	\N	2025-11-25 13:24:01.53726	c9d61691-fe87-4617-9a0c-829dea058770	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-11-25 13:24:01.53726	\N	\N
7d6d5b60-d44e-4c36-91f9-c707969fc977	iPad Pro 12.9" (2024)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
8353291d-f0bf-477e-9b18-d88f058b3fca	iPad Pro 11" (2024)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
0db07162-30ff-403b-b362-c8edffbfc5e3	iPad Pro 12.9" (2022)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
554fdfd7-3a5c-4dd6-843a-5fc7d718c99f	iPad Pro 11" (2022)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
8ec1e3b2-554b-43e1-8de6-565453479591	iPad Air (2024)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
028d9829-c0ca-4d73-9d88-f3bf40aca4bb	iPad Air (2022)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
c4237d69-0f20-4cb1-a09f-4f562653d744	iPad (10th gen)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
23e2577e-71ad-43d2-8e53-ef3a89cc9337	iPad (9th gen)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
a22aa253-045f-4ae5-8905-5c3bdb4523c3	iPad mini (6th gen)	Apple	Tablet	\N	\N	2025-11-25 13:24:35.802385	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
c098d3a4-e25d-42e3-872d-fbf4c668b0cc	Galaxy Tab S9 Ultra	Samsung	Tablet	\N	\N	2025-11-25 13:24:35.802385	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
1dfab5ed-f560-4f21-976c-cce065b50ae4	Galaxy Tab S9+	Samsung	Tablet	\N	\N	2025-11-25 13:24:35.802385	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
e70e9cab-e350-41fc-b5b4-747d7499210f	Galaxy Tab S8 Ultra	Samsung	Tablet	\N	\N	2025-11-25 13:24:35.802385	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
daa8fc9e-9d5c-458d-bb32-9668da83d59b	Galaxy Tab S8+	Samsung	Tablet	\N	\N	2025-11-25 13:24:35.802385	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
33a852b7-5a87-44ba-a2b7-172360a14c4f	Galaxy Tab S8	Samsung	Tablet	\N	\N	2025-11-25 13:24:35.802385	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
5d026b70-ef46-4a7c-89a4-64adf5ec7273	Galaxy Tab A8	Samsung	Tablet	\N	\N	2025-11-25 13:24:35.802385	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
2fd32ece-4b53-4084-89c9-bad0a21ca128	Pad 6	Xiaomi	Tablet	\N	\N	2025-11-25 13:24:35.802385	7937fb6e-7866-45c2-b8a2-13963a0408eb	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
10a2cd7e-4f18-40ee-aff5-bc8dab7f1d10	Pad 5	Xiaomi	Tablet	\N	\N	2025-11-25 13:24:35.802385	7937fb6e-7866-45c2-b8a2-13963a0408eb	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
0d970f31-08d4-4cff-ba36-3f08493be911	MatePad Pro	Huawei	Tablet	\N	\N	2025-11-25 13:24:35.802385	9058ab00-9307-4371-8930-8a822cc7082e	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
8d1430eb-2fdb-4c84-869a-466a6842c9ba	MatePad 11	Huawei	Tablet	\N	\N	2025-11-25 13:24:35.802385	9058ab00-9307-4371-8930-8a822cc7082e	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
e8681bd9-d4bf-4492-9fd3-d2b5306d2e8a	Surface Pro 9	Microsoft	Tablet	\N	\N	2025-11-25 13:24:35.802385	b3fc3d98-679d-4748-a37a-02852f6c31d3	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
45f326f3-710a-468d-bd17-55b6a0f4cca7	Surface Go 3	Microsoft	Tablet	\N	\N	2025-11-25 13:24:35.802385	b3fc3d98-679d-4748-a37a-02852f6c31d3	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
3cd70bc5-3fe9-4c32-9a4a-652c091263c4	Tab P12 Pro	Lenovo	Tablet	\N	\N	2025-11-25 13:24:35.802385	f8bba6d5-02e1-467d-a5cc-681dabe77e89	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
c49c96ab-8ca9-4096-940a-f7bcb431756b	Tab P11 Pro	Lenovo	Tablet	\N	\N	2025-11-25 13:24:35.802385	f8bba6d5-02e1-467d-a5cc-681dabe77e89	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2025-11-25 13:24:35.802385	\N	\N
54587099-2866-417f-9ae8-112e4eca1366	MacBook Air M3 15"	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
17fba2ae-f095-4b5a-8905-5ef2bebd0a6c	MacBook Air M3 13"	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
11799895-298a-46cd-ab1c-68b11592006e	MacBook Air M2 15"	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
4e40e275-9a3d-4a31-9c78-ec627bc47cbf	MacBook Air M2 13"	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
7b66e3e7-4a3a-478a-a052-7500d6b01da1	MacBook Air M1	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
8275cd84-2982-42ea-871b-0c6245c48640	MacBook Pro 16" M3 Pro	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
b8bf5884-e733-43ab-9d79-0f5fabea58f0	MacBook Pro 16" M3 Max	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
71b23270-6ecc-4636-ba17-ed1d753ddd4a	MacBook Pro 14" M3 Pro	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
79e80377-8d26-4fb1-8348-8346433c34bb	MacBook Pro 14" M3	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
5d19ddb2-9711-47e6-a16e-0ede756b915e	MacBook Pro 13" M2	Apple	Laptop	\N	\N	2025-11-25 13:25:06.048472	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
375ec08e-aac3-40c7-baee-930e8930b30d	ThinkPad X1 Carbon Gen 11	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
2952f350-3d09-41c9-9c16-dcc17c8a4ae3	ThinkPad X1 Yoga Gen 8	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
4835ab8a-4fb5-4e2f-86c2-e089d06e2f48	ThinkPad T14 Gen 4	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
b5e6492b-feb1-4235-83e8-1f9a3639c496	ThinkPad E14 Gen 5	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
66b9388b-dc98-46d0-8f38-07ac5710787d	IdeaPad Slim 5	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
3f3b96ef-c001-4d6b-80be-a734c91a11ea	Legion Pro 5	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
4bc1a9a5-87ad-40af-8fe8-7c5eb05b2f63	Yoga 9i	Lenovo	Laptop	\N	\N	2025-11-25 13:25:06.048472	f8bba6d5-02e1-467d-a5cc-681dabe77e89	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
91770d7e-7f90-4e46-a4fc-cf0f8ca86dfb	Spectre x360 14	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
0de5d018-8021-4046-b7d0-3a709ec4c360	Spectre x360 16	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
21792d0f-4098-4ed7-ab78-923fcaeef1e6	Envy x360 15	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
6a39382f-13f2-493c-8465-87b61396d7c7	EliteBook 840 G10	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
618ab376-a411-4db0-94b1-fda22ebbac76	ProBook 450 G10	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
ec4ca59b-c26f-4459-8c85-b0ee0f8083fc	Pavilion 15	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
5589439a-e6ae-49a3-a783-805e60e4a97d	OMEN 16	HP	Laptop	\N	\N	2025-11-25 13:25:06.048472	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
109a0b65-82c4-4c5b-8acb-d43a59250de6	XPS 15 (2024)	Dell	Laptop	\N	\N	2025-11-25 13:25:06.048472	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
505a068c-599c-49c0-8c45-c5f7f0b1efe1	XPS 13 Plus	Dell	Laptop	\N	\N	2025-11-25 13:25:06.048472	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
db9507a6-b566-4990-9643-29210f5674d1	Latitude 7440	Dell	Laptop	\N	\N	2025-11-25 13:25:06.048472	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
5604ba87-506b-430c-916e-51e2fddb8c0e	Latitude 5540	Dell	Laptop	\N	\N	2025-11-25 13:25:06.048472	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
5e8eaa14-9c3c-48c8-a082-b39e4477edbd	Inspiron 16 Plus	Dell	Laptop	\N	\N	2025-11-25 13:25:06.048472	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
f7051db9-6c40-491d-93f5-a1f61671260e	Alienware m16	Dell	Laptop	\N	\N	2025-11-25 13:25:06.048472	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:06.048472	\N	\N
45989e70-a533-47c6-918f-de9e968923bb	ZenBook 14 OLED	Asus	Laptop	\N	\N	2025-11-25 13:25:21.905565	de941763-a469-42e1-8709-fbbc71444668	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
8c1540b6-21ab-458f-941c-9c03209ae5a1	ZenBook Pro 16X	Asus	Laptop	\N	\N	2025-11-25 13:25:21.905565	de941763-a469-42e1-8709-fbbc71444668	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
ae46be0a-26c8-4877-8310-62a581c56e36	VivoBook S15	Asus	Laptop	\N	\N	2025-11-25 13:25:21.905565	de941763-a469-42e1-8709-fbbc71444668	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
3399e6dd-ee27-4b8b-b4e2-f586b4e0c377	ROG Zephyrus G14	Asus	Laptop	\N	\N	2025-11-25 13:25:21.905565	de941763-a469-42e1-8709-fbbc71444668	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
24acaace-39fc-4452-aac2-ed909183118d	ROG Strix G16	Asus	Laptop	\N	\N	2025-11-25 13:25:21.905565	de941763-a469-42e1-8709-fbbc71444668	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
bdb0f568-f9e3-4b08-8371-8c46a88c96ef	TUF Gaming A15	Asus	Laptop	\N	\N	2025-11-25 13:25:21.905565	de941763-a469-42e1-8709-fbbc71444668	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
7b0d87fc-3ce7-407d-8453-20ddf377855d	Swift X 14	Acer	Laptop	\N	\N	2025-11-25 13:25:21.905565	e918ff0b-5d39-483d-a905-0e353d1dba8a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
9d470787-fedd-4381-8f88-f630855dd620	Swift Go 14	Acer	Laptop	\N	\N	2025-11-25 13:25:21.905565	e918ff0b-5d39-483d-a905-0e353d1dba8a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
e2c3699f-4102-48e3-b126-d6e2a32b0919	Aspire 5	Acer	Laptop	\N	\N	2025-11-25 13:25:21.905565	e918ff0b-5d39-483d-a905-0e353d1dba8a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
66894bc3-aeeb-4ca2-9961-c09720641613	Nitro 5	Acer	Laptop	\N	\N	2025-11-25 13:25:21.905565	e918ff0b-5d39-483d-a905-0e353d1dba8a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
f51dfb23-08f1-4592-adce-66218acd6a46	Predator Helios Neo 16	Acer	Laptop	\N	\N	2025-11-25 13:25:21.905565	e918ff0b-5d39-483d-a905-0e353d1dba8a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
7ce22923-ae4c-4199-906b-16c4a24ce742	Surface Laptop 5	Microsoft	Laptop	\N	\N	2025-11-25 13:25:21.905565	b3fc3d98-679d-4748-a37a-02852f6c31d3	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
9f826751-5081-4c52-a727-138b5762635b	Surface Laptop Studio 2	Microsoft	Laptop	\N	\N	2025-11-25 13:25:21.905565	b3fc3d98-679d-4748-a37a-02852f6c31d3	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
dc871252-e0db-4448-922d-8e5ace45e7df	MateBook X Pro	Huawei	Laptop	\N	\N	2025-11-25 13:25:21.905565	9058ab00-9307-4371-8930-8a822cc7082e	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
5762df2f-a62a-449f-b303-2df2f23bc3a4	MateBook 14s	Huawei	Laptop	\N	\N	2025-11-25 13:25:21.905565	9058ab00-9307-4371-8930-8a822cc7082e	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
8f10b764-93e0-4984-a2ca-b61237db4954	Galaxy Book3 Pro	Samsung	Laptop	\N	\N	2025-11-25 13:25:21.905565	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
2e072dd3-67ad-46c4-8e01-87d9a874750c	Galaxy Book3 Ultra	Samsung	Laptop	\N	\N	2025-11-25 13:25:21.905565	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
6770fd08-810c-4de0-bf20-8bddd1a2a6c7	Galaxy Book3 360	Samsung	Laptop	\N	\N	2025-11-25 13:25:21.905565	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2025-11-25 13:25:21.905565	\N	\N
5c98a0dc-756f-460a-b664-91925230ea59	iMac 24" M3	Apple	Desktop	\N	\N	2025-11-25 13:25:56.349439	ad777972-7eba-47f8-a471-c41659da0514	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
9e54424e-0887-4d82-a975-1d9a9e978ce7	Mac Studio M2 Max	Apple	Desktop	\N	\N	2025-11-25 13:25:56.349439	ad777972-7eba-47f8-a471-c41659da0514	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
aec8c6ca-ff21-4694-91fe-9ba352b0366f	Mac Studio M2 Ultra	Apple	Desktop	\N	\N	2025-11-25 13:25:56.349439	ad777972-7eba-47f8-a471-c41659da0514	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
bc3a5480-bd30-419f-8ea6-e1826771060e	Mac mini M2	Apple	Desktop	\N	\N	2025-11-25 13:25:56.349439	ad777972-7eba-47f8-a471-c41659da0514	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
4eede62c-40c1-48cc-9a21-c3649e9708be	Mac mini M2 Pro	Apple	Desktop	\N	\N	2025-11-25 13:25:56.349439	ad777972-7eba-47f8-a471-c41659da0514	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
e18eb7c2-7f59-4795-8538-cefdbcf832fb	Mac Pro M2 Ultra	Apple	Desktop	\N	\N	2025-11-25 13:25:56.349439	ad777972-7eba-47f8-a471-c41659da0514	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
8adfd372-3863-4046-bc74-987811039e55	ThinkCentre M90q Gen 4	Lenovo	Desktop	\N	\N	2025-11-25 13:25:56.349439	f8bba6d5-02e1-467d-a5cc-681dabe77e89	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
b3a3b2f1-5d49-42e6-8fc9-3df9d0793953	ThinkCentre M720	Lenovo	Desktop	\N	\N	2025-11-25 13:25:56.349439	f8bba6d5-02e1-467d-a5cc-681dabe77e89	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
e0b3cd4d-c1a9-47b6-a3ee-bf12eab074d8	IdeaCentre AIO 3	Lenovo	Desktop	\N	\N	2025-11-25 13:25:56.349439	f8bba6d5-02e1-467d-a5cc-681dabe77e89	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
c8e96446-3b36-48f9-bce8-6559c0afafff	OptiPlex 7010	Dell	Desktop	\N	\N	2025-11-25 13:25:56.349439	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
802807f1-be5b-4952-985e-ff5b5248c729	OptiPlex 5000	Dell	Desktop	\N	\N	2025-11-25 13:25:56.349439	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
603d9554-8c08-40fa-98c4-6159c21a0826	Inspiron Desktop	Dell	Desktop	\N	\N	2025-11-25 13:25:56.349439	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
a907eff2-6393-4853-856a-6a5cf948b36c	ProDesk 400 G9	HP	Desktop	\N	\N	2025-11-25 13:25:56.349439	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
07cac78f-4a5d-41c6-9c30-a821a5bc0208	EliteDesk 800 G9	HP	Desktop	\N	\N	2025-11-25 13:25:56.349439	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
ea1a799b-99e6-4860-a862-cfbe393a83fb	OMEN 45L	HP	Desktop	\N	\N	2025-11-25 13:25:56.349439	746e18aa-9e4b-4bf7-98ea-ad2cacd2a4dc	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
6fbe83ad-5c0e-4e4c-878d-09a50577e5a7	ROG Strix G15	Asus	Desktop	\N	\N	2025-11-25 13:25:56.349439	de941763-a469-42e1-8709-fbbc71444668	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
5dfe410f-c9c2-441e-b017-6e1487a01553	ExpertCenter D700	Asus	Desktop	\N	\N	2025-11-25 13:25:56.349439	de941763-a469-42e1-8709-fbbc71444668	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
e55239c0-b97f-4abf-90d5-d72efdf6f225	Aspire TC	Acer	Desktop	\N	\N	2025-11-25 13:25:56.349439	e918ff0b-5d39-483d-a905-0e353d1dba8a	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
53bebb9f-c03b-4cb9-b5f5-0f20f96f06f5	Nitro 50	Acer	Desktop	\N	\N	2025-11-25 13:25:56.349439	e918ff0b-5d39-483d-a905-0e353d1dba8a	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2025-11-25 13:25:56.349439	\N	\N
79402c68-81fe-4c7b-91a8-97324daf444c	Apple Watch Series 9	Apple	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
973ddfc9-74a0-4a08-82d9-aee711dcefc7	Apple Watch Series 8	Apple	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
1ee0c02a-63c9-40df-88e9-759af8f06437	Apple Watch SE (2023)	Apple	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
97a3c8a1-ae72-40cb-af00-dd97247ad312	Galaxy Watch6 Classic	Samsung	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
33506c3f-6ba2-47c4-a6f3-da9b64ded8af	Galaxy Watch6	Samsung	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
07713094-7cfc-490a-9c90-9326ae2fe643	Galaxy Watch5 Pro	Samsung	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
18f82ef9-feea-406b-a80f-f74b92ba3208	Galaxy Watch5	Samsung	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
d4d3c1d3-6a50-4dec-a104-9a5a610523ad	Watch GT 4	Huawei	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	9058ab00-9307-4371-8930-8a822cc7082e	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
26e66347-c3c2-48e4-84eb-24a0ac525a0b	Watch GT 3 Pro	Huawei	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	9058ab00-9307-4371-8930-8a822cc7082e	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
b2e794a6-9211-480f-9286-2716444fd492	Watch Fit 3	Huawei	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	9058ab00-9307-4371-8930-8a822cc7082e	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
dc6f579e-3852-4792-947a-67947fc0cf1e	Watch S3	Xiaomi	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7937fb6e-7866-45c2-b8a2-13963a0408eb	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
2273e157-a8a1-4b25-b757-e77e85ccc8b7	Watch 2 Pro	Xiaomi	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7937fb6e-7866-45c2-b8a2-13963a0408eb	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
fc00b125-8c18-4b8e-84f4-0b810b1cf59e	Mi Band 8	Xiaomi	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	7937fb6e-7866-45c2-b8a2-13963a0408eb	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
db1e2218-19e3-4f63-b925-78e492b52218	Pixel Watch 2	Google	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	c9d61691-fe87-4617-9a0c-829dea058770	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
f6c2a336-b932-49bd-967b-f1ae009a5ffc	Pixel Watch	Google	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	c9d61691-fe87-4617-9a0c-829dea058770	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2025-11-25 13:26:13.007664	\N	\N
edcf14bb-256b-4bd1-9f9b-f9de88392bf1	PlayStation 5	Sony	Console	\N	\N	2025-11-25 13:26:23.829931	cbe016ed-2862-495f-9b8d-1c1db1341548	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
e00f5c01-8c6d-4d81-b7b1-1f8b1f7a4850	PlayStation 5 Digital	Sony	Console	\N	\N	2025-11-25 13:26:23.829931	cbe016ed-2862-495f-9b8d-1c1db1341548	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
6813f988-75ec-49b6-b3c2-a0f2145cccc5	PlayStation 5 Slim	Sony	Console	\N	\N	2025-11-25 13:26:23.829931	cbe016ed-2862-495f-9b8d-1c1db1341548	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
a8f59ae4-d33f-4917-b705-09a8b6807650	PlayStation 4 Pro	Sony	Console	\N	\N	2025-11-25 13:26:23.829931	cbe016ed-2862-495f-9b8d-1c1db1341548	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
4ce29148-c8cb-453c-95db-81a98224faae	PlayStation 4 Slim	Sony	Console	\N	\N	2025-11-25 13:26:23.829931	cbe016ed-2862-495f-9b8d-1c1db1341548	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
4906824a-b0b4-4fc8-8074-a4b3dbd38d69	PS Vita	Sony	Console	\N	\N	2025-11-25 13:26:23.829931	cbe016ed-2862-495f-9b8d-1c1db1341548	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
8e422725-a78b-4248-9e39-4cd43cb2c2c2	Xbox Series X	Microsoft	Console	\N	\N	2025-11-25 13:26:23.829931	b3fc3d98-679d-4748-a37a-02852f6c31d3	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
eafc0c91-e128-4d48-9bb4-7046319276c1	Xbox Series S	Microsoft	Console	\N	\N	2025-11-25 13:26:23.829931	b3fc3d98-679d-4748-a37a-02852f6c31d3	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
29b3cc4b-ca46-42a5-be28-8f5ee96d86e4	Xbox One X	Microsoft	Console	\N	\N	2025-11-25 13:26:23.829931	b3fc3d98-679d-4748-a37a-02852f6c31d3	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
b793816b-9ce5-4dbc-86d8-a7cc8bb9f721	Xbox One S	Microsoft	Console	\N	\N	2025-11-25 13:26:23.829931	b3fc3d98-679d-4748-a37a-02852f6c31d3	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-11-25 13:26:23.829931	\N	\N
dcc39cb1-6b7c-419a-be17-723d45d3b098	OLED C4 65"	LG	TV	\N	\N	2025-11-25 13:26:37.400514	050177fa-4bd0-4724-b0d7-c9de54932cd9	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
e7910caf-e7c1-4fd3-942e-c2ff02a4d1ed	OLED G4 77"	LG	TV	\N	\N	2025-11-25 13:26:37.400514	050177fa-4bd0-4724-b0d7-c9de54932cd9	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
3e3de131-7dbd-45eb-846b-b694549e8c77	NanoCell 55"	LG	TV	\N	\N	2025-11-25 13:26:37.400514	050177fa-4bd0-4724-b0d7-c9de54932cd9	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
c6aded9a-75ec-4058-8c82-2923c6912410	QNED 75"	LG	TV	\N	\N	2025-11-25 13:26:37.400514	050177fa-4bd0-4724-b0d7-c9de54932cd9	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
1118312a-5935-4779-ae09-24b92f6ecefa	Neo QLED 8K 85"	Samsung	TV	\N	\N	2025-11-25 13:26:37.400514	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
d1ba06f9-848f-4166-8a0e-644d112b9c14	Neo QLED 4K 75"	Samsung	TV	\N	\N	2025-11-25 13:26:37.400514	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
8b46e47b-d9c1-4ca1-a2da-6a55296ae94f	OLED S95D 65"	Samsung	TV	\N	\N	2025-11-25 13:26:37.400514	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
667761bc-4948-4ecf-952a-8240ff33a3da	Crystal UHD 55"	Samsung	TV	\N	\N	2025-11-25 13:26:37.400514	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
28c5c550-6e65-4231-bfa0-aedbdf59eb28	The Frame 65"	Samsung	TV	\N	\N	2025-11-25 13:26:37.400514	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
806edbaa-cb42-4699-8480-c55c51c1c6ad	Bravia XR A95L 65"	Sony	TV	\N	\N	2025-11-25 13:26:37.400514	cbe016ed-2862-495f-9b8d-1c1db1341548	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
89150a0e-c9f8-4d21-8a80-f9c1473c9317	Bravia XR X90L 75"	Sony	TV	\N	\N	2025-11-25 13:26:37.400514	cbe016ed-2862-495f-9b8d-1c1db1341548	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
cb7506ec-104e-4912-a58a-b7ee4b2ad2bc	Bravia 55"	Sony	TV	\N	\N	2025-11-25 13:26:37.400514	cbe016ed-2862-495f-9b8d-1c1db1341548	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	2025-11-25 13:26:37.400514	\N	\N
1fa3570c-0a84-4d66-9cac-56c937dc3ebd	prova	\N	\N	\N	\N	2025-12-23 22:28:01.753049	ad777972-7eba-47f8-a471-c41659da0514	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2025-12-23 22:28:01.753049	\N	\N
1a15d703-6bf1-4dd7-8ca7-63987b29f712	asdasda	\N	\N	\N	\N	2025-12-30 23:52:08.359868	de941763-a469-42e1-8709-fbbc71444668	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2025-12-30 23:52:08.359868	\N	\N
007c6f7c-98d5-44b4-b779-0f9149ced0d7	asd	\N	\N	\N	\N	2026-01-26 17:56:28.360357	ad777972-7eba-47f8-a471-c41659da0514	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	2026-01-26 17:56:28.360357	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N
6adca1dc-f1da-4460-8537-fe4ef6d087ad	Alienware Aurora R16	Dell	Desktop	\N	\N	2025-11-25 13:25:56.349439	79127b7e-4b20-47a9-99b2-c06bd6ac37ff	7c151c62-6ff0-47c7-a619-23323067b1e6	t	2026-01-27 10:16:43.92	\N	{A2894,A2893}
40f69565-9103-42f7-979e-e1a60d2a8c0c	iPhone 16	\N	\N	A2894	\N	2026-01-26 23:29:03.759127	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-26 23:29:03.759127	\N	\N
b8c53335-4a53-4d16-9b64-98df417f7e37	Edge+	\N	\N	\N	\N	2026-01-27 13:13:00.64069	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:17.586	\N	{XT2061-3}
7243a7ba-6374-489a-9cd4-bc52a83c5e04	Edge 20	\N	\N	\N	\N	2026-01-27 13:13:00.782612	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:17.728	\N	{XT2143-1}
3e7b42f0-c89c-4114-80ba-83abbf7d9034	Edge 20 Lite	\N	\N	\N	\N	2026-01-27 13:13:00.92361	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:17.875	\N	{XT2139-1}
a52bdc00-1d7c-4748-94ba-cbed7d0c0a84	Edge 20 Pro	\N	\N	\N	\N	2026-01-27 13:13:01.064305	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.016	\N	{XT2153-1}
99aef58e-a43c-419f-8656-0251c463b42f	Edge 30	\N	\N	\N	\N	2026-01-27 13:13:01.204646	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.157	\N	{XT2203-1}
1ae16844-c241-4a50-9bde-3d64c8fec431	Edge 30 Neo	\N	\N	\N	\N	2026-01-27 13:13:01.345437	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.298	\N	{XT2245-1}
641d005f-cf26-4a1d-b234-9c7262d5866d	Edge 30 Ultra	\N	\N	\N	\N	2026-01-27 13:13:01.627654	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.58	\N	{XT2241-1}
01fbce0b-7b57-4391-bebb-6c5f35ac5e0a	Edge 40	\N	\N	\N	\N	2026-01-27 13:13:01.769189	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.721	\N	{XT2303-1}
c01266c7-8947-49d9-b80c-debe6623be51	Edge 40 Neo	\N	\N	\N	\N	2026-01-27 13:13:01.909916	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.862	\N	{XT2307-1}
791931bc-6dce-45db-9325-bfe81c2fb995	Edge 40 Pro	\N	\N	\N	\N	2026-01-27 13:13:02.050723	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.003	\N	{XT2301-1}
9be3ee49-1e1e-4c62-8b48-a8d0112956d2	Edge 50	\N	\N	\N	\N	2026-01-27 13:13:02.191477	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.144	\N	{XT2401-1}
4b30938b-61bf-4aed-8bdd-e0497a71e437	Edge 50 Neo	\N	\N	\N	\N	2026-01-27 13:13:02.332313	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.285	\N	{XT2409-1}
4b0b772b-1e76-4c62-89db-dd62d95f1609	Edge 50 Fusion	\N	\N	\N	\N	2026-01-27 13:13:02.473396	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.427	\N	{XT2403-1}
182154ef-d2a1-4327-bb2a-7aaa6881531f	Edge 50 Ultra	\N	\N	\N	\N	2026-01-27 13:13:02.75718	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.709	\N	{XT2405-1}
bb5bc31c-c129-48f1-858d-2876b1eebd2d	Moto G7	\N	\N	\N	\N	2026-01-27 13:13:02.897923	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.85	\N	{XT1962-1}
d7a28304-eacd-459b-8cff-3b1f8df2e874	Moto G7 Plus	\N	\N	\N	\N	2026-01-27 13:13:03.038856	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.99	\N	{XT1965-2}
b0c4289a-5c3f-474f-9232-7ff9b3e5c155	Moto G7 Power	\N	\N	\N	\N	2026-01-27 13:13:03.179786	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.131	\N	{XT1955-2}
546fac16-7570-4df7-92e6-c1bfd3ce59fa	Moto G7 Play	\N	\N	\N	\N	2026-01-27 13:13:03.320396	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.27	\N	{XT1952-2}
08980301-14e6-46c8-a790-7abfa2325f69	Moto G8	\N	\N	\N	\N	2026-01-27 13:13:03.460132	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.411	\N	{XT2045-1}
29fd8893-27f1-42e1-86ce-957c2594ba37	Moto G8 Plus	\N	\N	\N	\N	2026-01-27 13:13:03.601305	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.554	\N	{XT2019-1}
f9323e7b-39f6-49e1-8e6c-1666e5aa296d	Moto G8 Power	\N	\N	\N	\N	2026-01-27 13:13:03.741638	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.695	\N	{XT2041-1}
74672b27-bff7-4a13-8ab4-5c5e083233a9	Moto G8 Play	\N	\N	\N	\N	2026-01-27 13:13:03.883977	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.834	\N	{XT2015-2}
49e933e5-f472-4d96-8fd9-7bce4101f418	Moto G9	\N	\N	\N	\N	2026-01-27 13:13:04.024599	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:20.974	\N	{XT2083-3}
7f35203f-df85-4ce5-8391-0fe1f2ccdae3	Moto G9 Plus	\N	\N	\N	\N	2026-01-27 13:13:04.165804	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.119	\N	{XT2087-1}
e7d9453c-72f0-44cf-b1ae-42f7caf8d6e7	Moto G9 Power	\N	\N	\N	\N	2026-01-27 13:13:04.306297	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.26	\N	{XT2091-3}
66aa10cb-208e-4b5e-8535-e85ae71d681f	Moto G9 Play	\N	\N	\N	\N	2026-01-27 13:13:04.446925	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.401	\N	{XT2083-1}
50bcaa9e-beac-4dab-b3e2-7f8761391f9b	Moto G10	\N	\N	\N	\N	2026-01-27 13:13:04.590734	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.541	\N	{XT2127-1}
e099e30e-170c-481a-ae9b-bbfa5a065431	Moto G20	\N	\N	\N	\N	2026-01-27 13:13:04.731723	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.684	\N	{XT2128-1}
3a7ce3b0-edaf-4c5e-a8e8-b5e1a404d5da	Moto G30	\N	\N	\N	\N	2026-01-27 13:13:04.87254	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.826	\N	{XT2129-1}
ec232d9b-e5e3-475c-ab24-d971201a29b5	Moto G31	\N	\N	\N	\N	2026-01-27 13:13:05.012077	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:21.968	\N	{XT2173-1}
8765fb97-1a29-412b-9673-25adc92dafd8	Moto G32	\N	\N	\N	\N	2026-01-27 13:13:05.152232	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.108	\N	{XT2235-1}
717ce235-df4b-4325-966e-ee2492b86bc7	Moto G34 5G	\N	\N	\N	\N	2026-01-27 13:13:05.293084	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.249	\N	{XT2363-1}
ea872da7-4ceb-4473-ab9d-d7a041e3a6cb	Moto G35 5G	\N	\N	\N	\N	2026-01-27 13:13:05.434417	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.389	\N	{XT2365-1}
6ae66ebb-9d52-4b6e-989d-1795487327b2	Moto G40 Fusion	\N	\N	\N	\N	2026-01-27 13:13:05.574921	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.533	\N	{XT2135-2}
bd7681cf-15ae-4ba4-94da-0d4ca23adeba	Moto G41	\N	\N	\N	\N	2026-01-27 13:13:05.715787	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.674	\N	{XT2167-2}
29a0f169-2755-471a-9c2a-2e05bb2cdd9e	Moto G42	\N	\N	\N	\N	2026-01-27 13:13:05.856141	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.814	\N	{XT2233-2}
37327661-ff82-45ef-a84b-42aafeefc933	Moto G50	\N	\N	\N	\N	2026-01-27 13:13:05.997165	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:22.954	\N	{XT2137-1}
2783c94b-6759-4ab9-8496-df47b90db8d9	Moto G52	\N	\N	\N	\N	2026-01-27 13:13:06.137756	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.095	\N	{XT2221-1}
04700fc7-185c-42a2-9cb9-9905f4d89589	Moto G53	\N	\N	\N	\N	2026-01-27 13:13:06.278197	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.236	\N	{XT2335-1}
8e12f94e-7725-4cf6-9a77-dfbde63ad84f	Moto G54	\N	\N	\N	\N	2026-01-27 13:13:06.41899	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.377	\N	{XT2343-1}
612d80a3-27ea-4c2b-85d5-38efcb082dbe	Moto G56 5G	\N	\N	\N	\N	2026-01-27 13:13:06.559713	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.52	\N	{XT2367-1}
8d33618f-3219-4b56-9351-7986b6efb4bf	Moto G60	\N	\N	\N	\N	2026-01-27 13:13:06.700509	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.66	\N	{XT2135-1}
b3ab51f4-6b46-41d1-9a88-22b1c6848d85	Moto G62	\N	\N	\N	\N	2026-01-27 13:13:06.840884	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.8	\N	{XT2223-1}
7c9f934a-71d6-4edf-8c2b-633b2aa44efd	Moto G71	\N	\N	\N	\N	2026-01-27 13:13:06.981944	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:23.94	\N	{XT2169-1}
2930ec52-f02c-46fe-8163-2c533cf45c93	Moto G72	\N	\N	\N	\N	2026-01-27 13:13:07.123368	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.081	\N	{XT2255-1}
a7608845-90e0-47f6-bad5-599ce0bfa010	Moto G73	\N	\N	\N	\N	2026-01-27 13:13:07.264162	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.221	\N	{XT2237-2}
f993385e-be43-4a2c-a337-743138a95b8d	Moto G84	\N	\N	\N	\N	2026-01-27 13:13:07.404827	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.362	\N	{XT2347-1}
4bf7d1b2-adfc-4e47-a6da-01b14fc26265	Edge	\N	\N	\N	\N	2026-01-27 13:13:00.430903	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:17.443	\N	{XT2063-3}
44b63afe-ae67-4d8b-bc2d-c6115d847d89	Edge 30 Fusion	\N	\N	\N	\N	2026-01-27 13:13:01.486681	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:18.439	\N	{XT2243-1}
c5777384-bcbd-41d5-b022-9f02f1609af7	Edge 50 Pro	\N	\N	\N	\N	2026-01-27 13:13:02.613215	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:19.568	\N	{XT2407-1}
96ad76c4-e70f-4d58-a1ba-d8bbd5f30d27	Moto G04	\N	\N	\N	\N	2026-01-27 13:13:07.545321	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.503	\N	{XT2421-1}
465ccf14-48cb-4691-8abf-d264c2a55068	Moto G04s	\N	\N	\N	\N	2026-01-27 13:13:07.68625	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.643	\N	{XT2423-1}
6ed10cc1-12f7-4b6a-b2e3-dbab76ec391d	Moto G05	\N	\N	\N	\N	2026-01-27 13:13:07.827634	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.786	\N	{XT2425-1}
877ca1c3-b624-4936-aab5-dedc652e2cee	Moto G05s	\N	\N	\N	\N	2026-01-27 13:13:07.968295	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:24.926	\N	{XT2427-1}
f94810db-ff81-423c-93cc-10a32a637868	Moto G14	\N	\N	\N	\N	2026-01-27 13:13:08.109363	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.072	\N	{XT2341-1}
7e66aff2-d6de-46bb-976b-990319209e34	Moto G15	\N	\N	\N	\N	2026-01-27 13:13:08.250349	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.212	\N	{XT2345-1}
9a55206a-5b72-4f71-ab7a-1b33cc8594e5	Moto G23	\N	\N	\N	\N	2026-01-27 13:13:08.391269	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.352	\N	{XT2333-1}
cb8fe12d-93fb-418a-88bf-62828316dc8d	Moto G24	\N	\N	\N	\N	2026-01-27 13:13:08.5319	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.493	\N	{XT2429-1}
70a6475a-8257-4cd0-9bfb-d469b3da7679	Moto E6 Plus	\N	\N	\N	\N	2026-01-27 13:13:08.672343	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.634	\N	{XT2025-2}
a409be9a-cbeb-4893-af86-42e8709cfdd8	Moto E7	\N	\N	\N	\N	2026-01-27 13:13:08.812807	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.775	\N	{XT2095-3}
06a1d339-5e43-427c-8a29-d92d334a3d38	Moto E7 Plus	\N	\N	\N	\N	2026-01-27 13:13:08.95346	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:25.915	\N	{XT2081-2}
4a55e2c2-0f6a-4af8-91f9-423003297462	Moto E13	\N	\N	\N	\N	2026-01-27 13:13:09.094877	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.056	\N	{XT2349-1}
84f30486-81f2-422f-be89-16d84054eac7	Moto E14	\N	\N	\N	\N	2026-01-27 13:13:09.236528	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.197	\N	{XT2351-1}
e789277d-525c-4550-9eb9-f0b4a3304b44	Moto E20	\N	\N	\N	\N	2026-01-27 13:13:09.376825	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.338	\N	{XT2155-1}
2cf72087-6d16-461c-85ca-c5fa06558010	Moto E22	\N	\N	\N	\N	2026-01-27 13:13:09.517991	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.478	\N	{XT2239-1}
c95526d2-e719-47a3-a8b3-422c163cd674	Moto E22i	\N	\N	\N	\N	2026-01-27 13:13:09.658218	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.618	\N	{XT2239-2}
09b15032-0c4e-4c5d-a1c4-7926a0de8e7d	Moto E32	\N	\N	\N	\N	2026-01-27 13:13:09.798946	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.76	\N	{XT2227-1}
ffc305be-c827-4f9c-9d87-cadc8cf9a882	Moto E32s	\N	\N	\N	\N	2026-01-27 13:13:09.93927	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:26.903	\N	{XT2229-1}
74f8036a-fb3d-48b5-81a7-bf5594f0ca84	Moto E32i	\N	\N	\N	\N	2026-01-27 13:13:10.084197	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.047	\N	{XT2231-1}
5ea04e5f-281a-4ae6-81da-87da47b1237a	Moto E40	\N	\N	\N	\N	2026-01-27 13:13:10.232225	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.193	\N	{XT2159-1}
3bf10fff-097a-4e0e-bcf0-86dd89067554	Razr (2019)	\N	\N	\N	\N	2026-01-27 13:13:10.374529	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.334	\N	{XT2000-1}
11f43bd1-9ce2-41d4-8114-bbf9a020e933	Razr 5G	\N	\N	\N	\N	2026-01-27 13:13:10.515445	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.475	\N	{XT2071-4}
d266d028-7df3-4d7a-bbff-fe1c22882d5c	Razr 40	\N	\N	\N	\N	2026-01-27 13:13:10.656001	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.616	\N	{XT2323-1}
eb3b7eb4-8214-46d0-b826-8869164e6755	Razr 40 Ultra	\N	\N	\N	\N	2026-01-27 13:13:10.796594	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.758	\N	{XT2321-1}
ab3f0ec1-aa25-4932-a0b9-4135026cce75	Razr 50	\N	\N	\N	\N	2026-01-27 13:13:10.937488	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:27.899	\N	{XT2451-1}
91a05de0-b123-43ed-b68d-cb7268ac5332	Razr 50 Ultra	\N	\N	\N	\N	2026-01-27 13:13:11.078168	5c5ebccc-71cd-44de-b8be-37af1b92a515	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:13:28.04	\N	{XT2453-1}
8f829c99-18f5-4450-af9e-e2bde04de5e1	Axon 30	\N	\N	\N	\N	2026-01-27 13:13:49.5919	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:02.789	\N	{A2022}
a03fa7a9-cf7e-438d-842a-ad151f83bbbe	Axon 30 5G	\N	\N	\N	\N	2026-01-27 13:13:49.738716	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:02.937	\N	{A2322}
a6babc2b-7da2-4d38-aa26-e8c052c7833c	Axon 40	\N	\N	\N	\N	2026-01-27 13:13:49.882173	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.085	\N	{A2023}
5c45e970-cfaf-4e41-9123-94447e931cbf	Axon 11	\N	\N	\N	\N	2026-01-27 13:13:49.158924	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:02.35	\N	{A2021}
b58b8679-18ef-4394-9305-13ff5d7cdc15	Axon 11 5G	\N	\N	\N	\N	2026-01-27 13:13:49.303753	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:02.496	\N	{A2021G}
b6374455-89bc-4d1f-8099-7ca27f9bd767	Axon 20 5G	\N	\N	\N	\N	2026-01-27 13:13:49.448456	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:02.643	\N	{A2121}
10525a63-238a-40aa-a932-24cbd20b8683	Blade A3	\N	\N	\N	\N	2026-01-27 13:13:50.462248	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.674	\N	{Z6530}
7c9b49aa-4b75-4dd8-b942-f246523b4e05	Blade A5	\N	\N	\N	\N	2026-01-27 13:13:50.60667	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.821	\N	{Z6550}
fa1e77f4-540c-4a74-8742-eefe43196e65	Blade A7	\N	\N	\N	\N	2026-01-27 13:13:50.752448	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.969	\N	{Z6570}
ac88a73e-d563-4d05-98be-578963d1f5c4	Blade A31	\N	\N	\N	\N	2026-01-27 13:13:50.897575	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:04.116	\N	{Z6201}
1e35dbcd-f9cf-4ef5-bb35-bb59e4147467	Blade A51	\N	\N	\N	\N	2026-01-27 13:13:51.043939	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:04.264	\N	{Z6220}
0e68d44d-f0f4-47e5-8eb1-31b737546eb0	Blade A71	\N	\N	\N	\N	2026-01-27 13:13:51.19008	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:04.414	\N	{Z6356}
0df253de-a495-4ba2-984f-86d05bb5f588	Blade A72	\N	\N	\N	\N	2026-01-27 13:13:51.334766	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:04.561	\N	{Z6556}
28b58b4f-9594-4c67-87ce-07e470f7ec9c	Blade A73 5G	\N	\N	\N	\N	2026-01-27 13:13:51.479375	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:04.709	\N	{Z6573}
12a512a6-a3e8-46a4-a004-941ba443e692	Blade A76	\N	\N	\N	\N	2026-01-27 13:13:51.623216	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:04.859	\N	{Z6560}
950f6109-429f-47ac-a1da-20b11b93d43e	Blade L9	\N	\N	\N	\N	2026-01-27 13:13:51.767529	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.006	\N	{Z5150}
68ed6503-291b-433c-88e0-1c3000db3245	Blade L210	\N	\N	\N	\N	2026-01-27 13:13:51.91324	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.154	\N	{Z6250}
dd41c1c7-5cfb-4591-a22e-ba39c2a70d18	Blade L220	\N	\N	\N	\N	2026-01-27 13:13:52.05945	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.302	\N	{Z6350}
132d3b03-2378-4b6d-ae78-a74cc653854a	Blade V8	\N	\N	\N	\N	2026-01-27 13:13:52.204026	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.451	\N	{Z978}
e79fb4dc-fbfa-49ce-8801-a6725d1b5119	Blade V9	\N	\N	\N	\N	2026-01-27 13:13:52.348192	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.598	\N	{Z955}
c2c1b909-2559-4b73-b303-71403791bc29	Blade V10	\N	\N	\N	\N	2026-01-27 13:13:52.492863	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.746	\N	{Z6200}
18795f03-f0be-4497-b1a4-27344d337bb4	Blade V2020	\N	\N	\N	\N	2026-01-27 13:13:52.637254	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:05.893	\N	{Z6202}
740db65b-44c3-4bbd-8490-6987d3a8619d	Blade V30	\N	\N	\N	\N	2026-01-27 13:13:52.781661	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.04	\N	{Z6203}
f03e4271-8edb-4e17-b228-752fef64b77f	Blade V40 Vita	\N	\N	\N	\N	2026-01-27 13:13:52.923962	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.187	\N	{Z6351}
5cd1ce3c-a5f5-4d02-bb28-eabfb9e45f92	Blade V40 Pro	\N	\N	\N	\N	2026-01-27 13:13:53.068487	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.334	\N	{Z6352}
137de5fb-a7d8-46bf-a96f-493edcb2389f	Blade V40 Design	\N	\N	\N	\N	2026-01-27 13:13:53.2165	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.481	\N	{Z6353}
463fc026-c44a-4b34-a23d-ede9b1479ca3	Blade V50	\N	\N	\N	\N	2026-01-27 13:13:53.360046	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.629	\N	{Z6571}
9b2dc5f5-ec71-4626-92ae-0fd2de46ebc2	Blade V50 Vita	\N	\N	\N	\N	2026-01-27 13:13:53.505284	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.776	\N	{Z6572}
1be8e898-7280-430b-a2c5-709a3b087aca	Blade V50 Design	\N	\N	\N	\N	2026-01-27 13:13:53.649654	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:06.924	\N	{Z6574}
ba8d6d55-5b5a-4ff1-a283-5bdec3fcfcf8	Nubia Focus 5G	\N	\N	\N	\N	2026-01-27 13:13:53.794393	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:07.071	\N	{NX631J}
71d30f1c-4f85-49f7-97b5-734865d5cd94	Nubia Focus 2 5G	\N	\N	\N	\N	2026-01-27 13:13:53.93792	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:07.219	\N	{NX721J}
0aea832f-146f-447d-8354-fef997131b2c	Nubia Focus 2 Ultra 5G	\N	\N	\N	\N	2026-01-27 13:13:54.082181	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:07.367	\N	{NX721U}
f0682e38-012a-47f7-99b5-f580b5d87a57	Nubia Z20	\N	\N	\N	\N	2026-01-27 13:13:54.226898	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:07.514	\N	{NX627J}
a816dfe1-37d9-4fec-9cc4-4205eebc7256	Nubia X	\N	\N	\N	\N	2026-01-27 13:13:54.369865	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:07.661	\N	{NX616J}
6b58b20c-bc16-42b4-8383-9a06b8e64f26	X51 5G	\N	\N	\N	\N	2026-01-27 13:20:14.180946	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:14.180946	\N	{V2059A}
62084043-882d-4632-80a8-52ef05c10533	Axon 10 Pro	\N	\N	\N	\N	2026-01-27 13:13:49.012889	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:02.205	\N	{A2020}
01ffd904-81d0-4adb-b1e5-5080224d1e65	Axon 40 Pro	\N	\N	\N	\N	2026-01-27 13:13:50.026613	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.234	\N	{A2023P}
63487580-1630-4c2d-834f-95ebe331a81f	Axon 50	\N	\N	\N	\N	2026-01-27 13:13:50.173363	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.381	\N	{A2323}
aab67751-a6ed-47ac-8f1f-6f707dbe7166	Axon 50 Lite	\N	\N	\N	\N	2026-01-27 13:13:50.318167	f31d071e-c5d7-4562-a4b0-21e1292e5484	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:03.528	\N	{A2323L}
691c361a-fa80-4597-ae71-b4c03bed8af7	X80 Lite	\N	\N	\N	\N	2026-01-27 13:20:14.329153	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:14.329153	\N	{V2209}
b56aae92-b8cb-4080-a46a-064b33bb58d2	X80 Pro	\N	\N	\N	\N	2026-01-27 13:20:14.477731	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:14.477731	\N	{V2145}
6b9b6029-8dc4-438b-9d5a-edd47fb7faaf	X90 Pro	\N	\N	\N	\N	2026-01-27 13:20:14.624654	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:14.624654	\N	{V2242}
6e8c708c-621c-4e6f-9e6e-b42f10f51874	X100 Pro	\N	\N	\N	\N	2026-01-27 13:20:14.769681	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:14.769681	\N	{V2309}
c71c558c-65e9-4d31-9e16-0982880fcd30	V21 5G	\N	\N	\N	\N	2026-01-27 13:20:14.915612	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:14.915612	\N	{V2059}
c598e638-71ca-49a0-b6a2-f869a404d023	V23 5G	\N	\N	\N	\N	2026-01-27 13:20:15.062491	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.062491	\N	{V2130}
2e33648d-244c-400c-8998-a19f48815536	V25	\N	\N	\N	\N	2026-01-27 13:20:15.207904	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.207904	\N	{V2202}
03e9b775-645f-4e00-aab8-ff494ae2b98b	V25 Pro	\N	\N	\N	\N	2026-01-27 13:20:15.352589	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.352589	\N	{V2158}
eb2ead71-85b8-48f5-846c-da69ddbc3671	V27	\N	\N	\N	\N	2026-01-27 13:20:15.497297	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.497297	\N	{V2246}
a7c6d29f-e030-42f4-a527-1c0b4dcd60b8	V29	\N	\N	\N	\N	2026-01-27 13:20:15.642024	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.642024	\N	{V2250}
e653ab24-1d03-4c91-9339-89cfb58e31f6	V30	\N	\N	\N	\N	2026-01-27 13:20:15.787185	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.787185	\N	{V2319}
95450632-046c-47c4-8d80-cfdb9a6f49a3	V40	\N	\N	\N	\N	2026-01-27 13:20:15.932297	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:15.932297	\N	{V2340}
23effb09-a455-4f96-a3e0-86ffec0fdd67	V40 Lite	\N	\N	\N	\N	2026-01-27 13:20:16.081328	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.081328	\N	{V2339}
c506d2e3-cfb5-4143-a2ce-c6c98543cce5	V40 SE	\N	\N	\N	\N	2026-01-27 13:20:16.226585	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.226585	\N	{V2337}
d9bea3a4-e08c-40e0-8e13-a9fbea9c5e2b	V40 SE 80W	\N	\N	\N	\N	2026-01-27 13:20:16.371739	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.371739	\N	{V2338}
7a876392-447d-4a9a-bcac-f99d3ff44cf1	Y11s	\N	\N	\N	\N	2026-01-27 13:20:16.515885	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.515885	\N	{V2029}
700d10d6-3d2d-42dd-9d92-f0f000dbd508	Y20s	\N	\N	\N	\N	2026-01-27 13:20:16.663264	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.663264	\N	{V2038}
e537ad0d-3c05-400b-b11a-cf565b598b4f	Y21	\N	\N	\N	\N	2026-01-27 13:20:16.809064	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.809064	\N	{V2111}
2cedc756-b571-4a79-9c7c-2517b49f3a3f	Y21s	\N	\N	\N	\N	2026-01-27 13:20:16.953966	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:16.953966	\N	{V2110}
25cb02ff-9c84-42b9-a51a-e28c460a618c	Y33s	\N	\N	\N	\N	2026-01-27 13:20:17.100309	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.100309	\N	{V2109}
02b2f5c0-41a6-404b-9217-e5f3db56dada	Y70	\N	\N	\N	\N	2026-01-27 13:20:17.245979	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.245979	\N	{V2034}
00d78854-7823-49dc-addf-5abaffe1cf17	Y76 5G	\N	\N	\N	\N	2026-01-27 13:20:17.392737	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.392737	\N	{V2124}
912e4733-4fbc-4b0a-90f1-7c97844e3c19	Y35	\N	\N	\N	\N	2026-01-27 13:20:17.537746	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.537746	\N	{V2205}
5d12b911-3b18-4b0f-9e36-4f9dfd032c01	Y36	\N	\N	\N	\N	2026-01-27 13:20:17.683339	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.683339	\N	{V2247}
141b6ed3-e2ce-45ef-a245-f897af2d8e5b	Y16	\N	\N	\N	\N	2026-01-27 13:20:17.828212	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.828212	\N	{V2204}
7e7f236d-4b22-48b4-9c16-1427f034f5a2	Y17s	\N	\N	\N	\N	2026-01-27 13:20:17.972888	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:17.972888	\N	{V2310}
3ee502d9-fa4b-43ca-9882-97459d4d6a61	Y22s	\N	\N	\N	\N	2026-01-27 13:20:18.11775	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:18.11775	\N	{V2207}
68d29409-dedd-4d1d-ac01-38d5259c0f7c	Y28	\N	\N	\N	\N	2026-01-27 13:20:18.262858	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:18.262858	\N	{V2332}
4b957b93-5230-4010-9b20-a4615880a60b	Y28s 5G	\N	\N	\N	\N	2026-01-27 13:20:18.407702	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:18.407702	\N	{V2346}
3815792d-bbd0-4a45-b231-1e342713182e	Y29s 5G	\N	\N	\N	\N	2026-01-27 13:20:18.552587	d571bd0b-5d65-4770-8381-8f2c1d612302	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:18.552587	\N	{V2348}
88d5c222-e164-48e0-8828-5577f4ec3b0f	realme 13	\N	\N	\N	\N	2026-01-27 13:20:30.537846	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:30.537846	\N	{RMX3939}
ab5929dc-6e42-49ba-a642-257447ea87d5	realme 13 Pro	\N	\N	\N	\N	2026-01-27 13:20:30.686544	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:30.686544	\N	{RMX3921}
59485966-5ea7-4f35-acd3-7adac323d22c	realme 13 Pro+	\N	\N	\N	\N	2026-01-27 13:20:30.834293	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:30.834293	\N	{RMX3920}
8e68c1c1-bd9b-43a0-8453-c3807dd38f58	realme 12	\N	\N	\N	\N	2026-01-27 13:20:30.981973	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:30.981973	\N	{RMX3870}
73be0d4a-0a78-4943-baa3-4b01a1967590	realme 12 5G	\N	\N	\N	\N	2026-01-27 13:20:31.1333	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:31.1333	\N	{RMX3868}
6aca416e-24cc-4e13-bb7e-f90fac730101	realme 12 Pro	\N	\N	\N	\N	2026-01-27 13:20:31.280622	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:31.280622	\N	{RMX3840}
1a015a35-12ab-4d70-ab6a-51c9d2879b00	realme 12 Pro+	\N	\N	\N	\N	2026-01-27 13:20:31.427791	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:31.427791	\N	{RMX3841}
70088493-bc40-4f45-8d44-c495612548e4	realme 11	\N	\N	\N	\N	2026-01-27 13:20:31.575012	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:31.575012	\N	{RMX3636}
deb33288-d6f2-4bd9-8752-a5839fe70c21	realme 11 5G	\N	\N	\N	\N	2026-01-27 13:20:31.721092	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:31.721092	\N	{RMX3780}
8220757a-3701-4f5f-8063-b4f5deb0d461	realme 11 Pro	\N	\N	\N	\N	2026-01-27 13:20:31.868504	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:31.868504	\N	{RMX3771}
ef458712-6845-416b-8918-61e091c2ac55	realme 11 Pro+	\N	\N	\N	\N	2026-01-27 13:20:32.016016	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.016016	\N	{RMX3741}
eca8fd82-f789-42e9-899d-824d4f381139	realme 10	\N	\N	\N	\N	2026-01-27 13:20:32.165709	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.165709	\N	{RMX3630}
2f5d665b-6d07-47b6-951f-cc942e394d50	realme 10 5G	\N	\N	\N	\N	2026-01-27 13:20:32.313398	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.313398	\N	{RMX3663}
49eeb0a8-089d-4bb2-b10b-7e50653a5854	realme 10 Pro	\N	\N	\N	\N	2026-01-27 13:20:32.464609	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.464609	\N	{RMX3660}
8ce8e6e7-40f9-403b-8f94-5eda5abcf9af	realme 10 Pro+	\N	\N	\N	\N	2026-01-27 13:20:32.611848	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.611848	\N	{RMX3687}
a6d840a1-eb0c-4783-ae1e-d4b1b96c7b02	realme GT 6	\N	\N	\N	\N	2026-01-27 13:20:32.759524	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.759524	\N	{RMX3851}
a037bfa7-443c-431c-aa0f-5c9a4910489e	realme GT 2	\N	\N	\N	\N	2026-01-27 13:20:32.906848	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:32.906848	\N	{RMX3311}
a68e3f87-ede9-40c6-9136-11e9e6abe81b	realme GT 2 Pro	\N	\N	\N	\N	2026-01-27 13:20:33.055142	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.055142	\N	{RMX3301}
dd893fca-da6a-4c95-b560-fe64d0f490be	realme GT Neo 3	\N	\N	\N	\N	2026-01-27 13:20:33.20371	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.20371	\N	{RMX3560}
ac9d93fb-5226-4913-b988-d24d613ebbba	realme GT Neo 3T	\N	\N	\N	\N	2026-01-27 13:20:33.351003	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.351003	\N	{RMX3372}
3b8caa1d-abe1-4154-a9cf-f0d0c280eecb	realme C67	\N	\N	\N	\N	2026-01-27 13:20:33.497064	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.497064	\N	{RMX3782}
8aeeb9c5-8736-4224-8fb0-97a58e9f6ae2	realme C55	\N	\N	\N	\N	2026-01-27 13:20:33.64673	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.64673	\N	{RMX3710}
2bed2651-376d-4b13-9fe2-2297620d785a	realme C53	\N	\N	\N	\N	2026-01-27 13:20:33.794243	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.794243	\N	{RMX3760}
d36a6028-b6d0-47b7-8478-f31cb1c4b720	realme C51	\N	\N	\N	\N	2026-01-27 13:20:33.941791	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:33.941791	\N	{RMX3830}
b8972afe-a4b4-4e3d-9ce1-aa109ee6b955	realme Narzo 50	\N	\N	\N	\N	2026-01-27 13:20:34.089514	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.089514	\N	{RMX3286}
0ee0e43d-2564-4d08-a7d6-7a8886250457	realme Narzo 50A	\N	\N	\N	\N	2026-01-27 13:20:34.236697	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.236697	\N	{RMX3430}
d93ab215-cc69-40a4-b2fe-cdf31f901593	realme Narzo 50i	\N	\N	\N	\N	2026-01-27 13:20:34.384593	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.384593	\N	{RMX3519}
1885f9ed-91d9-4e98-b565-949e63136eb9	realme Narzo 30A	\N	\N	\N	\N	2026-01-27 13:20:34.531956	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.531956	\N	{RMX3171}
a58d536b-6a3e-47e1-877d-f5322fa9a418	realme 9	\N	\N	\N	\N	2026-01-27 13:20:34.679112	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.679112	\N	{RMX3521}
75fcd720-2b57-475a-b727-e932252dfa52	realme 9i	\N	\N	\N	\N	2026-01-27 13:20:34.826045	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.826045	\N	{RMX3491}
9277e72b-0c5d-4f3b-b8e3-d68add1b3dd6	realme 9 5G	\N	\N	\N	\N	2026-01-27 13:20:34.972141	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:34.972141	\N	{RMX3474}
a9a4f086-16eb-489e-806b-efc3d6ce2f01	realme 9 Pro	\N	\N	\N	\N	2026-01-27 13:20:35.121276	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:35.121276	\N	{RMX3471}
c8d64bb5-1875-431f-999f-81135e670c0f	realme 9 Pro+	\N	\N	\N	\N	2026-01-27 13:20:35.269411	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:35.269411	\N	{RMX3393}
2f82e314-fd9f-4852-ae2a-254bb281064d	realme 8	\N	\N	\N	\N	2026-01-27 13:20:35.416254	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:35.416254	\N	{RMX3085}
be47bcc7-5e32-4f59-adca-d95fa6db2992	realme 8 Pro	\N	\N	\N	\N	2026-01-27 13:20:35.564076	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:35.564076	\N	{RMX3081}
ccebd58c-3205-4cd3-9322-328c575edae0	realme 8i	\N	\N	\N	\N	2026-01-27 13:20:35.711009	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:35.711009	\N	{RMX3151}
a810f85e-f6af-492d-ab99-389bcf4c5a67	realme 8s 5G	\N	\N	\N	\N	2026-01-27 13:20:35.858527	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:35.858527	\N	{RMX3381}
353d813e-4e84-4063-bed4-d7717cdd72f8	realme 8 5G	\N	\N	\N	\N	2026-01-27 13:20:36.009067	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.009067	\N	{RMX3241}
f383df84-a15c-43ae-8894-4a7ba7ae8911	realme 7	\N	\N	\N	\N	2026-01-27 13:20:36.154719	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.154719	\N	{RMX2155}
8a44d298-fa5a-49fa-8b63-78b329691971	realme 7 Pro	\N	\N	\N	\N	2026-01-27 13:20:36.301198	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.301198	\N	{RMX2170}
b2fd4117-b1f5-4253-8a21-53e03be039b3	realme 7 5G	\N	\N	\N	\N	2026-01-27 13:20:36.446261	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.446261	\N	{RMX2111}
2dd6bc8a-780f-46e4-ad89-a215702dd112	realme 6	\N	\N	\N	\N	2026-01-27 13:20:36.591308	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.591308	\N	{RMX2001}
0be0dfd5-29a1-48a6-a92b-abd4ed98ac39	realme 6 Pro	\N	\N	\N	\N	2026-01-27 13:20:36.736667	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.736667	\N	{RMX2061}
be21abd2-cfba-4417-bc95-f0672751e5de	realme GT	\N	\N	\N	\N	2026-01-27 13:20:36.881908	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:36.881908	\N	{RMX2202}
69bd9ad7-bade-4db1-ac1d-6adf83b56b30	realme GT Master Edition	\N	\N	\N	\N	2026-01-27 13:20:37.027729	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.027729	\N	{RMX3363}
3e22f8ee-c99b-4e2c-91c8-fa9f74d3d55c	realme GT Explorer Master Edition	\N	\N	\N	\N	2026-01-27 13:20:37.172541	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.172541	\N	{RMX3360}
a438c8c7-ff81-4010-b2c8-e6f90dad4e2d	realme GT Neo 2	\N	\N	\N	\N	2026-01-27 13:20:37.317949	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.317949	\N	{RMX3370}
af1dcfd8-3cb1-4484-a391-27e3d6d66d0a	realme C25	\N	\N	\N	\N	2026-01-27 13:20:37.462943	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.462943	\N	{RMX3193}
2822a93b-8853-4b2f-b7db-ad5269d81fb3	realme C25Y	\N	\N	\N	\N	2026-01-27 13:20:37.607933	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.607933	\N	{RMX3265}
cd8620f0-417e-47c9-b978-508e5625d0aa	realme C21	\N	\N	\N	\N	2026-01-27 13:20:37.752749	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.752749	\N	{RMX3201}
a67088b0-893a-496f-9165-7e1131afff98	realme C21Y	\N	\N	\N	\N	2026-01-27 13:20:37.898193	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:37.898193	\N	{RMX3261}
20fd4835-78d1-4535-8c38-72d629b10af1	realme C17	\N	\N	\N	\N	2026-01-27 13:20:38.0424	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.0424	\N	{RMX2101}
1fa53a55-c70b-4bd7-b44b-74f2c8668888	realme C15	\N	\N	\N	\N	2026-01-27 13:20:38.189289	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.189289	\N	{RMX2195}
8025ec94-216b-410f-81c1-23d4fcfe2b80	realme C11	\N	\N	\N	\N	2026-01-27 13:20:38.334145	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.334145	\N	{RMX2185}
37f49f40-3c90-4b77-af97-0ae06e901664	realme 5	\N	\N	\N	\N	2026-01-27 13:20:38.479531	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.479531	\N	{RMX1911}
ef91f5bb-80f5-48fb-ba5b-f08e0a43999a	realme 5 Pro	\N	\N	\N	\N	2026-01-27 13:20:38.624275	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.624275	\N	{RMX1971}
d36594d1-a57e-4a9d-8aa1-99ebb8aca0ef	realme 5i	\N	\N	\N	\N	2026-01-27 13:20:38.769013	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.769013	\N	{RMX2030}
74541547-0f8c-40f4-b79b-ae8a149e7a36	realme 5s	\N	\N	\N	\N	2026-01-27 13:20:38.914353	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:38.914353	\N	{RMX1925}
ae0beb30-0019-49fd-a390-840d2bb72c7f	realme X2	\N	\N	\N	\N	2026-01-27 13:20:39.082877	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:39.082877	\N	{RMX1993}
abcbc151-f5ff-4a92-b194-15fa0cd87c18	realme X2 Pro	\N	\N	\N	\N	2026-01-27 13:20:39.228527	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:39.228527	\N	{RMX1931}
265c6f37-667d-44ce-b38a-870ffd5a6fe2	realme C2	\N	\N	\N	\N	2026-01-27 13:20:39.373682	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:39.373682	\N	{RMX1941}
4bb09834-ac6e-41e6-aa1a-8cb3af94d39b	realme C3	\N	\N	\N	\N	2026-01-27 13:20:39.517858	160062cd-5316-43cf-96de-69c595f6403a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:39.517858	\N	{RMX2020}
fde6d654-fd53-4e9d-9d36-957a07217c0a	Find X	\N	\N	\N	\N	2026-01-27 13:20:50.805846	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:50.805846	\N	{CPH1871}
7b75d89a-599b-4b33-ac9d-134df8660fb9	Find X2	\N	\N	\N	\N	2026-01-27 13:20:51.325431	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:51.325431	\N	{CPH2023}
15cb6336-cbc2-4418-b875-3824569f7005	Find X2 Pro	\N	\N	\N	\N	2026-01-27 13:20:51.470518	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:51.470518	\N	{CPH2025}
eafd1fe2-3124-43c5-a1a5-9a32809c5686	Find X2 Neo	\N	\N	\N	\N	2026-01-27 13:20:51.614236	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:51.614236	\N	{CPH2009}
91065379-d4df-4d07-b6b5-2c744eb848d9	Find X2 Lite	\N	\N	\N	\N	2026-01-27 13:20:51.757544	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:51.757544	\N	{CPH2005}
8077ae44-72f8-4908-888d-d109b86ced59	Find X3 Pro	\N	\N	\N	\N	2026-01-27 13:20:51.90251	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:51.90251	\N	{CPH2173}
e00ce8fa-2a12-4bd4-b271-2413908add5a	Find X3 Neo	\N	\N	\N	\N	2026-01-27 13:20:52.046569	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.046569	\N	{CPH2207}
87425d13-9319-4a98-9d15-fb66a1bfad88	Find X3 Lite	\N	\N	\N	\N	2026-01-27 13:20:52.190169	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.190169	\N	{CPH2145}
4d4ad2db-ee8b-422c-981a-f1ec8e069052	Find X5	\N	\N	\N	\N	2026-01-27 13:20:52.333831	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.333831	\N	{CPH2307}
272de3fe-58c7-4be6-816a-9ce07f6d9640	Find X5 Pro	\N	\N	\N	\N	2026-01-27 13:20:52.477294	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.477294	\N	{CPH2305}
c72352be-7dd4-4a78-8824-6c65d064a0d7	Find N2 Flip	\N	\N	\N	\N	2026-01-27 13:20:52.620935	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.620935	\N	{CPH2437}
f755f234-b967-40c6-b7e5-8b209719e063	Find N3 Flip	\N	\N	\N	\N	2026-01-27 13:20:52.763928	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.763928	\N	{CPH2519}
21234d3d-c61e-449b-a7df-10fda8730cff	Reno	\N	\N	\N	\N	2026-01-27 13:20:52.906819	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:52.906819	\N	{CPH1917}
beb5670b-8e4a-493c-b0fb-3b0b7c70394c	Reno 2	\N	\N	\N	\N	2026-01-27 13:20:53.413604	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:53.413604	\N	{CPH1920}
c0ea0bcd-44a0-4d35-9f6b-22af22099560	Reno 2 Z	\N	\N	\N	\N	2026-01-27 13:20:53.55811	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:53.55811	\N	{CPH1945}
ff76a7f5-60cb-439c-b398-7ad2298daae2	Reno 3	\N	\N	\N	\N	2026-01-27 13:20:54.068394	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.068394	\N	{CPH2001}
17c77f2c-e509-4930-8665-2bf938508cf9	Reno 3 Pro	\N	\N	\N	\N	2026-01-27 13:20:54.215333	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.215333	\N	{CPH2003}
9647aa11-0d0d-4268-a1f8-739f2c336a05	Reno 4	\N	\N	\N	\N	2026-01-27 13:20:54.360952	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.360952	\N	{CPH2087}
28c808b3-d387-4d5b-82ad-1454b7963b94	Reno 4 Pro	\N	\N	\N	\N	2026-01-27 13:20:54.505902	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.505902	\N	{CPH2089}
c8677de0-cee3-4f95-98c1-a764378efe37	Reno 4 Z 5G	\N	\N	\N	\N	2026-01-27 13:20:54.651204	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.651204	\N	{CPH2065}
dce889f3-ba57-4cca-8899-54b03de95b10	Reno 6 5G	\N	\N	\N	\N	2026-01-27 13:20:54.796213	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.796213	\N	{CPH2251}
4fb433b0-b658-4d30-a90a-2ab8ff3485ca	Reno 6 Pro 5G	\N	\N	\N	\N	2026-01-27 13:20:54.941551	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:54.941551	\N	{CPH2247}
7728e3d0-b217-40e5-8125-02b9a580fd1e	Reno 7 5G	\N	\N	\N	\N	2026-01-27 13:20:55.088165	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.088165	\N	{CPH2371}
e6ac5b55-a539-4419-a2ff-c020deb004cb	Reno 7 Z 5G	\N	\N	\N	\N	2026-01-27 13:20:55.23287	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.23287	\N	{CPH2343}
43a30e09-b0e0-4e3a-bd3d-0c8d1743fe89	Reno 8	\N	\N	\N	\N	2026-01-27 13:20:55.377408	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.377408	\N	{CPH2359}
5661f022-7ab1-4677-8e22-665dcb1ffdfa	Reno 8 T	\N	\N	\N	\N	2026-01-27 13:20:55.523367	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.523367	\N	{CPH2481}
7ca7a160-0591-43ea-914a-14659e3b4ee9	Reno 9	\N	\N	\N	\N	2026-01-27 13:20:55.668706	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.668706	\N	{CPH2685}
3181e7fc-2a79-465f-9110-3b10da7000dd	Reno 9 Pro	\N	\N	\N	\N	2026-01-27 13:20:55.814494	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.814494	\N	{CPH2687}
31ebf26d-e04a-4765-b67e-90bf1b7e17f9	Reno 10	\N	\N	\N	\N	2026-01-27 13:20:55.959587	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:55.959587	\N	{CPH2731}
b466270b-25bd-4c11-aa99-1c6e06391899	Reno 10 Pro	\N	\N	\N	\N	2026-01-27 13:20:56.104775	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.104775	\N	{CPH2733}
63a65cef-a7e7-4ac9-b54a-3d0b67e56b38	Reno 12 5G	\N	\N	\N	\N	2026-01-27 13:20:56.24977	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.24977	\N	{CPH2625}
336250b5-301d-4512-9f50-9fa7970e17e4	Reno 12 Pro 5G	\N	\N	\N	\N	2026-01-27 13:20:56.393717	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.393717	\N	{CPH2629}
e36cb1e1-1fe9-4ee3-bb24-44b7f967cb0d	Reno 12 F 5G	\N	\N	\N	\N	2026-01-27 13:20:56.544189	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.544189	\N	{CPH2637}
958ae00c-5ca8-40ce-a799-750b89754c82	Reno 13	\N	\N	\N	\N	2026-01-27 13:20:56.68943	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.68943	\N	{CPH2689}
e3d35771-ec40-447b-9feb-7cb9c8d46084	Reno 13 Pro	\N	\N	\N	\N	2026-01-27 13:20:56.834347	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.834347	\N	{CPH2691}
eb29630f-2774-43b7-8dc1-885f6ba64c17	Reno 14	\N	\N	\N	\N	2026-01-27 13:20:56.979436	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:56.979436	\N	{CPH2737}
0a31548a-9eb9-45a6-a597-76cfcbda5081	Reno 14 Pro	\N	\N	\N	\N	2026-01-27 13:20:57.124249	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.124249	\N	{CPH2739}
297204c8-c6f0-4da6-ae07-6841872d8cde	A3	\N	\N	\N	\N	2026-01-27 13:20:57.269545	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.269545	\N	{CPH1837}
b39219e0-c638-4d42-96bc-ec5f986dcdb6	A5	\N	\N	\N	\N	2026-01-27 13:20:57.416975	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.416975	\N	{CPH1809}
50123fdf-eae3-44b2-a9f1-e8713d99853c	A5 (2020)	\N	\N	\N	\N	2026-01-27 13:20:57.562255	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.562255	\N	{CPH1943}
6da704ce-6c97-4ef1-9721-7630c6d73c49	A7	\N	\N	\N	\N	2026-01-27 13:20:57.707731	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.707731	\N	{CPH1901}
b1e7db22-b53a-4192-a082-68614406a165	A9 (2020)	\N	\N	\N	\N	2026-01-27 13:20:57.852711	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.852711	\N	{CPH1937}
8d0c73a2-a6f3-4681-9209-97daa1c882ce	A12	\N	\N	\N	\N	2026-01-27 13:20:57.99738	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:57.99738	\N	{CPH2083}
2d4fe288-aa29-4bbf-8ba5-0d3e182e4a00	A15	\N	\N	\N	\N	2026-01-27 13:20:58.142711	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:58.142711	\N	{CPH2185}
46453254-33e5-4e0a-a14f-36fdf56599b9	A15s	\N	\N	\N	\N	2026-01-27 13:20:58.287937	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:58.287937	\N	{CPH2179}
6691ab09-3455-4be8-9b5a-737ba0d73411	A16	\N	\N	\N	\N	2026-01-27 13:20:58.433166	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:58.433166	\N	{CPH2269}
d0466c08-c20b-4abc-9dca-bafcb55838bd	A16s	\N	\N	\N	\N	2026-01-27 13:20:58.579754	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:58.579754	\N	{CPH2271}
e2cd2628-9eb9-42be-95f7-ab3495f3f3b2	A16e	\N	\N	\N	\N	2026-01-27 13:20:58.723713	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:58.723713	\N	{CPH2273}
1b8b3177-f209-4896-9197-b873e796deee	A17	\N	\N	\N	\N	2026-01-27 13:20:58.868821	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:58.868821	\N	{CPH2477}
6d1421c7-6fa1-4a39-bcfe-5f0d9e50aea8	A17k	\N	\N	\N	\N	2026-01-27 13:20:59.013549	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.013549	\N	{CPH2479}
d59a8ead-fc31-47a2-b3fc-d23c5427293f	A18	\N	\N	\N	\N	2026-01-27 13:20:59.15903	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.15903	\N	{CPH2591}
e82a628d-8a31-4c31-9006-c3cd358fe380	A31	\N	\N	\N	\N	2026-01-27 13:20:59.304846	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.304846	\N	{CPH2015}
24ac8375-ffd4-49bb-930e-35c2eb0d8a3c	A32	\N	\N	\N	\N	2026-01-27 13:20:59.449651	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.449651	\N	{CPH2191}
55909349-0333-4a5d-a587-60868bb351e2	A34 5G	\N	\N	\N	\N	2026-01-27 13:20:59.595331	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.595331	\N	{CPH2389}
c7f7efdb-4af1-48a9-9885-925a8fbacd7a	A35	\N	\N	\N	\N	2026-01-27 13:20:59.740516	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.740516	\N	{CPH2309}
bcd30193-45f0-4152-b9a7-40a0535eb428	A38	\N	\N	\N	\N	2026-01-27 13:20:59.8853	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:20:59.8853	\N	{CPH2579}
ab122cea-0068-49f9-9db5-7846b3f213e3	A40	\N	\N	\N	\N	2026-01-27 13:21:00.030675	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.030675	\N	{CPH2669}
213b695b-828c-4ee5-8460-fecfaa0c12b2	A52	\N	\N	\N	\N	2026-01-27 13:21:00.176362	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.176362	\N	{CPH2069}
c7aef701-7283-445b-bb3f-0336ed798ee0	A53	\N	\N	\N	\N	2026-01-27 13:21:00.322276	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.322276	\N	{CPH2127}
5d413302-20c3-436b-aa73-3fb425402f59	A53s	\N	\N	\N	\N	2026-01-27 13:21:00.467288	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.467288	\N	{CPH2135}
78e834c9-98d7-48bd-ab0a-049f96d31a2d	A54	\N	\N	\N	\N	2026-01-27 13:21:00.61274	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.61274	\N	{CPH2239}
9391c90c-4527-4587-87fd-796ecd254bd3	A54 5G	\N	\N	\N	\N	2026-01-27 13:21:00.757655	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.757655	\N	{CPH2195}
52335971-e2d7-484d-8439-bcb37e3a26a5	A55 5G	\N	\N	\N	\N	2026-01-27 13:21:00.903422	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:00.903422	\N	{CPH2325}
53dd7b9c-49b9-43eb-8342-3181003367d3	A57	\N	\N	\N	\N	2026-01-27 13:21:01.048311	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:01.048311	\N	{CPH2387}
a47c232e-26c1-452e-ac13-aa43d0a7187f	A58	\N	\N	\N	\N	2026-01-27 13:21:01.193282	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:01.193282	\N	{CPH2577}
8af8fbb2-cc36-4f34-a78b-97f440ad8da8	A60	\N	\N	\N	\N	2026-01-27 13:21:01.338989	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:01.338989	\N	{CPH2683}
deb4858e-91da-42bb-b420-564f5df262f1	A72	\N	\N	\N	\N	2026-01-27 13:21:01.484526	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:01.484526	\N	{CPH2067}
6b5a4515-ce5f-4d50-95fb-169739bcc027	A74	\N	\N	\N	\N	2026-01-27 13:21:01.630577	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:01.630577	\N	{CPH2219}
9004ed70-5466-4a49-a6eb-11a776a3c308	A74 5G	\N	\N	\N	\N	2026-01-27 13:21:01.776021	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:01.776021	\N	{CPH2197}
3550d338-6975-4f7b-b38f-f592e337915d	A76	\N	\N	\N	\N	2026-01-27 13:21:02.281305	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:02.281305	\N	{CPH2375}
8e49b4e2-c9bc-49b9-b9a3-22ae21d61df2	A78 4G	\N	\N	\N	\N	2026-01-27 13:21:02.42493	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:02.42493	\N	{CPH2565}
0c3746d0-cd92-4b97-9de7-5b466870b62e	A78 5G	\N	\N	\N	\N	2026-01-27 13:21:02.567578	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:02.567578	\N	{CPH2495}
04332c1f-e6ed-4cb2-8554-87a241b318a4	A79 5G	\N	\N	\N	\N	2026-01-27 13:21:02.710019	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:02.710019	\N	{CPH2557}
e7b96cee-aaf7-4a4e-bfcb-2df0f9f66155	A80	\N	\N	\N	\N	2026-01-27 13:21:02.853519	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:02.853519	\N	{CPH2639}
f5e48ab3-904b-4b03-aeac-551a4938f0f9	A94	\N	\N	\N	\N	2026-01-27 13:21:02.996528	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:02.996528	\N	{CPH2203}
4cb15122-c640-414d-acbc-01e33e3efd5b	A94 5G	\N	\N	\N	\N	2026-01-27 13:21:03.138069	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:03.138069	\N	{CPH2211}
96f7362e-d6ec-4894-a2ed-58a11fc81567	A96	\N	\N	\N	\N	2026-01-27 13:21:03.285579	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:03.285579	\N	{CPH2333}
da033146-6394-40b6-bc4c-a9770937a384	A98 5G	\N	\N	\N	\N	2026-01-27 13:21:03.428764	ee33f1e3-c363-416d-a216-51e1ea12362c	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:03.428764	\N	{CPH2529}
32fb1b0f-414e-4b01-bf05-e27356fa8ef5	Galaxy Z Fold	\N	\N	\N	\N	2026-01-27 13:21:17.904908	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:17.904908	\N	{SM-F900F}
0880cd3d-4e77-4640-83ca-577cd92b5525	Galaxy Z Fold 5G	\N	\N	\N	\N	2026-01-27 13:21:18.052826	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.052826	\N	{SM-F907B}
b8ecee3b-0b7e-4075-b8db-a27383919e4a	Galaxy Z Fold2 5G	\N	\N	\N	\N	2026-01-27 13:21:18.199019	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.199019	\N	{SM-F916B}
4ee5c3c2-6ea9-4dc0-9480-2bc314778e21	Galaxy Z Fold3 5G	\N	\N	\N	\N	2026-01-27 13:21:18.343834	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.343834	\N	{SM-F926B}
aff6b074-b684-4aff-bd79-96dcfd460481	Galaxy Z Fold4	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.457	\N	{SM-F936B}
4064df79-52d1-4512-a48d-ec67ef831384	Galaxy Z Fold6	\N	\N	\N	\N	2026-01-27 13:21:18.779006	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.779006	\N	{SM-F956B}
19cb8623-e5e1-4da4-b279-da10452a754c	Galaxy Z Fold7	\N	\N	\N	\N	2026-01-27 13:21:18.922833	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:18.922833	\N	{SM-F966B}
8891c93d-0ac1-476d-8410-7b0dd5b79641	Galaxy Z Flip	\N	\N	\N	\N	2026-01-27 13:21:19.068992	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.068992	\N	{SM-F700F}
45a07420-e2f0-4c90-9fe4-396022e5792c	Galaxy Z Flip 5G	\N	\N	\N	\N	2026-01-27 13:21:19.213507	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.213507	\N	{SM-F707B}
cfe2dc0d-14ef-4eb7-b383-19a1f1294cb5	Galaxy Z Flip3 5G	\N	\N	\N	\N	2026-01-27 13:21:19.35823	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.35823	\N	{SM-F711B}
6c112eea-e4a3-450a-8167-40ec69e9f3be	Galaxy Z Flip6	\N	\N	\N	\N	2026-01-27 13:21:19.793342	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.793342	\N	{SM-F741B}
d85c5d49-81cd-49b1-8a82-518b51e1e729	Galaxy Z Flip7	\N	\N	\N	\N	2026-01-27 13:21:19.938468	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:19.938468	\N	{SM-F751B}
051155ab-6988-4f55-9fad-e045adea387b	Galaxy S20	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.052	\N	{SM-G980F}
a5d316dc-977b-40fc-ab1f-b24a4f1ce784	Galaxy S20 5G	\N	\N	\N	\N	2026-01-27 13:21:20.230598	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.230598	\N	{SM-G981B}
5f8074b8-7964-40db-b9ef-f3d3980c856e	Galaxy S20+ 5G	\N	\N	\N	\N	2026-01-27 13:21:20.521525	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.521525	\N	{SM-G986B}
e56b5f76-e67a-4351-9f4b-a04c6c1a3bd2	Galaxy S20 Ultra 5G	\N	\N	\N	\N	2026-01-27 13:21:20.667129	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.667129	\N	{SM-G988B}
5fd246ac-6fa2-4fb4-baeb-4e316e4ddc74	Galaxy S21 5G	\N	\N	\N	\N	2026-01-27 13:21:20.810831	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.810831	\N	{SM-G991B}
41b45884-17ef-47ca-a80f-ef16c98b4aa3	Galaxy S21+ 5G	\N	\N	\N	\N	2026-01-27 13:21:20.955919	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:20.955919	\N	{SM-G996B}
6cdba59c-0d48-4cf5-a6f4-efcddb7cf01a	Galaxy S21 Ultra 5G	\N	\N	\N	\N	2026-01-27 13:21:21.100886	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.100886	\N	{SM-G998B}
2c08b9b4-dd00-48aa-bbb3-20246ec6f7b1	Galaxy S22	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.213	\N	{SM-S901B}
e471d7ee-3708-46f9-86d1-db753fc2cf39	Galaxy S23 Ultra	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:21.936	\N	{SM-S918B}
76d4aada-963a-4c7e-85ac-8b39c1a79cb0	Galaxy S25	\N	\N	\N	\N	2026-01-27 13:21:22.547667	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.547667	\N	{SM-S931B}
e83c355c-d1a7-4399-a492-3b1621caddb2	Galaxy S25+	\N	\N	\N	\N	2026-01-27 13:21:22.692782	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.692782	\N	{SM-S936B}
4f518077-1d07-4f9c-96a7-52b3d15084e3	Galaxy S25 Ultra	\N	\N	\N	\N	2026-01-27 13:21:22.837816	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:22.837816	\N	{SM-S938B}
3e94cabf-81ac-4fa4-907c-07095f9ec4ff	Galaxy S20 FE 5G	\N	\N	\N	\N	2026-01-27 13:21:23.126505	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.126505	\N	{SM-G781B}
bee75cc8-e60b-409e-bc74-7440857d26a5	Galaxy S21 FE 5G	\N	\N	\N	\N	2026-01-27 13:21:23.27449	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.27449	\N	{SM-G990B}
f5b13957-3520-4c18-b32e-adcb1041ebed	Galaxy S23 FE	\N	\N	\N	\N	2026-01-27 13:21:23.419034	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.419034	\N	{SM-S711B}
5c3c27a9-92a0-4909-907e-f2b22d2eac1d	Galaxy A55 5G	\N	\N	\N	\N	2026-01-27 13:21:23.563566	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.563566	\N	{SM-A556B}
f62651bb-19c7-4d05-b5ae-d2cf340017d7	Galaxy A35 5G	\N	\N	\N	\N	2026-01-27 13:21:23.707947	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.707947	\N	{SM-A356B}
e47da174-ae4c-40b7-9fc6-009a95d5a250	Galaxy A25 5G	\N	\N	\N	\N	2026-01-27 13:21:23.852331	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.852331	\N	{SM-A256B}
2cf5c739-9a3e-41f8-81dd-263f3fa6bfc3	Galaxy A15	\N	\N	\N	\N	2026-01-27 13:21:23.996265	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:23.996265	\N	{SM-A155F}
daa3b4fe-daee-46fb-9270-448576f48033	Galaxy A15 5G	\N	\N	\N	\N	2026-01-27 13:21:24.140605	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:24.140605	\N	{SM-A156B}
78df6fba-48f9-4ed0-a5e0-f2450c664710	Galaxy A54 5G	\N	\N	\N	\N	2026-01-27 13:21:24.285231	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:24.285231	\N	{SM-A546B}
55cebf79-f915-40ac-93b3-1b385e6b8f2b	Galaxy A34 5G	\N	\N	\N	\N	2026-01-27 13:21:24.43176	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:24.43176	\N	{SM-A346B}
10071370-61a7-4986-ad7e-8f8b9aa99afb	Galaxy A14 5G	\N	\N	\N	\N	2026-01-27 13:21:24.720988	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:24.720988	\N	{SM-A146B}
4266b1df-1064-46cf-9d5a-6f20c6063330	Galaxy A53 5G	\N	\N	\N	\N	2026-01-27 13:21:24.865273	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:24.865273	\N	{SM-A536B}
f0e859e0-b6c8-4764-a089-73ccfebb69f0	Galaxy A33 5G	\N	\N	\N	\N	2026-01-27 13:21:25.009633	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.009633	\N	{SM-A336B}
e0a4d7da-4609-42b4-8055-40292d5d877c	Galaxy A13	\N	\N	\N	\N	2026-01-27 13:21:25.154001	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.154001	\N	{SM-A135F}
dafea2d7-1571-4c80-b5c2-0bbfcc230b06	Galaxy A13 5G	\N	\N	\N	\N	2026-01-27 13:21:25.299393	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.299393	\N	{SM-A136B}
f1e51d37-4257-4b5c-b330-b98932354714	Galaxy A52	\N	\N	\N	\N	2026-01-27 13:21:25.444226	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.444226	\N	{SM-A525F}
042f25ad-a22f-4a03-9990-3dd7d331aa13	Galaxy A52 5G	\N	\N	\N	\N	2026-01-27 13:21:25.588937	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.588937	\N	{SM-A526B}
1d958d2e-174f-448f-9849-a9eae46f83cc	Galaxy A52s 5G	\N	\N	\N	\N	2026-01-27 13:21:25.73316	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.73316	\N	{SM-A528B}
48a55724-4941-4dcd-8d35-532c57f3e23f	Galaxy A32	\N	\N	\N	\N	2026-01-27 13:21:25.878198	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:25.878198	\N	{SM-A325F}
aa559e2b-3b0b-4079-8325-fd7deb8ae5fd	Galaxy A32 5G	\N	\N	\N	\N	2026-01-27 13:21:26.022773	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:26.022773	\N	{SM-A326B}
66a18217-665f-4808-b839-e82d4b02bfc1	Galaxy A12	\N	\N	\N	\N	2026-01-27 13:21:26.168289	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:26.168289	\N	{SM-A125F}
d81c9ba8-d297-4d25-a2e4-9f6a3e00db45	Galaxy A51	\N	\N	\N	\N	2026-01-27 13:21:26.684103	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:26.684103	\N	{SM-A515F}
1571e8b4-3b7b-4495-bd32-dbece658a5e9	Galaxy A51 5G	\N	\N	\N	\N	2026-01-27 13:21:26.830996	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:26.830996	\N	{SM-A516B}
26e1d591-ddf0-45ec-adbe-e7ec0837b64a	Galaxy A31	\N	\N	\N	\N	2026-01-27 13:21:26.979104	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:26.979104	\N	{SM-A315F}
1c61dfa3-22fb-4e3f-af11-75bb84bc85c2	Galaxy A11	\N	\N	\N	\N	2026-01-27 13:21:27.130326	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:27.130326	\N	{SM-A115F}
abd0d6bb-58c7-42bb-a27e-bb353d1a13a8	Galaxy A50	\N	\N	\N	\N	2026-01-27 13:21:27.276211	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:27.276211	\N	{SM-A505F}
581c21df-fcd1-438d-b93b-8cf0101b00e0	Galaxy A50s	\N	\N	\N	\N	2026-01-27 13:21:27.422691	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:27.422691	\N	{SM-A507F}
c046207d-7b45-438f-bbd2-52f1c135e36c	Galaxy A30	\N	\N	\N	\N	2026-01-27 13:21:27.56997	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:27.56997	\N	{SM-A305F}
3b8d9129-389b-40d7-a68a-d26566ffbfee	Galaxy A30s	\N	\N	\N	\N	2026-01-27 13:21:27.717471	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:27.717471	\N	{SM-A307F}
86223826-f578-4942-af6e-6db0f991140c	Galaxy A10	\N	\N	\N	\N	2026-01-27 13:21:27.863442	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:27.863442	\N	{SM-A105F}
f6ed3bca-fc41-47cd-931d-e30b775b8ef6	Galaxy A10s	\N	\N	\N	\N	2026-01-27 13:21:28.009905	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.009905	\N	{SM-A107F}
edebb560-6fae-4315-abc4-66d2482dd5d1	Galaxy A9 (2018)	\N	\N	\N	\N	2026-01-27 13:21:28.156327	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.156327	\N	{SM-A920F}
ce32544c-3bfe-4e5a-8230-fe455871801d	Galaxy A8 (2018)	\N	\N	\N	\N	2026-01-27 13:21:28.307063	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.307063	\N	{SM-A530F}
a7685fd5-5bba-42c4-b77b-7756a0db84e2	Galaxy A8+ (2018)	\N	\N	\N	\N	2026-01-27 13:21:28.453624	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.453624	\N	{SM-A730F}
1452ab2e-08c7-45a6-959a-171a6122eda0	Galaxy A7 (2018)	\N	\N	\N	\N	2026-01-27 13:21:28.599781	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.599781	\N	{SM-A750F}
c666d49b-840a-4e25-b827-b733c1e65e8c	Galaxy Note 9	\N	\N	\N	\N	2026-01-27 13:21:28.745489	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.745489	\N	{SM-N960F}
e874f2ef-3a29-45ce-97bd-0327d13e1b0e	Galaxy Note 10	\N	\N	\N	\N	2026-01-27 13:21:28.891381	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:28.891381	\N	{SM-N970F}
c72461a9-5a5e-4b41-9122-1ec18e11ecd6	Galaxy Note 10+	\N	\N	\N	\N	2026-01-27 13:21:29.037221	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:29.037221	\N	{SM-N975F}
07da55b1-d79d-4b96-ba36-4e5703c0dc63	Galaxy Note 20	Samsung	Smartphone	\N	\N	2025-11-25 13:23:34.003245	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:29.149	\N	{SM-N980F}
c1114eda-b5ab-4bed-ae1e-5a20f066b631	Galaxy Note 20 Ultra 5G	\N	\N	\N	\N	2026-01-27 13:21:29.329297	7aabfa6e-34ff-4cc3-af18-f6e8f9b3351a	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:29.329297	\N	{SM-N986B}
0dc5e604-3eb0-409f-b670-e9bbbf2920f5	MacBook Air 13" (M3, 2024)	\N	\N	\N	\N	2026-01-27 13:22:06.826417	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:06.826417	\N	{A3113}
2d27d9c9-545e-401f-9073-f81668b2f9fc	MacBook Air 15" (M3, 2024)	\N	\N	\N	\N	2026-01-27 13:22:06.972087	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:06.972087	\N	{A3114}
b2a79841-09f3-4faa-b97a-b4044f3f94ef	MacBook Air 13" (M2, 2022)	\N	\N	\N	\N	2026-01-27 13:22:07.117709	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.117709	\N	{A2681}
f22af904-149a-4993-8875-0255ab28fe2e	MacBook Air 15" (M2, 2023)	\N	\N	\N	\N	2026-01-27 13:22:07.263481	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.263481	\N	{A2941}
b2a47bdd-b2e9-4576-8484-47a82980a650	MacBook Air 13" (M1, 2020)	\N	\N	\N	\N	2026-01-27 13:22:07.409257	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.409257	\N	{A2337}
7a7a21c2-0cd6-48d7-b201-248f25c0147e	MacBook Air 13" (Intel, 2020)	\N	\N	\N	\N	2026-01-27 13:22:07.554605	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.554605	\N	{A2179}
02621263-3bc7-4f19-a3e3-e984773a292e	MacBook Air 13" (Intel, 2019)	\N	\N	\N	\N	2026-01-27 13:22:07.69877	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.69877	\N	{A1932}
3f0feaac-f0eb-4df4-bbac-2ae875a7ea11	MacBook Air 13" (Early 2017)	\N	\N	\N	\N	2026-01-27 13:22:07.845376	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.845376	\N	{A1466}
629539b1-ac4a-4222-9e37-e64b439bfe34	MacBook Air 11" (Early 2015)	\N	\N	\N	\N	2026-01-27 13:22:07.994234	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:07.994234	\N	{A1465}
542d4c3e-3fe5-4b79-a66f-72323a55d702	MacBook Air 11" (Late 2010)	\N	\N	\N	\N	2026-01-27 13:22:08.139768	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:08.139768	\N	{A1370}
57240f3d-adf7-42e8-809c-1501ac652006	MacBook Air 13" (Late 2010)	\N	\N	\N	\N	2026-01-27 13:22:08.285346	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:08.285346	\N	{A1369}
d5f3270a-6b9b-4d1c-ba2e-188775265a8c	MacBook Pro 14" (M3, 2023)	\N	\N	\N	\N	2026-01-27 13:22:08.43039	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:08.43039	\N	{A2992}
f43ce50e-52e3-42e3-96f4-270d86b9e2d8	MacBook Pro 16" (M3, 2023)	\N	\N	\N	\N	2026-01-27 13:22:08.575421	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:08.575421	\N	{A2991}
76f223d1-f673-4eae-9c64-cd74312fa575	MacBook Pro 14" (M2 Pro/Max, 2023)	\N	\N	\N	\N	2026-01-27 13:22:08.720756	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:08.720756	\N	{A2779}
246a647b-5c1e-4032-96ca-e18347ef0347	MacBook Pro 13" (M2, 2022)	\N	\N	\N	\N	2026-01-27 13:22:08.869377	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:08.869377	\N	{A2338}
0326d368-bba4-465d-aaf7-15f00dc1a797	MacBook Pro 14" (M1 Pro/Max, 2021)	\N	\N	\N	\N	2026-01-27 13:22:09.014856	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.014856	\N	{A2442}
01dc5a95-fc1f-4647-9166-ee2e26621034	MacBook Pro 16" (M1 Pro/Max, 2021)	\N	\N	\N	\N	2026-01-27 13:22:09.159767	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.159767	\N	{A2485}
19a6f071-ada9-446e-95c0-6ff672c6d813	MacBook Pro 16" (2019)	\N	\N	\N	\N	2026-01-27 13:22:09.303771	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.303771	\N	{A2141}
e65aae02-f855-4161-9fd0-90537ec528bf	MacBook Pro 15" (2019)	\N	\N	\N	\N	2026-01-27 13:22:09.44913	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.44913	\N	{A1990}
622382eb-04db-4fb7-baab-29b45e64b23f	MacBook Pro 13" (2020 – 4 Thunderbolt)	\N	\N	\N	\N	2026-01-27 13:22:09.594644	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.594644	\N	{A2251}
6a02dcbc-e760-4bf6-a7be-9135865a47ab	MacBook Pro 13" (2020 – 2 Thunderbolt)	\N	\N	\N	\N	2026-01-27 13:22:09.74043	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.74043	\N	{A2289}
f6ef30b4-a5fd-4d0a-98b5-ddb0d0d02e45	MacBook Pro 13" (2019)	\N	\N	\N	\N	2026-01-27 13:22:09.884732	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:09.884732	\N	{A2159}
23a298df-4a66-4993-94b0-21cef5502025	MacBook Pro 13" (2018)	\N	\N	\N	\N	2026-01-27 13:22:10.032299	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.032299	\N	{A1989}
b53a1b75-2983-4f86-8f3f-4ecf2ab7583a	MacBook Pro 13" (2017 – 4 TB)	\N	\N	\N	\N	2026-01-27 13:22:10.178128	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.178128	\N	{A1706}
59e2fec1-53eb-41f7-beb0-71c2705acf0c	MacBook Pro 13" (2017 – 2 TB)	\N	\N	\N	\N	2026-01-27 13:22:10.322994	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.322994	\N	{A1708}
c1bad638-6d7a-4f70-a19c-f59a4d383d07	MacBook Pro 15" (2017)	\N	\N	\N	\N	2026-01-27 13:22:10.468563	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.468563	\N	{A1707}
e6327362-4412-4647-b251-7aed69639ffe	MacBook Pro 13" Retina (Early 2015)	\N	\N	\N	\N	2026-01-27 13:22:10.615006	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.615006	\N	{A1502}
a4774eab-2429-41d0-a1d8-ad12d5ae1479	MacBook Pro 15" Retina (Mid 2015)	\N	\N	\N	\N	2026-01-27 13:22:10.760743	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.760743	\N	{A1398}
301c877f-aca9-48e1-98d7-093b7acd4570	MacBook Pro 13" Retina (Late 2012 / Early 2013)	\N	\N	\N	\N	2026-01-27 13:22:10.905454	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:10.905454	\N	{A1425}
432f8af0-6aa9-41e4-9cff-f6fc247cb1ba	MacBook Pro 13" Unibody (Mid 2012)	\N	\N	\N	\N	2026-01-27 13:22:11.050672	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:11.050672	\N	{A1278}
162777a7-7c3b-4838-88dc-09ce50dc4e52	MacBook Pro 15" Unibody (Mid 2012)	\N	\N	\N	\N	2026-01-27 13:22:11.198247	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:11.198247	\N	{A1286}
39e4937e-ec98-4e8b-b57e-b603d38d2739	MacBook Pro 17" Unibody (2011)	\N	\N	\N	\N	2026-01-27 13:22:11.343349	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:11.343349	\N	{A1297}
0dd3ac3a-dc5e-4baf-8160-1de53df77359	MacBook Retina 12" (2017)	\N	\N	\N	\N	2026-01-27 13:22:11.489851	ad777972-7eba-47f8-a471-c41659da0514	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	2026-01-27 13:22:11.489851	\N	{A1534}
b5ccb226-6a87-4703-b688-426c6ce10343	Mac mini (M2, 2023)	\N	\N	\N	\N	2026-01-27 13:22:11.707511	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:11.707511	\N	{A2816}
86814ed7-3c88-4ac0-a11a-c2ee4dcaf32b	Mac mini (M2 Pro, 2023)	\N	\N	\N	\N	2026-01-27 13:22:11.853015	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:11.853015	\N	{A2817}
3dfb3187-605f-4a25-b658-be826b52945a	Mac mini (M1, 2020)	\N	\N	\N	\N	2026-01-27 13:22:11.99943	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:11.99943	\N	{A2348}
44481fa1-0223-4e3a-86e9-67af47c66b32	Mac mini (Intel, 2018)	\N	\N	\N	\N	2026-01-27 13:22:12.144274	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:12.144274	\N	{A1993}
c2a08973-4edf-459f-82d9-7d7b665d5fc2	Mac mini (Late 2014)	\N	\N	\N	\N	2026-01-27 13:22:12.290266	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:12.290266	\N	{A1347}
776fb2cd-c4ab-437b-a58b-8b9edd045536	Mac mini (Early 2009)	\N	\N	\N	\N	2026-01-27 13:22:12.435183	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:12.435183	\N	{A1283}
1dbb0b22-995c-4f6f-8aa8-ff5cbd5b037a	Mac mini (Early 2006 / 2007)	\N	\N	\N	\N	2026-01-27 13:22:12.578997	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:12.578997	\N	{A1176}
8b515051-9080-4c59-a43b-c0db6ed256dd	iMac 24" (M3, 2023)	\N	\N	\N	\N	2026-01-27 13:22:12.722943	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:12.722943	\N	{A2874}
81d40681-9acd-4a7f-8694-19701ad92ab8	iMac 24" (M1, 2021)	\N	\N	\N	\N	2026-01-27 13:22:12.866735	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:12.866735	\N	{A2438}
ab2350b4-33c4-4ad0-8116-1cbabcf4b095	iMac 27" (2020)	\N	\N	\N	\N	2026-01-27 13:22:13.013586	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.013586	\N	{A2115}
8a130e3c-8d74-49bf-b6df-f2af2c445d10	iMac 21.5" (2019)	\N	\N	\N	\N	2026-01-27 13:22:13.158984	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.158984	\N	{A2116}
031a916f-0387-4f58-8505-55bb1afe2267	iMac Pro 27" (2017)	\N	\N	\N	\N	2026-01-27 13:22:13.304231	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.304231	\N	{A1862}
c26cfcc5-6060-439a-bf44-4a24d8762c95	iMac 27" (2017)	\N	\N	\N	\N	2026-01-27 13:22:13.448741	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.448741	\N	{A1419}
e5b3511c-906c-4160-a1ee-4bc697195685	iMac 21.5" (2017)	\N	\N	\N	\N	2026-01-27 13:22:13.59668	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.59668	\N	{A1418}
a8c33571-cc53-40cf-bb47-0b004d79e34e	iMac 27" (Mid 2011)	\N	\N	\N	\N	2026-01-27 13:22:13.754291	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.754291	\N	{A1312}
6a773134-64b9-4ca5-8ce9-c25de7063d4c	iMac 21.5" (Mid 2011)	\N	\N	\N	\N	2026-01-27 13:22:13.903964	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:13.903964	\N	{A1311}
e89d92c0-0fba-4c65-b6c7-bb182ee1dbbc	Mac Pro (Apple Silicon, 2023)	\N	\N	\N	\N	2026-01-27 13:22:14.048808	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:14.048808	\N	{A2786}
05975d9e-a6cf-4914-9678-f15ece87ff17	Mac Pro (2019)	\N	\N	\N	\N	2026-01-27 13:22:14.193653	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:14.193653	\N	{A1991}
7d25c8b7-272f-4139-bd45-50fda49d110e	Mac Pro (Late 2013 – cilindrico)	\N	\N	\N	\N	2026-01-27 13:22:14.337768	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:14.337768	\N	{A1481}
1c94e42a-f97c-401b-91b3-fe67b5c50b9e	Mac Pro (Early 2009 – Mid 2012)	\N	\N	\N	\N	2026-01-27 13:22:14.483002	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:14.483002	\N	{A1289}
55dd7f3b-ecb5-420e-92c9-9203f3a31e16	Mac Pro (2006 – 2008)	\N	\N	\N	\N	2026-01-27 13:22:14.628001	ad777972-7eba-47f8-a471-c41659da0514	b8e7d07b-1502-439e-9166-222bb3e0376b	t	2026-01-27 13:22:14.628001	\N	{A1186}
a9166b5a-37c2-447d-be7f-1953d0967da0	iPhone XS	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:45.047	\N	{A1920,A2097,A2098,A2099,A2100}
5cc0c610-5b23-481f-bb1f-da22af68553b	iPhone XS Max	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:45.518	\N	{A1921,A2101,A2102,A2103,A2104}
c5c89d21-ba3c-41d9-b450-96ee5b239476	iPhone 11 Pro	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:46.098	\N	{A2160,A2215,A2217}
81fe2d74-770b-4835-8b36-713fa9ba6b38	iPhone 11 Pro Max	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:46.388	\N	{A2161,A2218,A2220}
3298a5f9-42a9-4625-99aa-41b1e7f7605c	iPhone 12	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:47.115	\N	{A2172,A2402,A2403,A2404}
79dbb374-8e2d-4992-9043-146ffec17293	iPhone 12 Pro	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:47.478	\N	{A2341,A2406,A2407,A2408}
bbdd42a2-90f3-4ece-aeb3-66e55a9a1acd	iPhone 12 Pro Max	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:47.841	\N	{A2342,A2410,A2411,A2412}
b832f091-c928-448c-b016-95a1a0cd025f	iPhone 13	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:48.714	\N	{A2482,A2631,A2633,A2634,A2635}
d21aed47-6e18-457c-aff2-c5c13f2f329e	iPhone 13 Pro	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:49.148	\N	{A2483,A2636,A2638,A2639,A2640}
e2eaf2da-df76-443b-856c-f086c45e2835	iPhone 14	Apple	Smartphone	\N	\N	2025-11-25 00:13:13.537614	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:50.021	\N	{A2649,A2881,A2882,A2883,A2884}
31e76391-2e66-4b52-bfa2-523235f55004	iPhone 14 Plus	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:50.454	\N	{A2632,A2885,A2886,A2887,A2888}
9273400a-6af3-4807-8746-1f518ecef6c3	iPhone 14 Pro Max	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:51.104	\N	{A2651,A2893,A2894,A2895,A2896}
c9ed1df3-c557-4085-a3dd-7a96996120ba	iPhone 15	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:51.464	\N	{A2846,A3089,A3090,A3092}
b6fcad10-a6eb-4862-b6e1-de94a9d76666	iPhone 15 Plus	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:51.826	\N	{A2847,A3093,A3094,A3096}
ce27ba59-c514-4f44-8aca-ccad5ba55e00	iPhone 15 Pro Max	Apple	Smartphone	\N	\N	2025-11-25 00:13:13.367519	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:52.548	\N	{A2849,A3105,A3106,A3108}
6e89d4eb-2069-4c57-8695-99fcf15c88ca	iPhone XR	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:44.613	\N	{A1984,A2105,A2106,A2107,A2108}
5fe5ada3-31b7-4cfc-b83d-bfeee1cbdf35	iPhone 11	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:45.808	\N	{A2111,A2221,A2223}
8672da78-bcfc-4263-9cb7-9e3c04f7075a	iPhone 12 mini	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:46.749	\N	{A2176,A2398,A2399,A2400}
90c553a6-8a8a-4927-b2c7-b01436adb199	iPhone 13 mini	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:48.278	\N	{A2481,A2626,A2628,A2629,A2630}
b038b6b9-5b1c-4d1f-8a09-7001c0c6c5fa	iPhone 13 Pro Max	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:49.584	\N	{A2484,A2641,A2643,A2644,A2645}
143a547c-255c-481a-9573-4fb4cb153686	iPhone 14 Pro	Apple	Smartphone	\N	\N	2025-11-25 13:23:12.128888	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:50.887	\N	{A2650,A2889,A2890,A2891,A2892}
0ecf4a3b-2d38-4b0c-9242-51a2fb9c3510	iPhone 15 Pro	Apple	Smartphone	\N	\N	2025-11-25 00:13:13.463271	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:52.189	\N	{A2848,A3101,A3102,A3104}
c9cf2172-76f0-476a-8af4-9c1edf5ffc1e	iPhone 17	\N	\N	\N	\N	2026-01-27 13:21:52.944793	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:52.944793	\N	{A3258,A3519,A3520,A3521}
77e70a9f-d9e2-4dc6-b3f7-bfd1e4407de3	iPhone 17 Pro	\N	\N	\N	\N	2026-01-27 13:21:53.308374	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:53.308374	\N	{A3256,A3522,A3523,A3524}
15f1e9df-6f65-4b3e-b6b5-a008a9622c52	iPhone 17 Pro Max	\N	\N	\N	\N	2026-01-27 13:21:53.672052	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:53.672052	\N	{A3257,A3525,A3526,A3527}
c7f8cdea-757e-4c72-866c-a6123c741157	iPhone 17 Air	\N	\N	\N	\N	2026-01-27 13:21:54.033438	ad777972-7eba-47f8-a471-c41659da0514	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	2026-01-27 13:21:54.033438	\N	{A3260,A3516,A3517,A3518}
300b285d-c3b0-42a3-a505-440438c69b49	iPad Pro 13" (M4)	\N	\N	\N	\N	2026-01-27 13:21:54.403474	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:54.403474	\N	{A2925,A2926,A3007}
176da99b-0463-477f-8d57-a404a8c73d65	iPad Pro 11" (M4)	\N	\N	\N	\N	2026-01-27 13:21:54.69428	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:54.69428	\N	{A2836,A2837,A3006}
a2a6481b-87f6-4ef5-9fd8-784914ecd427	iPad Pro 12.9" (6ª gen)	\N	\N	\N	\N	2026-01-27 13:21:55.057367	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:55.057367	\N	{A2436,A2437,A2764,A2766}
fe6dce7e-04c8-4fd1-963b-f778595dda54	iPad Pro 11" (4ª gen)	\N	\N	\N	\N	2026-01-27 13:21:55.41908	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:55.41908	\N	{A2435,A2759,A2761,A2762}
7f3971ee-589e-4519-8f82-f6f63076035b	iPad Pro 12.9" (5ª gen)	\N	\N	\N	\N	2026-01-27 13:21:55.780923	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:55.780923	\N	{A2378,A2379,A2461,A2462}
7c352215-b78a-4ae5-b990-4e06c1d6f53d	iPad Pro 11" (3ª gen)	\N	\N	\N	\N	2026-01-27 13:21:56.142451	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:56.142451	\N	{A2301,A2377,A2459,A2460}
7447c076-fa73-4aef-93ad-2908af7e8965	iPad Pro 12.9" (4ª gen)	\N	\N	\N	\N	2026-01-27 13:21:56.504409	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:56.504409	\N	{A2069,A2229,A2232,A2233}
52b5d556-aaae-48f9-b94e-760ed68b58e5	iPad Pro 11" (2ª gen)	\N	\N	\N	\N	2026-01-27 13:21:56.864394	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:56.864394	\N	{A2068,A2228,A2230,A2231}
f49eff78-6f01-48ea-8052-28998a90b7db	iPad Pro 12.9" (3ª gen)	\N	\N	\N	\N	2026-01-27 13:21:57.225221	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:57.225221	\N	{A1876,A1895,A1983,A2014}
d3dd963d-442c-4ce9-b3db-f76375ae7d0f	iPad Pro 11" (1ª gen)	\N	\N	\N	\N	2026-01-27 13:21:57.585844	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:57.585844	\N	{A1934,A1979,A1980,A2013}
21c4ff22-b212-4aa8-ab22-7c9511acb26d	iPad Air 13" (M2)	\N	\N	\N	\N	2026-01-27 13:21:57.873712	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:57.873712	\N	{A2898,A2899,A2900}
aa54635a-e059-4bf9-b929-c9b1c249bf1e	iPad Air 11" (M2)	\N	\N	\N	\N	2026-01-27 13:21:58.178559	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:58.178559	\N	{A2902,A2903,A2904}
7d510be2-18d8-436d-a814-8ef925816350	iPad Air (5ª gen)	\N	\N	\N	\N	2026-01-27 13:21:58.469504	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:58.469504	\N	{A2588,A2589,A2591}
44b4879a-b9b4-459a-9807-acdab7a6217c	iPad Air (4ª gen)	\N	\N	\N	\N	2026-01-27 13:21:58.832076	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:58.832076	\N	{A2072,A2316,A2324,A2325}
aad0685c-2122-4ce5-aa96-e4ba9fe05abc	iPad Air (3ª gen)	\N	\N	\N	\N	2026-01-27 13:21:59.193404	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:59.193404	\N	{A2123,A2152,A2153,A2154}
5a5ec2ce-850c-413b-a5f1-f1035ce3ee79	iPad (10ª gen)	\N	\N	\N	\N	2026-01-27 13:21:59.485995	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:59.485995	\N	{A2696,A2757,A2777}
74f21052-062e-4c82-b1b8-596234a303dc	iPad (9ª gen)	\N	\N	\N	\N	2026-01-27 13:21:59.776249	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:21:59.776249	\N	{A2602,A2603,A2604}
30cb94cb-6378-46e3-8441-3a573f932ac1	iPad (8ª gen)	\N	\N	\N	\N	2026-01-27 13:22:00.067353	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:00.067353	\N	{A2270,A2428,A2429}
7a5c3e5e-a2f9-400e-9926-28865b01f7c1	iPad (7ª gen)	\N	\N	\N	\N	2026-01-27 13:22:00.359465	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:00.359465	\N	{A2197,A2198,A2200}
cb24307e-9165-4ff5-a9c0-d22476a92c41	iPad (6ª gen)	\N	\N	\N	\N	2026-01-27 13:22:00.581951	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:00.581951	\N	{A1893,A1954}
19cc74a4-ac08-450a-9075-af2162c3ad07	iPad (5ª gen)	\N	\N	\N	\N	2026-01-27 13:22:00.799996	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:00.799996	\N	{A1822,A1823}
64e72548-018d-40d3-8680-f6b6ab79996e	iPad mini (6ª gen)	\N	\N	\N	\N	2026-01-27 13:22:01.090785	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:01.090785	\N	{A2567,A2568,A2569}
3c827360-1eb3-4a27-bd4a-c30d417babc2	iPad mini (5ª gen)	\N	\N	\N	\N	2026-01-27 13:22:01.453388	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:01.453388	\N	{A2124,A2125,A2126,A2133}
daf7c09a-a61b-4eff-9a55-e312dc59b0b4	iPad mini 4	\N	\N	\N	\N	2026-01-27 13:22:01.672574	ad777972-7eba-47f8-a471-c41659da0514	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	2026-01-27 13:22:01.672574	\N	{A1538,A1550}
7f32d262-dcdc-4a6b-8370-d4b9791b4571	Apple Watch Series 9 (41mm)	\N	\N	\N	\N	2026-01-27 13:22:02.037966	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:02.037966	\N	{A2978,A2980,A2982}
b03ede96-15ee-48bb-8d4d-01877ed914a2	Apple Watch Series 9 (45mm)	\N	\N	\N	\N	2026-01-27 13:22:02.32541	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:02.32541	\N	{A2984,A2986,A2988}
4f1ff6cd-668b-46ae-b932-558f63412210	Apple Watch Series 8 (41mm)	\N	\N	\N	\N	2026-01-27 13:22:02.615047	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:02.615047	\N	{A2770,A2772,A2774}
9d8375be-c1b8-4866-8b52-d78761768422	Apple Watch Series 8 (45mm)	\N	\N	\N	\N	2026-01-27 13:22:02.905075	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:02.905075	\N	{A2776,A2778,A2780}
db58853c-c400-4bb4-91d7-db9fc51c1b11	Apple Watch Series 7 (41mm)	\N	\N	\N	\N	2026-01-27 13:22:03.193885	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:03.193885	\N	{A2473,A2474,A2476}
c318889f-15ae-4311-9752-a88c0b25cc2d	Apple Watch Series 7 (45mm)	\N	\N	\N	\N	2026-01-27 13:22:03.483683	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:03.483683	\N	{A2477,A2478,A2480}
f3809ab1-5812-4e28-9ed2-4fab3ab59129	Apple Watch Series 6 (40mm)	\N	\N	\N	\N	2026-01-27 13:22:03.773223	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:03.773223	\N	{A2291,A2293,A2375}
fd3c123c-c1d7-473b-8570-97babbe1c797	Apple Watch Series 6 (44mm)	\N	\N	\N	\N	2026-01-27 13:22:04.063818	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:04.063818	\N	{A2292,A2294,A2376}
d471d36a-e74d-4af4-b628-36bf06aa6be5	Apple Watch Series 5 (40mm)	\N	\N	\N	\N	2026-01-27 13:22:04.355202	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:04.355202	\N	{A2092,A2093,A2156}
43ee4bd7-84aa-4d25-8b84-c27c5a610ef5	Apple Watch Series 5 (44mm)	\N	\N	\N	\N	2026-01-27 13:22:04.645875	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:04.645875	\N	{A2094,A2095,A2157}
7ddb2faa-f847-48d2-9e51-ce013ed95b61	Apple Watch Series 4 (40mm)	\N	\N	\N	\N	2026-01-27 13:22:04.935413	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:04.935413	\N	{A1977,A1978,A2007}
6f2f6953-8d4e-424b-9aff-0e96b6c9d9f0	Apple Watch Series 3 (38mm)	\N	\N	\N	\N	2026-01-27 13:22:05.153973	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:05.153973	\N	{A1860,A1889}
79da2c7d-657b-493b-a249-d1daf4f7b958	Apple Watch Series 3 (42mm)	\N	\N	\N	\N	2026-01-27 13:22:05.371813	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:05.371813	\N	{A1861,A1891}
b4547796-01c6-470e-82db-78b6346ebe97	Apple Watch SE (2ª gen – 40mm)	\N	\N	\N	\N	2026-01-27 13:22:05.589771	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:05.589771	\N	{A2722,A2723}
cd57ab3a-37cb-4317-8173-44ffd3f3cb23	Apple Watch SE (2ª gen – 44mm)	\N	\N	\N	\N	2026-01-27 13:22:05.807308	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:05.807308	\N	{A2724,A2725}
31e278b7-dfb9-4236-b22a-eab61110a23e	Apple Watch SE (1ª gen – 40mm)	\N	\N	\N	\N	2026-01-27 13:22:06.025335	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:06.025335	\N	{A2351,A2352}
4d74bf25-53a0-486d-a855-fabcc31ac417	Apple Watch SE (1ª gen – 44mm)	\N	\N	\N	\N	2026-01-27 13:22:06.244452	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:06.244452	\N	{A2353,A2354}
bb8a02ec-32df-4a6a-a9f6-8ef8888c5215	Apple Watch Ultra 2	Apple	Smartwatch	\N	\N	2025-11-25 13:26:13.007664	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:06.429	\N	{A2981,A2983}
bdc442b4-a463-44a9-a44b-684177fb42ae	Apple Watch Ultra	\N	\N	\N	\N	2026-01-27 13:22:06.680343	ad777972-7eba-47f8-a471-c41659da0514	7b4db345-71b3-4332-8223-57c1f5df76f0	t	2026-01-27 13:22:06.680343	\N	{A2622,A2684}
\.


--
-- Data for Name: device_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.device_types (id, name, description, is_active, created_at, updated_at) FROM stdin;
c8aab45b-4c23-47f1-835c-5c9afc46799d	Smartphone	Telefoni cellulari e smartphone	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
101c2d6d-eb55-42f5-96d7-cb059d926ca4	Tablet	Tablet e dispositivi touch	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
dfd146f2-08af-40fe-bd5b-6b0c851a6f76	Laptop	Computer portatili e notebook	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
7c151c62-6ff0-47c7-a619-23323067b1e6	Desktop	Computer fissi e all-in-one	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	TV	Televisori e monitor	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
7b4db345-71b3-4332-8223-57c1f5df76f0	Smartwatch	Orologi intelligenti e wearable	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	Console	Console da gioco	t	2025-11-25 00:01:33.311746	2025-11-25 00:01:33.311746
b8e7d07b-1502-439e-9166-222bb3e0376b	PC fisso	\N	t	2026-01-27 13:22:11.634543	2026-01-27 13:22:11.634543
\.


--
-- Data for Name: diagnostic_findings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.diagnostic_findings (id, name, description, category, device_type_id, is_active, sort_order, created_at, updated_at) FROM stdin;
df-hw-display-broken	Display rotto/crepato	\N	hardware	\N	t	1	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-display-lcd	LCD/pannello danneggiato	\N	hardware	\N	t	2	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-display-touch	Touch non funzionante	\N	hardware	\N	t	3	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-display-burn	Burn-in/immagini fantasma	\N	hardware	\N	t	4	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-display-lines	Linee/artefatti su schermo	\N	hardware	\N	t	5	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-battery-degraded	Batteria degradata	\N	hardware	\N	t	6	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-battery-swollen	Batteria gonfia	\N	hardware	\N	t	7	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-battery-drain	Consumo batteria eccessivo	\N	hardware	\N	t	8	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-charging-port	Porta ricarica danneggiata	\N	hardware	\N	t	9	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-charging-slow	Ricarica lenta	\N	hardware	\N	t	10	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-speaker-front	Altoparlante auricolare guasto	\N	hardware	\N	t	11	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-speaker-main	Altoparlante principale guasto	\N	hardware	\N	t	12	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-mic-main	Microfono principale guasto	\N	hardware	\N	t	13	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-mic-secondary	Microfono secondario guasto	\N	hardware	\N	t	14	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-cam-rear	Fotocamera posteriore guasta	\N	hardware	\N	t	15	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-cam-front	Fotocamera anteriore guasta	\N	hardware	\N	t	16	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-cam-flash	Flash non funzionante	\N	hardware	\N	t	17	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-button-power	Pulsante accensione guasto	\N	hardware	\N	t	18	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-button-volume	Pulsanti volume guasti	\N	hardware	\N	t	19	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-button-home	Tasto home guasto	\N	hardware	\N	t	20	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-vibration	Vibrazione non funzionante	\N	hardware	\N	t	21	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-wifi-antenna	Antenna WiFi danneggiata	\N	hardware	\N	t	22	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-bluetooth	Modulo Bluetooth guasto	\N	hardware	\N	t	23	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-cellular	Ricezione rete scarsa	\N	hardware	\N	t	24	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-gps	GPS non funzionante	\N	hardware	\N	t	25	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-nfc	NFC non funzionante	\N	hardware	\N	t	26	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-sensors	Sensori guasti	\N	hardware	\N	t	27	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-face-id	Face ID non funzionante	\N	hardware	\N	t	28	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-touch-id	Touch ID non funzionante	\N	hardware	\N	t	29	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-water-damage	Danni da liquidi	\N	hardware	\N	t	30	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-corrosion	Corrosione interna	\N	hardware	\N	t	31	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-hw-logic-board	Scheda madre danneggiata	\N	hardware	\N	t	32	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-crash	Crash sistema operativo	\N	software	\N	t	50	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-slow	Sistema lento	\N	software	\N	t	51	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-stuck	Blocco schermata (freeze)	\N	software	\N	t	52	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-boot-loop	Boot loop	\N	software	\N	t	53	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-no-boot	Non si avvia	\N	software	\N	t	54	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-recovery	Bloccato in modalità recovery	\N	software	\N	t	55	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-os-dfu	Bloccato in modalità DFU	\N	software	\N	t	56	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-update-failed	Aggiornamento fallito	\N	software	\N	t	57	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-factory-reset	Reset necessario	\N	software	\N	t	58	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-malware	Malware/virus rilevato	\N	software	\N	t	59	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-sw-app-crash	App che crashano	\N	software	\N	t	60	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-cn-no-signal	Nessun segnale rete	\N	connectivity	\N	t	70	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-cn-weak-signal	Segnale debole	\N	connectivity	\N	t	71	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-cn-sim-not-read	SIM non riconosciuta	\N	connectivity	\N	t	72	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-cn-wifi-no-connect	WiFi non si connette	\N	connectivity	\N	t	73	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-cn-wifi-disconnects	WiFi si disconnette	\N	connectivity	\N	t	74	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-cn-bluetooth-pair	Problemi abbinamento Bluetooth	\N	connectivity	\N	t	75	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
df-other	Altro (specificare)	\N	altro	\N	t	999	2025-11-25 14:03:30.242962	2025-11-25 14:03:30.242962
7110aa81-4b7b-4e76-bd9d-58296257f04a	Esempio problema	esempio	Hardware	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	0	2026-01-21 16:13:58.312868	2026-01-21 16:13:58.312868
99f741a0-07cb-4f7e-877d-de7c53280ba7	Display rotto/crepato	Il display presenta crepe, rotture o scheggiature visibili	Hardware	\N	t	1	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
080b28d7-fd1e-427d-afea-0c14d85cc09f	Display con macchie/pixel morti	Presenza di macchie, pixel morti o zone non funzionanti sul display	Hardware	\N	t	2	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
71bdc963-adff-4dcc-8df2-17e8067c8765	Touch non funzionante	Il touchscreen non risponde al tocco o risponde in modo irregolare	Hardware	\N	t	3	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
9d4ec6dd-779a-4046-8810-a24b78a49bc6	Touch parzialmente non funzionante	Il touchscreen non risponde in alcune aree specifiche	Hardware	\N	t	4	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
4173f3a0-75a5-4928-a998-8c9a3c0a0d5c	Altoparlante non funzionante	L'altoparlante non emette suono o il suono è distorto	Hardware	\N	t	5	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
9b890512-45d0-40a9-b0e5-70aa31a7d814	Microfono non funzionante	Il microfono non cattura audio durante le chiamate o registrazioni	Hardware	\N	t	6	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
8622aea7-fac6-456b-b86e-7dd2ebe1853e	Fotocamera posteriore difettosa	La fotocamera posteriore non funziona, produce immagini sfocate o ha artefatti	Hardware	\N	t	7	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
bad1b4ca-8e31-4cf4-9cb4-b55bdb3767b0	Fotocamera anteriore difettosa	La fotocamera anteriore/selfie non funziona o produce immagini di bassa qualità	Hardware	\N	t	8	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
f19ecfc6-d4d8-48a0-af19-22834d91f4ce	Vibrazione non funzionante	Il motore di vibrazione non funziona	Hardware	\N	t	9	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
39a64da4-829b-4466-b34f-e0aa8eda2e78	Pulsanti fisici non funzionanti	Uno o più pulsanti fisici (volume, accensione, home) non rispondono	Hardware	\N	t	10	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
1be7813c-d422-40c2-92a0-1dc38fa40d23	Connettore di ricarica difettoso	Il connettore di ricarica non funziona o ha contatto intermittente	Hardware	\N	t	11	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
53c98fe9-a672-4948-aa4b-1c5ab35eef4a	Jack audio difettoso	Il jack per le cuffie non funziona o ha contatto intermittente	Hardware	\N	t	12	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
94385553-7bfa-4ec6-b2ed-bff31e9ef648	Sensore di prossimità difettoso	Lo schermo non si spegne durante le chiamate	Hardware	\N	t	13	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
47de1322-52ea-4829-8b5b-f370ac22013f	Face ID / Touch ID non funzionante	Il sistema di riconoscimento biometrico non funziona	Hardware	\N	t	14	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
65f03403-53c6-4687-aa45-1a42f1c9288d	Antenna WiFi difettosa	Problemi di connessione WiFi, segnale debole o assente	Hardware	\N	t	15	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
c6f76aba-f589-4a39-aaa7-12d3d8b5b692	Antenna Bluetooth difettosa	Impossibile connettersi a dispositivi Bluetooth	Hardware	\N	t	16	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
473da6b8-5fb8-4206-ab7e-ef53a471e3be	GPS non funzionante	Il GPS non rileva la posizione o è impreciso	Hardware	\N	t	17	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
fd1deea4-d4e9-4cd0-8313-e52164b202ee	Scocca danneggiata	La scocca presenta ammaccature, graffi profondi o deformazioni	Hardware	\N	t	18	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
1a18a028-0a0a-4200-846e-47e390d479a3	Batteria scarica rapidamente	La batteria si scarica molto più velocemente del normale	Batteria	\N	t	20	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
c67cbae0-c163-4729-94de-7a1e0241a542	Batteria gonfia	La batteria è visibilmente gonfia e deforma il dispositivo	Batteria	\N	t	21	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
43b598cd-f643-4549-8502-7250d6463389	Dispositivo non si accende	Il dispositivo non si accende anche se collegato al caricatore	Batteria	\N	t	22	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
409c355b-05b3-43ec-89fb-f7fdfbf0ecc5	Ricarica lenta o intermittente	Il dispositivo si ricarica molto lentamente o la ricarica si interrompe	Batteria	\N	t	23	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
3a8a7897-1f88-482f-8e45-62e0f1e28d93	Sistema operativo corrotto	Il sistema operativo presenta errori gravi o non si avvia correttamente	Software	\N	t	30	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
ad205552-ec99-47ae-8270-b1c536085861	App si chiudono improvvisamente	Le applicazioni crashano frequentemente	Software	\N	t	31	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
fb2b0f95-2993-44ab-9695-aa1b57be3175	Dispositivo lento/lag	Il dispositivo è molto lento nelle operazioni quotidiane	Software	\N	t	32	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
ce11c482-7c8a-4095-ab5b-8af14681f81a	Blocco improvviso (freeze)	Il dispositivo si blocca frequentemente e richiede riavvio forzato	Software	\N	t	33	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
29366157-0b5d-4a1f-acff-18d5b5a40854	Problemi di aggiornamento	Impossibile aggiornare il sistema operativo	Software	\N	t	34	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
2adde7e5-c37e-4694-8396-7b65868243ce	Danno da liquidi	Il dispositivo è entrato in contatto con liquidi	Liquidi	\N	t	40	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
081a4bc7-b81c-43fb-ac2a-c47dafc45ce6	Corrosione interna	Presenza di corrosione sui componenti interni per esposizione a liquidi	Liquidi	\N	t	41	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
40a385e9-69fc-4723-85fa-0e4f651f954f	Nessun segnale rete mobile	Il dispositivo non rileva reti mobili (nessun segnale)	Rete	\N	t	50	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
39c321ef-facf-49ba-93f2-fc9f768212cd	SIM non rilevata	Il dispositivo non riconosce la scheda SIM inserita	Rete	\N	t	51	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
2235c460-880d-4a47-9a76-0f440ba86859	Chiamate senza audio	Durante le chiamate non si sente l'interlocutore o non si viene sentiti	Rete	\N	t	52	2026-02-20 14:34:19.932743	2026-02-20 14:34:19.932743
\.


--
-- Data for Name: entity_fiscal_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.entity_fiscal_config (id, entity_type, entity_id, rt_enabled, rt_api_key, rt_api_secret, rt_endpoint, use_own_credentials, created_at, updated_at, rt_entity_id, rt_system_id) FROM stdin;
a42bc58f-8ff8-402b-b70b-6ccef19a15b3	reseller	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	t	69958bf166015d013e0d9f88	EfXROS3RbCS6V206Y63vdpO4woZOnoNCILu0SDPhyaN	\N	t	2026-02-06 13:34:17.962493	2026-02-18 11:02:57.211871	MNKPLN26B18H501Z	bd230a89-9672-49bc-ae1a-a5bb9e7251d5
\.


--
-- Data for Name: estimated_repair_times; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.estimated_repair_times (id, name, description, hours_min, hours_max, device_type_id, is_active, sort_order, created_at, updated_at) FROM stdin;
ert-30min	30 minuti	Intervento rapido	0.5	0.5	\N	t	1	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-1h	1 ora	Riparazione semplice	1	1	\N	t	2	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-1h30	1 ora e 30 minuti	Riparazione semplice-media	1.5	1.5	\N	t	3	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-2h	2 ore	Riparazione media	2	2	\N	t	4	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-3h	3 ore	Riparazione media-complessa	3	3	\N	t	5	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-4h	4 ore	Riparazione complessa	4	4	\N	t	6	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-6h	6 ore	Riparazione molto complessa	6	6	\N	t	7	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-8h	8 ore (1 giorno)	Giornata intera di lavoro	8	8	\N	t	8	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-12h	12 ore (1.5 giorni)	Lavoro esteso	12	12	\N	t	9	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-16h	16 ore (2 giorni)	Due giorni di lavoro	16	16	\N	t	10	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-24h	24 ore (3 giorni)	Tre giorni di lavoro	24	24	\N	t	11	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-32h	32 ore (4 giorni)	Quattro giorni di lavoro	32	32	\N	t	12	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
ert-40h	40 ore (1 settimana)	Settimana di lavoro	40	40	\N	t	13	2025-11-25 14:39:26.64416	2025-11-25 14:39:26.64416
\.


--
-- Data for Name: expo_push_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expo_push_tokens (id, user_id, token, device_name, platform, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: external_integrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_integrations (id, code, name, description, logo_url, is_active, config_fields, default_api_endpoint, default_auth_method, supports_catalog, supports_ordering, supports_cart, docs_url, display_order, created_at, updated_at, supports_invoicing, supports_reconciliation, supports_accounts) FROM stdin;
1d55b941-2041-43b8-8254-6e389f36b164	sifar	SIFAR	Ordina ricambi per telefonia direttamente dal catalogo SIFAR	\N	t	\N	\N	\N	t	t	t	\N	1	2025-12-08 11:52:25.278101	2025-12-08 11:52:25.278101	f	f	f
8ffabe16-2b21-4dc2-9207-a937e9ae1ac7	ifixit	iFixit	Ricambi originali e kit riparazione da iFixit	\N	f	\N	\N	\N	t	t	f	\N	3	2025-12-08 11:52:25.278101	2025-12-08 11:52:25.278101	f	f	f
c5b9d071-4bc5-4b76-a14a-e9c29c0316bd	mobilax	Mobilax	Ricambi per dispositivi mobili da Mobilax	\N	f	\N	\N	\N	t	t	f	\N	4	2025-12-08 11:52:25.278101	2025-12-08 11:52:25.278101	f	f	f
6b0b098b-f612-4d17-a91e-172ef8ff1c80	foneday	Foneday	Ricambi e accessori per smartphone da Foneday.shop	\N	t	\N	\N	\N	t	t	f	\N	2	2025-12-08 11:52:25.278101	2025-12-09 23:24:06.173838	f	f	f
61e5aba8-854c-4df2-9fc3-d2218b2a5bb8	trovausati	TrovaUsati	Valutazioni dispositivi usati, marketplace ricondizionati e gestione coupon GDS	\N	t	\N	https://resellers.trovausati.it/api/v1	api_key	t	t	f	\N	5	2025-12-17 15:41:14.15866	2025-12-17 15:41:14.15866	f	f	f
0e6e659a-9ea1-45da-a402-d3d3bf1330bb	mobilesentrix	MobileSentrix	Ricambi premium per smartphone e tablet da MobileSentrix	\N	t	\N	\N	bearer_token	t	t	f	\N	5	2025-12-09 23:56:10.325108	2026-01-02 00:46:54.622	f	f	f
67a60a34-13a0-4c2a-b131-e2986fb7941e	sibill	Sibill	Gestione fatture, riconciliazione bancaria e monitoraggio finanziario	\N	t	\N	\N	\N	f	f	f	\N	0	2026-01-14 09:46:13.921625	2026-01-14 09:46:13.921625	t	t	t
116aa445-8bd2-4493-aca4-4b65372ccdf3	openapi_com	OpenAPI.com	Electronic receipts and invoices via OpenAPI.com — direct submission to Agenzia delle Entrate	\N	t	\N	\N	bearer_token	f	f	f	\N	8	2026-02-18 10:26:22.597142	2026-02-18 10:26:22.597142	t	f	f
\.


--
-- Data for Name: external_labs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.external_labs (id, name, code, address, city, phone, email, contact_person, api_endpoint, api_key, supports_api_integration, tracking_prefix, avg_turnaround_days, base_cost, notes, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: foneday_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.foneday_credentials (id, reseller_id, api_token, is_active, last_sync_at, last_test_at, test_status, test_message, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: foneday_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.foneday_orders (id, credential_id, foneday_order_number, status, shipment_method, tracking_number, total_incl_vat, paid, invoice_number, amount_of_products, total_products, order_data, foneday_created_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: foneday_products_cache; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.foneday_products_cache (id, reseller_id, products_data, total_products, last_sync_at, expires_at, sync_duration_ms, sync_status, sync_error, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_absences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_absences (id, user_id, reseller_id, absence_type, absence_date, expected_time, actual_time, minutes_lost, is_justified, auto_detected, related_clock_event_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_audit_logs (id, reseller_id, user_id, target_user_id, action, entity_type, entity_id, previous_data, new_data, ip_address, user_agent, created_at) FROM stdin;
0ee4a6c6-9f06-4b3e-a86d-6d42ac607012	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	update	leave_request	4ea90b9d-4365-439f-b68b-124fdaec5ac5	\N	\N	\N	\N	2026-01-29 16:16:11.029762
a2533527-6996-4ff6-b112-0b123e259d2d	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	update	expense_report	6dd3aacb-2ebb-4942-b3c4-c68388f17b1e	\N	\N	\N	\N	2026-01-29 22:42:51.817445
\.


--
-- Data for Name: hr_certificates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_certificates (id, user_id, reseller_id, certificate_type, related_sick_leave_id, file_name, file_url, file_size, mime_type, valid_from, valid_to, uploaded_by, notes, created_at) FROM stdin;
\.


--
-- Data for Name: hr_clock_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_clock_events (id, user_id, reseller_id, event_type, event_time, latitude, longitude, accuracy, device_info, policy_id, distance_from_location, status, validated_by, validated_at, validation_note, created_at) FROM stdin;
939fc972-c9f4-4baf-ac88-4cdfd0028a48	9cc5d774-98cb-421b-bb88-d1a9a5346977	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	entrata	2026-01-23 10:48:08.761	\N	\N	\N	\N	\N	\N	valid	\N	\N	\N	2026-01-23 10:48:08.794827
6bbd5a03-0aef-4844-b3f6-4b645f968f56	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	entrata	2026-01-27 14:28:31.584	\N	\N	\N	\N	\N	\N	valid	\N	\N	\N	2026-01-27 14:28:31.618552
\.


--
-- Data for Name: hr_clocking_policies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_clocking_policies (id, reseller_id, location_name, latitude, longitude, radius_meters, requires_geolocation, allow_manual_entry, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_expense_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_expense_items (id, expense_report_id, expense_date, category, description, amount, receipt_url, receipt_file_name, created_at) FROM stdin;
\.


--
-- Data for Name: hr_expense_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_expense_reports (id, user_id, reseller_id, report_number, title, description, total_amount, status, submitted_at, approved_by, approved_at, rejection_reason, paid_at, created_at, updated_at, receipt_url, receipt_file_name, repair_center_id) FROM stdin;
6dd3aacb-2ebb-4942-b3c4-c68388f17b1e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	asdfadfs		5700	draft	\N	\N	\N	\N	\N	2026-01-29 22:42:46.677175	2026-01-29 22:42:51.709	\N	\N	\N
\.


--
-- Data for Name: hr_justifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_justifications (id, absence_id, user_id, justification_text, status, reviewed_by, reviewed_at, review_note, created_at) FROM stdin;
\.


--
-- Data for Name: hr_leave_balances; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_leave_balances (id, user_id, reseller_id, leave_type, year, accrued, used, pending, carried_over, updated_at) FROM stdin;
\.


--
-- Data for Name: hr_leave_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_leave_requests (id, user_id, reseller_id, leave_type, start_date, end_date, start_time, end_time, is_full_day, total_hours, total_days, reason, status, approved_by, approved_at, rejection_reason, created_at, updated_at) FROM stdin;
4ea90b9d-4365-439f-b68b-124fdaec5ac5	9cc5d774-98cb-421b-bb88-d1a9a5346977	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	ferie	2026-01-23 00:00:00	2026-01-24 00:00:00	\N	\N	t	16	2		approved	\N	\N	\N	2026-01-23 10:53:17.045668	2026-01-29 16:16:10.901
\.


--
-- Data for Name: hr_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_notifications (id, reseller_id, recipient_id, channel, subject, message, is_broadcast, target_filters, sent_at, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: hr_sick_leaves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_sick_leaves (id, user_id, reseller_id, start_date, end_date, protocol_number, certificate_required, certificate_uploaded, certificate_deadline, validated_by, validated_at, notes, created_at, updated_at, status) FROM stdin;
22c32969-7d3f-47ee-83f0-e36ff588aeba	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-28 00:00:00	2026-01-29 00:00:00	\N	t	f	\N	\N	\N		2026-01-28 18:06:03.704576	2026-01-28 18:06:03.704576	pending
2f2ec6bf-5dd8-4e2c-b3d6-92a158c5237f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-29 00:00:00	2026-02-06 00:00:00	\N	t	f	\N	\N	\N		2026-01-29 16:26:17.771517	2026-01-29 22:41:49.242	confirmed
\.


--
-- Data for Name: hr_work_profile_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_work_profile_assignments (id, user_id, work_profile_id, valid_from, valid_to, assigned_by, created_at) FROM stdin;
\.


--
-- Data for Name: hr_work_profile_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_work_profile_versions (id, work_profile_id, version_number, weekly_hours, daily_hours, work_days, break_minutes, tolerance_minutes, valid_from, valid_to, changed_by, change_reason, created_at) FROM stdin;
\.


--
-- Data for Name: hr_work_profiles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hr_work_profiles (id, reseller_id, name, description, weekly_hours, daily_hours, work_days, break_minutes, tolerance_minutes, is_default, is_active, created_at, updated_at, start_time, end_time, source_type, source_entity_id, is_synced, last_synced_at, auto_sync_disabled) FROM stdin;
ef3f981e-4c59-4fe6-9a04-c46d11a12c9e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Orario Centro Riparazione Milano	Profilo sincronizzato automaticamente da Centro Riparazione Milano	48	8	[1, 2, 3, 4, 5, 6]	60	15	f	t	2026-01-30 09:27:46.699521	2026-01-30 09:27:46.699521	09:00	18:00	repair_center	c0f233d9-e60b-452c-8423-f8eb70dc10dc	t	2026-01-30 09:27:46.664	f
\.


--
-- Data for Name: inventory_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_movements (id, product_id, repair_center_id, movement_type, quantity, notes, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: inventory_stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inventory_stock (id, product_id, repair_center_id, quantity, updated_at) FROM stdin;
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, repair_order_id, customer_id, amount, tax, total, payment_status, payment_method, due_date, paid_date, notes, created_at, pos_transaction_id, repair_center_id, reseller_id, marketplace_order_id, source, vat_rate, remote_repair_request_id) FROM stdin;
6cdfd586-17b7-4a73-80d9-aadcae89b50d	FT-R-2026-00001	\N	3af078a6-01ce-4d7e-9268-1db16b60b82c	82	18	100	pending	bank_transfer	2026-02-21 16:02:28.418	\N	Fattura B2B per ordine MP-2026-00021	2026-01-22 16:02:28.453078	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
8aa82a5c-fa56-41eb-b5e0-cb106491e3ba	FT-R-2026-00011	\N	\N	164	36	200	pending	bank_transfer	2026-02-21 17:44:51.109	\N	Fattura B2B per ordine RC RCB2B-2026-00001	2026-01-22 17:44:51.1436	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
b7548756-0f2c-4399-a400-1ee31eabd1d0	FT-R-2026-00021	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	100	0	100	pending	bank_transfer	2026-02-25 16:59:06.672	\N	Fattura per ordine ORD-2026-000011	2026-01-26 16:59:06.706326	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	marketplace	22	\N
370c8fd8-9d81-474a-bdab-6b504c21f040	FT-R-2026-00031	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	0	0	0	pending	bank_transfer	2026-02-25 17:18:38.594	\N	Fattura per ordine ORD-2026-000001	2026-01-26 17:18:38.627848	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	marketplace	22	\N
b500ea79-c71f-414a-a3e9-731ca52e7221	FT-A-2026-00001	\N	3af078a6-01ce-4d7e-9268-1db16b60b82c	1229	270	1499	pending	bank_transfer	2026-03-04 16:40:51.307	\N	Fattura B2B Admin per ordine B2B-2026-00081	2026-02-02 16:40:51.341728	\N	\N	\N	\N	b2b	22	\N
292eee12-3eb2-4a2b-aef7-081938a402ba	FT-R-2026-00051	\N	\N	164	36	200	pending	bank_transfer	2026-03-04 16:59:04.85	\N	Fattura B2B per ordine RC RCB2B-2026-00071	2026-02-02 16:59:04.885532	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
a928ac62-d11b-413b-94db-cd26f30b5ee3	FT-R-2026-00041	\N	3af078a6-01ce-4d7e-9268-1db16b60b82c	246	54	300	pending	bank_transfer	2026-03-04 16:58:51.487	\N	Fattura B2B per ordine MP-2026-00101	2026-02-02 16:58:51.522033	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	e339ba4c-08ab-4a93-a2f0-8893637f9245	b2b	22	\N
6c1bfb11-ea8a-4927-8704-a7755ad81474	FT-R-2026-00061	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	10000	0	10000	pending	bank_transfer	2026-03-05 09:57:32.862	\N	Fattura per ordine ORD-TEST-001	2026-02-03 09:57:32.895847	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	marketplace	22	\N
332dbb8a-5358-4464-9efa-58aff7375059	FT-2026-00001	\N	\N	350	77	427	paid	bank_transfer	\N	2026-02-04 13:38:27.788	Fattura automatica per ordine Marketplace MP-2026-00181	2026-02-04 13:38:27.822206	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	other	22	\N
820f6d4b-f9b3-49bc-beb8-1de8d8f66de5	FT-R-2026-00081	\N	3af078a6-01ce-4d7e-9268-1db16b60b82c	350	77	427	paid	stripe	\N	2026-02-04 13:47:47.685	Fattura automatica per ordine Marketplace MP-2026-00201	2026-02-04 13:47:47.717901	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	other	22	\N
92d61835-c38f-4a1f-81de-40159a747276	FT-R-2026-00091	\N	\N	282	62	344	pending	bank_transfer	2026-03-06 14:42:45.303	\N	Fattura B2B per ordine RC RCB2B-2026-00141	2026-02-04 14:42:45.33682	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
b45de3a5-9567-42c0-b5dc-71aac7d4a425	FT-R-2026-00101	\N	\N	282	62	344	pending	bank_transfer	2026-03-06 14:47:53.077	\N	Fattura B2B per ordine RC RCB2B-2026-00151	2026-02-04 14:47:53.111119	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
e86cf860-e183-42f8-8220-7a1b83b2d1b3	FT-R-2026-00111	\N	\N	282	62	344	pending	stripe	2026-03-06 14:53:12.616	\N	Fattura B2B per ordine RC RCB2B-2026-00161	2026-02-04 14:53:12.64931	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
0ae8c3ad-cd16-4aaf-aadf-c1351e480b09	FT-R-2026-00121	\N	\N	182	40	222	pending	stripe	2026-03-06 15:48:31.042	\N	Fattura B2B per ordine RC RCB2B-2026-00211	2026-02-04 15:48:31.076195	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
4d622909-48ff-436a-b481-ac5f5fe49b14	FT-R-2026-00131	\N	\N	282	62	344	pending	stripe	2026-03-06 15:50:08.932	\N	Fattura B2B per ordine RC RCB2B-2026-00221	2026-02-04 15:50:08.965731	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	b2b	22	\N
f4b58c35-2dc0-4d0f-8a9e-a29ee3858c4a	FT-2026-00071	\N	3d7c8ab4-eba1-4878-860c-3f005e0d6118	1100	198	1100	paid	stripe_link	\N	2026-02-05 10:26:02.186	Fattura automatica da vendita POS POS-2602-0111	2026-02-05 10:26:02.221455	5c512cd5-a64b-4335-a27f-0d5d5c5f9db6	c0f233d9-e60b-452c-8423-f8eb70dc10dc	\N	\N	pos	22	\N
874aff16-7d09-4110-bcac-ceddd24e310f	FT-2026-00081	\N	3d7c8ab4-eba1-4878-860c-3f005e0d6118	1100	198	1100	paid	stripe_link	\N	2026-02-05 10:27:03.631	Fattura automatica da vendita POS POS-2602-0121	2026-02-05 10:27:03.665971	a9f0f582-77f1-4137-b98c-cef38d0d5c43	c0f233d9-e60b-452c-8423-f8eb70dc10dc	\N	\N	pos	22	\N
56d3ca13-5b03-4dec-b659-a93e3639c062	FT-2026-00091	\N	3d7c8ab4-eba1-4878-860c-3f005e0d6118	1100	198	1100	paid	stripe_link	\N	2026-02-05 10:27:15.411	Fattura automatica da vendita POS POS-2602-0131	2026-02-05 10:27:15.445278	a461c89b-e043-4c8b-a2ed-49cce9ddb70c	c0f233d9-e60b-452c-8423-f8eb70dc10dc	\N	\N	pos	22	\N
dbd0f2ac-e16a-4666-abd3-f0fcabf43ee8	FT-2026-00101	\N	3d7c8ab4-eba1-4878-860c-3f005e0d6118	1100	198	1100	paid	stripe_link	\N	2026-02-05 10:29:52.292	Fattura automatica da vendita POS POS-2602-0141	2026-02-05 10:29:52.325712	8baf7eb8-bfc7-45ec-bfe2-638e05f314f6	c0f233d9-e60b-452c-8423-f8eb70dc10dc	\N	\N	pos	22	\N
3364c184-132e-437e-8e75-dc0a70da40e7	FT-2026-00111	\N	3d7c8ab4-eba1-4878-860c-3f005e0d6118	1100	198	1100	paid	stripe_link	\N	2026-02-05 10:42:18.53	Fattura automatica da vendita POS POS-2602-0151	2026-02-05 10:42:18.563926	df505afd-4195-4c1a-85b9-61f3e698b884	c0f233d9-e60b-452c-8423-f8eb70dc10dc	\N	\N	pos	22	\N
de23022b-1161-452e-9ac1-efb554cdff76	FT-2026-00121	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	8197	1803	10000	paid	online_paypal	\N	2026-02-06 11:05:24.165	Fattura per richiesta remota #RRR-2026-00003	2026-02-06 11:05:24.20113	\N	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	remote_repair	22	7ac04ca0-25fe-461a-bd83-e35051d45e61
\.


--
-- Data for Name: issue_types; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.issue_types (id, name, description, device_type_id, is_active, sort_order, created_at, updated_at) FROM stdin;
5a560591-3963-4bc7-aa62-54f50f94048e	Schermo rotto/danneggiato	Display rotto, incrinato o con righe	\N	t	1	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
f1df4799-6eb9-4507-a886-ee0e3fda0711	Non si accende	Dispositivo non risponde all'accensione	\N	t	2	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
c219af50-d1de-4406-838b-22457e93e622	Problemi batteria	Batteria non carica, si scarica velocemente o gonfia	\N	t	3	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
c127e6ed-89d4-4e76-86af-bd2603218f09	Connettore di ricarica danneggiato	Porta di ricarica non funzionante	\N	t	4	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
6f286150-a682-4816-afcd-a05ff0b112f4	Danni da liquidi	Contatto con acqua o altri liquidi	\N	t	5	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
ecfd2f3c-20cf-4359-8878-7c15cf36a2d1	Problemi software/sistema	Blocchi, riavvii, lentezza eccessiva	\N	t	6	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a2f855ab-5cdf-4928-8288-ed563fc7df39	Problemi audio	Altoparlante, microfono o cuffie non funzionanti	\N	t	7	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a33a4b9e-7c15-4ed0-98ab-65cac3655178	Problemi WiFi/Bluetooth	Connettività wireless non funzionante	\N	t	8	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
2b17c8e1-4d31-404a-9f8d-eb9958dabcc0	Surriscaldamento	Dispositivo si scalda troppo	\N	t	9	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
faf507cd-05c2-40e1-8921-66442d6208f3	Altro	Altro problema non elencato	\N	t	100	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
558103d3-8c8c-4530-a8bf-f3c485e17c5c	Touch non funzionante	Schermo touch non risponde o risponde male	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
62d92dff-f1ad-4cb5-8b55-6f65aff38c19	Fotocamera non funziona	Fotocamera principale o frontale guasta	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
6207ddd8-94c4-4f4a-9912-ca9568d3cdcb	Face ID/Riconoscimento facciale	Sistema riconoscimento facciale non funziona	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
5f7894b3-e8e6-4ac6-86db-5ec48cf5a2e6	Sensore impronte non funziona	Lettore impronte digitali guasto	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
8a2f3c3c-b142-4368-91f1-73864cf21b17	SIM non riconosciuta	Problemi lettura scheda SIM	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
fb11e9c3-c26d-4858-896c-e2ddb5226ca5	Tasti volume/power non funzionano	Pulsanti fisici danneggiati	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a3260585-e376-415e-bf47-69585f8a0998	Vibrazione non funziona	Motore vibrazione guasto	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	16	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
6dd86c5c-75b7-436c-8a63-079a7c125495	Flash fotocamera non funziona	LED flash non si accende	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	17	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
69c1f2d7-282c-44f9-b505-9405f6a71e54	GPS non funziona	Localizzazione GPS non disponibile	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	18	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
8fe6748f-de37-4cdb-b116-784aa8dd1b0f	Rete mobile non funziona	Nessun segnale cellulare	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	19	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
d5beefc9-9859-4281-aef8-7ece071d4a97	Tastiera non funziona	Tasti non rispondono o tastiera danneggiata	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
caf9168f-c5d9-4e00-a351-0215ad5674b7	Trackpad/Touchpad non funziona	Trackpad non risponde o funziona male	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
8e2a69d9-7a9e-4320-9084-ec10e6719e6f	Cerniere rotte	Cerniere schermo danneggiate o rotte	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
738a55c3-1a5a-4141-94b8-716a70ca9b8a	Ventola rumorosa	Ventola di raffreddamento rumorosa o bloccata	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
ceef49af-871b-4d20-bfc5-7a45f4db9a50	SSD/HDD guasto	Disco rigido o SSD non riconosciuto	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a8b008e5-da42-4fa2-86df-0efbb29a6410	RAM difettosa	Memoria RAM non riconosciuta o difettosa	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
5f60d582-b12b-4b84-9b57-f55d4a70cb1b	Porta USB non funziona	Porte USB danneggiate	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	16	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
f3fc3fe0-2280-475e-909e-284bf40391c9	Webcam non funziona	Fotocamera integrata guasta	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	17	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
19b19180-de71-46f3-9537-04dadd779338	Alimentatore difettoso	Caricatore originale non funzionante	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	18	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
e90799e3-dd06-4308-bb4e-baac7d699d42	Schermo nero	Display acceso ma nero/nessuna immagine	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	19	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
26d442e5-a500-473f-8e9b-7d0bfe141f7b	Touch non funzionante	Schermo touch non risponde o risponde male	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
c3d2feff-0331-4241-9c0f-0c614323fc5f	Fotocamera non funziona	Fotocamera principale o frontale guasta	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
cc24b238-3ef2-4f04-87c2-0cb861c3b804	Tasti volume/power non funzionano	Pulsanti fisici danneggiati	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
626efee6-afd6-4a66-b46c-6f874f600600	Slot SIM/SD danneggiato	Lettore schede non funzionante	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
6d1c6a49-bb19-425f-8f9d-7e94e2d3f19b	Cover/scocca danneggiata	Danni estetici alla scocca	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
0f81f717-96be-4ca0-a020-b25f550e2dbe	Penna stylus non funziona	Problemi con pennino touch/stylus	101c2d6d-eb55-42f5-96d7-cb059d926ca4	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
23c394d1-bac5-4780-bf6e-4b0ed092aeac	PC non si avvia	Computer non si accende o si blocca all'avvio	7c151c62-6ff0-47c7-a619-23323067b1e6	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a78d27b7-edd0-440a-8d7c-3c2aa9deca21	Scheda video guasta	Problemi grafici o schermo nero	7c151c62-6ff0-47c7-a619-23323067b1e6	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
cf44ae61-0303-45f8-ba53-07b9c59f6c62	Alimentatore guasto	Alimentatore non funzionante	7c151c62-6ff0-47c7-a619-23323067b1e6	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
3712a401-493c-420c-9c7a-5f9f29dacdba	Scheda madre guasta	Motherboard con guasti	7c151c62-6ff0-47c7-a619-23323067b1e6	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
fd247f77-929b-49d3-9ce1-0a8a64f657db	Ventole rumorose	Ventole di raffreddamento rumorose	7c151c62-6ff0-47c7-a619-23323067b1e6	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
f5229dc1-4cc6-4cd2-b33d-6773be19a385	SSD/HDD guasto	Disco rigido o SSD non riconosciuto	7c151c62-6ff0-47c7-a619-23323067b1e6	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
268a7d52-17c2-47c7-b3ea-cffbebf24cbf	RAM difettosa	Memoria RAM non riconosciuta	7c151c62-6ff0-47c7-a619-23323067b1e6	t	16	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
d287c277-921f-4df1-a9c8-a231cb7e5d5e	Porte USB/HDMI guaste	Porte connessione non funzionanti	7c151c62-6ff0-47c7-a619-23323067b1e6	t	17	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
006f6dbc-b368-41ef-8c98-9a4909e3d5ed	Virus/Malware	Infezione da virus o malware	7c151c62-6ff0-47c7-a619-23323067b1e6	t	18	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
ed26ebc2-946b-4e20-beff-c6c05621d106	Display rotto	Schermo rotto o incrinato	7b4db345-71b3-4332-8223-57c1f5df76f0	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
66940020-93e4-4330-9209-63991784df8b	Cinturino rotto	Cinturino danneggiato o meccanismo rotto	7b4db345-71b3-4332-8223-57c1f5df76f0	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
d58b7609-f58b-40b7-b8f1-ba4d6fb62417	Sensori non funzionano	Cardiofrequenzimetro o altri sensori guasti	7b4db345-71b3-4332-8223-57c1f5df76f0	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
5f04594d-be37-49d5-a085-f4b54cf8cda1	Corona/Digital Crown guasta	Rotella/corona di controllo non funziona	7b4db345-71b3-4332-8223-57c1f5df76f0	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
f513408d-15d2-4f35-a56d-12868418b4cb	Non si sincronizza	Problemi di sincronizzazione con smartphone	7b4db345-71b3-4332-8223-57c1f5df76f0	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
0c1337a0-561d-4286-b79a-cda1046e2a8f	Resistenza all'acqua compromessa	Perdita di impermeabilità	7b4db345-71b3-4332-8223-57c1f5df76f0	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
f7601638-bcd8-43d7-b986-9c99eec6c973	Non legge dischi	Lettore ottico non funziona	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
9ae820b1-dc0e-42e5-89b8-f62cb048e680	Controller non funziona	Joypad/controller guasto	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
c811751c-bec8-421a-ab3a-bf5e836803eb	HDMI non funziona	Nessun output video	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
7e5f7dd8-f619-4eb8-aab8-eb9ef05c8ffa	Ventola rumorosa	Sistema di raffreddamento rumoroso	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
84ed7645-06f4-4f61-9636-8a9892160d61	Disco rigido pieno/guasto	Problemi con storage interno	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
588bda7e-7beb-4483-843c-7f8c73328660	Joystick drift	Stick analogici con deriva	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
51764f3f-fcfb-4331-adfe-93b71b2cfce0	Tasti controller non rispondono	Pulsanti del controller guasti	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	16	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a6187d35-69cc-4582-9f97-d920d73af549	Espulsione disco automatica	Console espelle i dischi da sola	b53bd4a1-a3b2-47ad-8a6e-ba2bd129976b	t	17	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
b1ee1ada-8208-428a-a9b6-4929240286b4	Schermo rotto	Pannello LCD/OLED danneggiato	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	10	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
2ad63f2a-39bb-4c36-b227-2bbaf2e55c66	Retroilluminazione guasta	Schermo scuro ma audio funzionante	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	11	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
e1dbe0c0-4d94-454c-befe-c56b44c457d0	Righe verticali/orizzontali	Linee colorate sullo schermo	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	12	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
03505ff7-32a9-4018-bbe9-ace70143de7e	Porte HDMI guaste	Ingressi HDMI non funzionanti	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	13	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
a8b5416d-e6b1-4447-93f2-aba494c46df7	Telecomando non funziona	Telecomando originale guasto	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	14	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
95ab5d36-23d0-45eb-bc9e-19f264c74590	Scheda madre guasta	Main board con problemi	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	15	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
e6f500a0-0ed4-49c8-a8aa-efd2943ad958	Smart TV non si connette	Problemi connessione internet	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	16	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
1d78d337-cdd6-44b9-87d3-fe08e1de9641	Audio distorto	Altoparlanti interni con problemi	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	17	2025-11-25 13:34:31.944833	2025-11-25 13:34:31.944833
\.


--
-- Data for Name: license_plans; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.license_plans (id, name, description, target_category, duration_months, price_cents, features, max_staff_users, is_active, sort_order, created_at, updated_at) FROM stdin;
3a05301f-d6d2-483a-be2f-332bae33d5d5	Piano senza pos	\N	all	12	5000	Gestione riparazioni\nMagazzino e inventario\nFatturazione\nPOS e corrispettivi\nRegistratore Telematico (RT)\nOrdini B2B\nMarketplace P2P\nStatistiche e report\nTicketing e supporto\nGaranzie e assicurazioni\nNotifiche push\nGestione clienti\nPagamenti online	\N	t	0	2026-02-09 22:26:05.484896	2026-02-10 17:04:05.295
\.


--
-- Data for Name: licenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.licenses (id, reseller_id, license_plan_id, status, start_date, end_date, payment_method, payment_id, auto_renew, notes, created_at) FROM stdin;
bb24e428-2423-4f9a-b3f8-2095f5bd060d	9985f30d-610e-4172-a39f-8ae614996edb	3a05301f-d6d2-483a-be2f-332bae33d5d5	cancelled	2026-02-09 22:26:21.451	2026-03-09 22:26:21.451	free	\N	f	\N	2026-02-09 22:26:21.485288
27370c58-16b0-436c-9e07-4f6b2e821f09	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	3a05301f-d6d2-483a-be2f-332bae33d5d5	cancelled	2026-02-09 22:26:55.531	2027-02-09 22:26:55.531	manual	\N	f	\N	2026-02-09 22:26:55.565637
f5083cb9-5018-4be8-8133-e77aae3c87f5	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	3a05301f-d6d2-483a-be2f-332bae33d5d5	pending	2026-02-09 22:46:01.042	2027-02-09 22:46:01.042	stripe	\N	f	\N	2026-02-09 22:46:01.077478
3c08ee12-1eff-4897-8d1b-e4b8af2464dd	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	3a05301f-d6d2-483a-be2f-332bae33d5d5	pending	2026-02-09 22:47:40.208	2027-02-09 22:47:40.208	paypal	\N	f	\N	2026-02-09 22:47:40.242278
b89ca8ac-e274-4792-a876-d4c61a23882a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	3a05301f-d6d2-483a-be2f-332bae33d5d5	pending	2026-02-09 22:47:45.211	2027-02-09 22:47:45.211	paypal	\N	f	\N	2026-02-09 22:47:45.245483
d0e7a909-74f8-40c6-a6ff-10d85c0867e3	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	3a05301f-d6d2-483a-be2f-332bae33d5d5	pending	2026-02-09 22:54:20.4	2027-02-09 22:54:20.4	paypal	6H89027676204881L	f	\N	2026-02-09 22:54:20.435542
32b0c7d0-bd46-41b2-878c-87c2ba4af9bb	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	3a05301f-d6d2-483a-be2f-332bae33d5d5	active	2026-02-10 13:26:38.087	2027-02-10 13:26:38.087	free	\N	f	\N	2026-02-10 13:26:38.121508
\.


--
-- Data for Name: marketplace_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marketplace_order_items (id, order_id, product_id, quantity, unit_price, total_price, product_name, product_sku, created_at, vat_rate) FROM stdin;
618ac835-708b-4201-ae70-b38393ef707d	4ac347c1-0e62-4628-b3e4-6dae184db146	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	2	100	200	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-01-22 14:52:41.636646	22
8f0cf9f5-548b-40d5-95d2-e49ff6226d8e	95cb6c28-6e9f-4575-ad30-153afcda1d15	daf22961-9f49-4a27-9f06-2447185c9c26	1	100	100	esempio	ACC-COVE-HUA-MKPBZ5JH	2026-01-22 15:52:14.460392	22
8008a961-5ed6-4a69-b8b0-db1e2542b0d8	1d0db182-be36-4334-a5ab-b0b40d8efcdd	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	100	100	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-01-22 16:02:12.087605	22
a6254176-981f-4514-91f1-8dffbe7b9398	fd4820ca-d826-462b-a90a-c2f3fb52281f	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	100	100	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-01-27 08:11:12.639598	22
0f4b8595-e612-4d84-bdb6-81aa70fc00db	3246dc7a-a7f9-4852-8924-66f350a1e868	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	100	100	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-01-27 08:29:49.417871	22
125613ce-547b-4ea7-a53e-cf42791379ec	a576fe27-fd3f-40b9-b7d3-c0caf671f750	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-01-29 14:18:45.791277	22
62d2a108-7244-42b1-9885-2e0fb54eec06	9e3bdb34-1fc5-4de4-9da6-05862899a488	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-01 10:14:07.968232	0
ce504562-27db-4214-b73e-c8ac64f21784	d56c470a-c03b-42a4-89da-68f12fdb789a	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-01 10:22:05.071954	0
4ec2a08b-3f48-4087-846c-9d26323923cd	d07b2115-13d5-4b6d-bf3d-acfa8c8d3744	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-02 11:29:36.817482	0
4900fbff-525a-4c84-94c5-36e966e4bf93	1350a181-1515-4736-8b74-ec4511e2c6b9	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-02 14:14:18.420075	0
3533daa8-922a-4b5e-89fb-33beade0c37f	e339ba4c-08ab-4a93-a2f0-8893637f9245	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-02 16:57:59.210223	22
850d7be8-5f5b-4c88-aadd-49270b5e73fc	d6781c0a-2bb5-4640-b0cc-8991245dcaf2	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-03 13:40:14.147124	22
3016cfe5-2c5c-47be-9523-e00387c88876	af03e9a1-000a-4e28-8d39-01dbae8bfa0b	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-03 13:58:35.045267	22
1463e825-4027-468d-a83d-5b485f45adf4	e3bfb65a-96bc-4ac5-8512-1f5a835c17d9	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-04 13:09:22.390465	22
81fff496-178e-4148-bfbb-9743e28924ff	e53d57a1-3392-4de5-9269-594045937331	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-04 13:12:54.538411	22
17b9be1f-d2df-4e46-9a0e-acd62bc4ab9f	777a87e1-a4d1-4d19-85b8-04e925675f22	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-04 13:16:57.272264	22
e71a3bdf-c729-44b6-ba4b-b9e011b65673	e495c7c7-b8a8-4914-99db-69db210b8b87	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	200	200	Titolo ricambio	00000000	2026-02-04 13:20:54.435196	22
b041b9ed-1e8a-41e3-854e-5ef7c819b730	78d935b5-55e1-4867-945a-17983a4ad382	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-04 13:34:08.430746	0
0db355e0-1b03-4dae-9cc6-a8c46bfb430b	a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-04 13:38:26.46574	0
b1736fa2-5322-4d71-b278-12bc2b1d43e8	456e4306-99b1-4053-8303-b5ec89b2633d	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-04 13:44:16.905039	0
354325f0-56d1-4829-93d7-c9ea9923ec78	d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	350	350	iPhone 14	SM-APPL-NUO-MKPBFR1Y	2026-02-04 13:47:46.378574	0
\.


--
-- Data for Name: marketplace_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.marketplace_orders (id, order_number, buyer_reseller_id, seller_reseller_id, status, subtotal, discount_amount, shipping_cost, total, payment_method, payment_reference, payment_confirmed_at, payment_confirmed_by, buyer_notes, seller_notes, rejection_reason, approved_by, approved_at, rejected_by, rejected_at, shipped_at, shipped_by, tracking_number, tracking_carrier, received_at, warehouse_transfer_id, created_at, updated_at, shipping_method_id) FROM stdin;
78d935b5-55e1-4867-945a-17983a4ad382	MP-2026-00171	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	350	0	100	450	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:34:08.247	\N	\N	\N	\N	\N	\N	\N	fd2cc0e7-f04f-4972-9c03-313939ae567d	2026-02-04 13:34:08.35278	2026-02-04 13:34:09.435	8ee66c39-dc1f-4911-804a-4bdf301e9a61
4ac347c1-0e62-4628-b3e4-6dae184db146	MP-2026-00001	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	received	200	0	0	200	bank_transfer	\N	\N	\N			\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-22 15:41:06.639	\N	\N	2026-01-22 15:41:18.68	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	IT9294234234234	BRT	2026-01-22 15:43:33.661	ae59f774-00f1-4e5e-bd37-bc868d3b4a52	2026-01-22 14:52:41.546966	2026-01-22 15:43:33.661	\N
95cb6c28-6e9f-4575-ad30-153afcda1d15	MP-2026-00011	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	shipped	100	0	0	100	bank_transfer	\N	\N	\N			\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-22 15:52:37.148	\N	\N	2026-01-22 15:52:43.252	00d54ab9-8a63-46a0-95f2-5b719c2a7e63			\N	25b484c7-1e13-4a88-8fe4-5b38e9b58ac3	2026-01-22 15:52:14.385339	2026-01-22 15:52:43.252	\N
1d0db182-be36-4334-a5ab-b0b40d8efcdd	MP-2026-00021	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	100	0	0	100	bank_transfer	\N	\N	\N			\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-22 16:02:28.185	\N	\N	\N	\N	\N	\N	\N	c40b7603-d331-4a35-83f2-7c5327ee7e6c	2026-01-22 16:02:11.991796	2026-01-22 16:02:28.185	\N
fd4820ca-d826-462b-a90a-c2f3fb52281f	MP-2026-00031	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	rejected	100	0	0	100	bank_transfer	\N	\N	\N			non ne ho	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-27 08:29:30.511	\N	\N	\N	\N	\N	\N	2026-01-27 08:11:12.560002	2026-01-27 08:29:30.511	\N
3246dc7a-a7f9-4852-8924-66f350a1e868	MP-2026-00041	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	100	0	0	100	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-27 08:29:49.338882	2026-01-27 08:29:49.338882	\N
a576fe27-fd3f-40b9-b7d3-c0caf671f750	MP-2026-00051	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	350	0	0	350	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 14:18:45.711269	2026-01-29 14:18:45.711269	\N
9e3bdb34-1fc5-4de4-9da6-05862899a488	MP-2026-00061	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	350	0	0	350	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-01 10:14:07.889751	2026-02-01 10:14:07.889751	\N
d56c470a-c03b-42a4-89da-68f12fdb789a	MP-2026-00071	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	350	0	0	350	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-01 10:22:04.991587	2026-02-01 10:22:04.991587	\N
d07b2115-13d5-4b6d-bf3d-acfa8c8d3744	MP-2026-00081	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	350	0	0	350	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 11:29:36.73888	2026-02-02 11:29:36.73888	\N
1350a181-1515-4736-8b74-ec4511e2c6b9	MP-2026-00091	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	350	0	100	450	bank_transfer	\N	\N	\N			\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-02-02 15:58:18.362	\N	\N	\N	\N	\N	\N	\N	65aaeb98-d1ad-4ca2-b5c8-6df8116708e2	2026-02-02 14:14:18.343188	2026-02-02 15:58:18.363	8ee66c39-dc1f-4911-804a-4bdf301e9a61
a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	MP-2026-00181	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	350	0	100	450	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:38:26.277	\N	\N	\N	\N	\N	\N	\N	aa8dc298-4f1d-4dd5-bc27-45bdef86e45a	2026-02-04 13:38:26.386169	2026-02-04 13:38:27.488	8ee66c39-dc1f-4911-804a-4bdf301e9a61
e339ba4c-08ab-4a93-a2f0-8893637f9245	MP-2026-00101	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	shipped	200	0	100	300	bank_transfer	\N	\N	\N			\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-02-02 16:58:45.533	\N	\N	2026-02-02 16:58:51.253	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	23213213123123	BRT	\N	5be94a60-475e-4f66-b76e-c8f2afed60c9	2026-02-02 16:57:59.120138	2026-02-02 16:58:51.253	8ee66c39-dc1f-4911-804a-4bdf301e9a61
d6781c0a-2bb5-4640-b0cc-8991245dcaf2	MP-2026-00111	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	paypal	\N	\N	\N	[PayPal Order ID: 0Y644949KB774763P]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 13:40:14.065758	2026-02-03 13:40:14.065758	8ee66c39-dc1f-4911-804a-4bdf301e9a61
af03e9a1-000a-4e28-8d39-01dbae8bfa0b	MP-2026-00121	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	paypal	\N	\N	\N	[PayPal Order ID: 21427607UG5267437]	\N	\N	\N	2026-02-03 13:58:34.851	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 13:58:34.968194	2026-02-03 13:58:34.968194	8ee66c39-dc1f-4911-804a-4bdf301e9a61
e3bfb65a-96bc-4ac5-8512-1f5a835c17d9	MP-2026-00131	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:09:22.199	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 13:09:22.311606	2026-02-04 13:09:22.311606	8ee66c39-dc1f-4911-804a-4bdf301e9a61
e53d57a1-3392-4de5-9269-594045937331	MP-2026-00141	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:12:54.353	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 13:12:54.461939	2026-02-04 13:12:54.461939	8ee66c39-dc1f-4911-804a-4bdf301e9a61
777a87e1-a4d1-4d19-85b8-04e925675f22	MP-2026-00151	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:16:57.075	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 13:16:57.186319	2026-02-04 13:16:57.186319	8ee66c39-dc1f-4911-804a-4bdf301e9a61
e495c7c7-b8a8-4914-99db-69db210b8b87	MP-2026-00161	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:20:54.246	\N	\N	\N	\N	\N	\N	\N	c979133b-64c1-4bbb-84b2-d4e60a485321	2026-02-04 13:20:54.352746	2026-02-04 13:20:55.47	8ee66c39-dc1f-4911-804a-4bdf301e9a61
456e4306-99b1-4053-8303-b5ec89b2633d	MP-2026-00191	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	350	0	100	450	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:44:16.718	\N	\N	\N	\N	\N	\N	\N	1b80e65b-7717-4a88-8bd8-99904f051b14	2026-02-04 13:44:16.826096	2026-02-04 13:44:17.919	8ee66c39-dc1f-4911-804a-4bdf301e9a61
d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	MP-2026-00201	3af078a6-01ce-4d7e-9268-1db16b60b82c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	350	0	100	450	stripe	\N	\N	\N		\N	\N	\N	2026-02-04 13:47:46.194	\N	\N	\N	\N	\N	\N	\N	d679d432-ea7f-42a3-b391-7f919a7a087e	2026-02-04 13:47:46.301537	2026-02-04 13:47:47.389	8ee66c39-dc1f-4911-804a-4bdf301e9a61
\.


--
-- Data for Name: mobilesentrix_cart_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mobilesentrix_cart_items (id, credential_id, product_id, sku, name, brand, model, price, quantity, image_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mobilesentrix_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mobilesentrix_credentials (id, reseller_id, consumer_name, consumer_key, consumer_secret, is_active, last_sync_at, last_test_at, test_status, test_message, created_at, updated_at, environment, access_token, access_token_secret) FROM stdin;
\.


--
-- Data for Name: mobilesentrix_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mobilesentrix_order_items (id, order_id, product_id, sku, name, brand, model, price, quantity, image_url, created_at) FROM stdin;
\.


--
-- Data for Name: mobilesentrix_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mobilesentrix_orders (id, credential_id, mobilesentrix_order_id, order_number, status, total_amount, currency, shipping_method, tracking_number, order_data, mobilesentrix_created_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_preferences (id, user_id, email_enabled, push_enabled, types, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, user_id, type, title, message, data, is_read, created_at) FROM stdin;
30ea137c-2746-423c-8f0a-af9dc77f5708	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	message	Nuovo ordine Marketplace	Ordine MP-2026-00011 da rivenditore2@example.com	{"orderId":"95cb6c28-6e9f-4575-ad30-153afcda1d15","orderNumber":"MP-2026-00011"}	t	2026-01-22 15:52:14.678642
1498ae29-ee5c-4dcb-be6e-cbd31f583d98	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 1.00 €. Ordine #MP-2026-00041	{"orderId":"3246dc7a-a7f9-4852-8924-66f350a1e868","orderNumber":"MP-2026-00041","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-01-27 08:29:49.577029
82073803-5c51-49e4-aaae-6ff77d93f336	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	message	Nuovo ordine Marketplace	Ordine MP-2026-00021 da rivenditore2@example.com	{"orderId":"1d0db182-be36-4334-a5ab-b0b40d8efcdd","orderNumber":"MP-2026-00021"}	t	2026-01-22 16:02:12.323954
8b78741e-87ac-480d-a6ba-3f0aaaf8efa1	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 3.50 €. Ordine #MP-2026-00081	{"orderId":"d07b2115-13d5-4b6d-bf3d-acfa8c8d3744","orderNumber":"MP-2026-00081","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-02 11:29:36.972337
5132e17b-a88f-47e9-8306-6c43566796d8	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore2 ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-02 12:37:00.674604
c6131f3b-72a0-4ca8-b916-53a517950ff2	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore2 ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-02 13:06:53.699794
b948f93e-d232-41cd-839a-3918db2e298f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore ha effettuato un ordine B2B per 5.00 EUR	\N	t	2026-02-02 14:07:16.638267
a5f1adb9-7d10-497b-8a43-fc763310538e	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore2 ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-02 14:14:05.167665
2568fa44-fa04-45c4-adf2-06b940b9ad5a	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore2 ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-02 16:40:19.135474
69e39aa2-1006-4af0-aea7-3345de8f77db	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore ha effettuato un ordine B2B per 10.00 EUR	\N	f	2026-02-03 13:00:05.753724
88d281a0-d22d-441f-a81b-c9d31e51c9e7	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-03 13:17:28.749046
eb0c0eba-6095-47b7-8333-3a6b6e1df9c4	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-04 10:18:26.221007
4868810a-3a4c-41e9-bd7a-92f1ee77a307	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-04 10:26:04.043536
c985c971-cf45-47d3-9870-76624666e94b	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	b2b_order_received	Nuovo ordine B2B ricevuto	rivenditore2 ha effettuato un ordine B2B per 5.00 EUR	\N	f	2026-02-04 13:08:23.799743
e09612ac-c15c-4851-b863-3bad33321761	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 3.50 €. Ordine #MP-2026-00061	{"orderId":"9e3bdb34-1fc5-4de4-9da6-05862899a488","orderNumber":"MP-2026-00061","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-01 10:14:08.119288
5b7367fc-451c-4e8a-9c8e-ace32fe54d05	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000041	{"salesOrderId":"c7692879-4632-484f-babc-0fce77af4ce4","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-03 14:52:09.472442
9626dedf-6e97-4ea8-8066-53404fec34d7	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000051	{"salesOrderId":"edac31e2-732e-42c5-8223-7c65fffa1b2f","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-03 14:56:07.173821
b8b39378-b7c8-4462-ba27-5fef2191d93a	9cc5d774-98cb-421b-bb88-d1a9a5346977	system	Preventivo accettato	Il cliente ha accettato il preventivo per la richiesta #RRR-2026-00002 (pagamento online)	{"remoteRequestId":"bb11d1fb-6dbe-4be9-bcae-b91a6ffa1a02"}	f	2026-02-06 09:05:20.42402
c6c04c88-6a64-45f3-9db6-a0364bc8585f	9cc5d774-98cb-421b-bb88-d1a9a5346977	system	Preventivo accettato	Il cliente ha accettato il preventivo per la richiesta #RRR-2026-00003 (pagamento online)	{"remoteRequestId":"7ac04ca0-25fe-461a-bd83-e35051d45e61"}	f	2026-02-06 10:40:16.898463
8227167b-1ac8-4a84-8973-6953c0efc712	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Richiesta remota accettata	Il centro di riparazione ha accettato la richiesta #RRR-2026-00003	{"remoteRequestId":"7ac04ca0-25fe-461a-bd83-e35051d45e61"}	t	2026-02-06 10:02:55.606389
87fe9867-1bbc-40f8-96d1-07c6235a171e	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 3.50 €. Ordine #MP-2026-00051	{"orderId":"a576fe27-fd3f-40b9-b7d3-c0caf671f750","orderNumber":"MP-2026-00051","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-01-29 14:18:45.943118
6fc5f18a-a830-4eaf-8c54-1e7ae1a693b8	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuova richiesta riparazione remota	PROVA IMPLAN ha inviato una richiesta di riparazione remota con 1 dispositivo/i	{"remoteRequestId":"7ac04ca0-25fe-461a-bd83-e35051d45e61","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-06 09:57:14.347113
e454deb5-1a04-4f7a-b958-95774c946add	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Richiesta remota accettata	Il centro di riparazione ha accettato la richiesta #RRR-2026-00002	{"remoteRequestId":"bb11d1fb-6dbe-4be9-bcae-b91a6ffa1a02"}	t	2026-02-06 09:04:45.091849
9ec2cbfa-c6de-43f2-be91-7f32f7d8e101	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 3.50 €. Ordine #MP-2026-00071	{"orderId":"d56c470a-c03b-42a4-89da-68f12fdb789a","orderNumber":"MP-2026-00071","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-01 10:22:05.221874
c3ef7253-59b3-4241-b4f1-a53f7d99b3d3	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 3.50 €. Ordine #MP-2026-00091	{"orderId":"1350a181-1515-4736-8b74-ec4511e2c6b9","orderNumber":"MP-2026-00091","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-02 14:14:18.571414
901ac9e8-0bac-4084-9104-09b53464d830	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 2.00 €. Ordine #MP-2026-00101	{"orderId":"e339ba4c-08ab-4a93-a2f0-8893637f9245","orderNumber":"MP-2026-00101","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-02 16:57:59.368794
f55944f6-b8e0-4c46-8c8e-c765401b3c32	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000021	{"salesOrderId":"96816db6-087b-4df5-afa3-1efdd5a260ee","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-02 20:30:34.509296
d9924055-1b7b-4c96-abb8-49dcff39d159	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000031	{"salesOrderId":"56b2c395-f00e-4c8c-84bd-2f0678d9111c","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-02 21:05:18.189586
3d471e42-7bb8-44b1-b38c-f06c8bf69a36	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace	Rivenditore Due ha effettuato un ordine di 1 prodotti per 2.00 €. Ordine #MP-2026-00111	{"orderId":"d6781c0a-2bb5-4640-b0cc-8991245dcaf2","orderNumber":"MP-2026-00111","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-03 13:40:14.295346
3bd52c93-cff9-4dea-874f-e3a662661f27	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000061	{"salesOrderId":"f34228b4-17c8-45de-bfab-5c8ac0c57472","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-03 15:11:09.051053
8f05388b-93d2-4055-bb79-aa35363594b4	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000071	{"salesOrderId":"d393dd17-68b3-41b1-94af-74dc9b6d65c5","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-03 18:48:43.118181
6be48d38-df49-42b5-a7a5-2c0485bb0f9b	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace (Approvato)	Rivenditore Due ha acquistato 1 prodotti per 3.50 €. Ordine #MP-2026-00181 già approvato (pagamento STRIPE).	{"orderId":"a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b","orderNumber":"MP-2026-00181","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-04 13:38:27.97511
0a903288-80c8-4dee-8030-98ccc2d6bcc4	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace (Approvato)	Rivenditore Due ha acquistato 1 prodotti per 3.50 €. Ordine #MP-2026-00201 già approvato (pagamento STRIPE).	{"orderId":"d0d9ce6c-d1f4-44db-811a-81f22b99cf5d","orderNumber":"MP-2026-00201","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-04 13:47:47.867407
956fbb7f-89b0-441d-9553-cd6af3a4921a	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine Marketplace (Approvato)	Rivenditore Due ha acquistato 1 prodotti per 2.00 €. Ordine #MP-2026-00161 già approvato (pagamento STRIPE).	{"orderId":"e495c7c7-b8a8-4914-99db-69db210b8b87","orderNumber":"MP-2026-00161","buyerId":"3af078a6-01ce-4d7e-9268-1db16b60b82c"}	t	2026-02-04 13:20:55.653133
6523963b-15ac-47d4-940e-0a40b9d938a9	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine e-commerce	PROVA IMPLAN ha effettuato l'ordine #ORD-2026-000081	{"salesOrderId":"c4e235ff-505a-4b43-ad72-caf0ac48b594","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-04 16:11:04.53237
228e1881-7387-4797-92ac-8170f9824aa4	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuovo ordine servizio	PROVA IMPLAN ha richiesto: asd	{"serviceOrderId":"b62db49f-b696-4c24-8989-c8c11dc8cf55","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-04 17:20:28.289607
3341086e-f3b8-4e0f-be72-71efdcd0f5d6	9cc5d774-98cb-421b-bb88-d1a9a5346977	system	Nuova richiesta riparazione remota	PROVA IMPLAN ha inviato una richiesta di riparazione remota con 1 dispositivo/i	{"remoteRequestId":"a333f793-db44-4960-acb2-38da5d40b9be","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	f	2026-02-11 22:22:22.091972
29efc6c0-f146-4324-99e9-031d48cfd9cb	9cc5d774-98cb-421b-bb88-d1a9a5346977	system	Nuova richiesta riparazione remota	PROVA IMPLAN ha inviato una richiesta di riparazione remota con 1 dispositivo/i	{"remoteRequestId":"e84c1a33-783d-48f9-9b40-d6451cdf32d2","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	f	2026-02-12 16:55:19.008709
f023685e-2afa-4aaa-81d9-148239b65287	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuova richiesta riparazione remota	PROVA IMPLAN ha inviato una richiesta di riparazione remota con 1 dispositivo/i	{"remoteRequestId":"a333f793-db44-4960-acb2-38da5d40b9be","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-11 22:22:21.871553
84bc686a-1495-489f-98dc-060d28072402	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Ticket Chiuso	Il tuo ticket #81ce9d96 è stato aggiornato a: Chiuso	{"ticketId":"81ce9d96-763d-42cd-b1f5-b1b266542a6a","status":"closed"}	t	2026-02-12 09:37:26.13802
0720c702-1e47-4327-82b3-8118e7b84bda	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	system	Nuova richiesta riparazione remota	PROVA IMPLAN ha inviato una richiesta di riparazione remota con 1 dispositivo/i	{"remoteRequestId":"e84c1a33-783d-48f9-9b40-d6451cdf32d2","customerId":"77a6c5c1-3408-4b9f-8eda-50af0d8e921c"}	t	2026-02-12 16:55:18.565027
\.


--
-- Data for Name: parts_load_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_load_documents (id, load_number, document_type, document_number, document_date, supplier_id, supplier_order_id, repair_center_id, status, total_items, total_quantity, total_amount, matched_items, stock_items, error_items, processed_at, completed_at, notes, is_auto_import, import_source, import_metadata, session_id, session_sequence, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: parts_load_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_load_items (id, parts_load_document_id, part_code, description, quantity, unit_price, total_price, status, matched_parts_order_id, matched_repair_order_id, matched_product_id, stock_location_suggested, stock_location_confirmed, added_to_inventory, inventory_movement_id, error_message, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: parts_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_orders (id, repair_order_id, part_name, part_number, quantity, unit_cost, supplier, status, ordered_at, expected_arrival, received_at, ordered_by, notes, product_id, purchase_order_id) FROM stdin;
\.


--
-- Data for Name: parts_purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parts_purchase_orders (id, repair_order_id, order_number, destination_type, supplier_name, supplier_id, source_warehouse_id, total_amount, status, expected_arrival, shipped_at, received_at, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: payment_configurations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.payment_configurations (id, entity_type, entity_id, use_parent_config, bank_transfer_enabled, iban, bank_name, account_holder, bic, stripe_enabled, stripe_account_id, stripe_account_status, stripe_onboarding_complete, stripe_details_submitted, stripe_charges_enabled, stripe_payouts_enabled, paypal_enabled, paypal_email, paypal_merchant_id, satispay_enabled, satispay_shop_id, created_at, updated_at, paypal_client_id, paypal_client_secret, stripe_publishable_key, stripe_secret_key) FROM stdin;
bba880bc-773b-4a23-b3e8-990e2649d72e	admin	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	f	t	it23942349234923492934924	Unicredit	asdasd	UNCRITMM	t	\N	\N	f	f	f	f	t	implanitalia@gmail.com	\N	f	\N	2026-02-01 18:00:50.131145	2026-02-04 08:47:09.738	ASGrhgtYiaRt8kAitGgM5JEKX3EvNPvaX9uRjEYmtwW_7e5sIflOn9nmP3zVGhRicgkz2kht2UNw9rCS	f35d91fa6d29fbfdb49cd80c85377d29:852934fd4b29de512cb2afad4bf5e0340900c33dc3c30718440fcf5252f47f1625277aa18ec0cdbc28b5bc10ffc19d93040af930e4bb9a6dbc28df20bbb3ef9e9e2cd5e8f659a57a7e8f5463e02e0d85dcd6b45de158cd08034b51fbe1b759e7	pk_test_51Sx1JrBMIN5zdCcAzyxrlCNHYhEI8AzBNvL1n6UR9jxmgoO8IUkj97W8yokVNezjk7ePamxUwhhwM1suJjx8CrMv00NHZD8aui	d79d48be9a88fac26d07d84fbf792aee:be5d38c3c33db47d914ff8844a68e2fb620a4639ed1640d6867667f70a8d18fb03675208e198e4a1a0736f8aa555321bf188bcee44d9ff97dc440e72425a8aa6f0ff0b2041e2f8ddef616cb595f9f17c8c18551c7509511cb07c7b2c9d80396c1e45a91658abf98fcfee057c84605898
817c5be1-c698-4735-a42d-d7da89c93208	reseller	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	f	t	IT93424238423492492	Unicredit	asdasd	UNCRITMM	t	\N	\N	f	f	f	f	t	implanitalia@gmail.com	\N	f		2026-02-01 10:13:33.326324	2026-02-04 19:24:17.803	ASGrhgtYiaRt8kAitGgM5JEKX3EvNPvaX9uRjEYmtwW_7e5sIflOn9nmP3zVGhRicgkz2kht2UNw9rCS	3458130d36189de628e426522d125ffc:9eb742f613de074aefbba984c49c6daaa287944b98492ba603c091d446aac58310cdd64fdec39abd95c40d8d36721fb6f3b31f83ee51fc1eb93f6d7d2c6b83cafd31f863ba4849ce8093acb07c529706d2d342954b0bd1a578abb6d9056b1527	pk_test_51Sx1JrBMIN5zdCcAzyxrlCNHYhEI8AzBNvL1n6UR9jxmgoO8IUkj97W8yokVNezjk7ePamxUwhhwM1suJjx8CrMv00NHZD8aui	ba4561ce863dd2c4119566916cd95098:7ada7c954333dc53bddb8425f4b48a44e986d19fe40a9644db93fa0e3fcd07470a7858c6ea6045fd9c6eb3b52d44abbff0ad3f979cd421b537c3169def7cd9cc808417423f0a18720af043b9a2f55ee0da2c9bc096c0adf237c00d9d489bfc8603a2e5b834137594a7deed8468168fc5
\.


--
-- Data for Name: platform_fiscal_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.platform_fiscal_config (id, default_rt_provider, rt_api_key, rt_api_secret, rt_endpoint, allow_override, sandbox_mode, created_at, updated_at, rt_entity_id, rt_system_id) FROM stdin;
0e21c00f-f5c5-4267-aff5-0cbf3b2cf25d	openapi_com	\N	\N	\N	t	t	2026-02-06 13:28:41.363371	2026-02-18 10:33:15.694	\N	\N
\.


--
-- Data for Name: pos_registers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_registers (id, repair_center_id, name, description, is_active, is_default, created_at, updated_at, default_payment_method, enabled_payment_methods, auto_print_receipt, rt_provider, rt_enabled, rt_api_key, rt_api_secret, rt_endpoint, rt_device_id, rt_uses_platform_config) FROM stdin;
030cd5b0-6be2-4957-8be6-a1c82a1eb860	c0f233d9-e60b-452c-8423-f8eb70dc10dc	Cassa 012	asd	t	t	2026-01-23 09:56:32.298936	2026-02-05 13:21:16.769	cash	{cash,stripe_link,paypal}	t	none	f	\N	\N	\N	\N	t
\.


--
-- Data for Name: pos_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_sessions (id, repair_center_id, operator_id, status, opened_at, closed_at, opening_cash, closing_cash, expected_cash, cash_difference, total_sales, total_transactions, total_cash_sales, total_card_sales, total_refunds, opening_notes, closing_notes, created_at, updated_at, register_id, daily_report_generated, totals_by_vat_rate) FROM stdin;
e61fc803-e08d-4ca7-9927-f65fac9d6510	c0f233d9-e60b-452c-8423-f8eb70dc10dc	9cc5d774-98cb-421b-bb88-d1a9a5346977	closed	2026-01-23 09:56:58.41488	2026-01-23 09:57:13.071	0	0	0	0	0	0	0	0	0	\N	\N	2026-01-23 09:56:58.41488	2026-01-23 09:57:13.071	030cd5b0-6be2-4957-8be6-a1c82a1eb860	f	\N
122155a9-2d6e-414f-a9e8-e7d7b873a4c5	c0f233d9-e60b-452c-8423-f8eb70dc10dc	9cc5d774-98cb-421b-bb88-d1a9a5346977	closed	2026-01-23 16:50:51.153893	2026-01-24 13:44:33.794	0	12500	100	12400	122	1	122	0	0	\N	\N	2026-01-23 16:50:51.153893	2026-01-24 13:44:33.794	030cd5b0-6be2-4957-8be6-a1c82a1eb860	f	\N
896e7582-5938-43ff-888e-a5daa5339d11	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	closed	2026-01-24 13:44:50.953394	2026-01-24 13:44:57.345	12500	12500	12500	0	0	0	0	0	0	\N	\N	2026-01-24 13:44:50.953394	2026-01-24 13:44:57.345	030cd5b0-6be2-4957-8be6-a1c82a1eb860	f	\N
42a94fda-2ff2-41d3-b8ad-ebdff09902bd	c0f233d9-e60b-452c-8423-f8eb70dc10dc	7e413aba-8495-4f15-98b5-b5b757a36565	open	2026-01-27 14:15:08.354314	\N	12500	\N	\N	\N	32330	24	20252	12078	0	\N	\N	2026-01-27 14:15:08.354314	2026-02-18 11:38:42.548	030cd5b0-6be2-4957-8be6-a1c82a1eb860	f	\N
\.


--
-- Data for Name: pos_transaction_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_transaction_items (id, transaction_id, product_id, product_name, product_sku, product_barcode, quantity, unit_price, discount, total_price, inventory_deducted, warehouse_id, created_at, is_temporary, service_item_id, is_service, vat_rate, warranty_product_id, is_warranty) FROM stdin;
5eef49dd-aa11-4118-9d2e-80d6263d1fdd	3b6de4fd-6d8b-4836-bdaf-73d0b5d061af	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	MP-2601-E2VHSX	1	100	0	100	t	bdc543af-101d-4bcd-b618-fee9a53fcdd8	2026-01-23 17:29:23.09852	f	\N	f	22	\N	f
d6d711c3-583e-4c9d-b6e7-cb27f091f58f	28f0affa-9e4d-4554-a3a3-48dcc8ba68c9	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	MP-2601-E2VHSX	1	100	0	100	t	bdc543af-101d-4bcd-b618-fee9a53fcdd8	2026-01-27 14:15:17.159163	f	\N	f	22	\N	f
c2ea67df-01d3-4113-8410-851704a4d51e	07681c89-a5a8-4821-9d97-4e6d28f3edea	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	MP-2601-581DMH	1	200	0	200	t	bdc543af-101d-4bcd-b618-fee9a53fcdd8	2026-02-05 09:17:04.060112	f	\N	f	22	\N	f
aaef2bcc-c9c7-4947-b56c-494215f47a23	c09f993f-d7b9-4e07-a94a-a965dcd88118	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	MP-2601-E2VHSX	1	300	0	300	t	bdc543af-101d-4bcd-b618-fee9a53fcdd8	2026-02-05 09:20:51.739088	f	\N	f	22	\N	f
04d4b1f5-ed0c-4cb3-b914-943fd8c3f913	a6478bb7-b33c-47e5-9987-be7cffb37ad6	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	MP-2601-E2VHSX	1	300	0	300	t	bdc543af-101d-4bcd-b618-fee9a53fcdd8	2026-02-05 09:31:25.395446	f	\N	f	22	\N	f
567c06a6-76a9-442c-aa47-86c6f82705b7	9e09599a-892d-46d6-ad66-7ae6366efa45	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	MP-2601-E2VHSX	1	300	0	300	t	bdc543af-101d-4bcd-b618-fee9a53fcdd8	2026-02-05 09:37:43.975714	f	\N	f	22	\N	f
e4388524-9b8a-44ae-b780-d297bd186a5b	ebd239d1-49f6-44ff-9039-9a31ada2def5	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 09:42:55.623879	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
c2371b36-38c2-41c8-a763-00415aeb2233	d5be7b54-bc72-4ce2-a1b4-ee59cea66403	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 09:49:08.256722	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
774928ca-a2bc-45d1-ab3d-d052aa0538ff	a4060f6f-f1f1-4b34-959e-e1eae2afedd6	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 09:52:59.492261	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
6cec6bc5-354a-4f86-bceb-c737e4c3e808	6f75f6a6-f5f3-4b19-a963-ee17180847ed	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 09:53:06.574231	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
0a041ca5-c871-4af1-926f-d2c128c16da7	2b68fd5b-a834-43a9-84fb-a266fcfd6336	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 09:56:52.476028	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
1f1353ad-40db-4db2-8818-f9a0b1eed1d6	e3a66650-a1cb-4918-b5e8-30448eea93f7	\N	asd	000	\N	2	1100	0	2200	f	\N	2026-02-05 10:00:14.898568	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
1c889aba-dbd2-4e08-8299-5b944d716152	77423808-20b8-4254-b110-0c1958bbf2aa	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 10:25:08.598731	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
0d6c0f05-edc7-4385-8f46-01f98c6d25b7	5ac9b670-e461-4ee0-8bad-d6b833d0918c	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 11:19:37.519971	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
32591fba-5b74-4443-933b-7d181ee49487	7c8d8ab2-95fc-4cbc-bcb4-2b946500f2c8	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 11:27:17.480521	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
5e6cd7b1-1570-47ee-bab3-00792c052eb0	5cb02443-484a-4623-aca9-987ae30abdfd	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 11:37:10.528623	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
f09f85bd-84a8-4ef6-8b81-2273aafca6d2	2784a8a3-bfc6-48b3-9312-64f721f46cc9	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 11:40:20.87074	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
165b0276-aba3-4a35-a9c1-5d7a6a327736	216709fb-9f7f-410b-85ef-b7b03a16c205	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 11:55:00.610999	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
a217ca28-9376-4565-9a5b-674d28444b88	2c497799-1f89-438b-ae1f-f715c99c317c	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 12:02:40.853685	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
bb96e301-3724-47ad-a0da-6773a5bd1aaa	c6dbe5a5-4a74-40b1-965b-f6e0ff3530fb	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 12:07:19.152281	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
1df1dbbe-dd24-4601-8b85-2b2b6912f867	61015398-b7d5-4702-be85-f115ae1aacb1	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-05 12:12:45.196193	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
86ee31bf-0fdc-438f-8798-975f77118c21	4f21cb91-0752-43c9-9e0c-4cd56c34a3f5	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-06 13:44:13.09358	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
542cae54-2e7a-4c6e-b1dd-c556420aab56	05197fba-2e79-42e8-9e3b-0cd266b23e14	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-06 14:01:44.435147	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
a581593d-00b5-4fe0-9a39-97948c5a4e33	8a5b775d-43b1-463a-ad88-cf88d80021dd	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-06 15:50:50.562171	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
85e53928-536c-48a5-ac09-2f44ae3a58fa	fefe6087-8c9c-4003-ac92-17f225c96dea	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-06 15:55:33.679269	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
8b4cb6a8-359d-4e43-9963-502f36bda0f9	21565fd0-84bc-4613-ac22-c4175966b947	\N	asd	000	\N	1	1100	0	1100	f	\N	2026-02-06 16:01:12.241095	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
4e1613fb-662b-41ee-b9dc-c50bb76b34d4	aff45c77-c88d-4471-b2dc-c4e50fbf4dbe	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:00:42.815333	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
b9de062a-1c4c-4ed1-92a3-343208ff2a6d	d49a5bc9-7b1d-4539-ae39-03be300054a3	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:03:53.172859	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
4acec36c-96f8-4965-a716-4c0984c34783	d9b492be-4fdb-48c7-a5e2-0663f0fb80a3	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:06:11.841953	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
b8619caf-896e-4f5d-bbf8-1ea537bd73ab	b6b94200-07bf-4b05-a140-03dcd845fb4b	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:11:15.255715	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
b4525915-48fc-45c7-858f-1f3e3a8e4d0e	da9375b9-2678-4dbf-bf5e-f749ecfb131f	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:13:02.191489	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
701e87ae-0ca0-45ec-a04f-f36da6a2a76c	d71d6a87-33a1-462e-aaba-21177c8fe63d	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:13:09.3414	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
b721363e-a4f8-48f6-917c-ad0143659003	fd3378be-0e39-4c91-ba95-2a97389ebc00	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:16:18.092055	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
9c4598a5-85de-4b2a-b083-0a2b968676c1	7c8c60d0-5cb7-498c-bf4c-667fc6205d7b	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:17:36.036413	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
0db93b01-0e7c-4339-bd6a-02ff83c151b6	beda1d4b-f425-4723-8fb2-d2c0bf697bd9	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:20:06.369417	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
c41aa26f-ee86-4ce6-bbb4-4b0ab1cd7fa4	a8565fc9-4df3-47bf-b569-0729486f6186	\N	Riparazione schermo iPhone	000	\N	1	1100	0	1100	f	\N	2026-02-18 11:38:42.541959	f	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	t	22	\N	f
\.


--
-- Data for Name: pos_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pos_transactions (id, transaction_number, repair_center_id, session_id, customer_id, operator_id, subtotal, discount_amount, discount_percent, tax_rate, tax_amount, total, payment_method, cash_received, change_given, card_last_four, payment_reference, status, refunded_amount, refund_reason, refunded_at, refunded_by, notes, customer_notes, created_at, updated_at, invoice_requested, invoice_id, register_id, void_reason, voided_at, voided_by, stripe_session_id, stripe_payment_url, stripe_payment_expires_at, paypal_order_id, paypal_approval_url, lottery_code, document_type, daily_number, rt_status, rt_submission_id, rt_submitted_at, rt_error_message, rt_document_url, rt_provider_used, rt_retry_count) FROM stdin;
3b6de4fd-6d8b-4836-bdaf-73d0b5d061af	POS-2601-0001	c0f233d9-e60b-452c-8423-f8eb70dc10dc	122155a9-2d6e-414f-a9e8-e7d7b873a4c5	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	100	0	\N	22	22	122	cash	5500	5378	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-01-23 17:29:23.009006	2026-01-23 17:29:23.009006	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
28f0affa-9e4d-4554-a3a3-48dcc8ba68c9	POS-2601-0011	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	7e413aba-8495-4f15-98b5-b5b757a36565	100	0	\N	22	22	122	cash	100	-22	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-01-27 14:15:17.078532	2026-01-27 14:15:17.078532	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
07681c89-a5a8-4821-9d97-4e6d28f3edea	POS-2602-0001	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	200	0	\N	22	44	244	stripe_link	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 09:17:03.975812	2026-02-05 09:17:03.975812	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
c09f993f-d7b9-4e07-a94a-a965dcd88118	POS-2602-0011	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	300	0	\N	22	66	366	stripe_link	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 09:20:51.638873	2026-02-05 09:20:57.82	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
a6478bb7-b33c-47e5-9987-be7cffb37ad6	POS-2602-0021	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	300	0	\N	22	66	366	stripe_link	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 09:31:25.311952	2026-02-05 09:31:27.085	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a1RxOdrOOol4fDro4dzfmfxE0Ux7BaPk29lVQvGaxZIRMN0wRsomVrIdzG	https://checkout.stripe.com/c/pay/cs_test_a1RxOdrOOol4fDro4dzfmfxE0Ux7BaPk29lVQvGaxZIRMN0wRsomVrIdzG#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 09:31:26	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
5ac9b670-e461-4ee0-8bad-d6b833d0918c	POS-2602-0161	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 11:19:37.430543	2026-02-05 11:19:39.732	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
9e09599a-892d-46d6-ad66-7ae6366efa45	POS-2602-0031	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	300	0	\N	22	66	366	stripe_link	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 09:37:43.89474	2026-02-05 09:37:45.62	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a1G0SZvZtm0EVX9va5WMGSNJMiBNo6GS48licAwEwLxaQ3tlmrI5ov67zb	https://checkout.stripe.com/c/pay/cs_test_a1G0SZvZtm0EVX9va5WMGSNJMiBNo6GS48licAwEwLxaQ3tlmrI5ov67zb#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 09:37:45	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
ebd239d1-49f6-44ff-9039-9a31ada2def5	POS-2602-0041	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	stripe_link	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 09:42:55.546914	2026-02-05 09:42:57.073	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a1PrpaBr7kw98dB5uLUD0LUDVj66Doj3a6pHwWlCLpBiSTjKL6savjwsnn	https://checkout.stripe.com/c/pay/cs_test_a1PrpaBr7kw98dB5uLUD0LUDVj66Doj3a6pHwWlCLpBiSTjKL6savjwsnn#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 09:42:56	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
d5be7b54-bc72-4ce2-a1b4-ee59cea66403	POS-2602-0051	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	stripe_link	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 09:49:08.160389	2026-02-05 09:49:10.094	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a138VxuDPtK98VDNKsPhDVLMuXVqRQGGShShyi9yl6BUL3KHYRZUQWPwz8	https://checkout.stripe.com/c/pay/cs_test_a138VxuDPtK98VDNKsPhDVLMuXVqRQGGShShyi9yl6BUL3KHYRZUQWPwz8#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 09:49:09	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
a4060f6f-f1f1-4b34-959e-e1eae2afedd6	POS-2602-0061	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	stripe_link	\N	\N	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-05 09:52:59.412711	2026-02-05 09:52:59.412711	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
6f75f6a6-f5f3-4b19-a963-ee17180847ed	POS-2602-0071	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	stripe_link	\N	\N	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-05 09:53:06.496656	2026-02-05 09:53:06.496656	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
e3a66650-a1cb-4918-b5e8-30448eea93f7	POS-2602-0091	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	2200	0	\N	22	484	2684	stripe_link	\N	\N	\N	pi_3SxPMSBMIN5zdCcA4tUlxwhk	completed	0	\N	\N	\N	\N	\N	2026-02-05 10:00:14.817459	2026-02-05 10:00:41.778	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a1hR0Gf2dJKhiu5aZn7UeGDHQSXhaSEAlh4NVdSsZdHIPe0Ak1Al8GcCUQ	https://checkout.stripe.com/c/pay/cs_test_a1hR0Gf2dJKhiu5aZn7UeGDHQSXhaSEAlh4NVdSsZdHIPe0Ak1Al8GcCUQ#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 10:00:15	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
2b68fd5b-a834-43a9-84fb-a266fcfd6336	POS-2602-0081	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	stripe_link	\N	\N	\N	pi_3SxPJDBMIN5zdCcA4yhsqERW	completed	0	\N	\N	\N	\N	\N	2026-02-05 09:56:52.393588	2026-02-05 09:57:41.333	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a1zqtIkAwP7IPBwnqFyp73ATIaRfOHtW0hZC0mMGLfHq3tQAqOB9nRlGUL	https://checkout.stripe.com/c/pay/cs_test_a1zqtIkAwP7IPBwnqFyp73ATIaRfOHtW0hZC0mMGLfHq3tQAqOB9nRlGUL#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 09:56:53	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
77423808-20b8-4254-b110-0c1958bbf2aa	POS-2602-0101	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	stripe_link	\N	\N	\N	pi_3SxPkbBMIN5zdCcA2xfKaSpZ	completed	0	\N	\N	\N	\N	\N	2026-02-05 10:25:08.517111	2026-02-05 10:25:46.835	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	cs_test_a1YhUqi9MrueS4F4iVcXwx3VQl9svkoxuaR6rEGLwCHVURd611DUiBOeFA	https://checkout.stripe.com/c/pay/cs_test_a1YhUqi9MrueS4F4iVcXwx3VQl9svkoxuaR6rEGLwCHVURd611DUiBOeFA#fidnandhYHdWcXxpYCc%2FJ2FgY2RwaXEnKSdkdWxOYHwnPyd1blpxYHZxWjA0Vn00T3dHSExLMH9hRmZEf3x9d2lGS01cbUBMPUR%2FR0tzSTRrM1BXPG99aGJqSj1MUG5vPDJSPXxqblNLYH9vbjJgVWRofVBybW1ySDR2cE9vfT1Gd0hzNTVLTV9BPWRwbCcpJ2N3amhWYHdzYHcnP3F3cGApJ2dkZm5id2pwa2FGamlqdyc%2FJyY1NTU1NTUnKSdpZHxqcHFRfHVgJz8ndmxrYmlgWmxxYGgnKSdga2RnaWBVaWRmYG1qaWFgd3YnP3F3cGB4JSUl	2026-02-06 10:25:09	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
7c8d8ab2-95fc-4cbc-bcb4-2b946500f2c8	POS-2602-0171	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 11:27:17.402486	2026-02-05 11:27:20.099	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
5cb02443-484a-4623-aca9-987ae30abdfd	POS-2602-0181	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 11:37:10.438629	2026-02-05 11:37:12.734	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
2784a8a3-bfc6-48b3-9312-64f721f46cc9	POS-2602-0191	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 11:40:20.794505	2026-02-05 11:40:22.684	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
216709fb-9f7f-410b-85ef-b7b03a16c205	POS-2602-0201	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 11:55:00.519243	2026-02-05 11:55:02.833	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
2c497799-1f89-438b-ae1f-f715c99c317c	POS-2602-0211	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 12:02:40.766242	2026-02-05 12:02:42.628	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
c6dbe5a5-4a74-40b1-965b-f6e0ff3530fb	POS-2602-0221	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	\N	pending	0	\N	\N	\N	\N	\N	2026-02-05 12:07:19.077913	2026-02-05 12:07:21.142	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
61015398-b7d5-4702-be85-f115ae1aacb1	POS-2602-0231	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	paypal	\N	\N	\N	3YS6530042596104C	completed	0	\N	\N	\N	\N	\N	2026-02-05 12:12:45.111743	2026-02-05 12:13:18.312	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	3YS6530042596104C	https://www.sandbox.paypal.com/checkoutnow?token=3YS6530042596104C	\N	receipt	\N	not_required	\N	\N	\N	\N	\N	0
4f21cb91-0752-43c9-9e0c-4cd56c34a3f5	POS-2602-0241	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-06 13:44:13.011622	2026-02-06 13:44:13.011622	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	1	not_required	\N	\N	\N	\N	\N	0
05197fba-2e79-42e8-9e3b-0cd266b23e14	POS-2602-0251	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-06 14:01:44.326652	2026-02-06 14:01:44.326652	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	2	submitted	SB-1770386505529-6KBXZG	2026-02-06 14:01:45.529	\N	\N	sandbox	0
8a5b775d-43b1-463a-ad88-cf88d80021dd	POS-2602-0261	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-06 15:50:50.477033	2026-02-06 15:50:50.477033	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	3	failed	\N	\N	System ID Fiskaly non configurato. Configuralo nelle impostazioni RT.	\N	\N	1
fefe6087-8c9c-4003-ac92-17f225c96dea	POS-2602-0271	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-06 15:55:33.602332	2026-02-06 15:55:33.602332	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	4	failed	\N	\N	Fiskaly API POST /records fallito (HTTP 400): request validation failed: request body has an error: doesn't match schema #/components/schemas/RecordCreateRequest: Error at "/content": discriminator property "type" has invalid value	\N	\N	1
21565fd0-84bc-4613-ac22-c4175966b947	POS-2602-0281	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-06 16:01:12.162159	2026-02-06 16:01:12.162159	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	5	failed	\N	\N	Fiskaly API POST /records fallito (HTTP 400): request validation failed: Error at "/content/system/id": string doesn't match the regular expression "^[0-9a-f]{8}-?[0-9a-f]{4}-?7[0-9a-f]{3}-?[0-9a-f]{4}-?[0-9a-f]{12}$"\nSchema:\n  {\n    "description": "{{\\u003eoas_components_schemas_universally_unique_identifier_v7_description}}\\n",\n    "example": "0189f7ea-ae2c-7809-8aeb-b819cf5e9e7f",\n    "format": "uuid",\n    "pattern": "^[0-9a-f]{8}-?[0-9a-f]{4}-?7[0-9a-f]{3}-?[0-9a-f]{4}-?[0-9a-f]{12}$",\n    "type": "string",\n    "x-go-type": "uuid.UUID",\n    "x-go-type-import": {\n      "name": "uuid",\n      "path": "github.com/google/uuid"\n    }\n  }\n\nValue:\n  "bd230a89-9672-49bc-ae1a-a5bb9e7251d5"\n	\N	\N	1
aff45c77-c88d-4471-b2dc-c4e50fbf4dbe	POS-2602-0291	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:00:42.809943	2026-02-18 11:00:42.809943	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	1	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 401): Wrong Token	\N	\N	1
a8565fc9-4df3-47bf-b569-0729486f6186	POS-2602-0381	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:38:42.537998	2026-02-18 11:38:42.537998	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	10	submitted	6995a4c55d97f253b30f97a9	2026-02-18 11:38:45.285	\N	\N	openapi_com	0
d49a5bc9-7b1d-4539-ae39-03be300054a3	POS-2602-0301	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:03:53.135852	2026-02-18 11:03:53.135852	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	2	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 401): Wrong Token	\N	\N	1
fd3378be-0e39-4c91-ba95-2a97389ebc00	POS-2602-0351	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:16:18.08675	2026-02-18 11:16:18.08675	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	7	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 400): receipts_authentication must be valid in configuration	\N	\N	1
d9b492be-4fdb-48c7-a5e2-0663f0fb80a3	POS-2602-0311	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:06:11.838027	2026-02-18 11:06:11.838027	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	3	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 401): Wrong Token	\N	\N	1
b6b94200-07bf-4b05-a140-03dcd845fb4b	POS-2602-0321	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:11:15.248754	2026-02-18 11:11:15.248754	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	4	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 404): Fiscal ID not found or not registered, use endpoint /IT_configurations to register it	\N	\N	1
da9375b9-2678-4dbf-bf5e-f749ecfb131f	POS-2602-0331	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:13:02.176612	2026-02-18 11:13:02.176612	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	5	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 400): receipts service is not enabled for the user, set receipts to true in configuration	\N	\N	1
7c8c60d0-5cb7-498c-bf4c-667fc6205d7b	POS-2602-0361	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:17:36.031562	2026-02-18 11:17:36.031562	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	8	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 422): The 'cash_payment_amount' must be a number.	\N	\N	1
d71d6a87-33a1-462e-aaba-21177c8fe63d	POS-2602-0341	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:13:09.336946	2026-02-18 11:13:09.336946	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	6	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 400): receipts service is not enabled for the user, set receipts to true in configuration	\N	\N	1
beda1d4b-f425-4723-8fb2-d2c0bf697bd9	POS-2602-0371	c0f233d9-e60b-452c-8423-f8eb70dc10dc	42a94fda-2ff2-41d3-b8ad-ebdff09902bd	\N	9cc5d774-98cb-421b-bb88-d1a9a5346977	1100	0	\N	22	242	1342	cash	1342	0	\N	\N	completed	0	\N	\N	\N	\N	\N	2026-02-18 11:20:06.363902	2026-02-18 11:20:06.363902	f	\N	030cd5b0-6be2-4957-8be6-a1c82a1eb860	\N	\N	\N	\N	\N	\N	\N	\N	\N	receipt	9	failed	\N	\N	OpenAPI.com POST /IT-receipts failed (HTTP 400): An error occurred: Total paid and uncollected amounts is not matching the items total amount.	\N	\N	1
\.


--
-- Data for Name: price_list_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_list_items (id, price_list_id, product_id, service_item_id, price_cents, cost_price_cents, is_active, created_at, updated_at, vat_rate, warranty_product_id) FROM stdin;
08b0da76-dbd8-431f-bc57-ee87c6efec73	acf6c94e-0426-4e7d-aea5-e33c5b726aae	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	\N	300	200	t	2026-01-29 10:17:37.500861	2026-01-29 10:17:37.500861	\N	\N
699eda82-a114-4618-87c7-4d201c5e7345	acf6c94e-0426-4e7d-aea5-e33c5b726aae	daf22961-9f49-4a27-9f06-2447185c9c26	\N	500	\N	t	2026-01-29 10:59:18.569578	2026-01-29 10:59:18.569578	\N	\N
587ec698-db7b-46bf-91f4-5a0660516ac3	0c81a6d3-e0a7-45c6-b55d-e5cfe026a8fc	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	\N	350	\N	t	2026-01-29 14:18:13.312186	2026-01-29 14:18:17.503	\N	\N
46d89006-1c90-4aa7-8d5f-7e96dc27c995	d155cf7c-37b2-4706-86c4-27d47e4ae518	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	\N	500	\N	t	2026-01-29 15:53:34.303891	2026-01-29 15:53:34.303891	\N	\N
1adff0a8-201b-4c91-be13-547a4cbe8274	4f4e592e-3984-426b-a223-9bdfd94e475e	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	\N	500	\N	t	2026-01-31 10:43:56.491071	2026-01-31 10:43:56.491071	\N	\N
\.


--
-- Data for Name: price_lists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.price_lists (id, name, description, owner_id, owner_type, repair_center_id, parent_list_id, is_default, is_active, created_at, updated_at, target_audience, target_customer_type, default_vat_rate) FROM stdin;
acf6c94e-0426-4e7d-aea5-e33c5b726aae	Listino Test		00d54ab9-8a63-46a0-95f2-5b719c2a7e63	reseller	\N	\N	t	t	2026-01-29 07:58:52.956899	2026-01-30 17:26:27.505	customer	\N	22
d155cf7c-37b2-4706-86c4-27d47e4ae518	Listino admin verso reseller	\N	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	admin	\N	\N	f	t	2026-01-29 15:26:00.905918	2026-01-31 10:21:31.953	reseller	\N	10
4f4e592e-3984-426b-a223-9bdfd94e475e	Listino Clienti IVA 0		00d54ab9-8a63-46a0-95f2-5b719c2a7e63	reseller	\N	\N	f	t	2026-01-31 10:43:46.930262	2026-01-31 11:28:27.798	customer	company	0
0c81a6d3-e0a7-45c6-b55d-e5cfe026a8fc	Listino reseller	Prova	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	reseller	\N	\N	f	t	2026-01-29 14:07:11.108997	2026-01-31 16:03:35.108	reseller	\N	0
\.


--
-- Data for Name: product_device_compatibilities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_device_compatibilities (id, product_id, device_brand_id, device_model_id, created_at) FROM stdin;
f70281c1-0f7a-4079-b722-f41b4c1330e9	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	ad777972-7eba-47f8-a471-c41659da0514	aec8c6ca-ff21-4694-91fe-9ba352b0366f	2026-01-22 10:35:24.786991
f3781264-30eb-4344-ba47-87fb3ac4da9c	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	ad777972-7eba-47f8-a471-c41659da0514	9ac94c2d-b46f-4320-80f2-5b66986b5342	2026-01-22 10:35:24.786991
d4f4d796-55a2-452d-9ede-3464cde401aa	daf22961-9f49-4a27-9f06-2447185c9c26	ad777972-7eba-47f8-a471-c41659da0514	4eede62c-40c1-48cc-9a21-c3649e9708be	2026-01-22 10:50:29.276375
d337fda5-2a8c-4e02-852f-e7fdec355bd6	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	ad777972-7eba-47f8-a471-c41659da0514	973ddfc9-74a0-4a08-82d9-aee711dcefc7	2026-01-26 23:29:53.150756
ab692777-d502-42f9-8088-6ddfc26b80fe	8cdd0ece-9366-4127-83fb-8e1fdb949817	ad777972-7eba-47f8-a471-c41659da0514	23e2577e-71ad-43d2-8e53-ef3a89cc9337	2026-01-26 23:43:08.630768
6e78f519-a208-41f0-a982-ca43ef610120	e40ea486-2117-48cb-a63f-c256b088df72	ad777972-7eba-47f8-a471-c41659da0514	7b66e3e7-4a3a-478a-a052-7500d6b01da1	2026-01-26 23:43:29.562115
d2a0b9d1-116a-4ee8-aa2b-0d3061f7fd14	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	ad777972-7eba-47f8-a471-c41659da0514	143a547c-255c-481a-9573-4fb4cb153686	2026-01-27 07:49:07.305695
\.


--
-- Data for Name: product_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_prices (id, product_id, reseller_id, price_cents, cost_price_cents, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.product_suppliers (id, product_id, supplier_id, supplier_code, supplier_name, purchase_price, min_order_qty, pack_size, lead_time_days, is_preferred, is_active, created_at, updated_at) FROM stdin;
f0aedee6-5344-487e-994c-c621c0355c12	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 10:35:25.640316	2026-01-22 10:35:25.640316
b544c6d3-4279-4120-b4a4-4dc0434d3125	daf22961-9f49-4a27-9f06-2447185c9c26	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 10:50:29.893915	2026-01-22 10:50:29.893915
aa6442e7-9ec8-4d13-9b39-47adc114ad53	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:32:07.404335	2026-01-22 12:32:07.404335
e0fcdbd0-8247-4e12-9491-154b9aed1f9c	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:32:20.576935	2026-01-22 12:32:20.576935
dbc38e6b-1c81-40d6-96a9-7d3b1c23f22f	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:32:33.440304	2026-01-22 12:32:33.440304
2adcd72c-8e55-4f4d-8507-a5ce96f25796	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:37:22.717899	2026-01-22 12:37:22.717899
c81ed7b1-9721-4709-8dc7-778e61ce4120	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:43:07.148098	2026-01-22 12:43:07.148098
3ac24a27-9601-418d-ba09-9076cf0f49a7	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:43:22.407923	2026-01-22 12:43:22.407923
6b905663-154f-4cd7-9c12-607b1cddb4a3	daf22961-9f49-4a27-9f06-2447185c9c26	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 12:43:41.483571	2026-01-22 12:43:41.483571
ea8ee0ef-22b1-4c71-bd02-cd00eec07fe1	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-01-22 15:41:00.794408	2026-01-22 15:41:00.794408
1396c761-45c1-440f-9292-1e48648705f4	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-02-02 15:12:23.889214	2026-02-02 15:12:23.889214
43710c27-17e0-46cc-b06d-e4d2c315b91e	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	26fc3cb6-3ee0-468b-9ccc-83201147742c	\N	\N	\N	1	1	\N	t	t	2026-02-02 15:51:22.592046	2026-02-02 15:51:22.592046
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.products (id, name, sku, category, description, unit_price, created_at, product_type, brand, compatible_models, color, cost_price, condition, warranty_months, supplier, supplier_code, min_stock, location, is_active, updated_at, created_by, device_type_id, image_url, is_visible_in_shop, is_marketplace_enabled, marketplace_price_cents, marketplace_min_quantity, repair_center_id, barcode, vat_rate, is_courtesy_phone) FROM stdin;
daf22961-9f49-4a27-9f06-2447185c9c26	esempio	ACC-COVE-HUA-MKPBZ5JH	accessorio		100	2026-01-22 10:50:27.261299	accessorio		\N	Oro	200	nuovo	12	\N	\N	5	\N	t	2026-01-22 12:43:40.859	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	/objects/products/daf22961-9f49-4a27-9f06-2447185c9c26/1769079027683.png	t	t	\N	1	\N	MP-2601-1CE0UF	22	f
7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	altro	\N	200	2026-01-22 10:33:56.781101	ricambio	Apple	\N	\N	100	nuovo	3	\N	\N	5	\N	t	2026-01-26 23:29:52.341	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	/objects/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf/1769078039080.png	t	t	\N	1	\N	MP-2601-581DMH	22	f
8cdd0ece-9366-4127-83fb-8e1fdb949817	quattogiugno3	ACC-COVE-APP-MKVTC87E	cover		1200	2026-01-26 23:43:07.768008	accessorio	\N	\N	\N	\N	nuovo	12	\N	\N	5	\N	t	2026-01-26 23:43:07.768008	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	\N	\N	t	f	\N	1	\N	MP-2601-TRN1P9	22	f
e40ea486-2117-48cb-a63f-c256b088df72	cliente	SM-XIAO-NUO-MKVTCNYO	smartphone		1200	2026-01-26 23:43:28.701823	dispositivo	\N	\N	\N	\N	nuovo	12	\N	\N	5	\N	t	2026-01-26 23:43:28.701823	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	\N	\N	t	f	\N	1	\N	MP-2601-JVUBV1	22	f
07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	smartphone		100	2026-01-22 10:35:22.925299	dispositivo		\N		200	nuovo	12	\N	\N	5	\N	t	2026-02-19 19:18:20.726	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	/objects/products/07e44d0c-fc41-4e3f-b57d-9b55b53efa94/1769078123345.png	t	t	\N	1	\N	MP-2601-E2VHSX	22	t
13382a3f-b4c0-4d5e-b5c3-890dac0405a7	Prova	SM-APPL-RIC-MKWAP6IS	smartphone		1200	2026-01-27 07:49:06.21288	dispositivo		\N		1500	ricondizionato	12	\N	\N	5	\N	t	2026-02-19 22:44:10.208	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	t	f	\N	1	\N	MP-2601-XDJ7P3	22	f
\.


--
-- Data for Name: promotions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.promotions (id, name, description, icon, is_active, sort_order, created_at, updated_at) FROM stdin;
1e761b4e-595d-4bda-915e-42732630e2ed	Telefono nuovo con SIM inclusa	Offerta smartphone nuovo con piano telefonico incluso	Smartphone	t	1	2025-11-28 14:31:17.118914	2025-11-28 14:31:17.118914
82c50ce6-e96a-4fe1-bcd0-36f83ae8b34c	Offerta a rate	Finanziamento a tasso zero per nuovo dispositivo	CreditCard	t	2	2025-11-28 14:31:17.118914	2025-11-28 14:31:17.118914
0f841ef7-a023-4bd8-819d-8bc1387f4b27	Permuta usato	Valutazione e ritiro del vecchio dispositivo	ArrowLeftRight	t	3	2025-11-28 14:31:17.118914	2025-11-28 14:31:17.118914
b2ef7911-4a80-4ccd-aefb-58e6f1bd134f	Sconto fedeltà sul nuovo	Sconto riservato ai clienti fedeli	Gift	t	4	2025-11-28 14:31:17.118914	2025-11-28 14:31:17.118914
\.


--
-- Data for Name: push_notification_log; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_notification_log (id, user_id, token_id, expo_ticket_id, status, title, body, data, error_message, retry_count, next_retry_at, receipt_checked_at, created_at) FROM stdin;
\.


--
-- Data for Name: remote_repair_request_devices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remote_repair_request_devices (id, request_id, device_type, brand, model, device_model_id, imei, serial, quantity, issue_description, photos, status, repair_order_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: remote_repair_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remote_repair_requests (id, request_number, customer_id, reseller_id, sub_reseller_id, requested_center_id, assigned_center_id, status, rejection_reason, forwarded_from, forward_reason, customer_address, customer_city, customer_cap, customer_province, courier_name, tracking_number, shipped_at, received_at, customer_notes, center_notes, created_at, updated_at, quote_amount, quote_description, quote_valid_until, quoted_at, quote_response_at, payment_method, payment_status, stripe_payment_intent_id, paypal_order_id) FROM stdin;
\.


--
-- Data for Name: repair_acceptance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_acceptance (id, repair_order_id, declared_defects, aesthetic_condition, aesthetic_notes, aesthetic_photos_mandatory, accessories, lock_code, lock_pattern, has_lock_code, accessories_removed, accepted_by, accepted_at, label_document_url) FROM stdin;
\.


--
-- Data for Name: repair_attachments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_attachments (id, repair_order_id, object_key, file_name, file_type, file_size, uploaded_by, uploaded_at, upload_session_id) FROM stdin;
\.


--
-- Data for Name: repair_center_availability; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_center_availability (id, repair_center_id, weekday, start_time, end_time, slot_duration_minutes, capacity_per_slot, is_closed, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: repair_center_blackouts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_center_blackouts (id, repair_center_id, date, start_time, end_time, reason, created_at) FROM stdin;
\.


--
-- Data for Name: repair_center_purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_center_purchase_order_items (id, order_id, product_id, product_name, product_sku, quantity, unit_price, total_price, created_at) FROM stdin;
32d0aaf9-6d3d-434c-871f-d772be0940a2	67b34c9b-3626-4c21-9124-7dad143301da	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	1	200	200	2026-01-22 17:24:40.393145
02ae7b7b-cd2d-4085-a45a-89ba3dc89d24	14f36c8d-fa8d-4573-999d-9ca018c141e5	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	ACC-COVE-HUA-MKPBZ5JH	1	100	100	2026-01-23 09:47:11.125184
41376812-0021-486d-9379-047d7b0792fe	95bbbef3-633c-4693-bf6e-18cef558b797	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	1	200	200	2026-02-02 13:34:15.468126
9734a3ac-fc70-4d5e-8aee-6185c3f758ca	1311216d-a4c0-40ee-a674-bf0e9345acbf	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	1	200	200	2026-02-02 14:48:02.029832
6567888b-7cb7-4dc3-85af-1cb3e6cf619f	6d6975f0-09db-41ec-9e33-21230f36efe4	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	1	200	200	2026-02-02 14:57:20.601975
5a0595e6-ae4e-4365-8052-1c727e0e5d5c	e17df8a6-5b2f-4489-8717-3b8f98b4f17f	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	\N	1	100	100	2026-02-02 16:58:10.845413
12367806-6162-452e-9b22-b7ce997da9bd	4d7133c1-f731-4997-b903-dd13d0198dbe	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	1	200	200	2026-02-03 14:33:31.191042
307c97d3-f413-473b-b238-67c0f4b1ab7c	33228cb8-99c4-4de9-9b81-95a37eee5db4	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	1	200	200	2026-02-03 14:39:00.243209
06f69d69-3f89-4569-a7ce-b1984e5908c6	5acac918-6de6-4139-9974-baf88f3e5d47	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	1	200	200	2026-02-03 14:43:41.039859
2718cf84-66e0-4b2c-8ddf-187fbaf803c5	7964e8fc-98d7-4fe1-b70f-bf7d041092bd	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	\N	1	200	200	2026-02-04 14:24:13.43451
50108f35-a967-4c3d-ba7a-fa02bda1f0db	e4b00f3f-2507-4ef2-bb37-ad5fc50a63af	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	\N	1	200	200	2026-02-04 14:27:54.565028
a1737dea-343f-47c1-b899-af838d949368	9e924fa5-106f-4f7d-8a8e-80aa585d3413	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	\N	1	200	200	2026-02-04 14:42:44.793319
cce6f059-605c-4cc5-917b-d6e792f5195e	f692ea14-fd08-4782-b4a1-2accb303e4a5	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	\N	1	200	200	2026-02-04 14:47:52.569559
1fb8351f-3ee0-4223-addc-0a6f40b96de6	abcb3038-2573-4040-a93a-20e7029b6a59	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	\N	1	200	200	2026-02-04 14:53:12.130833
2d1b5185-cff4-4646-ac2d-7d177a9645e4	7f60c7ee-58db-4898-832e-627ff0a58484	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	1	100	100	2026-02-04 15:04:27.84873
49c8101a-fb69-4069-9611-7baa2d51dd16	3946154e-9cb5-4e1b-9df6-287b5bc5c48d	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	1	100	100	2026-02-04 15:04:47.130235
1556557b-34b1-4d99-829c-ccc4be432d41	cb55cb1c-c1ed-4831-89b2-90fff491c02f	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	1	100	100	2026-02-04 15:09:33.77178
47de535e-3b5e-43f7-be15-5a77b956c702	1754e5e6-fb10-4894-aa0e-e83e4815a01f	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	1	100	100	2026-02-04 15:09:47.850778
6e9a8644-c277-4b70-aecb-79d98a2d77bd	6d120e15-8a7c-4a0b-8f65-cbf697e48d2d	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	1	100	100	2026-02-04 15:48:30.539631
7e9d9261-799c-4705-8f2d-0c88fb19bd73	2cfde78b-49be-4449-8de2-ea6ace8efc22	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	\N	1	200	200	2026-02-04 15:50:08.452397
\.


--
-- Data for Name: repair_center_purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_center_purchase_orders (id, order_number, repair_center_id, reseller_id, status, subtotal, discount_amount, shipping_cost, total, payment_method, payment_reference, payment_confirmed_at, notes, rejection_reason, approved_by, approved_at, shipped_at, tracking_number, carrier, delivered_at, created_at, updated_at, shipping_method_id, tax) FROM stdin;
abcb3038-2573-4040-a93a-20e7029b6a59	RCB2B-2026-00161	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	344	stripe	\N	2026-02-04 14:53:12.322		\N	\N	\N	\N	\N	\N	\N	2026-02-04 14:53:12.05091	2026-02-04 14:53:12.322	8ee66c39-dc1f-4911-804a-4bdf301e9a61	44
7f60c7ee-58db-4898-832e-627ff0a58484	RCB2B-2026-00171	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	100	0	100	200	paypal	\N	\N	[PayPal Order ID: 11B53202GJ343574S]	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:04:27.771009	2026-02-04 15:04:27.771009	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
67b34c9b-3626-4c21-9124-7dad143301da	RCB2B-2026-00001	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	delivered	200	0	0	200	bank_transfer	\N	\N		\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-22 17:44:42.819	2026-01-22 17:44:50.882	m	dhl	2026-01-23 09:14:06.55	2026-01-22 17:24:40.316249	2026-01-23 09:14:06.55	\N	0
022ebe3d-d43b-4e87-a320-a854332c2f60	RCB2B-2026-00011	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	100	0	0	100	bank_transfer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 09:39:54.98901	2026-01-23 09:39:54.98901	\N	0
73d7e88b-7059-443e-a5f2-d28811a5d26f	RCB2B-2026-00021	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	100	0	0	100	bank_transfer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 09:40:02.40224	2026-01-23 09:40:02.40224	\N	0
14f36c8d-fa8d-4573-999d-9ca018c141e5	RCB2B-2026-00031	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	100	0	0	100	bank_transfer	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-23 09:47:11.037735	2026-01-23 09:47:11.037735	\N	0
95bbbef3-633c-4693-bf6e-18cef558b797	RCB2B-2026-00041	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	bank_transfer	\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-02-02 13:34:15.389979	2026-02-02 13:34:15.389979	\N	0
1311216d-a4c0-40ee-a674-bf0e9345acbf	RCB2B-2026-00051	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	bank_transfer	\N	\N		\N	\N	\N	\N	\N	\N	\N	2026-02-02 14:48:01.941416	2026-02-02 14:48:01.941416	\N	0
6d6975f0-09db-41ec-9e33-21230f36efe4	RCB2B-2026-00061	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	bank_transfer	\N	\N		\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-02-02 14:57:38.931	\N	\N	\N	\N	2026-02-02 14:57:20.521558	2026-02-02 14:57:38.931	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
3946154e-9cb5-4e1b-9df6-287b5bc5c48d	RCB2B-2026-00181	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	100	0	100	200	paypal	\N	\N	[PayPal Order ID: 5BL14336MS5898928]	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:04:47.057836	2026-02-04 15:04:47.057836	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
e17df8a6-5b2f-4489-8717-3b8f98b4f17f	RCB2B-2026-00071	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	shipped	100	0	100	200	bank_transfer	\N	\N		\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-02-02 16:58:57.779	2026-02-02 16:59:04.61	12313123	BRT	\N	2026-02-02 16:58:10.764023	2026-02-02 16:59:04.61	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
fcbd1cb6-9e1d-4ff2-ad01-0f156fd9fcc5	RCB2B-2026-00081	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	paypal	\N	\N	[PayPal Order ID: 6N103088T9728110P]	\N	\N	\N	\N	\N	\N	\N	2026-02-03 14:25:30.78462	2026-02-03 14:25:30.78462	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
4d7133c1-f731-4997-b903-dd13d0198dbe	RCB2B-2026-00091	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	paypal	\N	\N	[PayPal Order ID: 76S80303U67202331]	\N	\N	\N	\N	\N	\N	\N	2026-02-03 14:33:31.109974	2026-02-03 14:33:31.109974	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
33228cb8-99c4-4de9-9b81-95a37eee5db4	RCB2B-2026-00101	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	paypal	\N	\N	[PayPal Order ID: 59G07318430498838]	\N	\N	\N	\N	\N	\N	\N	2026-02-03 14:39:00.165692	2026-02-03 14:39:00.165692	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
5acac918-6de6-4139-9974-baf88f3e5d47	RCB2B-2026-00111	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	paypal	\N	2026-02-03 14:43:41.231	[PayPal Order ID: 41N1062482702443M]	\N	\N	\N	\N	\N	\N	\N	2026-02-03 14:43:40.959284	2026-02-03 14:43:41.231	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
7964e8fc-98d7-4fe1-b70f-bf7d041092bd	RCB2B-2026-00121	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	200	0	100	300	paypal	\N	\N	[PayPal Order ID: 3TT25290S13285445]	\N	\N	\N	\N	\N	\N	\N	2026-02-04 14:24:13.349225	2026-02-04 14:24:13.349225	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
e4b00f3f-2507-4ef2-bb37-ad5fc50a63af	RCB2B-2026-00131	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	300	paypal	\N	2026-02-04 14:27:54.759	[PayPal Order ID: 7F209645UH975471M]	\N	\N	\N	\N	\N	\N	\N	2026-02-04 14:27:54.488656	2026-02-04 14:27:54.759	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
9e924fa5-106f-4f7d-8a8e-80aa585d3413	RCB2B-2026-00141	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	344	paypal	\N	2026-02-04 14:42:44.996	[PayPal Order ID: 1L244735YL862900E]	\N	\N	\N	\N	\N	\N	\N	2026-02-04 14:42:44.70966	2026-02-04 14:42:44.996	8ee66c39-dc1f-4911-804a-4bdf301e9a61	44
f692ea14-fd08-4782-b4a1-2accb303e4a5	RCB2B-2026-00151	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	344	stripe	\N	2026-02-04 14:47:52.77		\N	\N	\N	\N	\N	\N	\N	2026-02-04 14:47:52.487403	2026-02-04 14:47:52.77	8ee66c39-dc1f-4911-804a-4bdf301e9a61	44
cb55cb1c-c1ed-4831-89b2-90fff491c02f	RCB2B-2026-00191	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	100	0	100	200	paypal	\N	2026-02-04 15:09:33.978	[PayPal Order ID: 9RR36204M25335316]	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:09:33.690136	2026-02-04 15:09:33.978	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
1754e5e6-fb10-4894-aa0e-e83e4815a01f	RCB2B-2026-00201	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	100	0	100	200	stripe	\N	2026-02-04 15:09:48.045	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:09:47.774831	2026-02-04 15:09:48.045	8ee66c39-dc1f-4911-804a-4bdf301e9a61	0
6d120e15-8a7c-4a0b-8f65-cbf697e48d2d	RCB2B-2026-00211	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	100	0	100	222	stripe	\N	2026-02-04 15:48:30.739	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:48:30.456519	2026-02-04 15:48:30.739	8ee66c39-dc1f-4911-804a-4bdf301e9a61	22
2cfde78b-49be-4449-8de2-ea6ace8efc22	RCB2B-2026-00221	c0f233d9-e60b-452c-8423-f8eb70dc10dc	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	200	0	100	344	stripe	\N	2026-02-04 15:50:08.64		\N	\N	\N	\N	\N	\N	\N	2026-02-04 15:50:08.374407	2026-02-04 15:50:08.64	8ee66c39-dc1f-4911-804a-4bdf301e9a61	44
\.


--
-- Data for Name: repair_center_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_center_settings (id, repair_center_id, setting_key, setting_value, description, updated_at) FROM stdin;
75627a48-c983-4aa3-a37b-d7f7e3cd5b2e	c0f233d9-e60b-452c-8423-f8eb70dc10dc	ai_enabled	true	Accesso assistente AI	2026-02-16 09:36:04.416
\.


--
-- Data for Name: repair_centers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_centers (id, name, address, city, phone, email, is_active, created_at, reseller_id, cap, provincia, ragione_sociale, partita_iva, codice_fiscale, iban, codice_univoco, pec, hourly_rate_cents, description, website_url, logo_url, public_phone, public_email, accepts_walk_ins, opening_hours, social_links, notes, sub_reseller_id, has_autonomous_invoicing) FROM stdin;
c0f233d9-e60b-452c-8423-f8eb70dc10dc	Centro Riparazione Milano	Via Roma 1	Milano	0212345678	milano@repair.it	t	2026-01-22 11:55:53.809455	00d54ab9-8a63-46a0-95f2-5b719c2a7e63									\N			/objects/repair-centers/c0f233d9-e60b-452c-8423-f8eb70dc10dc/logo.png			f	{"friday": {"end": "18:00", "start": "09:00", "isOpen": true, "breakEnd": null, "breakStart": null}, "monday": {"end": "18:00", "start": "09:00", "isOpen": true, "breakEnd": null, "breakStart": null}, "sunday": {"end": "18:00", "start": "09:00", "isOpen": false, "breakEnd": null, "breakStart": null}, "tuesday": {"end": "18:00", "start": "09:00", "isOpen": true, "breakEnd": null, "breakStart": null}, "saturday": {"end": "18:00", "start": "09:00", "isOpen": true, "breakEnd": null, "breakStart": null}, "thursday": {"end": "18:00", "start": "09:00", "isOpen": true, "breakEnd": null, "breakStart": null}, "wednesday": {"end": "18:00", "start": "09:00", "isOpen": true, "breakEnd": null, "breakStart": null}}	{"twitter": "", "facebook": "", "linkedin": "", "instagram": ""}		\N	f
\.


--
-- Data for Name: repair_delivery; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_delivery (id, repair_order_id, delivered_to, delivery_method, signature_data, id_document_type, id_document_number, notes, delivered_by, delivered_at, id_document_photo, customer_signature, customer_signer_name, customer_signed_at, technician_signature, technician_signer_name, technician_signed_at) FROM stdin;
\.


--
-- Data for Name: repair_diagnostics; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_diagnostics (id, repair_order_id, technical_diagnosis, damaged_components, estimated_repair_time, requires_external_parts, diagnosis_notes, photos, diagnosed_by, diagnosed_at, updated_at, finding_ids, component_ids, estimated_repair_time_id, diagnosis_outcome, unrepairable_reason_id, unrepairable_reason_other, customer_data_important, suggested_promotion_ids, data_recovery_requested, skip_photos, suggested_device_ids) FROM stdin;
\.


--
-- Data for Name: repair_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_logs (id, repair_order_id, log_type, description, technician_id, hours_worked, parts_used, test_results, photos, created_at) FROM stdin;
\.


--
-- Data for Name: repair_order_state_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_order_state_history (id, repair_order_id, status, entered_at, exited_at, duration_minutes, changed_by) FROM stdin;
\.


--
-- Data for Name: repair_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_orders (id, order_number, customer_id, reseller_id, repair_center_id, device_type, device_model, issue_description, status, estimated_cost, final_cost, notes, created_at, updated_at, brand, imei, serial, imei_not_readable, imei_not_present, serial_only, ingressato_at, device_model_id, priority, quote_bypass_reason, quote_bypassed_at, branch_id, skip_diagnosis, skip_diagnosis_reason, warranty_supplier, warranty_purchase_date, warranty_purchase_price, warranty_proof_attachment_id, is_return, parent_repair_order_id, return_reason, courtesy_phone_product_id, courtesy_phone_assigned_at, courtesy_phone_returned_at, courtesy_phone_notes) FROM stdin;
\.


--
-- Data for Name: repair_quotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_quotes (id, repair_order_id, quote_number, parts, labor_cost, total_amount, status, valid_until, notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: repair_test_checklist; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_test_checklist (id, repair_order_id, display_test, touch_test, battery_test, audio_test, camera_test, connectivity_test, buttons_test, sensors_test, charging_test, software_test, overall_result, notes, tested_by, tested_at) FROM stdin;
\.


--
-- Data for Name: repair_warranties; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.repair_warranties (id, repair_order_id, customer_id, warranty_product_id, seller_type, seller_id, status, price_snapshot, duration_months_snapshot, coverage_type_snapshot, product_name_snapshot, starts_at, ends_at, invoice_id, notes, offered_at, accepted_at, declined_at, created_at, updated_at) FROM stdin;
2efd0277-0d53-4f97-a425-0c937a4b8200	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	735955d3-0892-49cb-a373-e10fa343f229	repair_center	9cc5d774-98cb-421b-bb88-d1a9a5346977	accepted	8990	24	extended	Garanzia Estesa 24 Mesi	2026-02-12 13:10:22.8	2028-02-12 13:10:22.8	\N	\N	2026-02-12 13:10:22.835154	2026-02-12 13:10:22.8	\N	2026-02-12 13:10:22.835154	2026-02-12 13:10:22.835154
6b362da0-854f-4421-a6aa-d782d8cbdc23	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	5e667cf8-1f3d-47dc-9f47-dcf5928256c2	reseller	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	accepted	2990	6	basic	Garanzia Base 6 Mesi	2026-02-22 23:49:46.325	2026-08-22 23:49:46.325	\N	\N	2026-02-22 23:49:46.327359	2026-02-22 23:49:46.325	\N	2026-02-22 23:49:46.327359	2026-02-22 23:49:46.327359
79e7fd25-9a58-480d-8fb9-fa2371a9a471	\N	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	e269e96f-e986-4e55-afdc-03ad30af3ab4	reseller	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	accepted	14990	36	full	Garanzia Gold 36 Mesi	2026-02-23 00:01:10.186	2029-02-23 00:01:10.186	\N	asd	2026-02-23 00:01:10.187779	2026-02-23 00:01:10.186	\N	2026-02-23 00:01:10.187779	2026-02-23 00:01:10.187779
\.


--
-- Data for Name: reseller_device_brands; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_device_brands (id, reseller_id, name, logo_url, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reseller_device_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_device_models (id, reseller_id, model_name, brand_id, reseller_brand_id, brand_name, type_id, photo_url, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reseller_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_products (id, product_id, reseller_id, is_published, custom_price_cents, inherited_from, can_override_price, can_unpublish, created_at, updated_at, b2b_price_cents, minimum_order_quantity) FROM stdin;
\.


--
-- Data for Name: reseller_purchase_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_purchase_order_items (id, order_id, product_id, product_name, product_sku, product_image, quantity, unit_price, total_price, shipped_quantity, received_quantity, created_at) FROM stdin;
4cad1ef7-150e-42e0-9e40-ca7fc65727fe	8e487e54-8a28-4ee4-8105-2e793e0f34e0	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	200	200	\N	\N	2026-01-22 19:20:43.683099
561b026d-e5b9-4652-9a44-e061364bba89	8c01ef6e-fb14-4656-88df-ca52585c91b0	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-01-29 16:04:08.231421
e487ebf4-2158-4227-95aa-0bc0ca1e651c	51b67546-5853-4b3b-83e2-5edeb97b3685	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-01 18:02:53.183741
c5971c76-9b20-45a9-a616-1aae76ffdd7b	143c2c8a-16c4-4b8d-ba7f-77328113c0ef	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-02 11:29:45.983973
a8940d91-8e67-4ea2-87fc-08b63c5660e4	045441eb-c675-4d94-88b8-1af3229ef5a2	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-02 12:37:00.443184
6c035cd8-debb-44e6-ae0b-8ecd3cebc310	473aede7-7392-4e4d-b88f-e1a8b02e1490	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-02 13:06:53.474036
5babaeb6-7f38-4b06-8a3b-fe18d906f252	b4b65355-5db2-49fc-b1cc-e59fd372fa09	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-02 14:07:16.412888
42476f87-17fa-4277-adcd-1ae5b38c9366	4489c3d1-38f6-4a74-ba9a-934fbbf79cc2	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-02 14:14:04.893311
cb84f3d8-b0b0-4824-83c9-0aeee9f6e863	24e24217-e1a0-4360-b18d-435fdfcffffb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-02 16:40:18.907878
0f6d8011-4adb-48b1-869d-3634e6a6f902	c3d6a839-b302-400e-8eae-8754fcc90f97	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	2	500	1000	\N	\N	2026-02-03 13:00:05.522651
e3707806-a74e-470a-b1eb-4fce22d09938	91341d6f-6262-492b-9c05-9fe0bf9ba321	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-03 13:11:30.15092
3abe1e1d-1032-487b-8d7b-68e0f154b6c0	27a3cdd5-389a-4889-a6e7-3c677e76f370	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-03 13:17:28.286804
e6618090-e4a9-4f71-92c4-892ab6e6cf75	7eb445b0-fa61-4535-b6e7-a035bbe674d7	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-04 10:15:12.682511
af495987-ed7e-4dba-bee2-a35514f7ecc6	75e96764-655a-4fab-80fb-3526a1369efc	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-04 10:18:25.757518
045d28af-08c3-4e8c-bbd9-995a1782328d	7b06ff0b-f7f1-4063-ac61-5d968db41f13	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-04 10:26:03.598376
2e1ee2ec-9992-4e02-a5d9-874d5f720470	66d44b07-c50a-428b-a174-29f9c7ce395a	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	500	500	\N	\N	2026-02-04 13:08:23.338589
\.


--
-- Data for Name: reseller_purchase_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_purchase_orders (id, order_number, reseller_id, status, subtotal, discount_amount, shipping_cost, total, payment_method, payment_reference, payment_confirmed_at, payment_confirmed_by, reseller_notes, admin_notes, rejection_reason, approved_by, approved_at, rejected_by, rejected_at, shipped_at, shipped_by, tracking_number, tracking_carrier, received_at, warehouse_transfer_id, created_at, updated_at, shipping_method_id) FROM stdin;
8e487e54-8a28-4ee4-8105-2e793e0f34e0	B2B-2026-00001	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	shipped	200	0	0	200	bank_transfer	\N	\N	\N		\N	\N	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	2026-01-22 19:24:53.285	\N	\N	2026-01-22 19:25:01.429	\N	12313123	\N	\N	\N	2026-01-22 19:20:43.597224	2026-01-22 19:25:01.429	\N
8c01ef6e-fb14-4656-88df-ca52585c91b0	B2B-2026-00011	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	500	0	0	500	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-29 16:04:08.14115	2026-01-29 16:04:08.14115	\N
51b67546-5853-4b3b-83e2-5edeb97b3685	B2B-2026-00021	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	500	0	0	500	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-01 18:02:53.105375	2026-02-01 18:02:53.105375	\N
143c2c8a-16c4-4b8d-ba7f-77328113c0ef	B2B-2026-00031	3af078a6-01ce-4d7e-9268-1db16b60b82c	pending	500	0	0	500	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 11:29:45.906529	2026-02-02 11:29:45.906529	\N
045441eb-c675-4d94-88b8-1af3229ef5a2	B2B-2026-00041	3af078a6-01ce-4d7e-9268-1db16b60b82c	pending	500	0	0	500	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 12:37:00.357032	2026-02-02 12:37:00.357032	4dfc7ca1-7fb3-4e9b-b757-fba6581b2351
473aede7-7392-4e4d-b88f-e1a8b02e1490	B2B-2026-00051	3af078a6-01ce-4d7e-9268-1db16b60b82c	pending	500	0	0	500	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 13:06:53.388117	2026-02-02 13:06:53.388117	4dfc7ca1-7fb3-4e9b-b757-fba6581b2351
b4b65355-5db2-49fc-b1cc-e59fd372fa09	B2B-2026-00061	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	500	0	999	1499	bank_transfer	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 14:07:16.326869	2026-02-02 14:07:16.326869	eb02df31-fc3e-4fd0-9df3-9167066a1d05
4489c3d1-38f6-4a74-ba9a-934fbbf79cc2	B2B-2026-00071	3af078a6-01ce-4d7e-9268-1db16b60b82c	approved	500	0	999	1499	bank_transfer	\N	\N	\N		\N	\N	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	2026-02-02 15:58:42.097	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 14:14:04.808285	2026-02-02 15:58:42.097	eb02df31-fc3e-4fd0-9df3-9167066a1d05
24e24217-e1a0-4360-b18d-435fdfcffffb	B2B-2026-00081	3af078a6-01ce-4d7e-9268-1db16b60b82c	shipped	500	0	999	1499	bank_transfer	\N	\N	\N		\N	\N	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	2026-02-02 16:40:42.616	\N	\N	2026-02-02 16:40:51.083	\N		\N	\N	\N	2026-02-02 16:40:18.828522	2026-02-02 16:40:51.083	eb02df31-fc3e-4fd0-9df3-9167066a1d05
c3d6a839-b302-400e-8eae-8754fcc90f97	B2B-2026-00091	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	1000	0	999	1999	paypal	\N	\N	\N	[PayPal Order ID: 3TX40815LL7586341]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 13:00:05.4421	2026-02-03 13:00:05.4421	eb02df31-fc3e-4fd0-9df3-9167066a1d05
91341d6f-6262-492b-9c05-9fe0bf9ba321	B2B-2026-00101	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	500	0	999	1499	paypal	\N	\N	\N	[PayPal Order ID: 20Y03666F3745354B]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 13:11:30.073924	2026-02-03 13:11:30.073924	eb02df31-fc3e-4fd0-9df3-9167066a1d05
27a3cdd5-389a-4889-a6e7-3c677e76f370	B2B-2026-00111	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	500	0	999	1499	paypal	\N	2026-02-03 13:17:28.494	\N	[PayPal Order ID: 9UV926564G418131D]	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 13:17:28.204054	2026-02-03 13:17:28.494	eb02df31-fc3e-4fd0-9df3-9167066a1d05
7eb445b0-fa61-4535-b6e7-a035bbe674d7	B2B-2026-00121	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	pending	500	0	999	1499	stripe	\N	\N	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:15:12.602352	2026-02-04 10:15:12.602352	eb02df31-fc3e-4fd0-9df3-9167066a1d05
75e96764-655a-4fab-80fb-3526a1369efc	B2B-2026-00131	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	500	0	999	1499	stripe	\N	2026-02-04 10:18:25.96	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:18:25.680464	2026-02-04 10:18:25.96	eb02df31-fc3e-4fd0-9df3-9167066a1d05
7b06ff0b-f7f1-4063-ac61-5d968db41f13	B2B-2026-00141	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	approved	500	0	999	1499	stripe	\N	2026-02-04 10:26:03.792	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 10:26:03.520154	2026-02-04 10:26:03.792	eb02df31-fc3e-4fd0-9df3-9167066a1d05
66d44b07-c50a-428b-a174-29f9c7ce395a	B2B-2026-00151	3af078a6-01ce-4d7e-9268-1db16b60b82c	approved	500	0	999	1499	stripe	\N	2026-02-04 13:08:23.544	\N		\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 13:08:23.254426	2026-02-04 13:08:23.544	eb02df31-fc3e-4fd0-9df3-9167066a1d05
\.


--
-- Data for Name: reseller_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_settings (id, reseller_id, setting_key, setting_value, description, updated_at) FROM stdin;
7a1b8206-5904-4894-a732-587fb3028743	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	sla_thresholds	{"ingressato":{"warning":25,"critical":48},"in_diagnosi":{"warning":24,"critical":48},"preventivo_emesso":{"warning":48,"critical":72},"attesa_ricambi":{"warning":72,"critical":120},"in_riparazione":{"warning":24,"critical":48},"in_test":{"warning":8,"critical":24},"pronto_ritiro":{"warning":48,"critical":72},"supplier_return_draft":{"warning":24,"critical":48},"supplier_return_requested":{"warning":48,"critical":96},"supplier_return_approved":{"warning":24,"critical":48},"supplier_return_shipped":{"warning":72,"critical":120}}	Soglie SLA per stati riparazioni (valori in ore)	2026-02-02 10:39:58.92628
22ad4ddc-ea1f-41ac-a633-c2f85d1a3507	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	hourly_rate	2800	Tariffa oraria manodopera in centesimi	2026-02-02 11:08:54.669
2159014d-bfb1-4d95-b6f3-4fa1f7eb1fd8	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	ai_enabled	true	Accesso assistente AI	2026-02-16 09:42:24.115
c4fe406a-0b15-4183-a14a-b9fc323a9401	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	ai_sub_resellers_enabled	true	AI abilitato per sub-resellers	2026-02-16 09:42:24.263
\.


--
-- Data for Name: reseller_staff_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reseller_staff_permissions (id, user_id, reseller_id, module, can_read, can_create, can_update, can_delete, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sales_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_order_items (id, order_id, product_id, product_name, product_sku, product_image, quantity, unit_price, discount, total_price, inventory_reserved, inventory_deducted, product_snapshot, created_at) FROM stdin;
ecda6b40-8658-4bad-be0f-732b3480cdd7	fb05d2d3-48ca-406c-abe0-e97c52070a4b	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	/objects/products/7aa7b534-000e-4d37-b4c2-1dbdcd47bddf/1769078039080.png	1	2	0	2	f	f	\N	2026-01-26 15:43:12.619825
e7d7d22b-72b4-45a3-b97b-f77140993e4b	fb05d2d3-48ca-406c-abe0-e97c52070a4b	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	ACC-COVE-HUA-MKPBZ5JH	/objects/products/daf22961-9f49-4a27-9f06-2447185c9c26/1769079027683.png	1	1	0	1	f	f	\N	2026-01-26 15:43:12.778523
636c8429-8dfd-4b59-b587-74d5fb0c89b1	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	/objects/products/07e44d0c-fc41-4e3f-b57d-9b55b53efa94/1769078123345.png	1	1	0	1	f	f	\N	2026-01-26 16:14:26.962021
b6d81417-ebcc-41b9-9193-386dfbc3ebaf	35d37d2f-485c-4e86-b8ff-ae9daf8c474d	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	\N	\N	1	100	0	100	f	f	\N	2026-01-26 17:24:35.899486
657f50f0-8696-4560-9540-7a6928ef477f	96816db6-087b-4df5-afa3-1efdd5a260ee	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	ACC-COVE-HUA-MKPBZ5JH	\N	1	5	0	5	f	f	\N	2026-02-02 20:30:34.127234
7506ea67-378e-493e-b3c9-f783c0000a5e	96816db6-087b-4df5-afa3-1efdd5a260ee	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	iPhone 14	SM-APPL-NUO-MKPBFR1Y	\N	3	3	0	9	f	f	\N	2026-02-02 20:30:34.288304
0bf74d43-4d92-4417-9b23-5efd9f09c5b9	56b2c395-f00e-4c8c-84bd-2f0678d9111c	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	ACC-COVE-HUA-MKPBZ5JH	\N	1	5	0	5	f	f	\N	2026-02-02 21:05:17.953905
2b844314-179d-42e5-9c57-318c61f2e0c0	c7692879-4632-484f-babc-0fce77af4ce4	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	\N	1	2	0	2	f	f	\N	2026-02-03 14:52:09.241568
a77accc4-0436-4271-9c9e-359429fd1c94	edac31e2-732e-42c5-8223-7c65fffa1b2f	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	\N	1	2	0	2	f	f	\N	2026-02-03 14:56:06.947026
cbc1b913-c8e8-49a4-9d4d-b55952e6a689	f34228b4-17c8-45de-bfab-5c8ac0c57472	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	\N	1	200	0	200	f	f	\N	2026-02-03 15:11:08.828663
8f19d7a0-5983-484e-8440-323d1854d343	d393dd17-68b3-41b1-94af-74dc9b6d65c5	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	\N	1	200	0	200	f	f	\N	2026-02-03 18:48:42.89429
eba01af6-5fd1-40f8-8641-a47e1ec41293	c4e235ff-505a-4b43-ad72-caf0ac48b594	daf22961-9f49-4a27-9f06-2447185c9c26	esempio	ACC-COVE-HUA-MKPBZ5JH	\N	1	500	0	500	f	f	\N	2026-02-04 16:11:04.120727
74477f54-5c3e-4c57-b0d4-2a0588e6fb35	c4e235ff-505a-4b43-ad72-caf0ac48b594	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	Titolo ricambio	00000000	\N	1	200	0	200	f	f	\N	2026-02-04 16:11:04.299615
\.


--
-- Data for Name: sales_order_payments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_order_payments (id, order_id, method, status, amount, currency, transaction_id, gateway_reference, gateway_response, paid_at, failed_at, refunded_at, refund_amount, refund_reason, notes, created_at, updated_at, order_type, order_number, confirmed_by, reseller_id, reseller_name) FROM stdin;
e71eda99-c012-4877-9edb-4c0528f0aa9c	fb05d2d3-48ca-406c-abe0-e97c52070a4b	bank_transfer	pending	0	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 15:43:12.854579	2026-01-26 15:43:12.854579	b2c	\N	\N	\N	\N
f8330f10-2816-4205-a67c-3323d2c57c69	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	bank_transfer	pending	1	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 16:14:27.042733	2026-01-26 16:14:27.042733	b2c	\N	\N	\N	\N
e2230238-9cd1-4cf4-86bb-41e44678f1fb	96816db6-087b-4df5-afa3-1efdd5a260ee	bank_transfer	pending	14	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-02 20:30:34.361027	2026-02-02 20:30:34.361027	b2c	\N	\N	\N	\N
b54ae3b9-453f-4046-b27b-7f438d044d9b	56b2c395-f00e-4c8c-84bd-2f0678d9111c	bank_transfer	completed	5	EUR	\N	\N	\N	2026-02-03 08:51:09.782	\N	\N	\N	\N	Confermato manualmente	2026-02-02 21:05:18.033244	2026-02-03 08:51:10.155	b2c	\N	\N	\N	\N
080d07e6-c5ca-4295-b4a4-ca94186f198e	27a3cdd5-389a-4889-a6e7-3c677e76f370	paypal	completed	1499	EUR	\N	9UV926564G418131D	\N	2026-02-03 13:17:28.407	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B B2B-2026-00111	2026-02-03 13:17:28.440774	2026-02-03 13:17:28.440774	b2b	B2B-2026-00111	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	rivenditore1
a0fce5e4-40ea-422d-975f-5a53602032f4	33228cb8-99c4-4de9-9b81-95a37eee5db4	paypal	completed	300	EUR	\N	59G07318430498838	\N	2026-02-03 14:39:00.356	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B RCB2B-2026-00101	2026-02-03 14:39:00.390948	2026-02-03 14:39:00.390948	b2b	RCB2B-2026-00101	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
dcffd244-40d9-4250-96ad-b76ebf4ad11a	5acac918-6de6-4139-9974-baf88f3e5d47	paypal	completed	300	EUR	\N	41N1062482702443M	\N	2026-02-03 14:43:41.154	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B RCB2B-2026-00111	2026-02-03 14:43:41.189001	2026-02-03 14:43:41.189001	b2b	RCB2B-2026-00111	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
548ea9d6-91a5-4335-b2a5-9387e99e938c	c7692879-4632-484f-babc-0fce77af4ce4	paypal	pending	2	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 14:52:09.319329	2026-02-03 14:52:09.319329	b2c	\N	\N	\N	\N
07441a2b-9b51-4a79-a861-eb89d471b683	edac31e2-732e-42c5-8223-7c65fffa1b2f	paypal	pending	2	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 14:56:07.024339	2026-02-03 14:56:07.024339	b2c	\N	\N	\N	\N
480bdcbc-0bcb-45f6-8ff0-241224819051	f34228b4-17c8-45de-bfab-5c8ac0c57472	paypal	pending	200	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 15:11:08.903812	2026-02-03 15:11:08.903812	b2c	\N	\N	\N	\N
812e8f6a-1baf-49d2-a1d3-1d11740e3652	d393dd17-68b3-41b1-94af-74dc9b6d65c5	paypal	pending	200	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-03 18:48:42.969376	2026-02-03 18:48:42.969376	b2c	\N	\N	\N	\N
2a06dc7c-8fb8-43dd-a6ca-36556fef308e	75e96764-655a-4fab-80fb-3526a1369efc	stripe	completed	1499	EUR	\N	\N	\N	2026-02-04 10:18:25.876	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B B2B-2026-00131	2026-02-04 10:18:25.916042	2026-02-04 10:18:25.916042	b2b	B2B-2026-00131	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	rivenditore1
1aa0ba25-00f9-4066-999d-c2b6cfbef429	7b06ff0b-f7f1-4063-ac61-5d968db41f13	stripe	completed	1499	EUR	\N	\N	\N	2026-02-04 10:26:03.715	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B B2B-2026-00141	2026-02-04 10:26:03.747791	2026-02-04 10:26:03.747791	b2b	B2B-2026-00141	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	rivenditore1
9d9e30df-99f1-45f2-babc-716fd1a3348e	66d44b07-c50a-428b-a174-29f9c7ce395a	stripe	completed	1499	EUR	\N	\N	\N	2026-02-04 13:08:23.461	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B B2B-2026-00151	2026-02-04 13:08:23.493901	2026-02-04 13:08:23.493901	b2b	B2B-2026-00151	\N	3af078a6-01ce-4d7e-9268-1db16b60b82c	Rivenditore Due
4f3ffd21-1e53-4b7c-a3f6-34721c0aaf37	777a87e1-a4d1-4d19-85b8-04e925675f22	stripe	completed	300	EUR	\N	\N	\N	\N	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine Marketplace MP-2026-00151	2026-02-04 13:16:57.350237	2026-02-04 13:16:57.350237	marketplace	\N	\N	\N	\N
0acc8067-51c4-4373-8cbc-57cf204bb699	e495c7c7-b8a8-4914-99db-69db210b8b87	stripe	completed	300	EUR	\N	\N	\N	\N	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine Marketplace MP-2026-00161	2026-02-04 13:20:54.512922	2026-02-04 13:20:54.512922	marketplace	\N	\N	\N	\N
f5b0b404-c5da-4153-9a91-9aa692daf991	78d935b5-55e1-4867-945a-17983a4ad382	stripe	completed	450	EUR	\N	\N	\N	\N	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine Marketplace MP-2026-00171	2026-02-04 13:34:08.506334	2026-02-04 13:34:08.506334	marketplace	\N	\N	\N	\N
caf3ee01-cdce-4865-8173-c33789259d60	a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	stripe	completed	450	EUR	\N	\N	\N	\N	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine Marketplace MP-2026-00181	2026-02-04 13:38:26.543122	2026-02-04 13:38:26.543122	marketplace	\N	\N	\N	\N
ed1d02f1-6662-48a6-8745-125895ad8e8d	456e4306-99b1-4053-8303-b5ec89b2633d	stripe	completed	450	EUR	\N	\N	\N	\N	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine Marketplace MP-2026-00191	2026-02-04 13:44:16.981104	2026-02-04 13:44:16.981104	marketplace	\N	\N	\N	\N
1e7cda74-3c9e-44a2-8441-f78eacc3e0d2	d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	stripe	completed	450	EUR	\N	\N	\N	\N	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine Marketplace MP-2026-00201	2026-02-04 13:47:46.4562	2026-02-04 13:47:46.4562	marketplace	\N	\N	\N	\N
b09f4bae-a076-4b69-9498-95efcc37c0cd	7964e8fc-98d7-4fe1-b70f-bf7d041092bd	paypal	completed	300	EUR	\N	3TT25290S13285445	\N	2026-02-04 14:24:13.558	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B RCB2B-2026-00121	2026-02-04 14:24:13.592793	2026-02-04 14:24:13.592793	b2b	RCB2B-2026-00121	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
09152c4f-9497-4f7e-886e-82439173857b	e4b00f3f-2507-4ef2-bb37-ad5fc50a63af	paypal	completed	300	EUR	\N	7F209645UH975471M	\N	2026-02-04 14:27:54.683	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B RCB2B-2026-00131	2026-02-04 14:27:54.716604	2026-02-04 14:27:54.716604	b2b	RCB2B-2026-00131	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
cb5ed589-286a-4397-9649-02d60587ecbc	9e924fa5-106f-4f7d-8a8e-80aa585d3413	paypal	completed	344	EUR	\N	1L244735YL862900E	\N	2026-02-04 14:42:44.911	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B RCB2B-2026-00141	2026-02-04 14:42:44.945023	2026-02-04 14:42:44.945023	b2b	RCB2B-2026-00141	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
f77e4d1c-8bc5-4382-833c-e60cc48b6c39	f692ea14-fd08-4782-b4a1-2accb303e4a5	stripe	completed	344	EUR	\N	\N	\N	2026-02-04 14:47:52.691	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B RCB2B-2026-00151	2026-02-04 14:47:52.725751	2026-02-04 14:47:52.725751	b2b	RCB2B-2026-00151	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
7df0aa3b-d11b-432b-b19f-83c456204dd5	abcb3038-2573-4040-a93a-20e7029b6a59	stripe	completed	344	EUR	\N	\N	\N	2026-02-04 14:53:12.246	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B RCB2B-2026-00161	2026-02-04 14:53:12.27913	2026-02-04 14:53:12.27913	b2b	RCB2B-2026-00161	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
34869396-1c74-4208-b543-7867b92baa80	cb55cb1c-c1ed-4831-89b2-90fff491c02f	paypal	completed	200	EUR	\N	9RR36204M25335316	\N	2026-02-04 15:09:33.899	\N	\N	\N	\N	Pagamento automatico PAYPAL per ordine B2B RCB2B-2026-00191	2026-02-04 15:09:33.934776	2026-02-04 15:09:33.934776	b2b	RCB2B-2026-00191	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
8e72d48b-b395-422a-af95-aa47843f2ac5	1754e5e6-fb10-4894-aa0e-e83e4815a01f	stripe	completed	200	EUR	\N	\N	\N	2026-02-04 15:09:47.969	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B RCB2B-2026-00201	2026-02-04 15:09:48.00361	2026-02-04 15:09:48.00361	b2b	RCB2B-2026-00201	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
591b729b-b0be-4af8-baa8-51de828d38f6	6d120e15-8a7c-4a0b-8f65-cbf697e48d2d	stripe	completed	222	EUR	\N	\N	\N	2026-02-04 15:48:30.654	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B RCB2B-2026-00211	2026-02-04 15:48:30.688923	2026-02-04 15:48:30.688923	b2b	RCB2B-2026-00211	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
5ebc0504-cfba-4b9e-917b-a34a3d65c147	2cfde78b-49be-4449-8de2-ea6ace8efc22	stripe	completed	344	EUR	\N	\N	\N	2026-02-04 15:50:08.565	\N	\N	\N	\N	Pagamento automatico STRIPE per ordine B2B RCB2B-2026-00221	2026-02-04 15:50:08.599285	2026-02-04 15:50:08.599285	b2b	RCB2B-2026-00221	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Tecnico Milano
c36e5c6a-a414-4dfd-9925-e377a08de0dc	c4e235ff-505a-4b43-ad72-caf0ac48b594	card	pending	700	EUR	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-02-04 16:11:04.375764	2026-02-04 16:11:04.375764	b2c	\N	\N	\N	\N
\.


--
-- Data for Name: sales_order_shipments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_order_shipments (id, order_id, status, carrier, carrier_name, tracking_number, tracking_url, weight, length, width, height, shipping_cost, insurance_value, prepared_at, picked_up_at, delivered_at, estimated_delivery, delivery_signature, delivery_photo, delivery_notes, label_url, manifest_id, notes, created_at, updated_at) FROM stdin;
287dd2bc-8d20-4a68-bd43-3b3196531fcd	fb05d2d3-48ca-406c-abe0-e97c52070a4b	in_transit	dhl	\N	asdsdads	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 17:14:48.560954	2026-01-26 17:14:48.560954
e83a458c-94f9-4e0e-a0b4-232755b41d7f	fb05d2d3-48ca-406c-abe0-e97c52070a4b	in_transit	dhl	\N	asdsdads	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 17:14:52.96922	2026-01-26 17:14:52.96922
1c6eefb0-93dd-42bb-b4d9-927c49bad4c9	35d37d2f-485c-4e86-b8ff-ae9daf8c474d	in_transit	ups	\N	asd	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	2026-01-26 17:37:51.136566	2026-01-26 17:37:51.136566
\.


--
-- Data for Name: sales_order_state_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_order_state_history (id, order_id, from_status, to_status, changed_by, reason, created_at) FROM stdin;
2b4cee9f-dfd7-4734-bb1e-3d3ef2d21aca	fb05d2d3-48ca-406c-abe0-e97c52070a4b	\N	pending	\N	\N	2026-01-26 15:43:12.437771
c7be47a6-5bb7-4307-b878-06f12be30e1e	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	\N	pending	\N	\N	2026-01-26 16:14:26.783235
42d636b8-581e-4341-8623-5468c7590ef0	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	pending	confirmed	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 16:48:10.966825
a65bd54d-2801-4d12-ae88-7aa9e454d7ec	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	confirmed	processing	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 16:48:15.954585
55471179-4734-413e-9cd8-274add087085	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	processing	ready_to_ship	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 16:48:24.861408
218d1809-dfe9-43f1-a718-ecc655637cb3	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	ready_to_ship	shipped	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 16:48:29.269743
a3976c01-9e06-458d-a0f3-abdc83b03f9a	e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	shipped	delivered	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 16:59:06.403575
01cdaa22-dee2-4c15-9464-a2e28ecc37cd	fb05d2d3-48ca-406c-abe0-e97c52070a4b	pending	confirmed	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:14:28.450439
b5be5458-86b6-41df-8765-e0b9c279a2ab	fb05d2d3-48ca-406c-abe0-e97c52070a4b	confirmed	processing	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:14:31.683395
57881300-6dbc-4c77-9d91-4e81227c2842	fb05d2d3-48ca-406c-abe0-e97c52070a4b	processing	ready_to_ship	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:14:34.695112
ffd73adf-24c1-438a-8590-8c4c418bbc9b	fb05d2d3-48ca-406c-abe0-e97c52070a4b	ready_to_ship	shipped	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:14:48.484189
7a460397-1f8d-4ad3-82a5-2d7d36fd1de4	fb05d2d3-48ca-406c-abe0-e97c52070a4b	shipped	shipped	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:14:52.891419
44a4ca1c-5860-43fb-91d4-778fe5206887	fb05d2d3-48ca-406c-abe0-e97c52070a4b	shipped	delivered	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:18:38.32388
e445e3b0-4623-4ea5-a110-3c33ce3f1e6f	35d37d2f-485c-4e86-b8ff-ae9daf8c474d	ready_to_ship	shipped	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-01-26 17:37:51.057952
4479f947-ca08-458e-9341-60559d85d546	96816db6-087b-4df5-afa3-1efdd5a260ee	\N	pending	\N	\N	2026-02-02 20:30:33.979956
6a870165-6e46-442a-a3aa-e715591fa667	56b2c395-f00e-4c8c-84bd-2f0678d9111c	\N	pending	\N	\N	2026-02-02 21:05:17.800465
6376e5de-479b-4fb3-9526-8201381d07e4	35d37d2f-485c-4e86-b8ff-ae9daf8c474d	shipped	delivered	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-02-03 09:57:32.568857
1207dbea-2ad8-422b-99a6-e6ca4ef8fed4	c7692879-4632-484f-babc-0fce77af4ce4	\N	pending	\N	\N	2026-02-03 14:52:09.089246
f1ff8e9d-e4f2-43cd-b57e-5b087a5c2cbd	edac31e2-732e-42c5-8223-7c65fffa1b2f	\N	pending	\N	\N	2026-02-03 14:56:06.797487
8732b681-460f-4a0b-828c-193e39df9fc5	f34228b4-17c8-45de-bfab-5c8ac0c57472	\N	pending	\N	\N	2026-02-03 15:11:08.682536
9958efe1-622c-4bb2-8f9d-e88d9e2eb8e3	d393dd17-68b3-41b1-94af-74dc9b6d65c5	\N	pending	\N	\N	2026-02-03 18:48:42.746669
4c95dcf3-d79e-4b61-bc91-6bfe1ded7636	c4e235ff-505a-4b43-ad72-caf0ac48b594	\N	pending	\N	\N	2026-02-04 16:11:03.968864
\.


--
-- Data for Name: sales_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sales_orders (id, order_number, customer_id, reseller_id, branch_id, status, delivery_type, subtotal, discount_amount, discount_code, shipping_cost, tax_amount, total, shipping_address_id, shipping_recipient, shipping_address, shipping_city, shipping_province, shipping_postal_code, shipping_country, shipping_phone, billing_address_id, billing_recipient, billing_address, billing_city, billing_province, billing_postal_code, billing_country, customer_notes, internal_notes, estimated_delivery, confirmed_at, shipped_at, delivered_at, cancelled_at, cancellation_reason, source, created_at, updated_at, vat_rate) FROM stdin;
edac31e2-732e-42c5-8223-7c65fffa1b2f	ORD-2026-000051	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	2	0	\N	100	0.36	102	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	[PayPal Order ID: 8V487495BV744581C]	\N	\N	\N	\N	\N	\N	\N	web	2026-02-03 14:56:06.718338	2026-02-03 14:56:06.718338	22
f34228b4-17c8-45de-bfab-5c8ac0c57472	ORD-2026-000061	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	200	0	\N	100	36.07	300	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	[PayPal Order ID: 5V217790CW2582426]	\N	\N	\N	\N	\N	\N	\N	web	2026-02-03 15:11:08.607301	2026-02-03 15:11:08.607301	22
d393dd17-68b3-41b1-94af-74dc9b6d65c5	ORD-2026-000071	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	200	0	\N	100	0	300	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	[PayPal Order ID: 8HA37731TX2148028]	\N	\N	\N	\N	\N	\N	\N	web	2026-02-03 18:48:42.67054	2026-02-03 18:48:42.67054	0
e7b53e45-8e1d-4b1a-ad54-84a82fbc5e91	ORD-2026-000011	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	delivered	shipping	1	0	\N	0	0	1	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT		\N	\N	2026-01-26 16:48:10.851	2026-01-26 16:48:29.161	2026-01-26 16:59:06.294	\N	\N	web	2026-01-26 16:14:26.695292	2026-01-26 16:59:06.294	0
fb05d2d3-48ca-406c-abe0-e97c52070a4b	ORD-2026-000001	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	delivered	shipping	0	0	\N	0	0	0	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT		\N	\N	2026-01-26 17:14:28.338	2026-01-26 17:14:52.785	2026-01-26 17:18:38.211	\N	\N	web	2026-01-26 15:43:12.353123	2026-01-26 17:18:38.212	0
96816db6-087b-4df5-afa3-1efdd5a260ee	ORD-2026-000021	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	14	0	\N	0	0	14	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT		\N	\N	\N	\N	\N	\N	\N	web	2026-02-02 20:30:33.905123	2026-02-02 20:30:33.905123	0
35d37d2f-485c-4e86-b8ff-ae9daf8c474d	ORD-TEST-001	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	delivered	shipping	100	0	\N	0	0	100	\N	\N	\N	\N	\N	\N	IT	\N	\N	\N	\N	\N	\N	\N	IT	\N	\N	\N	\N	2026-01-26 17:37:50.945	2026-02-03 09:57:32.46	\N	\N	web	2026-01-26 17:24:24.094468	2026-02-03 09:57:32.46	0
c4e235ff-505a-4b43-ad72-caf0ac48b594	ORD-2026-000081	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	700	0	\N	100	0	800	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT		\N	\N	\N	\N	\N	\N	\N	web	2026-02-04 16:11:03.88991	2026-02-04 16:11:03.88991	0
56b2c395-f00e-4c8c-84bd-2f0678d9111c	ORD-2026-000031	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	5	0	\N	1	0.9	6	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	\N	\N	\N	\N	\N	\N	\N	\N	web	2026-02-02 21:05:17.722273	2026-02-02 21:05:17.722273	22
c7692879-4632-484f-babc-0fce77af4ce4	ORD-2026-000041	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	pending	shipping	2	0	\N	1	0.36	3	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	3312362882	54ad7bd1-2a93-45d5-9573-90194aec2005	PROVA IMPLAN	via gaetano daita 15	Palemo	PA	90100	IT	[PayPal Order ID: 42P1896191244492D]	\N	\N	\N	\N	\N	\N	\N	web	2026-02-03 14:52:09.011368	2026-02-03 14:52:09.011368	22
\.


--
-- Data for Name: self_diagnosis_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.self_diagnosis_sessions (id, token, repair_order_id, created_by, status, display_test, touch_test, battery_test, audio_test, camera_front_test, camera_rear_test, microphone_test, speaker_test, vibration_test, connectivity_test, sensors_test, buttons_test, device_info, battery_level, notes, expires_at, started_at, completed_at, created_at) FROM stdin;
3d05e6c8-27c7-4b32-b54a-d7c4c6cbcfe2	c4ec778ce95f57aa933f9a4ef5a517efb13d6f8a2ed7be50b2fb6367858968ff	96e2f962-0720-4aa4-83a9-86e63f0c9f7d	9cc5d774-98cb-421b-bb88-d1a9a5346977	completed	t	t	t	\N	t	t	t	t	t	t	t	t	{"language": "it-IT", "platform": "MacIntel", "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36", "pixelRatio": 2, "screenWidth": 1800, "screenHeight": 1169}	100	\N	2026-02-21 13:47:43.497	2026-02-20 13:48:10.714	2026-02-20 13:48:53.623	2026-02-20 13:47:43.499626
c5852255-f5a4-4899-9ec3-29994ee0fee4	e13f3364bd8a943afa7d3f24baad46657f57e8b924056fa2538c768c1501c450	9ffd7072-2269-4d91-972d-2741229f6f0c	9cc5d774-98cb-421b-bb88-d1a9a5346977	completed	t	t	t	\N	t	t	t	t	t	t	t	t	{"language": "it-IT", "platform": "iPhone", "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1", "pixelRatio": 3, "screenWidth": 430, "screenHeight": 932}	\N	\N	2026-02-21 14:01:31.996	2026-02-20 14:02:01.381	2026-02-20 14:02:47.355	2026-02-20 14:01:31.997611
51c6ffd4-fae3-4988-b8e1-995f04962510	f07bc66b0befafa12c64b6cc812303011b295be68f11f219f6f39cc91904b9c3	e06992de-0638-44b1-a396-27c9fd2bd9e9	9cc5d774-98cb-421b-bb88-d1a9a5346977	completed	t	t	t	\N	t	f	t	t	t	t	t	t	{"language": "it-IT", "platform": "iPhone", "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.2 Mobile/15E148 Safari/604.1", "pixelRatio": 3, "screenWidth": 430, "screenHeight": 932}	\N	\N	2026-02-21 14:07:45.461	2026-02-20 14:08:06.813	2026-02-20 14:08:56.518	2026-02-20 14:07:45.462709
\.


--
-- Data for Name: service_item_prices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_item_prices (id, service_item_id, reseller_id, repair_center_id, price_cents, labor_minutes, is_active, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: service_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_items (id, code, name, description, category, device_type_id, default_price_cents, default_labor_minutes, is_active, created_at, updated_at, created_by, repair_center_id, brand_id, model_id, vat_rate) FROM stdin;
eccfaab5-1219-48d7-a1ab-ec897c1c7d45	000	Riparazione schermo iPhone	asd	display	c8aab45b-4c23-47f1-835c-5c9afc46799d	1100	60	t	2026-01-24 12:43:42.899783	2026-02-16 12:22:22.782	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	ad777972-7eba-47f8-a471-c41659da0514	e2eaf2da-df76-443b-856c-f086c45e2835	22
\.


--
-- Data for Name: service_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.service_orders (id, order_number, customer_id, reseller_id, repair_center_id, service_item_id, price_cents, device_type, device_model_id, brand, model, imei, serial, issue_description, customer_notes, internal_notes, status, repair_order_id, accepted_at, scheduled_at, completed_at, cancelled_at, created_at, updated_at, delivery_method, shipping_address, shipping_city, shipping_cap, shipping_province, courier_name, tracking_number, shipped_at, device_received_at, ddt_url, payment_method, payment_status) FROM stdin;
2a698b91-f685-4ea9-b0e0-819cea44a0d4	SVC-202601-00001	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	c0f233d9-e60b-452c-8423-f8eb70dc10dc	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	1100	Desktop	6fbe83ad-5c0e-4e4c-878d-09a50577e5a7	Asus	ROG Strix G15	123	asd	asdsasddas	asddsaadsdsaadsds	\N	in_progress	\N	2026-01-25 23:44:38.085	\N	\N	\N	2026-01-25 23:15:05.045022	2026-02-04 17:51:56.87	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	bank_transfer	pending
b62db49f-b696-4c24-8989-c8c11dc8cf55	SVC-202602-00001	77a6c5c1-3408-4b9f-8eda-50af0d8e921c	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	1100	Desktop	6fbe83ad-5c0e-4e4c-878d-09a50577e5a7	Asus	ROG Strix G15	\N	\N	\N	\N	\N	completed	48cbc7c5-3c28-4dc4-b34b-501de7f51c84	\N	\N	2026-02-23 15:02:49.374	\N	2026-02-04 17:20:28.172003	2026-02-23 15:02:49.374	shipping	via casalini 149	Palermo	90100	PA	brt	1313123132123	2026-02-11 23:23:58.571	2026-02-23 15:02:40.815	.private/service-ddt/ddt-service-SVC-202602-00001-1770852238768.pdf	card	paid
\.


--
-- Data for Name: session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session (sid, sess, expire) FROM stdin;
-FeqHG-NkhJLe64Ir31XiTtx-0QPkMK3	{"cookie":{"originalMaxAge":86400000,"expires":"2026-02-24T19:19:50.427Z","secure":false,"httpOnly":true,"path":"/","sameSite":"lax"},"passport":{"user":"a8eacd3b-2836-4d1a-a541-6a00b7f484ac"}}	2026-02-24 19:19:58
\.


--
-- Data for Name: shipment_tracking_events; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipment_tracking_events (id, shipment_id, status, status_code, description, location, event_at, raw_data, created_at) FROM stdin;
\.


--
-- Data for Name: shipping_methods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.shipping_methods (id, name, code, description, price_cents, estimated_days, is_pickup, created_by, repair_center_id, is_active, sort_order, created_at, updated_at, is_template, copied_from_id) FROM stdin;
e0bab663-919d-46c5-bae8-ee2100fe230f	Spedizione Standard	STD	\N	699	4	f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	\N	t	0	2026-02-01 19:28:33.315348	2026-02-01 19:28:33.315348	t	\N
43d4cc5a-3423-488f-8aae-678f42f78c0e	Spedizione Express	EXP	\N	1299	1	f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	\N	t	0	2026-02-01 19:28:33.469821	2026-02-01 19:28:33.469821	t	\N
4dfc7ca1-7fb3-4e9b-b757-fba6581b2351	Ritiro in Sede	PICKUP	\N	0	\N	t	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	\N	t	0	2026-02-01 19:28:33.619397	2026-02-01 19:28:33.619397	t	\N
eb02df31-fc3e-4fd0-9df3-9167066a1d05	Corriere Espresso	COURIER		999	3	f	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	\N	t	0	2026-02-01 19:28:33.766286	2026-02-02 10:26:36.49	t	\N
8ee66c39-dc1f-4911-804a-4bdf301e9a61	Prova	01	Prova	100	3	f	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	t	0	2026-02-02 10:40:27.504805	2026-02-02 10:40:27.504805	f	\N
\.


--
-- Data for Name: sibill_accounts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sibill_accounts (id, credential_id, reseller_id, external_id, name, iban, bank_name, account_type, balance, currency, raw_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sibill_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sibill_categories (id, credential_id, reseller_id, external_id, name, parent_id, category_type, raw_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sibill_companies; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sibill_companies (id, credential_id, reseller_id, external_id, name, vat_number, fiscal_code, raw_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sibill_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sibill_credentials (id, reseller_id, api_key, environment, company_id, is_active, last_test_at, last_test_result, last_sync_at, created_at, updated_at, api_token, selected_company_id, selected_company_name, test_status, test_message) FROM stdin;
\.


--
-- Data for Name: sibill_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sibill_documents (id, credential_id, reseller_id, external_id, document_number, document_type, status, issue_date, due_date, total_amount, currency, counterparty_name, counterparty_vat, raw_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sibill_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sibill_transactions (id, credential_id, reseller_id, account_id, external_id, amount, currency, transaction_date, value_date, description, counterparty_name, counterparty_iban, category_id, status, matched_document_id, raw_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sifar_carts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_carts (id, credential_id, store_id, status, items_count, total_cents, cart_data, last_sync_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sifar_catalog; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_catalog (id, codice_articolo, ean, descrizione, marca, modello, categoria, gruppo, prezzo_netto, aliquota_iva, disponibile, giacenza, contatta_per_ordinare, image_url, qualita, mesi_garanzia, last_sync_at, raw_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sifar_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_credentials (id, reseller_id, client_key, allowed_ip, partner_code, environment, default_courier_id, is_active, last_test_at, last_test_result, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sifar_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_models (id, codice_modello, descrizione, codice_marca, nome_marca, image_url, last_sync_at, created_at) FROM stdin;
\.


--
-- Data for Name: sifar_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_orders (id, credential_id, store_id, sifar_order_id, sifar_order_number, subtotal_cents, shipping_cents, tax_cents, total_cents, courier_id, courier_name, tracking_number, status, order_data, supplier_order_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sifar_product_compatibility; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_product_compatibility (id, catalog_id, model_id, created_at) FROM stdin;
\.


--
-- Data for Name: sifar_stores; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sifar_stores (id, credential_id, store_code, store_name, branch_id, repair_center_id, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: smartphone_specs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.smartphone_specs (id, product_id, storage, ram, screen_size, battery_health, grade, network_lock, imei, imei2, serial_number, original_box, accessories, notes, created_at, updated_at) FROM stdin;
229f7ecc-244f-4714-b180-5fb56eb12e85	e40ea486-2117-48cb-a63f-c256b088df72	128GB	\N	\N	100	A	unlocked	\N	\N	\N	f	{}		2026-01-26 23:43:28.781327	2026-01-26 23:43:28.781327
5762f3ba-aed8-4d1a-9289-8af2505a3667	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	256GB	\N	\N	95-99	A+	unlocked	12345671231231231345	\N	ELX2024001	t	\N	\N	2026-01-22 10:35:23.300594	2026-02-02 15:51:21.699
73be697f-a433-4b74-b79f-4e20a7d3ac98	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	128GB	\N	\N	95-99	A	unlocked	123213213132131	\N	\N	t	{"Caricatore originale"}	\N	2026-01-27 07:49:06.298848	2026-02-19 22:44:10.216
\.


--
-- Data for Name: staff_repair_centers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_repair_centers (id, staff_id, repair_center_id, created_at) FROM stdin;
\.


--
-- Data for Name: staff_sub_resellers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.staff_sub_resellers (id, staff_id, sub_reseller_id, created_at) FROM stdin;
\.


--
-- Data for Name: standalone_quote_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.standalone_quote_items (id, quote_id, service_item_id, name, description, quantity, unit_price_cents, vat_rate, total_cents, created_at, product_id, item_type) FROM stdin;
c6f5b3bf-376a-4ad1-a67a-28f1cb733135	68135283-c577-4ab0-ac36-5d960554ef0b	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	Riparazione schermo iPhone	asd	1	1100	22	1100	2026-02-13 15:48:18.186814	\N	service
b9f47b47-59ac-4a7f-af18-73283b8e980e	68135283-c577-4ab0-ac36-5d960554ef0b	\N	iPhone 14	\N	1	100	22	100	2026-02-13 15:48:18.266535	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	product
88277d1f-f23d-4ec2-b278-03d24954d650	42cb42e2-9de6-48a3-82cf-bc0d1b1b0edb	eccfaab5-1219-48d7-a1ab-ec897c1c7d45	Riparazione schermo iPhone	asd	1	1100	22	1100	2026-02-13 16:06:23.264057	\N	service
\.


--
-- Data for Name: standalone_quotes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.standalone_quotes (id, quote_number, customer_id, customer_name, customer_email, customer_phone, device_type_id, brand_id, model_id, device_description, subtotal_cents, vat_amount_cents, total_amount_cents, status, valid_until, notes, created_by, reseller_id, repair_center_id, created_at, updated_at) FROM stdin;
68135283-c577-4ab0-ac36-5d960554ef0b	PRV-2026-0001	\N	\N	\N	\N	c8aab45b-4c23-47f1-835c-5c9afc46799d	ad777972-7eba-47f8-a471-c41659da0514	\N	\N	1200	264	1464	sent	2026-03-15 15:48:17.407	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-02-13 15:48:18.094887	2026-02-13 15:48:28.533
42cb42e2-9de6-48a3-82cf-bc0d1b1b0edb	PRV-2026-0002	\N	\N	\N	\N	c8aab45b-4c23-47f1-835c-5c9afc46799d	ad777972-7eba-47f8-a471-c41659da0514	c9cf2172-76f0-476a-8af4-9c1edf5ffc1e	\N	1100	242	1342	draft	2026-03-15 16:06:22.611	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	2026-02-13 16:06:23.184403	2026-02-13 16:06:23.184403
\.


--
-- Data for Name: stock_reservations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.stock_reservations (id, order_id, order_item_id, product_id, reseller_id, repair_center_id, quantity, status, reserved_at, expires_at, committed_at, released_at) FROM stdin;
\.


--
-- Data for Name: supplier_catalog_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_catalog_products (id, supplier_id, external_sku, external_ean, external_artcode, title, description, category, brand, model_brand, model_codes, suitable_for, quality, price_cents, currency, in_stock, stock_quantity, image_url, thumbnail_url, raw_data, linked_product_id, linked_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: supplier_communication_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_communication_logs (id, supplier_id, communication_type, channel, entity_type, entity_id, subject, content, sent_at, delivered_at, read_at, failed_at, failure_reason, response_content, response_received_at, metadata, created_by, created_at) FROM stdin;
\.


--
-- Data for Name: supplier_order_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_order_items (id, supplier_order_id, product_id, supplier_code, description, quantity, unit_price, total_price, quantity_received, notes, created_at) FROM stdin;
\.


--
-- Data for Name: supplier_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_orders (id, order_number, supplier_id, repair_center_id, status, subtotal, shipping_cost, tax_amount, total_amount, expected_delivery, sent_at, confirmed_at, shipped_at, received_at, tracking_number, tracking_carrier, repair_order_id, notes, internal_notes, created_by, created_at, updated_at, owner_type, owner_id, target_warehouse_id) FROM stdin;
\.


--
-- Data for Name: supplier_return_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_return_items (id, supplier_return_id, product_id, supplier_order_item_id, supplier_code, description, quantity, unit_price, total_price, notes, created_at) FROM stdin;
\.


--
-- Data for Name: supplier_return_state_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_return_state_history (id, supplier_return_id, status, entered_at, exited_at, duration_minutes, changed_by) FROM stdin;
\.


--
-- Data for Name: supplier_returns; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_returns (id, return_number, supplier_id, repair_center_id, supplier_order_id, status, reason, reason_details, total_amount, refund_amount, requested_at, approved_at, shipped_at, received_at, refunded_at, tracking_number, tracking_carrier, rma_number, notes, internal_notes, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: supplier_sync_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.supplier_sync_logs (id, supplier_id, status, products_total, products_created, products_updated, products_failed, duration_ms, error_message, error_details, triggered_by, created_at) FROM stdin;
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.suppliers (id, code, name, email, phone, whatsapp, website, address, city, zip_code, country, vat_number, fiscal_code, communication_channel, api_endpoint, api_key, api_format, order_email_template, return_email_template, payment_terms, delivery_days, min_order_amount, shipping_cost, free_shipping_threshold, notes, internal_notes, is_active, created_at, updated_at, api_type, api_secret_name, api_auth_method, api_products_endpoint, api_orders_endpoint, api_cart_endpoint, api_invoices_endpoint, catalog_sync_enabled, catalog_sync_status, catalog_last_sync_at, catalog_products_count, created_by) FROM stdin;
db8bd82c-4006-45ca-909c-21fb07653200	FORN001	TechParts Italia	ordini@techparts.it	+39 02 1234567	\N	\N	Via Roma 1, Milano	\N	\N	IT	\N	\N	email	\N	\N	\N	\N	\N	bank_transfer_30	3	\N	\N	\N	Fornitore ricambi smartphone	\N	t	2025-11-29 16:25:09.35424	2025-11-29 16:25:09.35424	\N	\N	bearer_token	\N	\N	\N	\N	f	\N	\N	0	\N
b8f2dc59-a6a0-4991-ac53-8d489fb989a3	FORN-0001	Nuovo Fornitore Test	test@nuovofornitore.it	\N	\N	\N	\N	\N	\N	IT	\N	\N	email	\N	\N	\N	\N	\N	bank_transfer_30	3	\N	\N	\N	\N	\N	t	2025-11-29 17:03:39.547983	2025-11-29 17:03:39.547983	\N	\N	bearer_token	\N	\N	\N	\N	f	\N	\N	0	\N
26fc3cb6-3ee0-468b-9ccc-83201147742c	TEST001	Fornitore Test	test@example.com	\N	\N	\N	\N	\N	\N	IT	\N	\N	email	\N	\N	json	\N	\N	bank_transfer_30	3	\N	\N	\N	\N	\N	t	2025-11-29 16:50:14.364063	2025-11-29 17:42:31.235	\N	\N	bearer_token	\N	\N	\N	\N	f	\N	\N	0	\N
5da820cd-d231-4ebf-b752-aec2035c7456	FORN-0002	prova	poreworwer@gmail.com	+32942342843	\N	\N	via catania 10	Pallermo	20100	IT	131321323232	\N	email	\N	\N	\N	\N	\N	bank_transfer_30	3	\N	\N	\N	\N	\N	t	2025-12-07 12:28:41.64031	2025-12-07 12:28:41.64031	\N	\N	bearer_token	\N	\N	\N	\N	f	\N	\N	0	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
\.


--
-- Data for Name: ticket_messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ticket_messages (id, ticket_id, user_id, message, is_internal, created_at, attachments) FROM stdin;
\.


--
-- Data for Name: tickets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tickets (id, ticket_number, customer_id, subject, description, status, priority, assigned_to, created_at, updated_at, ticket_type, initiator_id, initiator_role, target_type, target_id) FROM stdin;
81ce9d96-763d-42cd-b1f5-b1b266542a6a	TKT-1769179755209-1	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Ciao	questo è un test	closed	medium	\N	2026-01-23 14:49:15.243967	2026-02-12 09:37:26.025	internal	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	reseller	repair_center	c0f233d9-e60b-452c-8423-f8eb70dc10dc
\.


--
-- Data for Name: transfer_request_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfer_request_items (id, request_id, product_id, requested_quantity, approved_quantity, shipped_quantity, received_quantity) FROM stdin;
ab2e8f57-dddc-4d6a-94bb-fd670eed4bfa	0a1eb0a6-563b-4456-97c6-53211d3af368	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	\N	\N	\N
afcb1fa1-6fb5-45ee-b461-2170e686d2fe	dbbcce61-afb1-4e46-8503-44257f7e9a39	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	1	1	\N
\.


--
-- Data for Name: transfer_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transfer_requests (id, request_number, requester_type, requester_id, requester_warehouse_id, source_warehouse_id, target_reseller_id, status, approved_by, approved_at, rejected_by, rejected_at, rejection_reason, shipped_at, shipped_by, received_at, notes, created_at, updated_at, tracking_number, tracking_carrier, ddt_number) FROM stdin;
0a1eb0a6-563b-4456-97c6-53211d3af368	REQ-2026-00011	repair_center	9cc5d774-98cb-421b-bb88-d1a9a5346977	bdc543af-101d-4bcd-b618-fee9a53fcdd8	3839aae0-c91e-4efb-a152-ec9a053a0fbb	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	rejected	\N	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-22 14:10:10.007		\N	\N	\N		2026-01-22 14:02:14.589635	2026-01-22 14:10:10.007	\N	\N	\N
dbbcce61-afb1-4e46-8503-44257f7e9a39	REQ-2026-00001	sub_reseller	9985f30d-610e-4172-a39f-8ae614996edb	7bd1a58e-a47b-4e1e-a81d-e56ae9f5e89c	3839aae0-c91e-4efb-a152-ec9a053a0fbb	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	shipped	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-01-22 14:10:04.636	\N	\N	\N	2026-01-22 14:10:20.11	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N		2026-01-22 14:01:35.155707	2026-01-22 14:10:20.11	2942342838423	DHL	DDT-2026-00001
\.


--
-- Data for Name: trovausati_coupons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trovausati_coupons (id, credential_id, shop_id, coupon_code, barcode, value_cents, status, brand, model, imei_or_sn, consumed_at, consumed_shop_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trovausati_credentials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trovausati_credentials (id, reseller_id, api_type, api_key, marketplace_id, is_active, last_test_at, last_test_result, created_at, updated_at, marketplace_api_key, stores_api_key, stores_is_active, stores_last_test_at, stores_last_test_result) FROM stdin;
\.


--
-- Data for Name: trovausati_models; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trovausati_models (id, credential_id, external_id, brand, model, model_base, variant, device_type, label, image_url, price_never_used, price_great, price_good, price_average, price_shop, price_public, last_sync_at, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trovausati_orders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trovausati_orders (id, credential_id, external_order_id, reference, status, total_products, total_cents, carrier_code, tracking_code, shipping_pdf_url, address_data, products_data, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: trovausati_shops; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.trovausati_shops (id, credential_id, shop_id, shop_name, branch_id, repair_center_id, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: unrepairable_reasons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.unrepairable_reasons (id, name, description, device_type_id, is_active, sort_order, created_at, updated_at, icon) FROM stdin;
d0a6a8f1-c134-496c-b72c-d07e4300e0d3	Ricambi Non Reperibili nei Mercati Ufficiali	Componenti non disponibili attraverso canali ufficiali	\N	t	2	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
81d03a5c-183b-4734-9b5d-a8eba314d3cf	Scheda Madre Compromessa	Danno irreparabile alla scheda logica principale	\N	t	3	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
ade345a8-08eb-49cb-9e69-679c26a0871b	Chip di Memoria Guasto	Memoria NAND/eMMC danneggiata	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	5	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
9129eb4c-8685-4a97-a9c3-5dd947f1c8a8	Baseband Compromesso	Modulo radio cellulare non riparabile	c8aab45b-4c23-47f1-835c-5c9afc46799d	t	6	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
5254c0a1-6550-4eed-a8b0-355e781ac161	GPU Saldata Danneggiata	Chip grafico integrato non sostituibile	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	7	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
c4638c4c-baae-4d4e-a5d4-8a9e731688b4	BIOS Corrotto	Firmware di base irrecuperabile	dfd146f2-08af-40fe-bd5b-6b0c851a6f76	t	8	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
6c9fab82-8e21-4f14-badf-ba4f6ca15a8a	Pannello LCD/OLED Danneggiato	Schermo principale non riparabile	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	12	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
0feeb5a8-14cb-4046-99df-6ba3244aa4b6	T-Con Board Bruciata	Scheda di controllo tempi non riparabile	34ee92ca-5ef6-44c8-a3ef-47c8083df0f6	t	14	2025-11-28 14:31:34.675681	2025-11-28 14:31:34.675681	\N
bc1bb2ab-91b8-43f6-805a-59b736c2b2e9	CPU Danneggiata	Processore principale non funzionante	\N	t	4	2025-11-28 14:31:34.675681	2026-01-17 09:59:36.432	\N
b42908f3-2323-410e-80c0-6d855adb3fb4	prova	prova	\N	f	10	2026-02-05 14:54:30.190434	2026-02-05 14:54:34.49	Droplets
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, username, password, email, full_name, role, is_active, repair_center_id, created_at, phone, reseller_id, reseller_category, parent_reseller_id, partita_iva, codice_fiscale, ragione_sociale, indirizzo, cap, citta, provincia, iban, codice_univoco, pec, sub_reseller_id, logo_url, has_autonomous_invoicing) FROM stdin;
a8eacd3b-2836-4d1a-a541-6a00b7f484ac	admin	73d3d78cf126fdc3bf38cb7b2e7a3292d229844738e866135b22c23a6f8ca76425ece9e785dfc74f383371b1e2d1c7a6e47bcf9cf92f18eb180ce76b9c408697.9963264336d0a6247691d63329bcf35b	admin@monkeyplan.it	Admin Sistema	admin	t	\N	2025-11-24 22:15:59.026597	\N	\N	standard	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
9cc5d774-98cb-421b-bb88-d1a9a5346977	repair_milano	32e80fbf599dfd93ac582f2ae85e4b94b0f0c83d1f578b106925b295ffbf88c6b546a20c9c2c1490121a693503a1b15e9893c61ce86b704fce55807cdc7de132.d21d906a5aaab5d5c2fcc34c98fcaf50	repair@milano.it	Tecnico Milano	repair_center	t	c0f233d9-e60b-452c-8423-f8eb70dc10dc	2025-11-24 22:23:42.326789	\N	\N	standard	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	f
00d54ab9-8a63-46a0-95f2-5b719c2a7e63	rivenditore	065d726d936df918c570e10b1052951cda76d8e03bcdf265b8bba9a789c76a081e902fa63c00be49912ac7a7c0df6c55c706b0287ac5ded11ed53ad49ef00d11.117710e71015fbee2f85151f4e7cd7aa	rivenditore@prova.it	rivenditore1	reseller	t	\N	2025-11-30 21:10:35.310348	+329238291212	\N	franchising	\N	11122334455	FLCRSO58L55B371A	asdasdadsadsdas	via casalini 149	90100	Palermo	PA				\N	/objects/resellers/00d54ab9-8a63-46a0-95f2-5b719c2a7e63/logo.png	f
3af078a6-01ce-4d7e-9268-1db16b60b82c	rivenditore2	e2bbeaec6d7b64781ca721a3e3f1198d007f2bd087e1d7985d1d02f30f5649a2f1fd83381fb7db2d529179f03ce6368d4ceab09cf9d5aaeac937de352f14a5ec.7a28e3b45c30c075cfaf6934c82eb83f	rivenditore2@example.com	Rivenditore Due	reseller	t	\N	2026-01-22 14:28:03.489605	+39 06 12345678	\N	standard	\N	12345678902	RVNDUO80A01H501X	Rivenditore Due S.r.l.	Via Roma 2	00100	Roma	RM	\N	\N	\N	\N	\N	f
9985f30d-610e-4172-a39f-8ae614996edb	rivenditore34234242	2d23df3fecb78659fdd09d899dda4c5e8b712e1d4f752dadcd55e42c137e6c9282ed2bed31fba6ad64b1a1cda2ba8dc6a659ec9c07ded6a4821ee934a7e92616.98d8befae92d832a5a7b7d07cabd4f86	info223232@implan.it	giulio Ferlazzo	reseller	t	\N	2026-01-14 14:33:55.619243	3312362882	\N	standard	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	11122334412155	FLCRSO58L55B371A	asdasdadsadsdas	via casalini 149	90100	Palermo	PA	\N			\N	/objects/sub-resellers/9985f30d-610e-4172-a39f-8ae614996edb/logo.png	f
\.


--
-- Data for Name: utility_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_categories (id, slug, name, description, icon, color, sort_order, is_active, created_at, updated_at) FROM stdin;
eee2171e-6e7a-4a96-a365-6f7ee8234d65	fisso	Telefonia Fissa	Servizi di telefonia fissa	Phone	#0088FE	1	t	2025-12-30 14:25:14.50175	2025-12-30 14:25:14.50175
3c24d1d7-3cd9-4d18-8ebb-1d347623c0a1	mobile	Telefonia Mobile	Servizi di telefonia mobile	Smartphone	#00C49F	2	t	2025-12-30 14:25:14.50175	2025-12-30 14:25:14.50175
e9e50401-6a00-4e9c-8000-f50fbdf7b9a4	centralino	Centralino/PBX	Sistemi telefonici aziendali	Building2	#FFBB28	3	t	2025-12-30 14:25:14.50175	2025-12-30 14:25:14.50175
73878f31-766d-4934-8740-f1eba70eb446	luce	Energia Elettrica	Forniture di energia elettrica	Lightbulb	#FF8042	4	t	2025-12-30 14:25:14.50175	2025-12-30 14:25:14.50175
94d7c769-7a3c-4845-83f6-8a6ec56574fc	gas	Gas Naturale	Forniture di gas naturale	Flame	#8884d8	5	t	2025-12-30 14:25:14.50175	2025-12-30 14:25:14.50175
e87588e4-f33f-463b-becd-169e0eda4b56	altro	Altro	Altri servizi utility	Zap	#82ca9d	6	t	2025-12-30 14:25:14.50175	2025-12-30 14:25:14.50175
\.


--
-- Data for Name: utility_commissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_commissions (id, practice_id, period_month, period_year, amount_cents, status, accrued_at, invoiced_at, paid_at, invoice_number, notes, created_at, updated_at, approved_by, approved_at, rejected_by, rejected_at, rejected_reason) FROM stdin;
c0eccba8-0286-4f42-92cb-4354715831fb	11c3be32-1676-453b-a214-1293f925231e	2	2026	100000	paid	2026-02-12 11:03:59.756	\N	\N	\N	Commissione automatica per pratica UTL-2026-0001	2026-02-12 09:57:22.560244	2026-02-12 11:04:13.413	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	2026-02-12 11:03:59.756	\N	\N	\N
\.


--
-- Data for Name: utility_practice_documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practice_documents (id, practice_id, object_key, file_name, file_size, mime_type, category, description, uploaded_by, created_at) FROM stdin;
\.


--
-- Data for Name: utility_practice_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practice_notes (id, practice_id, body, visibility, created_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: utility_practice_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practice_products (id, practice_id, product_id, quantity, unit_price_cents, notes, created_at) FROM stdin;
\.


--
-- Data for Name: utility_practice_state_history; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practice_state_history (id, practice_id, from_status, to_status, reason, changed_by, created_at) FROM stdin;
e9cedbad-c137-49ce-a49b-323d3fe5ef44	11c3be32-1676-453b-a214-1293f925231e	bozza	completata	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-02-12 09:37:48.142875
\.


--
-- Data for Name: utility_practice_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practice_tasks (id, practice_id, title, description, status, assigned_to, due_date, sort_order, created_by, completed_at, completed_by, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: utility_practice_timeline; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practice_timeline (id, practice_id, event_type, title, description, payload, created_by, created_at) FROM stdin;
1396c6ce-994d-4b00-a704-7f93939e2d9b	11c3be32-1676-453b-a214-1293f925231e	status_change	Stato cambiato: bozza → completata	\N	{"toStatus": "completata", "fromStatus": "bozza"}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	2026-02-12 09:37:48.224814
1bf74249-a537-4b16-9b79-4f3176e48bc5	11c3be32-1676-453b-a214-1293f925231e	commissione_approvata	Commissione approvata: €1000.00	Commissione approvata da admin	{"approvedBy": "a8eacd3b-2836-4d1a-a541-6a00b7f484ac", "commissionId": "c0eccba8-0286-4f42-92cb-4354715831fb"}	a8eacd3b-2836-4d1a-a541-6a00b7f484ac	2026-02-12 11:03:59.877878
\.


--
-- Data for Name: utility_practices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_practices (id, practice_number, service_id, supplier_id, customer_id, reseller_id, status, supplier_reference, submitted_at, activated_at, expires_at, monthly_price_cents, activation_fee_cents, commission_amount_cents, notes, created_at, updated_at, priority, assigned_to, external_identifiers, communication_channel, expected_activation_date, go_live_date, contract_end_date, sla_due_at, item_type, product_id, price_type, flat_price_cents, custom_service_name, temporary_supplier_name, temporary_customer_name, temporary_customer_email, temporary_customer_phone, repair_center_id) FROM stdin;
11c3be32-1676-453b-a214-1293f925231e	UTL-2026-0001	0fcd7870-14a3-4390-9810-be22c39d5abb	132a1024-3b26-49c7-815c-e1ccb5b595a1	3d7c8ab4-eba1-4878-860c-3f005e0d6118	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	completata	\N	\N	2026-02-12 09:37:48.27	\N	\N	100000	\N	\N	2026-02-10 18:48:48.898648	2026-02-12 09:37:48.27	normale	\N	\N	\N	\N	\N	\N	\N	service	\N	attivazione	\N	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: utility_services; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_services (id, supplier_id, code, name, description, category, monthly_price_cents, activation_fee_cents, commission_percent, commission_fixed, commission_one_time, contract_months, is_active, created_at, updated_at, price_type, flat_price_cents, cover_image_url) FROM stdin;
0fcd7870-14a3-4390-9810-be22c39d5abb	132a1024-3b26-49c7-815c-e1ccb5b595a1	IMPLN	Sviluppo Software	Sviluppo software	altro	\N	100000	10	\N	\N	24	t	2025-12-30 18:44:59.232267	2026-01-02 14:54:45.43	mensile	\N	\N
5e02a782-ff96-41f7-b8f1-8aa25547503b	132a1024-3b26-49c7-815c-e1ccb5b595a1	TIM-LINEA-BIZ	Linea Telefonica Business	prova prova prova	fisso	2500	\N	10	\N	\N	\N	t	2025-11-30 17:30:03.340219	2026-02-22 23:28:57.516	mensile	\N	/objects/utility-services/5e02a782-ff96-41f7-b8f1-8aa25547503b/1771802906485.png
\.


--
-- Data for Name: utility_suppliers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utility_suppliers (id, code, name, category, email, phone, referent_name, referent_phone, referent_email, portal_url, portal_username, default_commission_percent, default_commission_fixed, payment_terms_days, notes, is_active, created_at, updated_at, reseller_id, logo_url) FROM stdin;
132a1024-3b26-49c7-815c-e1ccb5b595a1	TIM-BIZ	TIM Business	fisso	business@tim.it	+39 02 1234567	Mario Rossi	\N	\N	https://business.tim.it	\N	\N	\N	30	\N	t	2025-11-30 17:29:40.220568	2025-11-30 17:29:40.220568	\N	\N
6c8e6d50-2d58-4e80-b512-e27d9691f447	pr	prova	altro	implanitalia@gmail.com	3312362882	asd	asd	asdadasda@gmail.com	https://www.prova.it	\N	\N	\N	30	\N	t	2025-12-11 11:38:56.709571	2025-12-11 11:38:56.709571	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N
2fd2c315-7237-47e8-a1fd-7da1edc568cc	TIM-MOB	TIM	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
646aa114-a7fe-4ce3-aa25-f9ada0fed9f1	VODAFONE-MOB	Vodafone	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
5a5bbbd9-2ce2-4efb-93ca-0aa6981666e9	WINDTRE-MOB	WindTre	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
aea16324-780a-424a-a1f5-aedfe4c608a5	ILIAD	Iliad	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
cf0ebb91-8a61-4bc3-9c86-a58a5b9e9ce9	FASTWEB-MOB	Fastweb	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
09acdad8-acba-4136-88cb-5cfbd174548d	HO	ho.	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
17513086-b1da-4fff-ac19-1afed9305dd2	KENA	Kena Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
c09e53c5-8bdd-4a2b-8a00-ab3d3aa0393f	VERY	Very Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
1cedc048-3712-42f4-89b2-9398b48fae38	POSTEMOBILE	PosteMobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
463ba781-bb52-40ca-b8a9-9aa898e84bc2	COOPVOCE	CoopVoce	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
c5f8689e-64ef-4b36-835a-23742b8f8e1d	SPUSU	Spusu	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
0e691d6a-5cd3-4a53-a1e7-195fccf02f80	LYCAMOBILE	Lycamobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
b99bb0ca-e1ae-42ae-8413-a8938920f872	OPTIMA-MOB	Optima Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
e49c4e80-d4c1-4331-ac29-ab410dfacfcc	NOITEL	Noitel	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
bf9bb5ec-0312-43d4-a9c7-829f3dadf253	NTMOBILE	NT Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
0ff23ca9-b9ab-478f-b1cd-f3d8fbc2962a	FEDERMOBILE	Feder Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
6544d300-7ee1-4f75-8891-b7e1d1b82e17	ENEGAN-MOB	Enegan Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
202dac3c-8d0f-4d42-8f30-6aa61811ebe9	TISCALI-MOB	Tiscali Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
e115ab10-1373-43a9-b338-56b997e1dc0b	WELCOME	Welcome Italia	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
1b4bca3e-50af-49a4-8161-ba3bf4a356b3	PLINTRON	Plintron	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
03ac1249-0075-4d37-9571-6677eddba96c	AIRALO	Airalo	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
76616992-7506-4992-a205-f8da7357689c	UBIGI	Ubigi	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
984080a3-f2ea-45b9-bcd0-081733940556	HOLAFLY	Holafly	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-01-02 12:36:24.449364	\N	\N
b4e2ef06-eb45-4ff1-a5d6-4aa54994374f	TIM-FIS	TIM	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
798328e7-ae6a-4bcc-9e1b-6b024657e08c	VODAFONE-FIS	Vodafone	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
24e46814-f6e7-46cb-a1a4-6332b2ae8f3b	WINDTRE-FIS	WindTre	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
80713a62-579e-4fa5-9c45-1a759ac52f95	FASTWEB-FIS	Fastweb	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
41a1ed98-a612-4a72-9b7b-0de5e0094a90	SKYWIFI	Sky Wifi	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
2fb9bd2e-c6f4-4e4d-a7e7-05442393fb84	EOLO	Eolo	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
4ed7c348-6737-487e-a89c-6c1608294159	LINKEM	Linkem	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
d7835ac2-6f21-4e84-bcc4-fb684b117b0f	DIMENSIONE	Dimensione	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
a1af449e-983d-4f20-9f74-fc2e62b0a1a2	ARUBA	Aruba	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
55ed58eb-2856-4063-8ed6-64f961ea2b2c	TISCALI-FIS	Tiscali	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
a10d200b-cc6a-4309-a9c1-5e0f12a13f67	OPENFIBER	Open Fiber	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
5cc1a1e7-2a8d-4cf5-af30-4437345a0bc5	FIBERCOP	FiberCop	fisso	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:40.349695	2026-01-02 12:36:40.349695	\N	\N
11261407-5830-4740-8f09-47e2347d6742	ENEL	Enel Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
03f72ef1-4143-4e8e-929a-926371d4c422	ENI	ENI Plenitude	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
3ce74ccf-1c28-4115-aa4d-fd489980a357	EDISON	Edison Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
03b9a23f-829b-4388-9dce-8ce666902d14	A2A	A2A Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
5e79b429-bd26-4e9b-b795-5d9bfc7e3bce	HERA	Hera Comm	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
3fa21cc2-d9a6-40be-8f9a-24f29f8a338b	IREN	Iren Mercato	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
108d4cc5-8cfe-443a-8702-535865266282	ACEA	Acea Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
b16690af-d232-4be7-90b1-ba4fb3e8ce17	SORGENIA	Sorgenia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
ce79860a-101c-44a6-b9ab-d805e52f0db3	ILLUMIA	Illumia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
070a82f5-c718-42f0-9381-836d8092ce29	NEN	NeN	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
535875f0-52ef-43e4-bbec-71ede9e04e56	PULSEE	Pulsee	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
8e101e45-eb7c-45ea-bb34-2cdd19899d32	OPTIMA-EN	Optima Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
29aafbd1-f776-4080-9875-f5ec75389e48	ESTRA	Estra Energie	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
6602e6d1-bdaf-40f5-8623-baa319d3497e	DOLOMITI	Dolomiti Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
fc3a00df-1bd6-41ed-bf1b-26ddef52aead	ALPERIA	Alperia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
94a5fed7-b982-41a9-b901-681977e46b4f	GREENNET	Green Network	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
6471a73a-6fe9-453d-85ae-cc2aa975e141	WEKIWI	WeKiwi	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
4cfd01dc-89c1-4138-a79a-65de90077712	ENGIE	Engie Italia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
73792d69-6cc7-460f-8e4a-09df149b5b23	EON	E.ON Energia	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
9582696a-1803-4d18-b379-ed690533eeee	ARGOS	Argos	luce	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:50.828119	2026-01-02 12:36:50.828119	\N	\N
5939d4e6-c7a7-4152-bbeb-7b5740f86620	1MOBILE	1Mobile	mobile	\N	\N	\N	\N	\N	\N	\N	\N	\N	30	\N	t	2026-01-02 12:36:24.449364	2026-02-22 23:45:48.493	\N	/objects/utility-suppliers/5939d4e6-c7a7-4152-bbeb-7b5740f86620/logo-1771803947474.png
\.


--
-- Data for Name: warehouse_movements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_movements (id, warehouse_id, product_id, movement_type, quantity, reference_type, reference_id, notes, created_at, created_by) FROM stdin;
09ba512c-734c-44e5-a8a7-2ee50ab8266e	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	carico	1	\N	\N	Quantità iniziale alla creazione del prodotto	2026-01-22 10:33:57.321132	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
634ad2ec-515f-417f-b6f1-559d04d1da61	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	1	initial_stock	\N	Quantità iniziale alla creazione prodotto	2026-01-22 10:35:23.075339	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
18caccde-71cb-4bf4-97b4-67e2eccbf72e	3839aae0-c91e-4efb-a152-ec9a053a0fbb	daf22961-9f49-4a27-9f06-2447185c9c26	carico	1	initial_stock	\N	Quantità iniziale alla creazione prodotto	2026-01-22 10:50:27.411837	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
0fe6eca3-817e-4c3b-8221-a6641f953ce8	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	4	\N	\N	Modifica manuale stock	2026-01-22 12:43:07.862437	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
2b919b3b-17cf-4b6f-b8c9-b36cefaf4a27	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	carico	4	\N	\N	Modifica manuale stock	2026-01-22 12:43:21.335785	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
8b907930-73f1-4f78-a9d6-4513a2011969	3839aae0-c91e-4efb-a152-ec9a053a0fbb	daf22961-9f49-4a27-9f06-2447185c9c26	carico	4	\N	\N	Modifica manuale stock	2026-01-22 12:43:42.173578	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
1da6b0f6-6bf8-427d-934a-fd4a9fbb1603	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	1	transfer_request	dbbcce61-afb1-4e46-8503-44257f7e9a39	\N	2026-01-22 14:10:20.067095	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
ff85c3a8-644d-44bb-90a2-7f53d79949b7	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-2	marketplace_order	4ac347c1-0e62-4628-b3e4-6dae184db146	Vendita Marketplace MP-2026-00001 → Magazzino Buyer Reseller	2026-01-22 15:28:39.169342	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
114dc2f5-ebcc-4cf7-b817-21c0371aa517	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	2	marketplace_order	4ac347c1-0e62-4628-b3e4-6dae184db146	Acquisto Marketplace MP-2026-00001 ← Magazzino rivenditore1	2026-01-22 15:28:39.392832	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
de88cf57-0cac-4b67-810c-f4d5a0d4bc8c	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-2	marketplace_order	4ac347c1-0e62-4628-b3e4-6dae184db146	Vendita Marketplace MP-2026-00001 → Magazzino Buyer Reseller	2026-01-22 15:33:29.754725	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
6b0323bb-d362-44e3-a730-29d5e92cf264	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-2	marketplace_order	4ac347c1-0e62-4628-b3e4-6dae184db146	Vendita Marketplace MP-2026-00001 → Magazzino Buyer Reseller	2026-01-22 15:34:51.324891	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
39bf6555-2591-42a5-97af-48ab7b8f578f	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	9	\N	\N	Modifica manuale stock	2026-01-22 15:41:01.476591	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
aa8f51e1-9f44-42e0-af26-f1224eb34232	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-2	marketplace_order	4ac347c1-0e62-4628-b3e4-6dae184db146	Vendita Marketplace MP-2026-00001 → Magazzino Buyer Reseller	2026-01-22 15:41:06.301232	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
efa64312-5f9f-4295-8f1a-fe010928ffef	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	2	marketplace_order	4ac347c1-0e62-4628-b3e4-6dae184db146	Acquisto Marketplace MP-2026-00001 ← Magazzino rivenditore1	2026-01-22 15:41:06.523981	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
f3398b09-3be5-478d-9ddf-577198f82554	3839aae0-c91e-4efb-a152-ec9a053a0fbb	daf22961-9f49-4a27-9f06-2447185c9c26	trasferimento_out	-1	marketplace_order	95cb6c28-6e9f-4575-ad30-153afcda1d15	Vendita Marketplace MP-2026-00011 → Magazzino Buyer Reseller	2026-01-22 15:52:36.811163	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
bd355dfa-0f71-4fb8-8805-593651988c0d	ddea9f6a-131c-4ec2-933e-409aa18c2b10	daf22961-9f49-4a27-9f06-2447185c9c26	trasferimento_in	1	marketplace_order	95cb6c28-6e9f-4575-ad30-153afcda1d15	Acquisto Marketplace MP-2026-00011 ← Magazzino rivenditore1	2026-01-22 15:52:37.033248	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
3ed3affc-8689-4b12-b499-5b6dbea6d1b6	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	1d0db182-be36-4334-a5ab-b0b40d8efcdd	Vendita Marketplace MP-2026-00021 → Magazzino Buyer Reseller	2026-01-22 16:02:27.83754	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
b52b8341-bd0b-48fb-a560-c04de8965579	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	1d0db182-be36-4334-a5ab-b0b40d8efcdd	Acquisto Marketplace MP-2026-00021 ← Magazzino rivenditore1	2026-01-22 16:02:28.066182	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
1c195856-4ed2-4841-8101-d8b58eae6490	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	1	ordine_rc_b2b	67b34c9b-3626-4c21-9124-7dad143301da	Ordine RC B2B RCB2B-2026-00001	2026-01-22 17:44:42.558566	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
66a2e62e-9faa-4646-afaf-213e85e300ff	bdc543af-101d-4bcd-b618-fee9a53fcdd8	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	ordine_rc_b2b	67b34c9b-3626-4c21-9124-7dad143301da	Ordine RC B2B RCB2B-2026-00001	2026-01-22 17:44:42.780307	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
ebef0d6d-11ad-441a-abdd-4306d0e96d49	2ff305dd-92c8-485c-bc93-634cff9f43be	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	1	\N	\N		2026-01-22 19:11:52.074113	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
e3e44ef6-d401-4d54-8dd0-ac1d3057cdf4	2ff305dd-92c8-485c-bc93-634cff9f43be	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	1	ordine_b2b	8e487e54-8a28-4ee4-8105-2e793e0f34e0	Ordine B2B B2B-2026-00001 → Magazzino rivenditore1	2026-01-22 19:24:53.00915	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
7ae2b80e-0343-4c95-9930-4863602f0798	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	ordine_b2b	8e487e54-8a28-4ee4-8105-2e793e0f34e0	Ordine B2B B2B-2026-00001 ← Magazzino Centrale	2026-01-22 19:24:53.245593	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
386e858b-0634-4054-b591-4d254dfc6dea	2ff305dd-92c8-485c-bc93-634cff9f43be	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	155	rettifica	\N	Rettifica manuale: da 0 a 155	2026-01-29 15:54:26.987645	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
170dd28b-98de-41c2-992f-35f69ce15603	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	2	transfer	bdc543af-101d-4bcd-b618-fee9a53fcdd8	Trasferimento verso Magazzino Centro Riparazione Milano	2026-01-30 10:13:59.254295	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
f2c6997e-c434-4717-b3f2-fcd8846d2674	bdc543af-101d-4bcd-b618-fee9a53fcdd8	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	2	transfer	3839aae0-c91e-4efb-a152-ec9a053a0fbb	Trasferimento da Magazzino rivenditore1	2026-01-30 10:13:59.475993	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
1ab7a0a0-f819-4414-a4db-89852038acfb	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	1	ordine_rc_b2b	6d6975f0-09db-41ec-9e33-21230f36efe4	Ordine RC B2B RCB2B-2026-00061	2026-02-02 14:57:38.655969	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
fe40be71-d3ac-41a0-81f3-6df7e15b03e4	bdc543af-101d-4bcd-b618-fee9a53fcdd8	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	ordine_rc_b2b	6d6975f0-09db-41ec-9e33-21230f36efe4	Ordine RC B2B RCB2B-2026-00061	2026-02-02 14:57:38.889642	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
08df2c0d-cf4e-4967-b4f9-bb1e711a5432	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Vendita Marketplace MP-2026-00091 → Magazzino Buyer Reseller	2026-02-02 15:09:33.22591	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
1bf36d5b-a883-4f1d-b3fa-01ed49e085e7	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Acquisto Marketplace MP-2026-00091 ← Magazzino rivenditore1	2026-02-02 15:09:33.45394	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
bfe17404-49cd-4a74-910b-db4b27c0fadc	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Vendita Marketplace MP-2026-00091 → Magazzino Buyer Reseller	2026-02-02 15:09:37.506247	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
447c5b00-5518-4df3-ad99-1146b9028cb9	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Acquisto Marketplace MP-2026-00091 ← Magazzino rivenditore1	2026-02-02 15:09:37.723725	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
5f072592-a7e1-4727-8b9d-aeee13745a64	3839aae0-c91e-4efb-a152-ec9a053a0fbb	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	carico	12	\N	\N	Modifica manuale stock	2026-02-02 15:25:39.74701	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
d4de8e25-08de-4f02-9bd0-6bc46d2a236c	3839aae0-c91e-4efb-a152-ec9a053a0fbb	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	carico	1	\N	\N	Modifica manuale stock	2026-02-02 15:42:25.913501	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
d43b7262-5293-4ed7-8c54-01d4ae753a9e	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	2	\N	\N	Modifica manuale stock	2026-02-02 15:51:23.309545	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
08eed5bb-46f6-46b0-a6a3-30d96c42d4f0	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Vendita Marketplace MP-2026-00091 → Magazzino Buyer Reseller	2026-02-02 15:55:08.740713	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
e1b14fd7-6057-485a-999d-e9b218bc5072	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Acquisto Marketplace MP-2026-00091 ← Magazzino rivenditore1	2026-02-02 15:55:08.972983	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
e7e8636b-ca8e-461e-9932-3531157b63a7	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Vendita Marketplace MP-2026-00091 → Magazzino Buyer Reseller	2026-02-02 15:55:13.041778	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
b2ea41ad-d3c3-4a0d-a900-83a061cd5aa9	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Acquisto Marketplace MP-2026-00091 ← Magazzino rivenditore1	2026-02-02 15:55:13.261175	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
70a474ec-c5b8-4d8f-92b9-c78ce57afa29	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Vendita Marketplace MP-2026-00091 → Magazzino Buyer Reseller	2026-02-02 15:58:18.027666	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
87a4a73b-6490-46c3-b327-dc4b821ca287	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	1350a181-1515-4736-8b74-ec4511e2c6b9	Acquisto Marketplace MP-2026-00091 ← Magazzino rivenditore1	2026-02-02 15:58:18.246593	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
87dbb4f6-738e-441f-a7af-7092aa142728	2ff305dd-92c8-485c-bc93-634cff9f43be	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	1	ordine_b2b	4489c3d1-38f6-4a74-ba9a-934fbbf79cc2	Ordine B2B B2B-2026-00071 → Magazzino Buyer Reseller	2026-02-02 15:58:41.833204	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
daaca2f0-0a0a-4f23-8b6f-07310204388b	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	ordine_b2b	4489c3d1-38f6-4a74-ba9a-934fbbf79cc2	Ordine B2B B2B-2026-00071 ← Magazzino Centrale	2026-02-02 15:58:42.056176	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
3c5283ac-55d8-4410-a936-52418272ac3c	2ff305dd-92c8-485c-bc93-634cff9f43be	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	1	ordine_b2b	24e24217-e1a0-4360-b18d-435fdfcffffb	Ordine B2B B2B-2026-00081 → Magazzino Buyer Reseller	2026-02-02 16:40:42.350621	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
f9d51031-6ab9-41c5-b6ee-eae914151f48	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	ordine_b2b	24e24217-e1a0-4360-b18d-435fdfcffffb	Ordine B2B B2B-2026-00081 ← Magazzino Centrale	2026-02-02 16:40:42.576314	a8eacd3b-2836-4d1a-a541-6a00b7f484ac
4f029511-6ee0-4265-ba2e-8a38aec3e812	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	trasferimento_out	-1	marketplace_order	e339ba4c-08ab-4a93-a2f0-8893637f9245	Vendita Marketplace MP-2026-00101 → Magazzino Buyer Reseller	2026-02-02 16:58:45.181247	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
9031b838-4b37-4864-8972-313c212f4038	ddea9f6a-131c-4ec2-933e-409aa18c2b10	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	trasferimento_in	1	marketplace_order	e339ba4c-08ab-4a93-a2f0-8893637f9245	Acquisto Marketplace MP-2026-00101 ← Magazzino rivenditore1	2026-02-02 16:58:45.409772	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
4d745e66-e772-4b35-a552-bf37677b2b50	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	trasferimento_out	1	ordine_rc_b2b	e17df8a6-5b2f-4489-8717-3b8f98b4f17f	Ordine RC B2B RCB2B-2026-00071	2026-02-02 16:58:57.504805	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
52fb4cd1-05b0-401d-9b78-317c1dc0528b	bdc543af-101d-4bcd-b618-fee9a53fcdd8	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	trasferimento_in	1	ordine_rc_b2b	e17df8a6-5b2f-4489-8717-3b8f98b4f17f	Ordine RC B2B RCB2B-2026-00071	2026-02-02 16:58:57.738131	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
adfe5009-1fd9-4de6-8b26-fe6cc7adce58	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	trasferimento_out	-1	marketplace_order	e495c7c7-b8a8-4914-99db-69db210b8b87	Vendita Marketplace MP-2026-00161 → Magazzino Buyer Reseller	2026-02-04 13:20:55.119174	3af078a6-01ce-4d7e-9268-1db16b60b82c
c08f45c2-8e2e-4ac6-8846-e226e613fa89	ddea9f6a-131c-4ec2-933e-409aa18c2b10	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	trasferimento_in	1	marketplace_order	e495c7c7-b8a8-4914-99db-69db210b8b87	Acquisto Marketplace MP-2026-00161 ← Magazzino rivenditore1	2026-02-04 13:20:55.348037	3af078a6-01ce-4d7e-9268-1db16b60b82c
44d2f56b-9b58-4471-a92b-bed1604573a1	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	78d935b5-55e1-4867-945a-17983a4ad382	Vendita Marketplace MP-2026-00171 → Magazzino Buyer Reseller	2026-02-04 13:34:09.098031	3af078a6-01ce-4d7e-9268-1db16b60b82c
886661c5-eb19-42e9-9028-e90642e3e3be	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	78d935b5-55e1-4867-945a-17983a4ad382	Acquisto Marketplace MP-2026-00171 ← Magazzino rivenditore1	2026-02-04 13:34:09.318442	3af078a6-01ce-4d7e-9268-1db16b60b82c
81f439b9-1258-4ed0-810a-9eacbb01d3b6	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	Vendita Marketplace MP-2026-00181 → Magazzino Buyer Reseller	2026-02-04 13:38:27.145774	3af078a6-01ce-4d7e-9268-1db16b60b82c
1930ce3a-f27a-4bca-be56-9bff727d99ee	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	a2b468b6-e8a3-4f74-98a6-87e72e4f5e4b	Acquisto Marketplace MP-2026-00181 ← Magazzino rivenditore1	2026-02-04 13:38:27.370452	3af078a6-01ce-4d7e-9268-1db16b60b82c
def3c514-e3d8-4ad8-b3bc-7844559d68b6	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	456e4306-99b1-4053-8303-b5ec89b2633d	Vendita Marketplace MP-2026-00191 → Magazzino Buyer Reseller	2026-02-04 13:44:17.577911	3af078a6-01ce-4d7e-9268-1db16b60b82c
61617b68-a2aa-402e-9f7c-f91fa1e481c0	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	456e4306-99b1-4053-8303-b5ec89b2633d	Acquisto Marketplace MP-2026-00191 ← Magazzino rivenditore1	2026-02-04 13:44:17.80205	3af078a6-01ce-4d7e-9268-1db16b60b82c
aa2808e2-a2cf-4918-ac61-01728d841394	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_out	-1	marketplace_order	d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	Vendita Marketplace MP-2026-00201 → Magazzino Buyer Reseller	2026-02-04 13:47:47.051844	3af078a6-01ce-4d7e-9268-1db16b60b82c
3ec229e5-a78e-449c-a909-9df2ab1efc30	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	trasferimento_in	1	marketplace_order	d0d9ce6c-d1f4-44db-811a-81f22b99cf5d	Acquisto Marketplace MP-2026-00201 ← Magazzino rivenditore1	2026-02-04 13:47:47.271497	3af078a6-01ce-4d7e-9268-1db16b60b82c
8e2e4f4c-3766-419e-b3e7-10b30e859ff2	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	carico	120	\N	\N	Modifica manuale stock	2026-02-06 12:37:19.604788	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
13850e5e-cbe7-4d14-833d-f556b4cb2856	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	scarico	1	courtesy_phone	c609f327-72d7-452b-b93b-f5799b47af9e	Telefono di cortesia assegnato - Ordine ORD-1771542621139-10	2026-02-19 23:10:21.279453	7e413aba-8495-4f15-98b5-b5b757a36565
ae3e6f8f-7334-407c-9101-66c6a720823e	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	carico	1	courtesy_phone_return	c609f327-72d7-452b-b93b-f5799b47af9e	Telefono di cortesia restituito - Ordine ORD-1771542621139-10	2026-02-19 23:25:58.646018	7e413aba-8495-4f15-98b5-b5b757a36565
\.


--
-- Data for Name: warehouse_stock; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_stock (id, warehouse_id, product_id, quantity, min_stock, location, updated_at) FROM stdin;
dd074d9e-6a61-4ed3-82a4-3e55aea69cbe	2ff305dd-92c8-485c-bc93-634cff9f43be	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	153	0	\N	2026-02-02 16:40:42.237
2a5d4091-15b8-4188-bc2d-4271dc42dbc9	3839aae0-c91e-4efb-a152-ec9a053a0fbb	daf22961-9f49-4a27-9f06-2447185c9c26	4	0	\N	2026-01-22 15:52:36.704
b5264017-5b93-4a2e-a366-838ba823eaff	ddea9f6a-131c-4ec2-933e-409aa18c2b10	daf22961-9f49-4a27-9f06-2447185c9c26	1	0	\N	2026-01-22 15:52:36.958394
6a73beaf-b99e-424b-823c-99e501c99793	ddea9f6a-131c-4ec2-933e-409aa18c2b10	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	2	0	\N	2026-02-04 13:20:55.24
9d993387-c72d-4f41-85c9-b2c0befd5383	ddea9f6a-131c-4ec2-933e-409aa18c2b10	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	20	0	\N	2026-02-04 13:47:47.167
b0dd93a7-bce9-4ad6-9f73-da3ee018a64a	bdc543af-101d-4bcd-b618-fee9a53fcdd8	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	0	0	\N	2026-02-05 09:17:04.19
13a5e8d2-03f2-4e54-8bee-a317af821e1f	bdc543af-101d-4bcd-b618-fee9a53fcdd8	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	0	\N	\N	2026-02-05 09:37:44.094
8fef1de0-d665-45fb-8ddc-5b76cee17b7e	3839aae0-c91e-4efb-a152-ec9a053a0fbb	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	120	0	\N	2026-02-06 12:37:19.728
7f5fe566-f9c2-4a78-8297-e2105e5a76bf	3839aae0-c91e-4efb-a152-ec9a053a0fbb	13382a3f-b4c0-4d5e-b5c3-890dac0405a7	13	0	\N	2026-02-02 15:42:26.03
d7fc165a-ec1a-41c8-929b-ff1784666d0c	3839aae0-c91e-4efb-a152-ec9a053a0fbb	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	9	0	\N	2026-02-19 23:25:58.649
\.


--
-- Data for Name: warehouse_transfer_items; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_transfer_items (id, transfer_id, product_id, requested_quantity, shipped_quantity, received_quantity) FROM stdin;
a1806e33-5e14-4322-bd44-36c594163615	ae59f774-00f1-4e5e-bd37-bc868d3b4a52	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	2	\N	\N
17bcc30e-dc43-4899-bfda-9aead169e609	25b484c7-1e13-4a88-8fe4-5b38e9b58ac3	daf22961-9f49-4a27-9f06-2447185c9c26	1	\N	\N
5429495c-a554-4c3d-8552-e113baa674cf	c40b7603-d331-4a35-83f2-7c5327ee7e6c	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	\N	\N
b060668d-fe3d-45e2-bb38-82675bfaea5f	65aaeb98-d1ad-4ca2-b5c8-6df8116708e2	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	\N	\N
b2588258-4527-4f6f-acdc-151bafb3a71f	5be94a60-475e-4f66-b76e-c8f2afed60c9	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	\N	\N
b392fdcb-ef6b-45f0-a7ec-c6e1aced0e3c	c979133b-64c1-4bbb-84b2-d4e60a485321	7aa7b534-000e-4d37-b4c2-1dbdcd47bddf	1	\N	\N
4b4747fd-d3e2-423e-9afb-53ac33aa1fa9	fd2cc0e7-f04f-4972-9c03-313939ae567d	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	\N	\N
fb8180a8-649a-4ff1-a2aa-b7a5cc3f0c7c	aa8dc298-4f1d-4dd5-bc27-45bdef86e45a	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	\N	\N
4bfb41b9-39a9-45e7-9267-3bb10566327a	1b80e65b-7717-4a88-8bd8-99904f051b14	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	\N	\N
4c1e99cb-803c-4906-b348-960da13ec42b	d679d432-ea7f-42a3-b391-7f919a7a087e	07e44d0c-fc41-4e3f-b57d-9b55b53efa94	1	\N	\N
\.


--
-- Data for Name: warehouse_transfers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouse_transfers (id, transfer_number, source_warehouse_id, destination_warehouse_id, status, requested_by, approved_by, approved_at, shipped_at, received_at, notes, created_at, updated_at) FROM stdin;
cb01f21c-3fed-41e9-99d7-7386dd7ee8b1	TRF-2026-00001	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00001	2026-01-22 15:26:45.424787	2026-01-22 15:26:45.424787
b70096f6-0451-4287-a4a6-4afce63da2bc	TRF-2026-00011	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00001	2026-01-22 15:28:38.947701	2026-01-22 15:28:38.947701
6477fd82-a980-452a-9419-e86d705dba97	TRF-2026-00021	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00001	2026-01-22 15:33:29.522521	2026-01-22 15:33:29.522521
3c0e9f36-b3d9-40f8-a49a-637558fb3f7d	TRF-2026-00031	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00001	2026-01-22 15:34:51.095962	2026-01-22 15:34:51.095962
ae59f774-00f1-4e5e-bd37-bc868d3b4a52	TRF-2026-00041	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00001	2026-01-22 15:41:06.083456	2026-01-22 15:41:06.083456
25b484c7-1e13-4a88-8fe4-5b38e9b58ac3	TRF-2026-00051	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00011	2026-01-22 15:52:36.589304	2026-01-22 15:52:36.589304
c40b7603-d331-4a35-83f2-7c5327ee7e6c	TRF-2026-00061	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00021	2026-01-22 16:02:27.609294	2026-01-22 16:02:27.609294
640e7c3a-8c0c-410c-b372-35933df30879	TRF-2026-00071	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00091	2026-02-02 15:06:55.347114	2026-02-02 15:06:55.347114
fd4fa1bd-9233-4fa7-9b8b-eecacae4af69	TRF-2026-00081	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00091	2026-02-02 15:09:32.998928	2026-02-02 15:09:32.998928
8fcf4250-6506-4dba-ba7f-99969679bad9	TRF-2026-00091	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00091	2026-02-02 15:09:37.284429	2026-02-02 15:09:37.284429
93265575-673e-4781-9968-2eb9af040639	TRF-2026-00101	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00091	2026-02-02 15:55:08.511032	2026-02-02 15:55:08.511032
fa907001-3402-49af-9633-99fd9541a38e	TRF-2026-00111	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00091	2026-02-02 15:55:12.817687	2026-02-02 15:55:12.817687
65aaeb98-d1ad-4ca2-b5c8-6df8116708e2	TRF-2026-00121	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00091	2026-02-02 15:58:17.801895	2026-02-02 15:58:17.801895
5be94a60-475e-4f66-b76e-c8f2afed60c9	TRF-2026-00131	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	\N	\N	\N	Ordine Marketplace MP-2026-00101	2026-02-02 16:58:44.951242	2026-02-02 16:58:44.951242
c979133b-64c1-4bbb-84b2-d4e60a485321	TRF-2026-00141	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	3af078a6-01ce-4d7e-9268-1db16b60b82c	\N	\N	\N	\N	Ordine Marketplace MP-2026-00161 (auto-approvato)	2026-02-04 13:20:54.887236	2026-02-04 13:20:54.887236
fd2cc0e7-f04f-4972-9c03-313939ae567d	TRF-2026-00151	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	3af078a6-01ce-4d7e-9268-1db16b60b82c	\N	\N	\N	\N	Ordine Marketplace MP-2026-00171 (auto-approvato)	2026-02-04 13:34:08.873838	2026-02-04 13:34:08.873838
aa8dc298-4f1d-4dd5-bc27-45bdef86e45a	TRF-2026-00161	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	3af078a6-01ce-4d7e-9268-1db16b60b82c	\N	\N	\N	\N	Ordine Marketplace MP-2026-00181 (auto-approvato)	2026-02-04 13:38:26.918822	2026-02-04 13:38:26.918822
1b80e65b-7717-4a88-8bd8-99904f051b14	TRF-2026-00171	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	3af078a6-01ce-4d7e-9268-1db16b60b82c	\N	\N	\N	\N	Ordine Marketplace MP-2026-00191 (auto-approvato)	2026-02-04 13:44:17.351673	2026-02-04 13:44:17.351673
d679d432-ea7f-42a3-b391-7f919a7a087e	TRF-2026-00181	3839aae0-c91e-4efb-a152-ec9a053a0fbb	ddea9f6a-131c-4ec2-933e-409aa18c2b10	received	3af078a6-01ce-4d7e-9268-1db16b60b82c	\N	\N	\N	\N	Ordine Marketplace MP-2026-00201 (auto-approvato)	2026-02-04 13:47:46.827184	2026-02-04 13:47:46.827184
\.


--
-- Data for Name: warehouses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warehouses (id, owner_type, owner_id, name, address, notes, is_active, created_at, updated_at) FROM stdin;
3839aae0-c91e-4efb-a152-ec9a053a0fbb	reseller	00d54ab9-8a63-46a0-95f2-5b719c2a7e63	Magazzino rivenditore1	\N	\N	t	2026-01-22 09:54:04.863327	2026-01-22 09:54:04.863327
7bd1a58e-a47b-4e1e-a81d-e56ae9f5e89c	sub_reseller	9985f30d-610e-4172-a39f-8ae614996edb	Magazzino rivenditore34234242	\N	\N	t	2026-01-22 11:59:10.735517	2026-01-22 11:59:10.735517
bdc543af-101d-4bcd-b618-fee9a53fcdd8	repair_center	c0f233d9-e60b-452c-8423-f8eb70dc10dc	Magazzino Centro Riparazione Milano	\N	\N	t	2026-01-22 11:59:10.735517	2026-01-22 11:59:10.735517
ddea9f6a-131c-4ec2-933e-409aa18c2b10	reseller	3af078a6-01ce-4d7e-9268-1db16b60b82c	Magazzino Buyer Reseller	\N	\N	t	2026-01-22 15:19:30.958538	2026-01-22 15:19:30.958538
2ff305dd-92c8-485c-bc93-634cff9f43be	admin	system	Magazzino Centrale	\N	\N	t	2026-01-22 19:11:37.832642	2026-01-22 19:11:37.832642
\.


--
-- Data for Name: warranty_products; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.warranty_products (id, name, description, duration_months, price_in_cents, coverage_type, max_claim_amount, deductible_amount, terms_and_conditions, is_active, created_at, updated_at, device_categories, reseller_id) FROM stdin;
7b71af46-c9a8-407d-9697-2062e1890ba8	Esempio garanzia		12	100	basic	\N	0		t	2026-01-23 11:30:22.968452	2026-01-23 11:30:22.968452	\N	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
5e667cf8-1f3d-47dc-9f47-dcf5928256c2	Garanzia Base 6 Mesi	Copertura base per difetti di fabbrica e malfunzionamenti hardware per 6 mesi dalla riparazione.	6	2990	basic	30000	0	La garanzia copre difetti di fabbrica e guasti hardware. Esclusi danni accidentali, liquidi e manomissioni.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
0408c5e0-7080-48c8-b135-77a564b4c887	Garanzia Standard 12 Mesi	Copertura standard per 12 mesi con protezione da difetti hardware e software.	12	4990	extended	50000	1000	Copertura completa per guasti hardware e software. Franchigia di 10 euro per ogni intervento. Esclusi danni da liquidi.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet,laptop}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
fa2e4181-e8bc-4fa0-8568-86736e2f767e	Garanzia Premium 12 Mesi	Copertura premium completa inclusi danni accidentali, cadute e liquidi per 12 mesi.	12	7990	full	80000	2000	Copertura totale inclusi danni accidentali, cadute e contatto con liquidi. Franchigia di 20 euro.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet,laptop}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
735955d3-0892-49cb-a373-e10fa343f229	Garanzia Estesa 24 Mesi	Estensione di garanzia per 24 mesi con copertura ampliata.	24	8990	extended	60000	1500	Garanzia estesa 24 mesi. Copre guasti hardware e software. Esclusi danni accidentali e cosmetici.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet,laptop,desktop}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
9add55fb-da0b-4ee4-a485-45559f118fa3	Protezione Schermo 6 Mesi	Garanzia specifica per la sostituzione dello schermo in caso di rottura accidentale.	6	3490	basic	25000	500	Copre la sostituzione dello schermo per rottura accidentale. Massimo 1 intervento nel periodo di copertura.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
11a42c72-cd3c-46dc-bca4-26d15a29b3d8	Garanzia Batteria 12 Mesi	Copertura per degrado batteria e sostituzione gratuita se la capacita scende sotto l'80%.	12	1990	basic	15000	0	Sostituzione batteria gratuita se la capacita residua risulta inferiore all'80%. Verifica tramite diagnostica certificata.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet,laptop}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
50b80c11-785d-4284-8d40-2250c3aebcd5	Assicurazione Furto e Smarrimento	Copertura assicurativa contro furto e smarrimento del dispositivo per 12 mesi.	12	12990	full	100000	5000	Copertura per furto con scasso e smarrimento documentato. Richiesta denuncia alle autorita. Franchigia di 50 euro.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
09a3a380-b5d8-4185-a54a-db42173cf2ca	Garanzia PC Desktop 12 Mesi	Copertura completa per computer desktop e workstation, inclusa componentistica interna.	12	5990	extended	70000	2000	Copre guasti hardware di componenti interni (scheda madre, alimentatore, RAM, storage). Escluse periferiche esterne.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{desktop}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
e4290d73-b933-4ebe-a385-cdfd9d0e17fb	Garanzia Console Gaming 6 Mesi	Protezione per console da gioco contro difetti hardware e malfunzionamenti.	6	3990	basic	40000	1000	Copre guasti hardware e malfunzionamenti della console. Esclusi controller e accessori.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{console}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
e269e96f-e986-4e55-afdc-03ad30af3ab4	Garanzia Gold 36 Mesi	La garanzia piu completa: 36 mesi di copertura totale per ogni tipo di dispositivo con assistenza prioritaria.	36	14990	full	120000	3000	Copertura totale 36 mesi per qualsiasi tipo di guasto inclusi danni accidentali. Assistenza prioritaria. Franchigia di 30 euro.	t	2026-02-12 07:57:14.67863	2026-02-12 07:57:14.67863	{smartphone,tablet,laptop,desktop,console}	00d54ab9-8a63-46a0-95f2-5b719c2a7e63
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: accessory_specs accessory_specs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_specs
    ADD CONSTRAINT accessory_specs_pkey PRIMARY KEY (id);


--
-- Name: accessory_specs accessory_specs_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_specs
    ADD CONSTRAINT accessory_specs_product_id_key UNIQUE (product_id);


--
-- Name: accessory_types accessory_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_types
    ADD CONSTRAINT accessory_types_pkey PRIMARY KEY (id);


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_setting_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_setting_key_key UNIQUE (setting_key);


--
-- Name: admin_staff_permissions admin_staff_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_staff_permissions
    ADD CONSTRAINT admin_staff_permissions_pkey PRIMARY KEY (id);


--
-- Name: admin_staff_permissions admin_staff_permissions_user_id_module_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_staff_permissions
    ADD CONSTRAINT admin_staff_permissions_user_id_module_key UNIQUE (user_id, module);


--
-- Name: aesthetic_defects aesthetic_defects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aesthetic_defects
    ADD CONSTRAINT aesthetic_defects_pkey PRIMARY KEY (id);


--
-- Name: analytics_cache analytics_cache_key_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_key_key UNIQUE (key);


--
-- Name: analytics_cache analytics_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.analytics_cache
    ADD CONSTRAINT analytics_cache_pkey PRIMARY KEY (id);


--
-- Name: b2b_return_items b2b_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_return_items
    ADD CONSTRAINT b2b_return_items_pkey PRIMARY KEY (id);


--
-- Name: b2b_returns b2b_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_returns
    ADD CONSTRAINT b2b_returns_pkey PRIMARY KEY (id);


--
-- Name: b2b_returns b2b_returns_return_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.b2b_returns
    ADD CONSTRAINT b2b_returns_return_number_key UNIQUE (return_number);


--
-- Name: billing_data billing_data_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_data
    ADD CONSTRAINT billing_data_pkey PRIMARY KEY (id);


--
-- Name: billing_data billing_data_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.billing_data
    ADD CONSTRAINT billing_data_user_id_unique UNIQUE (user_id);


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: carts carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.carts
    ADD CONSTRAINT carts_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: customer_addresses customer_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_addresses
    ADD CONSTRAINT customer_addresses_pkey PRIMARY KEY (id);


--
-- Name: customer_branches customer_branches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_branches
    ADD CONSTRAINT customer_branches_pkey PRIMARY KEY (id);


--
-- Name: customer_relationships customer_relationships_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT customer_relationships_pkey PRIMARY KEY (id);


--
-- Name: customer_repair_centers customer_repair_centers_customer_id_repair_center_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_repair_centers
    ADD CONSTRAINT customer_repair_centers_customer_id_repair_center_id_key UNIQUE (customer_id, repair_center_id);


--
-- Name: customer_repair_centers customer_repair_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_repair_centers
    ADD CONSTRAINT customer_repair_centers_pkey PRIMARY KEY (id);


--
-- Name: damaged_component_types damaged_component_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damaged_component_types
    ADD CONSTRAINT damaged_component_types_pkey PRIMARY KEY (id);


--
-- Name: dashboard_preferences dashboard_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT dashboard_preferences_pkey PRIMARY KEY (id);


--
-- Name: data_recovery_events data_recovery_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_events
    ADD CONSTRAINT data_recovery_events_pkey PRIMARY KEY (id);


--
-- Name: data_recovery_jobs data_recovery_jobs_job_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_jobs
    ADD CONSTRAINT data_recovery_jobs_job_number_key UNIQUE (job_number);


--
-- Name: data_recovery_jobs data_recovery_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_jobs
    ADD CONSTRAINT data_recovery_jobs_pkey PRIMARY KEY (id);


--
-- Name: delivery_appointments delivery_appointments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_appointments
    ADD CONSTRAINT delivery_appointments_pkey PRIMARY KEY (id);


--
-- Name: device_brands device_brands_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_brands
    ADD CONSTRAINT device_brands_name_key UNIQUE (name);


--
-- Name: device_brands device_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_brands
    ADD CONSTRAINT device_brands_pkey PRIMARY KEY (id);


--
-- Name: device_models device_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_pkey PRIMARY KEY (id);


--
-- Name: device_types device_types_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_types
    ADD CONSTRAINT device_types_name_key UNIQUE (name);


--
-- Name: device_types device_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_types
    ADD CONSTRAINT device_types_pkey PRIMARY KEY (id);


--
-- Name: diagnostic_findings diagnostic_findings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_findings
    ADD CONSTRAINT diagnostic_findings_pkey PRIMARY KEY (id);


--
-- Name: entity_fiscal_config entity_fiscal_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entity_fiscal_config
    ADD CONSTRAINT entity_fiscal_config_pkey PRIMARY KEY (id);


--
-- Name: estimated_repair_times estimated_repair_times_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimated_repair_times
    ADD CONSTRAINT estimated_repair_times_pkey PRIMARY KEY (id);


--
-- Name: expo_push_tokens expo_push_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expo_push_tokens
    ADD CONSTRAINT expo_push_tokens_pkey PRIMARY KEY (id);


--
-- Name: expo_push_tokens expo_push_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expo_push_tokens
    ADD CONSTRAINT expo_push_tokens_token_key UNIQUE (token);


--
-- Name: external_integrations external_integrations_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_integrations
    ADD CONSTRAINT external_integrations_code_key UNIQUE (code);


--
-- Name: external_integrations external_integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_integrations
    ADD CONSTRAINT external_integrations_pkey PRIMARY KEY (id);


--
-- Name: external_labs external_labs_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_labs
    ADD CONSTRAINT external_labs_code_key UNIQUE (code);


--
-- Name: external_labs external_labs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.external_labs
    ADD CONSTRAINT external_labs_pkey PRIMARY KEY (id);


--
-- Name: foneday_credentials foneday_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foneday_credentials
    ADD CONSTRAINT foneday_credentials_pkey PRIMARY KEY (id);


--
-- Name: foneday_orders foneday_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foneday_orders
    ADD CONSTRAINT foneday_orders_pkey PRIMARY KEY (id);


--
-- Name: foneday_products_cache foneday_products_cache_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foneday_products_cache
    ADD CONSTRAINT foneday_products_cache_pkey PRIMARY KEY (id);


--
-- Name: hr_absences hr_absences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_absences
    ADD CONSTRAINT hr_absences_pkey PRIMARY KEY (id);


--
-- Name: hr_audit_logs hr_audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_audit_logs
    ADD CONSTRAINT hr_audit_logs_pkey PRIMARY KEY (id);


--
-- Name: hr_certificates hr_certificates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificates
    ADD CONSTRAINT hr_certificates_pkey PRIMARY KEY (id);


--
-- Name: hr_clock_events hr_clock_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clock_events
    ADD CONSTRAINT hr_clock_events_pkey PRIMARY KEY (id);


--
-- Name: hr_clocking_policies hr_clocking_policies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clocking_policies
    ADD CONSTRAINT hr_clocking_policies_pkey PRIMARY KEY (id);


--
-- Name: hr_expense_items hr_expense_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_items
    ADD CONSTRAINT hr_expense_items_pkey PRIMARY KEY (id);


--
-- Name: hr_expense_reports hr_expense_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_reports
    ADD CONSTRAINT hr_expense_reports_pkey PRIMARY KEY (id);


--
-- Name: hr_justifications hr_justifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_justifications
    ADD CONSTRAINT hr_justifications_pkey PRIMARY KEY (id);


--
-- Name: hr_leave_balances hr_leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_balances
    ADD CONSTRAINT hr_leave_balances_pkey PRIMARY KEY (id);


--
-- Name: hr_leave_requests hr_leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_requests
    ADD CONSTRAINT hr_leave_requests_pkey PRIMARY KEY (id);


--
-- Name: hr_notifications hr_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_notifications
    ADD CONSTRAINT hr_notifications_pkey PRIMARY KEY (id);


--
-- Name: hr_sick_leaves hr_sick_leaves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_sick_leaves
    ADD CONSTRAINT hr_sick_leaves_pkey PRIMARY KEY (id);


--
-- Name: hr_work_profile_assignments hr_work_profile_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_assignments
    ADD CONSTRAINT hr_work_profile_assignments_pkey PRIMARY KEY (id);


--
-- Name: hr_work_profile_versions hr_work_profile_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_versions
    ADD CONSTRAINT hr_work_profile_versions_pkey PRIMARY KEY (id);


--
-- Name: hr_work_profiles hr_work_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profiles
    ADD CONSTRAINT hr_work_profiles_pkey PRIMARY KEY (id);


--
-- Name: inventory_movements inventory_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_movements
    ADD CONSTRAINT inventory_movements_pkey PRIMARY KEY (id);


--
-- Name: inventory_stock inventory_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventory_stock
    ADD CONSTRAINT inventory_stock_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_invoice_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_invoice_number_unique UNIQUE (invoice_number);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: issue_types issue_types_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_types
    ADD CONSTRAINT issue_types_pkey PRIMARY KEY (id);


--
-- Name: license_plans license_plans_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.license_plans
    ADD CONSTRAINT license_plans_pkey PRIMARY KEY (id);


--
-- Name: licenses licenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.licenses
    ADD CONSTRAINT licenses_pkey PRIMARY KEY (id);


--
-- Name: marketplace_order_items marketplace_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_pkey PRIMARY KEY (id);


--
-- Name: marketplace_orders marketplace_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_order_number_key UNIQUE (order_number);


--
-- Name: marketplace_orders marketplace_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_pkey PRIMARY KEY (id);


--
-- Name: mobilesentrix_cart_items mobilesentrix_cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_cart_items
    ADD CONSTRAINT mobilesentrix_cart_items_pkey PRIMARY KEY (id);


--
-- Name: mobilesentrix_credentials mobilesentrix_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_credentials
    ADD CONSTRAINT mobilesentrix_credentials_pkey PRIMARY KEY (id);


--
-- Name: mobilesentrix_order_items mobilesentrix_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_order_items
    ADD CONSTRAINT mobilesentrix_order_items_pkey PRIMARY KEY (id);


--
-- Name: mobilesentrix_orders mobilesentrix_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_orders
    ADD CONSTRAINT mobilesentrix_orders_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_pkey PRIMARY KEY (id);


--
-- Name: notification_preferences notification_preferences_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_preferences
    ADD CONSTRAINT notification_preferences_user_id_key UNIQUE (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: parts_load_documents parts_load_documents_load_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_documents
    ADD CONSTRAINT parts_load_documents_load_number_key UNIQUE (load_number);


--
-- Name: parts_load_documents parts_load_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_documents
    ADD CONSTRAINT parts_load_documents_pkey PRIMARY KEY (id);


--
-- Name: parts_load_items parts_load_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_items
    ADD CONSTRAINT parts_load_items_pkey PRIMARY KEY (id);


--
-- Name: parts_orders parts_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_orders
    ADD CONSTRAINT parts_orders_pkey PRIMARY KEY (id);


--
-- Name: parts_purchase_orders parts_purchase_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_purchase_orders
    ADD CONSTRAINT parts_purchase_orders_order_number_key UNIQUE (order_number);


--
-- Name: parts_purchase_orders parts_purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_purchase_orders
    ADD CONSTRAINT parts_purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: payment_configurations payment_configurations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.payment_configurations
    ADD CONSTRAINT payment_configurations_pkey PRIMARY KEY (id);


--
-- Name: platform_fiscal_config platform_fiscal_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.platform_fiscal_config
    ADD CONSTRAINT platform_fiscal_config_pkey PRIMARY KEY (id);


--
-- Name: pos_registers pos_registers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_registers
    ADD CONSTRAINT pos_registers_pkey PRIMARY KEY (id);


--
-- Name: pos_sessions pos_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_pkey PRIMARY KEY (id);


--
-- Name: pos_transaction_items pos_transaction_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_pkey PRIMARY KEY (id);


--
-- Name: pos_transactions pos_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_pkey PRIMARY KEY (id);


--
-- Name: pos_transactions pos_transactions_transaction_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_transaction_number_key UNIQUE (transaction_number);


--
-- Name: price_list_items price_list_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_pkey PRIMARY KEY (id);


--
-- Name: price_lists price_lists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_pkey PRIMARY KEY (id);


--
-- Name: product_device_compatibilities product_device_compatibilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_device_compatibilities
    ADD CONSTRAINT product_device_compatibilities_pkey PRIMARY KEY (id);


--
-- Name: product_prices product_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_pkey PRIMARY KEY (id);


--
-- Name: product_suppliers product_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_pkey PRIMARY KEY (id);


--
-- Name: products products_barcode_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_barcode_key UNIQUE (barcode);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_unique UNIQUE (sku);


--
-- Name: promotions promotions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.promotions
    ADD CONSTRAINT promotions_pkey PRIMARY KEY (id);


--
-- Name: push_notification_log push_notification_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_notification_log
    ADD CONSTRAINT push_notification_log_pkey PRIMARY KEY (id);


--
-- Name: remote_repair_request_devices remote_repair_request_devices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_request_devices
    ADD CONSTRAINT remote_repair_request_devices_pkey PRIMARY KEY (id);


--
-- Name: remote_repair_requests remote_repair_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_pkey PRIMARY KEY (id);


--
-- Name: remote_repair_requests remote_repair_requests_request_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_request_number_key UNIQUE (request_number);


--
-- Name: repair_acceptance repair_acceptance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_acceptance
    ADD CONSTRAINT repair_acceptance_pkey PRIMARY KEY (id);


--
-- Name: repair_acceptance repair_acceptance_repair_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_acceptance
    ADD CONSTRAINT repair_acceptance_repair_order_id_key UNIQUE (repair_order_id);


--
-- Name: repair_attachments repair_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_attachments
    ADD CONSTRAINT repair_attachments_pkey PRIMARY KEY (id);


--
-- Name: repair_center_availability repair_center_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_availability
    ADD CONSTRAINT repair_center_availability_pkey PRIMARY KEY (id);


--
-- Name: repair_center_blackouts repair_center_blackouts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_blackouts
    ADD CONSTRAINT repair_center_blackouts_pkey PRIMARY KEY (id);


--
-- Name: repair_center_purchase_order_items repair_center_purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_order_items
    ADD CONSTRAINT repair_center_purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: repair_center_purchase_orders repair_center_purchase_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_orders
    ADD CONSTRAINT repair_center_purchase_orders_order_number_key UNIQUE (order_number);


--
-- Name: repair_center_purchase_orders repair_center_purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_orders
    ADD CONSTRAINT repair_center_purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: repair_center_settings repair_center_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_settings
    ADD CONSTRAINT repair_center_settings_pkey PRIMARY KEY (id);


--
-- Name: repair_centers repair_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_centers
    ADD CONSTRAINT repair_centers_pkey PRIMARY KEY (id);


--
-- Name: repair_delivery repair_delivery_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_delivery
    ADD CONSTRAINT repair_delivery_pkey PRIMARY KEY (id);


--
-- Name: repair_delivery repair_delivery_repair_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_delivery
    ADD CONSTRAINT repair_delivery_repair_order_id_key UNIQUE (repair_order_id);


--
-- Name: repair_diagnostics repair_diagnostics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_diagnostics
    ADD CONSTRAINT repair_diagnostics_pkey PRIMARY KEY (id);


--
-- Name: repair_diagnostics repair_diagnostics_repair_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_diagnostics
    ADD CONSTRAINT repair_diagnostics_repair_order_id_key UNIQUE (repair_order_id);


--
-- Name: repair_logs repair_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_logs
    ADD CONSTRAINT repair_logs_pkey PRIMARY KEY (id);


--
-- Name: repair_order_state_history repair_order_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_order_state_history
    ADD CONSTRAINT repair_order_state_history_pkey PRIMARY KEY (id);


--
-- Name: repair_orders repair_orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_orders
    ADD CONSTRAINT repair_orders_order_number_unique UNIQUE (order_number);


--
-- Name: repair_orders repair_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_orders
    ADD CONSTRAINT repair_orders_pkey PRIMARY KEY (id);


--
-- Name: repair_quotes repair_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_quotes
    ADD CONSTRAINT repair_quotes_pkey PRIMARY KEY (id);


--
-- Name: repair_quotes repair_quotes_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_quotes
    ADD CONSTRAINT repair_quotes_quote_number_key UNIQUE (quote_number);


--
-- Name: repair_quotes repair_quotes_repair_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_quotes
    ADD CONSTRAINT repair_quotes_repair_order_id_key UNIQUE (repair_order_id);


--
-- Name: repair_test_checklist repair_test_checklist_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_test_checklist
    ADD CONSTRAINT repair_test_checklist_pkey PRIMARY KEY (id);


--
-- Name: repair_test_checklist repair_test_checklist_repair_order_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_test_checklist
    ADD CONSTRAINT repair_test_checklist_repair_order_id_key UNIQUE (repair_order_id);


--
-- Name: repair_warranties repair_warranties_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_warranties
    ADD CONSTRAINT repair_warranties_pkey PRIMARY KEY (id);


--
-- Name: reseller_device_brands reseller_device_brands_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_brands
    ADD CONSTRAINT reseller_device_brands_pkey PRIMARY KEY (id);


--
-- Name: reseller_device_models reseller_device_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_models
    ADD CONSTRAINT reseller_device_models_pkey PRIMARY KEY (id);


--
-- Name: reseller_products reseller_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_products
    ADD CONSTRAINT reseller_products_pkey PRIMARY KEY (id);


--
-- Name: reseller_products reseller_products_product_id_reseller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_products
    ADD CONSTRAINT reseller_products_product_id_reseller_id_key UNIQUE (product_id, reseller_id);


--
-- Name: reseller_purchase_order_items reseller_purchase_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_order_items
    ADD CONSTRAINT reseller_purchase_order_items_pkey PRIMARY KEY (id);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_order_number_key UNIQUE (order_number);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_pkey PRIMARY KEY (id);


--
-- Name: reseller_settings reseller_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_settings
    ADD CONSTRAINT reseller_settings_pkey PRIMARY KEY (id);


--
-- Name: reseller_staff_permissions reseller_staff_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_staff_permissions
    ADD CONSTRAINT reseller_staff_permissions_pkey PRIMARY KEY (id);


--
-- Name: reseller_staff_permissions reseller_staff_permissions_user_id_module_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_staff_permissions
    ADD CONSTRAINT reseller_staff_permissions_user_id_module_key UNIQUE (user_id, module);


--
-- Name: sales_order_items sales_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_items
    ADD CONSTRAINT sales_order_items_pkey PRIMARY KEY (id);


--
-- Name: sales_order_payments sales_order_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_payments
    ADD CONSTRAINT sales_order_payments_pkey PRIMARY KEY (id);


--
-- Name: sales_order_shipments sales_order_shipments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_shipments
    ADD CONSTRAINT sales_order_shipments_pkey PRIMARY KEY (id);


--
-- Name: sales_order_state_history sales_order_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_order_state_history
    ADD CONSTRAINT sales_order_state_history_pkey PRIMARY KEY (id);


--
-- Name: sales_orders sales_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_order_number_key UNIQUE (order_number);


--
-- Name: sales_orders sales_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sales_orders
    ADD CONSTRAINT sales_orders_pkey PRIMARY KEY (id);


--
-- Name: self_diagnosis_sessions self_diagnosis_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_diagnosis_sessions
    ADD CONSTRAINT self_diagnosis_sessions_pkey PRIMARY KEY (id);


--
-- Name: self_diagnosis_sessions self_diagnosis_sessions_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_diagnosis_sessions
    ADD CONSTRAINT self_diagnosis_sessions_token_key UNIQUE (token);


--
-- Name: service_item_prices service_item_prices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_item_prices
    ADD CONSTRAINT service_item_prices_pkey PRIMARY KEY (id);


--
-- Name: service_items service_items_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_code_key UNIQUE (code);


--
-- Name: service_items service_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_pkey PRIMARY KEY (id);


--
-- Name: service_orders service_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_order_number_key UNIQUE (order_number);


--
-- Name: service_orders service_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_pkey PRIMARY KEY (id);


--
-- Name: session session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session
    ADD CONSTRAINT session_pkey PRIMARY KEY (sid);


--
-- Name: shipment_tracking_events shipment_tracking_events_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipment_tracking_events
    ADD CONSTRAINT shipment_tracking_events_pkey PRIMARY KEY (id);


--
-- Name: shipping_methods shipping_methods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_pkey PRIMARY KEY (id);


--
-- Name: sibill_accounts sibill_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_accounts
    ADD CONSTRAINT sibill_accounts_pkey PRIMARY KEY (id);


--
-- Name: sibill_categories sibill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_categories
    ADD CONSTRAINT sibill_categories_pkey PRIMARY KEY (id);


--
-- Name: sibill_companies sibill_companies_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_companies
    ADD CONSTRAINT sibill_companies_pkey PRIMARY KEY (id);


--
-- Name: sibill_credentials sibill_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_credentials
    ADD CONSTRAINT sibill_credentials_pkey PRIMARY KEY (id);


--
-- Name: sibill_documents sibill_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_documents
    ADD CONSTRAINT sibill_documents_pkey PRIMARY KEY (id);


--
-- Name: sibill_transactions sibill_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_transactions
    ADD CONSTRAINT sibill_transactions_pkey PRIMARY KEY (id);


--
-- Name: sifar_carts sifar_carts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_carts
    ADD CONSTRAINT sifar_carts_pkey PRIMARY KEY (id);


--
-- Name: sifar_catalog sifar_catalog_codice_articolo_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_catalog
    ADD CONSTRAINT sifar_catalog_codice_articolo_key UNIQUE (codice_articolo);


--
-- Name: sifar_catalog sifar_catalog_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_catalog
    ADD CONSTRAINT sifar_catalog_pkey PRIMARY KEY (id);


--
-- Name: sifar_credentials sifar_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_credentials
    ADD CONSTRAINT sifar_credentials_pkey PRIMARY KEY (id);


--
-- Name: sifar_models sifar_models_codice_modello_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_models
    ADD CONSTRAINT sifar_models_codice_modello_key UNIQUE (codice_modello);


--
-- Name: sifar_models sifar_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_models
    ADD CONSTRAINT sifar_models_pkey PRIMARY KEY (id);


--
-- Name: sifar_orders sifar_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_orders
    ADD CONSTRAINT sifar_orders_pkey PRIMARY KEY (id);


--
-- Name: sifar_product_compatibility sifar_product_compatibility_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_product_compatibility
    ADD CONSTRAINT sifar_product_compatibility_pkey PRIMARY KEY (id);


--
-- Name: sifar_stores sifar_stores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_stores
    ADD CONSTRAINT sifar_stores_pkey PRIMARY KEY (id);


--
-- Name: smartphone_specs smartphone_specs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smartphone_specs
    ADD CONSTRAINT smartphone_specs_pkey PRIMARY KEY (id);


--
-- Name: smartphone_specs smartphone_specs_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smartphone_specs
    ADD CONSTRAINT smartphone_specs_product_id_key UNIQUE (product_id);


--
-- Name: staff_repair_centers staff_repair_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_repair_centers
    ADD CONSTRAINT staff_repair_centers_pkey PRIMARY KEY (id);


--
-- Name: staff_repair_centers staff_repair_centers_staff_id_repair_center_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_repair_centers
    ADD CONSTRAINT staff_repair_centers_staff_id_repair_center_id_key UNIQUE (staff_id, repair_center_id);


--
-- Name: staff_sub_resellers staff_sub_resellers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_sub_resellers
    ADD CONSTRAINT staff_sub_resellers_pkey PRIMARY KEY (id);


--
-- Name: staff_sub_resellers staff_sub_resellers_staff_id_sub_reseller_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_sub_resellers
    ADD CONSTRAINT staff_sub_resellers_staff_id_sub_reseller_id_key UNIQUE (staff_id, sub_reseller_id);


--
-- Name: standalone_quote_items standalone_quote_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quote_items
    ADD CONSTRAINT standalone_quote_items_pkey PRIMARY KEY (id);


--
-- Name: standalone_quotes standalone_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_pkey PRIMARY KEY (id);


--
-- Name: standalone_quotes standalone_quotes_quote_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_quote_number_key UNIQUE (quote_number);


--
-- Name: stock_reservations stock_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.stock_reservations
    ADD CONSTRAINT stock_reservations_pkey PRIMARY KEY (id);


--
-- Name: supplier_catalog_products supplier_catalog_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_catalog_products
    ADD CONSTRAINT supplier_catalog_products_pkey PRIMARY KEY (id);


--
-- Name: supplier_communication_logs supplier_communication_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_communication_logs
    ADD CONSTRAINT supplier_communication_logs_pkey PRIMARY KEY (id);


--
-- Name: supplier_order_items supplier_order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_pkey PRIMARY KEY (id);


--
-- Name: supplier_orders supplier_orders_order_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_order_number_key UNIQUE (order_number);


--
-- Name: supplier_orders supplier_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_pkey PRIMARY KEY (id);


--
-- Name: supplier_return_items supplier_return_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_return_items
    ADD CONSTRAINT supplier_return_items_pkey PRIMARY KEY (id);


--
-- Name: supplier_return_state_history supplier_return_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_return_state_history
    ADD CONSTRAINT supplier_return_state_history_pkey PRIMARY KEY (id);


--
-- Name: supplier_returns supplier_returns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_pkey PRIMARY KEY (id);


--
-- Name: supplier_returns supplier_returns_return_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_return_number_key UNIQUE (return_number);


--
-- Name: supplier_sync_logs supplier_sync_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_sync_logs
    ADD CONSTRAINT supplier_sync_logs_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_code_key UNIQUE (code);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: ticket_messages ticket_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ticket_messages
    ADD CONSTRAINT ticket_messages_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: transfer_request_items transfer_request_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_request_items
    ADD CONSTRAINT transfer_request_items_pkey PRIMARY KEY (id);


--
-- Name: transfer_requests transfer_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_pkey PRIMARY KEY (id);


--
-- Name: transfer_requests transfer_requests_request_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_request_number_key UNIQUE (request_number);


--
-- Name: trovausati_coupons trovausati_coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_coupons
    ADD CONSTRAINT trovausati_coupons_pkey PRIMARY KEY (id);


--
-- Name: trovausati_credentials trovausati_credentials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_credentials
    ADD CONSTRAINT trovausati_credentials_pkey PRIMARY KEY (id);


--
-- Name: trovausati_models trovausati_models_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_models
    ADD CONSTRAINT trovausati_models_pkey PRIMARY KEY (id);


--
-- Name: trovausati_orders trovausati_orders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_orders
    ADD CONSTRAINT trovausati_orders_pkey PRIMARY KEY (id);


--
-- Name: trovausati_shops trovausati_shops_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_shops
    ADD CONSTRAINT trovausati_shops_pkey PRIMARY KEY (id);


--
-- Name: unrepairable_reasons unrepairable_reasons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unrepairable_reasons
    ADD CONSTRAINT unrepairable_reasons_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_unique UNIQUE (username);


--
-- Name: utility_categories utility_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_categories
    ADD CONSTRAINT utility_categories_pkey PRIMARY KEY (id);


--
-- Name: utility_categories utility_categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_categories
    ADD CONSTRAINT utility_categories_slug_key UNIQUE (slug);


--
-- Name: utility_commissions utility_commissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_commissions
    ADD CONSTRAINT utility_commissions_pkey PRIMARY KEY (id);


--
-- Name: utility_practice_documents utility_practice_documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_documents
    ADD CONSTRAINT utility_practice_documents_pkey PRIMARY KEY (id);


--
-- Name: utility_practice_notes utility_practice_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_notes
    ADD CONSTRAINT utility_practice_notes_pkey PRIMARY KEY (id);


--
-- Name: utility_practice_products utility_practice_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_products
    ADD CONSTRAINT utility_practice_products_pkey PRIMARY KEY (id);


--
-- Name: utility_practice_state_history utility_practice_state_history_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_state_history
    ADD CONSTRAINT utility_practice_state_history_pkey PRIMARY KEY (id);


--
-- Name: utility_practice_tasks utility_practice_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_tasks
    ADD CONSTRAINT utility_practice_tasks_pkey PRIMARY KEY (id);


--
-- Name: utility_practice_timeline utility_practice_timeline_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_timeline
    ADD CONSTRAINT utility_practice_timeline_pkey PRIMARY KEY (id);


--
-- Name: utility_practices utility_practices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_pkey PRIMARY KEY (id);


--
-- Name: utility_practices utility_practices_practice_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_practice_number_key UNIQUE (practice_number);


--
-- Name: utility_services utility_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_services
    ADD CONSTRAINT utility_services_pkey PRIMARY KEY (id);


--
-- Name: utility_suppliers utility_suppliers_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_suppliers
    ADD CONSTRAINT utility_suppliers_code_key UNIQUE (code);


--
-- Name: utility_suppliers utility_suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_suppliers
    ADD CONSTRAINT utility_suppliers_pkey PRIMARY KEY (id);


--
-- Name: warehouse_movements warehouse_movements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_movements
    ADD CONSTRAINT warehouse_movements_pkey PRIMARY KEY (id);


--
-- Name: warehouse_stock warehouse_stock_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stock
    ADD CONSTRAINT warehouse_stock_pkey PRIMARY KEY (id);


--
-- Name: warehouse_stock warehouse_stock_warehouse_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_stock
    ADD CONSTRAINT warehouse_stock_warehouse_id_product_id_key UNIQUE (warehouse_id, product_id);


--
-- Name: warehouse_transfer_items warehouse_transfer_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_transfer_items
    ADD CONSTRAINT warehouse_transfer_items_pkey PRIMARY KEY (id);


--
-- Name: warehouse_transfers warehouse_transfers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_transfers
    ADD CONSTRAINT warehouse_transfers_pkey PRIMARY KEY (id);


--
-- Name: warehouse_transfers warehouse_transfers_transfer_number_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouse_transfers
    ADD CONSTRAINT warehouse_transfers_transfer_number_key UNIQUE (transfer_number);


--
-- Name: warehouses warehouses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warehouses
    ADD CONSTRAINT warehouses_pkey PRIMARY KEY (id);


--
-- Name: warranty_products warranty_products_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.warranty_products
    ADD CONSTRAINT warranty_products_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_session_expire" ON public.session USING btree (expire);


--
-- Name: idx_device_models_unique; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_device_models_unique ON public.device_models USING btree (type_id, brand_id, lower(model_name)) WHERE ((type_id IS NOT NULL) AND (brand_id IS NOT NULL));


--
-- Name: idx_entity_fiscal_config_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_entity_fiscal_config_entity ON public.entity_fiscal_config USING btree (entity_type, entity_id);


--
-- Name: idx_payment_config_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_payment_config_entity ON public.payment_configurations USING btree (entity_type, entity_id);


--
-- Name: idx_pos_sessions_operator; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_sessions_operator ON public.pos_sessions USING btree (operator_id);


--
-- Name: idx_pos_sessions_repair_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_sessions_repair_center ON public.pos_sessions USING btree (repair_center_id);


--
-- Name: idx_pos_sessions_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_sessions_status ON public.pos_sessions USING btree (status);


--
-- Name: idx_pos_transaction_items_transaction; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_transaction_items_transaction ON public.pos_transaction_items USING btree (transaction_id);


--
-- Name: idx_pos_transactions_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_transactions_created ON public.pos_transactions USING btree (created_at);


--
-- Name: idx_pos_transactions_repair_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_transactions_repair_center ON public.pos_transactions USING btree (repair_center_id);


--
-- Name: idx_pos_transactions_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pos_transactions_session ON public.pos_transactions USING btree (session_id);


--
-- Name: idx_price_list_items_list; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_list_items_list ON public.price_list_items USING btree (price_list_id);


--
-- Name: idx_price_list_items_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_list_items_product ON public.price_list_items USING btree (product_id);


--
-- Name: idx_price_list_items_service; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_list_items_service ON public.price_list_items USING btree (service_item_id);


--
-- Name: idx_price_lists_owner; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_price_lists_owner ON public.price_lists USING btree (owner_id);


--
-- Name: idx_product_suppliers_product; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_suppliers_product ON public.product_suppliers USING btree (product_id);


--
-- Name: idx_product_suppliers_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_product_suppliers_supplier ON public.product_suppliers USING btree (supplier_id);


--
-- Name: idx_repair_order_state_history_order; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_order_state_history_order ON public.repair_order_state_history USING btree (repair_order_id);


--
-- Name: idx_repair_order_state_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_order_state_history_status ON public.repair_order_state_history USING btree (status);


--
-- Name: idx_repair_warranties_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_warranties_created_at ON public.repair_warranties USING btree (created_at);


--
-- Name: idx_repair_warranties_customer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_warranties_customer_id ON public.repair_warranties USING btree (customer_id);


--
-- Name: idx_repair_warranties_seller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_warranties_seller_id ON public.repair_warranties USING btree (seller_id);


--
-- Name: idx_repair_warranties_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_repair_warranties_status ON public.repair_warranties USING btree (status);


--
-- Name: idx_supplier_orders_repair_center; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_orders_repair_center ON public.supplier_orders USING btree (repair_center_id);


--
-- Name: idx_supplier_orders_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_orders_status ON public.supplier_orders USING btree (status);


--
-- Name: idx_supplier_orders_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_orders_supplier ON public.supplier_orders USING btree (supplier_id);


--
-- Name: idx_supplier_return_state_history_return; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_return_state_history_return ON public.supplier_return_state_history USING btree (supplier_return_id);


--
-- Name: idx_supplier_return_state_history_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_return_state_history_status ON public.supplier_return_state_history USING btree (status);


--
-- Name: idx_supplier_returns_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_returns_status ON public.supplier_returns USING btree (status);


--
-- Name: idx_supplier_returns_supplier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_returns_supplier ON public.supplier_returns USING btree (supplier_id);


--
-- Name: idx_warranty_products_reseller_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_warranty_products_reseller_id ON public.warranty_products USING btree (reseller_id);


--
-- Name: repair_center_settings_rc_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX repair_center_settings_rc_key_idx ON public.repair_center_settings USING btree (repair_center_id, setting_key);


--
-- Name: reseller_settings_reseller_key_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reseller_settings_reseller_key_idx ON public.reseller_settings USING btree (reseller_id, setting_key);


--
-- Name: accessory_specs accessory_specs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_specs
    ADD CONSTRAINT accessory_specs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: accessory_types accessory_types_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.accessory_types
    ADD CONSTRAINT accessory_types_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: admin_staff_permissions admin_staff_permissions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_staff_permissions
    ADD CONSTRAINT admin_staff_permissions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.users(id);


--
-- Name: admin_staff_permissions admin_staff_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_staff_permissions
    ADD CONSTRAINT admin_staff_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: aesthetic_defects aesthetic_defects_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.aesthetic_defects
    ADD CONSTRAINT aesthetic_defects_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: customer_relationships customer_relationships_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT customer_relationships_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: customer_relationships customer_relationships_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT customer_relationships_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: customer_relationships customer_relationships_related_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_relationships
    ADD CONSTRAINT customer_relationships_related_customer_id_fkey FOREIGN KEY (related_customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: customer_repair_centers customer_repair_centers_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_repair_centers
    ADD CONSTRAINT customer_repair_centers_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: customer_repair_centers customer_repair_centers_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.customer_repair_centers
    ADD CONSTRAINT customer_repair_centers_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: damaged_component_types damaged_component_types_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.damaged_component_types
    ADD CONSTRAINT damaged_component_types_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: dashboard_preferences dashboard_preferences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.dashboard_preferences
    ADD CONSTRAINT dashboard_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: data_recovery_events data_recovery_events_data_recovery_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_events
    ADD CONSTRAINT data_recovery_events_data_recovery_job_id_fkey FOREIGN KEY (data_recovery_job_id) REFERENCES public.data_recovery_jobs(id);


--
-- Name: data_recovery_jobs data_recovery_jobs_diagnosis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_jobs
    ADD CONSTRAINT data_recovery_jobs_diagnosis_id_fkey FOREIGN KEY (diagnosis_id) REFERENCES public.repair_diagnostics(id);


--
-- Name: data_recovery_jobs data_recovery_jobs_external_lab_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_jobs
    ADD CONSTRAINT data_recovery_jobs_external_lab_id_fkey FOREIGN KEY (external_lab_id) REFERENCES public.external_labs(id);


--
-- Name: data_recovery_jobs data_recovery_jobs_parent_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.data_recovery_jobs
    ADD CONSTRAINT data_recovery_jobs_parent_repair_order_id_fkey FOREIGN KEY (parent_repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: delivery_appointments delivery_appointments_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_appointments
    ADD CONSTRAINT delivery_appointments_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: delivery_appointments delivery_appointments_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_appointments
    ADD CONSTRAINT delivery_appointments_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: delivery_appointments delivery_appointments_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_appointments
    ADD CONSTRAINT delivery_appointments_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: delivery_appointments delivery_appointments_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.delivery_appointments
    ADD CONSTRAINT delivery_appointments_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: device_models device_models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.device_brands(id);


--
-- Name: device_models device_models_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: device_models device_models_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.device_models
    ADD CONSTRAINT device_models_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.device_types(id);


--
-- Name: diagnostic_findings diagnostic_findings_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.diagnostic_findings
    ADD CONSTRAINT diagnostic_findings_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: estimated_repair_times estimated_repair_times_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.estimated_repair_times
    ADD CONSTRAINT estimated_repair_times_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: foneday_credentials foneday_credentials_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foneday_credentials
    ADD CONSTRAINT foneday_credentials_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: foneday_orders foneday_orders_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foneday_orders
    ADD CONSTRAINT foneday_orders_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.foneday_credentials(id) ON DELETE CASCADE;


--
-- Name: foneday_products_cache foneday_products_cache_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.foneday_products_cache
    ADD CONSTRAINT foneday_products_cache_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_absences hr_absences_related_clock_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_absences
    ADD CONSTRAINT hr_absences_related_clock_event_id_fkey FOREIGN KEY (related_clock_event_id) REFERENCES public.hr_clock_events(id);


--
-- Name: hr_absences hr_absences_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_absences
    ADD CONSTRAINT hr_absences_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_absences hr_absences_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_absences
    ADD CONSTRAINT hr_absences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_audit_logs hr_audit_logs_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_audit_logs
    ADD CONSTRAINT hr_audit_logs_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_audit_logs hr_audit_logs_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_audit_logs
    ADD CONSTRAINT hr_audit_logs_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id);


--
-- Name: hr_audit_logs hr_audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_audit_logs
    ADD CONSTRAINT hr_audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: hr_certificates hr_certificates_related_sick_leave_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificates
    ADD CONSTRAINT hr_certificates_related_sick_leave_id_fkey FOREIGN KEY (related_sick_leave_id) REFERENCES public.hr_sick_leaves(id);


--
-- Name: hr_certificates hr_certificates_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificates
    ADD CONSTRAINT hr_certificates_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_certificates hr_certificates_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificates
    ADD CONSTRAINT hr_certificates_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: hr_certificates hr_certificates_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_certificates
    ADD CONSTRAINT hr_certificates_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_clock_events hr_clock_events_policy_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clock_events
    ADD CONSTRAINT hr_clock_events_policy_id_fkey FOREIGN KEY (policy_id) REFERENCES public.hr_clocking_policies(id);


--
-- Name: hr_clock_events hr_clock_events_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clock_events
    ADD CONSTRAINT hr_clock_events_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_clock_events hr_clock_events_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clock_events
    ADD CONSTRAINT hr_clock_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_clock_events hr_clock_events_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clock_events
    ADD CONSTRAINT hr_clock_events_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.users(id);


--
-- Name: hr_clocking_policies hr_clocking_policies_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_clocking_policies
    ADD CONSTRAINT hr_clocking_policies_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_expense_items hr_expense_items_expense_report_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_items
    ADD CONSTRAINT hr_expense_items_expense_report_id_fkey FOREIGN KEY (expense_report_id) REFERENCES public.hr_expense_reports(id) ON DELETE CASCADE;


--
-- Name: hr_expense_reports hr_expense_reports_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_reports
    ADD CONSTRAINT hr_expense_reports_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: hr_expense_reports hr_expense_reports_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_reports
    ADD CONSTRAINT hr_expense_reports_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: hr_expense_reports hr_expense_reports_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_reports
    ADD CONSTRAINT hr_expense_reports_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_expense_reports hr_expense_reports_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_expense_reports
    ADD CONSTRAINT hr_expense_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_justifications hr_justifications_absence_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_justifications
    ADD CONSTRAINT hr_justifications_absence_id_fkey FOREIGN KEY (absence_id) REFERENCES public.hr_absences(id) ON DELETE CASCADE;


--
-- Name: hr_justifications hr_justifications_reviewed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_justifications
    ADD CONSTRAINT hr_justifications_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.users(id);


--
-- Name: hr_justifications hr_justifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_justifications
    ADD CONSTRAINT hr_justifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_leave_balances hr_leave_balances_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_balances
    ADD CONSTRAINT hr_leave_balances_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_leave_balances hr_leave_balances_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_balances
    ADD CONSTRAINT hr_leave_balances_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_leave_requests hr_leave_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_requests
    ADD CONSTRAINT hr_leave_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: hr_leave_requests hr_leave_requests_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_requests
    ADD CONSTRAINT hr_leave_requests_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_leave_requests hr_leave_requests_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_leave_requests
    ADD CONSTRAINT hr_leave_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_notifications hr_notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_notifications
    ADD CONSTRAINT hr_notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_notifications hr_notifications_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_notifications
    ADD CONSTRAINT hr_notifications_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_sick_leaves hr_sick_leaves_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_sick_leaves
    ADD CONSTRAINT hr_sick_leaves_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_sick_leaves hr_sick_leaves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_sick_leaves
    ADD CONSTRAINT hr_sick_leaves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_sick_leaves hr_sick_leaves_validated_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_sick_leaves
    ADD CONSTRAINT hr_sick_leaves_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES public.users(id);


--
-- Name: hr_work_profile_assignments hr_work_profile_assignments_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_assignments
    ADD CONSTRAINT hr_work_profile_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: hr_work_profile_assignments hr_work_profile_assignments_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_assignments
    ADD CONSTRAINT hr_work_profile_assignments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: hr_work_profile_assignments hr_work_profile_assignments_work_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_assignments
    ADD CONSTRAINT hr_work_profile_assignments_work_profile_id_fkey FOREIGN KEY (work_profile_id) REFERENCES public.hr_work_profiles(id) ON DELETE CASCADE;


--
-- Name: hr_work_profile_versions hr_work_profile_versions_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_versions
    ADD CONSTRAINT hr_work_profile_versions_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: hr_work_profile_versions hr_work_profile_versions_work_profile_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profile_versions
    ADD CONSTRAINT hr_work_profile_versions_work_profile_id_fkey FOREIGN KEY (work_profile_id) REFERENCES public.hr_work_profiles(id) ON DELETE CASCADE;


--
-- Name: hr_work_profiles hr_work_profiles_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hr_work_profiles
    ADD CONSTRAINT hr_work_profiles_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: issue_types issue_types_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.issue_types
    ADD CONSTRAINT issue_types_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: marketplace_order_items marketplace_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.marketplace_orders(id) ON DELETE CASCADE;


--
-- Name: marketplace_order_items marketplace_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_order_items
    ADD CONSTRAINT marketplace_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: marketplace_orders marketplace_orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: marketplace_orders marketplace_orders_buyer_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_buyer_reseller_id_fkey FOREIGN KEY (buyer_reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_orders marketplace_orders_payment_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_payment_confirmed_by_fkey FOREIGN KEY (payment_confirmed_by) REFERENCES public.users(id);


--
-- Name: marketplace_orders marketplace_orders_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: marketplace_orders marketplace_orders_seller_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_seller_reseller_id_fkey FOREIGN KEY (seller_reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: marketplace_orders marketplace_orders_shipped_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_shipped_by_fkey FOREIGN KEY (shipped_by) REFERENCES public.users(id);


--
-- Name: marketplace_orders marketplace_orders_warehouse_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.marketplace_orders
    ADD CONSTRAINT marketplace_orders_warehouse_transfer_id_fkey FOREIGN KEY (warehouse_transfer_id) REFERENCES public.warehouse_transfers(id);


--
-- Name: mobilesentrix_cart_items mobilesentrix_cart_items_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_cart_items
    ADD CONSTRAINT mobilesentrix_cart_items_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.mobilesentrix_credentials(id) ON DELETE CASCADE;


--
-- Name: mobilesentrix_credentials mobilesentrix_credentials_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_credentials
    ADD CONSTRAINT mobilesentrix_credentials_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mobilesentrix_order_items mobilesentrix_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_order_items
    ADD CONSTRAINT mobilesentrix_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.mobilesentrix_orders(id) ON DELETE CASCADE;


--
-- Name: mobilesentrix_orders mobilesentrix_orders_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mobilesentrix_orders
    ADD CONSTRAINT mobilesentrix_orders_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.mobilesentrix_credentials(id) ON DELETE CASCADE;


--
-- Name: parts_load_documents parts_load_documents_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_documents
    ADD CONSTRAINT parts_load_documents_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: parts_load_documents parts_load_documents_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_documents
    ADD CONSTRAINT parts_load_documents_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: parts_load_documents parts_load_documents_supplier_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_documents
    ADD CONSTRAINT parts_load_documents_supplier_order_id_fkey FOREIGN KEY (supplier_order_id) REFERENCES public.supplier_orders(id);


--
-- Name: parts_load_items parts_load_items_matched_parts_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_items
    ADD CONSTRAINT parts_load_items_matched_parts_order_id_fkey FOREIGN KEY (matched_parts_order_id) REFERENCES public.parts_orders(id);


--
-- Name: parts_load_items parts_load_items_matched_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_items
    ADD CONSTRAINT parts_load_items_matched_product_id_fkey FOREIGN KEY (matched_product_id) REFERENCES public.products(id);


--
-- Name: parts_load_items parts_load_items_matched_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_items
    ADD CONSTRAINT parts_load_items_matched_repair_order_id_fkey FOREIGN KEY (matched_repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: parts_load_items parts_load_items_parts_load_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_load_items
    ADD CONSTRAINT parts_load_items_parts_load_document_id_fkey FOREIGN KEY (parts_load_document_id) REFERENCES public.parts_load_documents(id) ON DELETE CASCADE;


--
-- Name: parts_orders parts_orders_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_orders
    ADD CONSTRAINT parts_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: parts_orders parts_orders_purchase_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_orders
    ADD CONSTRAINT parts_orders_purchase_order_id_fkey FOREIGN KEY (purchase_order_id) REFERENCES public.parts_purchase_orders(id);


--
-- Name: parts_orders parts_orders_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_orders
    ADD CONSTRAINT parts_orders_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: parts_purchase_orders parts_purchase_orders_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parts_purchase_orders
    ADD CONSTRAINT parts_purchase_orders_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: pos_registers pos_registers_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_registers
    ADD CONSTRAINT pos_registers_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: pos_sessions pos_sessions_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.users(id);


--
-- Name: pos_sessions pos_sessions_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_register_id_fkey FOREIGN KEY (register_id) REFERENCES public.pos_registers(id) ON DELETE SET NULL;


--
-- Name: pos_sessions pos_sessions_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_sessions
    ADD CONSTRAINT pos_sessions_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: pos_transaction_items pos_transaction_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: pos_transaction_items pos_transaction_items_service_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id);


--
-- Name: pos_transaction_items pos_transaction_items_transaction_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.pos_transactions(id) ON DELETE CASCADE;


--
-- Name: pos_transaction_items pos_transaction_items_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_warehouse_id_fkey FOREIGN KEY (warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: pos_transaction_items pos_transaction_items_warranty_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transaction_items
    ADD CONSTRAINT pos_transaction_items_warranty_product_id_fkey FOREIGN KEY (warranty_product_id) REFERENCES public.warranty_products(id);


--
-- Name: pos_transactions pos_transactions_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: pos_transactions pos_transactions_operator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_operator_id_fkey FOREIGN KEY (operator_id) REFERENCES public.users(id);


--
-- Name: pos_transactions pos_transactions_refunded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_refunded_by_fkey FOREIGN KEY (refunded_by) REFERENCES public.users(id);


--
-- Name: pos_transactions pos_transactions_register_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_register_id_fkey FOREIGN KEY (register_id) REFERENCES public.pos_registers(id) ON DELETE SET NULL;


--
-- Name: pos_transactions pos_transactions_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: pos_transactions pos_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.pos_sessions(id);


--
-- Name: pos_transactions pos_transactions_voided_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pos_transactions
    ADD CONSTRAINT pos_transactions_voided_by_fkey FOREIGN KEY (voided_by) REFERENCES public.users(id);


--
-- Name: price_list_items price_list_items_price_list_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_price_list_id_fkey FOREIGN KEY (price_list_id) REFERENCES public.price_lists(id) ON DELETE CASCADE;


--
-- Name: price_list_items price_list_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: price_list_items price_list_items_service_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id) ON DELETE CASCADE;


--
-- Name: price_list_items price_list_items_warranty_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_list_items
    ADD CONSTRAINT price_list_items_warranty_product_id_fkey FOREIGN KEY (warranty_product_id) REFERENCES public.warranty_products(id) ON DELETE CASCADE;


--
-- Name: price_lists price_lists_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: price_lists price_lists_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.price_lists
    ADD CONSTRAINT price_lists_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: product_device_compatibilities product_device_compatibilities_device_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_device_compatibilities
    ADD CONSTRAINT product_device_compatibilities_device_brand_id_fkey FOREIGN KEY (device_brand_id) REFERENCES public.device_brands(id) ON DELETE CASCADE;


--
-- Name: product_device_compatibilities product_device_compatibilities_device_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_device_compatibilities
    ADD CONSTRAINT product_device_compatibilities_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES public.device_models(id) ON DELETE SET NULL;


--
-- Name: product_device_compatibilities product_device_compatibilities_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_device_compatibilities
    ADD CONSTRAINT product_device_compatibilities_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_prices product_prices_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_prices product_prices_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_prices
    ADD CONSTRAINT product_prices_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: product_suppliers product_suppliers_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: product_suppliers product_suppliers_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product_suppliers
    ADD CONSTRAINT product_suppliers_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: products products_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: products products_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: products products_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: remote_repair_request_devices remote_repair_request_devices_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_request_devices
    ADD CONSTRAINT remote_repair_request_devices_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: remote_repair_request_devices remote_repair_request_devices_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_request_devices
    ADD CONSTRAINT remote_repair_request_devices_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.remote_repair_requests(id) ON DELETE CASCADE;


--
-- Name: remote_repair_requests remote_repair_requests_assigned_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_assigned_center_id_fkey FOREIGN KEY (assigned_center_id) REFERENCES public.users(id);


--
-- Name: remote_repair_requests remote_repair_requests_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: remote_repair_requests remote_repair_requests_forwarded_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_forwarded_from_fkey FOREIGN KEY (forwarded_from) REFERENCES public.users(id);


--
-- Name: remote_repair_requests remote_repair_requests_requested_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_requested_center_id_fkey FOREIGN KEY (requested_center_id) REFERENCES public.users(id);


--
-- Name: remote_repair_requests remote_repair_requests_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: remote_repair_requests remote_repair_requests_sub_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remote_repair_requests
    ADD CONSTRAINT remote_repair_requests_sub_reseller_id_fkey FOREIGN KEY (sub_reseller_id) REFERENCES public.users(id);


--
-- Name: repair_center_availability repair_center_availability_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_availability
    ADD CONSTRAINT repair_center_availability_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: repair_center_blackouts repair_center_blackouts_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_blackouts
    ADD CONSTRAINT repair_center_blackouts_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: repair_center_purchase_order_items repair_center_purchase_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_order_items
    ADD CONSTRAINT repair_center_purchase_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.repair_center_purchase_orders(id) ON DELETE CASCADE;


--
-- Name: repair_center_purchase_order_items repair_center_purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_order_items
    ADD CONSTRAINT repair_center_purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: repair_center_purchase_orders repair_center_purchase_orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_orders
    ADD CONSTRAINT repair_center_purchase_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: repair_center_purchase_orders repair_center_purchase_orders_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_orders
    ADD CONSTRAINT repair_center_purchase_orders_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: repair_center_purchase_orders repair_center_purchase_orders_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_orders
    ADD CONSTRAINT repair_center_purchase_orders_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: repair_center_purchase_orders repair_center_purchase_orders_shipping_method_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_purchase_orders
    ADD CONSTRAINT repair_center_purchase_orders_shipping_method_id_fkey FOREIGN KEY (shipping_method_id) REFERENCES public.shipping_methods(id);


--
-- Name: repair_center_settings repair_center_settings_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_center_settings
    ADD CONSTRAINT repair_center_settings_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: repair_delivery repair_delivery_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_delivery
    ADD CONSTRAINT repair_delivery_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: repair_diagnostics repair_diagnostics_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_diagnostics
    ADD CONSTRAINT repair_diagnostics_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: repair_diagnostics repair_diagnostics_unrepairable_reason_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_diagnostics
    ADD CONSTRAINT repair_diagnostics_unrepairable_reason_id_fkey FOREIGN KEY (unrepairable_reason_id) REFERENCES public.unrepairable_reasons(id);


--
-- Name: repair_logs repair_logs_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_logs
    ADD CONSTRAINT repair_logs_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: repair_order_state_history repair_order_state_history_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_order_state_history
    ADD CONSTRAINT repair_order_state_history_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: repair_orders repair_orders_device_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_orders
    ADD CONSTRAINT repair_orders_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES public.device_models(id);


--
-- Name: repair_quotes repair_quotes_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_quotes
    ADD CONSTRAINT repair_quotes_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: repair_test_checklist repair_test_checklist_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.repair_test_checklist
    ADD CONSTRAINT repair_test_checklist_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: reseller_device_brands reseller_device_brands_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_brands
    ADD CONSTRAINT reseller_device_brands_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: reseller_device_models reseller_device_models_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_models
    ADD CONSTRAINT reseller_device_models_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.device_brands(id);


--
-- Name: reseller_device_models reseller_device_models_reseller_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_models
    ADD CONSTRAINT reseller_device_models_reseller_brand_id_fkey FOREIGN KEY (reseller_brand_id) REFERENCES public.reseller_device_brands(id);


--
-- Name: reseller_device_models reseller_device_models_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_models
    ADD CONSTRAINT reseller_device_models_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: reseller_device_models reseller_device_models_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_device_models
    ADD CONSTRAINT reseller_device_models_type_id_fkey FOREIGN KEY (type_id) REFERENCES public.device_types(id);


--
-- Name: reseller_products reseller_products_inherited_from_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_products
    ADD CONSTRAINT reseller_products_inherited_from_fkey FOREIGN KEY (inherited_from) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: reseller_products reseller_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_products
    ADD CONSTRAINT reseller_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: reseller_products reseller_products_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_products
    ADD CONSTRAINT reseller_products_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reseller_purchase_order_items reseller_purchase_order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_order_items
    ADD CONSTRAINT reseller_purchase_order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.reseller_purchase_orders(id) ON DELETE CASCADE;


--
-- Name: reseller_purchase_order_items reseller_purchase_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_order_items
    ADD CONSTRAINT reseller_purchase_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_payment_confirmed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_payment_confirmed_by_fkey FOREIGN KEY (payment_confirmed_by) REFERENCES public.users(id);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reseller_purchase_orders reseller_purchase_orders_shipped_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_shipped_by_fkey FOREIGN KEY (shipped_by) REFERENCES public.users(id);


--
-- Name: reseller_purchase_orders reseller_purchase_orders_warehouse_transfer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_purchase_orders
    ADD CONSTRAINT reseller_purchase_orders_warehouse_transfer_id_fkey FOREIGN KEY (warehouse_transfer_id) REFERENCES public.warehouse_transfers(id);


--
-- Name: reseller_staff_permissions reseller_staff_permissions_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_staff_permissions
    ADD CONSTRAINT reseller_staff_permissions_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: reseller_staff_permissions reseller_staff_permissions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reseller_staff_permissions
    ADD CONSTRAINT reseller_staff_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: self_diagnosis_sessions self_diagnosis_sessions_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.self_diagnosis_sessions
    ADD CONSTRAINT self_diagnosis_sessions_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: service_item_prices service_item_prices_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_item_prices
    ADD CONSTRAINT service_item_prices_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: service_item_prices service_item_prices_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_item_prices
    ADD CONSTRAINT service_item_prices_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_item_prices service_item_prices_service_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_item_prices
    ADD CONSTRAINT service_item_prices_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id) ON DELETE CASCADE;


--
-- Name: service_items service_items_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.device_brands(id);


--
-- Name: service_items service_items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_items service_items_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: service_items service_items_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.device_models(id);


--
-- Name: service_items service_items_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_items
    ADD CONSTRAINT service_items_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: service_orders service_orders_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_orders service_orders_device_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_device_model_id_fkey FOREIGN KEY (device_model_id) REFERENCES public.device_models(id);


--
-- Name: service_orders service_orders_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE SET NULL;


--
-- Name: service_orders service_orders_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id) ON DELETE SET NULL;


--
-- Name: service_orders service_orders_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: service_orders service_orders_service_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.service_orders
    ADD CONSTRAINT service_orders_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id) ON DELETE CASCADE;


--
-- Name: shipping_methods shipping_methods_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: shipping_methods shipping_methods_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.shipping_methods
    ADD CONSTRAINT shipping_methods_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: sibill_accounts sibill_accounts_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_accounts
    ADD CONSTRAINT sibill_accounts_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sibill_credentials(id) ON DELETE CASCADE;


--
-- Name: sibill_accounts sibill_accounts_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_accounts
    ADD CONSTRAINT sibill_accounts_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sibill_categories sibill_categories_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_categories
    ADD CONSTRAINT sibill_categories_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sibill_credentials(id) ON DELETE CASCADE;


--
-- Name: sibill_categories sibill_categories_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_categories
    ADD CONSTRAINT sibill_categories_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sibill_companies sibill_companies_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_companies
    ADD CONSTRAINT sibill_companies_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sibill_credentials(id) ON DELETE CASCADE;


--
-- Name: sibill_companies sibill_companies_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_companies
    ADD CONSTRAINT sibill_companies_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sibill_credentials sibill_credentials_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_credentials
    ADD CONSTRAINT sibill_credentials_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sibill_documents sibill_documents_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_documents
    ADD CONSTRAINT sibill_documents_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sibill_credentials(id) ON DELETE CASCADE;


--
-- Name: sibill_documents sibill_documents_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_documents
    ADD CONSTRAINT sibill_documents_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sibill_transactions sibill_transactions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_transactions
    ADD CONSTRAINT sibill_transactions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.sibill_accounts(id) ON DELETE SET NULL;


--
-- Name: sibill_transactions sibill_transactions_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_transactions
    ADD CONSTRAINT sibill_transactions_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sibill_credentials(id) ON DELETE CASCADE;


--
-- Name: sibill_transactions sibill_transactions_matched_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_transactions
    ADD CONSTRAINT sibill_transactions_matched_document_id_fkey FOREIGN KEY (matched_document_id) REFERENCES public.sibill_documents(id) ON DELETE SET NULL;


--
-- Name: sibill_transactions sibill_transactions_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sibill_transactions
    ADD CONSTRAINT sibill_transactions_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sifar_carts sifar_carts_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_carts
    ADD CONSTRAINT sifar_carts_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sifar_credentials(id) ON DELETE CASCADE;


--
-- Name: sifar_carts sifar_carts_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_carts
    ADD CONSTRAINT sifar_carts_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.sifar_stores(id) ON DELETE CASCADE;


--
-- Name: sifar_credentials sifar_credentials_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_credentials
    ADD CONSTRAINT sifar_credentials_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: sifar_orders sifar_orders_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_orders
    ADD CONSTRAINT sifar_orders_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sifar_credentials(id) ON DELETE CASCADE;


--
-- Name: sifar_orders sifar_orders_store_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_orders
    ADD CONSTRAINT sifar_orders_store_id_fkey FOREIGN KEY (store_id) REFERENCES public.sifar_stores(id) ON DELETE CASCADE;


--
-- Name: sifar_orders sifar_orders_supplier_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_orders
    ADD CONSTRAINT sifar_orders_supplier_order_id_fkey FOREIGN KEY (supplier_order_id) REFERENCES public.supplier_orders(id) ON DELETE SET NULL;


--
-- Name: sifar_product_compatibility sifar_product_compatibility_catalog_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_product_compatibility
    ADD CONSTRAINT sifar_product_compatibility_catalog_id_fkey FOREIGN KEY (catalog_id) REFERENCES public.sifar_catalog(id) ON DELETE CASCADE;


--
-- Name: sifar_product_compatibility sifar_product_compatibility_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_product_compatibility
    ADD CONSTRAINT sifar_product_compatibility_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.sifar_models(id) ON DELETE CASCADE;


--
-- Name: sifar_stores sifar_stores_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_stores
    ADD CONSTRAINT sifar_stores_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.customer_branches(id) ON DELETE SET NULL;


--
-- Name: sifar_stores sifar_stores_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_stores
    ADD CONSTRAINT sifar_stores_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.sifar_credentials(id) ON DELETE CASCADE;


--
-- Name: sifar_stores sifar_stores_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sifar_stores
    ADD CONSTRAINT sifar_stores_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE SET NULL;


--
-- Name: smartphone_specs smartphone_specs_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.smartphone_specs
    ADD CONSTRAINT smartphone_specs_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: staff_repair_centers staff_repair_centers_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_repair_centers
    ADD CONSTRAINT staff_repair_centers_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE CASCADE;


--
-- Name: staff_repair_centers staff_repair_centers_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_repair_centers
    ADD CONSTRAINT staff_repair_centers_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: staff_sub_resellers staff_sub_resellers_staff_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_sub_resellers
    ADD CONSTRAINT staff_sub_resellers_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: staff_sub_resellers staff_sub_resellers_sub_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.staff_sub_resellers
    ADD CONSTRAINT staff_sub_resellers_sub_reseller_id_fkey FOREIGN KEY (sub_reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: standalone_quote_items standalone_quote_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quote_items
    ADD CONSTRAINT standalone_quote_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: standalone_quote_items standalone_quote_items_quote_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quote_items
    ADD CONSTRAINT standalone_quote_items_quote_id_fkey FOREIGN KEY (quote_id) REFERENCES public.standalone_quotes(id) ON DELETE CASCADE;


--
-- Name: standalone_quote_items standalone_quote_items_service_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quote_items
    ADD CONSTRAINT standalone_quote_items_service_item_id_fkey FOREIGN KEY (service_item_id) REFERENCES public.service_items(id) ON DELETE SET NULL;


--
-- Name: standalone_quotes standalone_quotes_brand_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_brand_id_fkey FOREIGN KEY (brand_id) REFERENCES public.device_brands(id);


--
-- Name: standalone_quotes standalone_quotes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: standalone_quotes standalone_quotes_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: standalone_quotes standalone_quotes_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: standalone_quotes standalone_quotes_model_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_model_id_fkey FOREIGN KEY (model_id) REFERENCES public.device_models(id);


--
-- Name: standalone_quotes standalone_quotes_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: standalone_quotes standalone_quotes_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.standalone_quotes
    ADD CONSTRAINT standalone_quotes_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: supplier_catalog_products supplier_catalog_products_linked_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_catalog_products
    ADD CONSTRAINT supplier_catalog_products_linked_product_id_fkey FOREIGN KEY (linked_product_id) REFERENCES public.products(id) ON DELETE SET NULL;


--
-- Name: supplier_catalog_products supplier_catalog_products_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_catalog_products
    ADD CONSTRAINT supplier_catalog_products_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: supplier_communication_logs supplier_communication_logs_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_communication_logs
    ADD CONSTRAINT supplier_communication_logs_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_order_items supplier_order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: supplier_order_items supplier_order_items_supplier_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_order_items
    ADD CONSTRAINT supplier_order_items_supplier_order_id_fkey FOREIGN KEY (supplier_order_id) REFERENCES public.supplier_orders(id) ON DELETE CASCADE;


--
-- Name: supplier_orders supplier_orders_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: supplier_orders supplier_orders_repair_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_repair_order_id_fkey FOREIGN KEY (repair_order_id) REFERENCES public.repair_orders(id);


--
-- Name: supplier_orders supplier_orders_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_orders supplier_orders_target_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_orders
    ADD CONSTRAINT supplier_orders_target_warehouse_id_fkey FOREIGN KEY (target_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: supplier_return_items supplier_return_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_return_items
    ADD CONSTRAINT supplier_return_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: supplier_return_items supplier_return_items_supplier_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_return_items
    ADD CONSTRAINT supplier_return_items_supplier_order_item_id_fkey FOREIGN KEY (supplier_order_item_id) REFERENCES public.supplier_order_items(id);


--
-- Name: supplier_return_items supplier_return_items_supplier_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_return_items
    ADD CONSTRAINT supplier_return_items_supplier_return_id_fkey FOREIGN KEY (supplier_return_id) REFERENCES public.supplier_returns(id) ON DELETE CASCADE;


--
-- Name: supplier_return_state_history supplier_return_state_history_supplier_return_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_return_state_history
    ADD CONSTRAINT supplier_return_state_history_supplier_return_id_fkey FOREIGN KEY (supplier_return_id) REFERENCES public.supplier_returns(id);


--
-- Name: supplier_returns supplier_returns_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: supplier_returns supplier_returns_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id);


--
-- Name: supplier_returns supplier_returns_supplier_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_returns
    ADD CONSTRAINT supplier_returns_supplier_order_id_fkey FOREIGN KEY (supplier_order_id) REFERENCES public.supplier_orders(id);


--
-- Name: supplier_sync_logs supplier_sync_logs_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_sync_logs
    ADD CONSTRAINT supplier_sync_logs_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE;


--
-- Name: suppliers suppliers_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: transfer_request_items transfer_request_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_request_items
    ADD CONSTRAINT transfer_request_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: transfer_request_items transfer_request_items_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_request_items
    ADD CONSTRAINT transfer_request_items_request_id_fkey FOREIGN KEY (request_id) REFERENCES public.transfer_requests(id) ON DELETE CASCADE;


--
-- Name: transfer_requests transfer_requests_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: transfer_requests transfer_requests_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: transfer_requests transfer_requests_requester_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_requester_warehouse_id_fkey FOREIGN KEY (requester_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: transfer_requests transfer_requests_shipped_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_shipped_by_fkey FOREIGN KEY (shipped_by) REFERENCES public.users(id);


--
-- Name: transfer_requests transfer_requests_source_warehouse_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_source_warehouse_id_fkey FOREIGN KEY (source_warehouse_id) REFERENCES public.warehouses(id);


--
-- Name: transfer_requests transfer_requests_target_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transfer_requests
    ADD CONSTRAINT transfer_requests_target_reseller_id_fkey FOREIGN KEY (target_reseller_id) REFERENCES public.users(id);


--
-- Name: trovausati_coupons trovausati_coupons_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_coupons
    ADD CONSTRAINT trovausati_coupons_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.trovausati_credentials(id) ON DELETE CASCADE;


--
-- Name: trovausati_coupons trovausati_coupons_shop_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_coupons
    ADD CONSTRAINT trovausati_coupons_shop_id_fkey FOREIGN KEY (shop_id) REFERENCES public.trovausati_shops(id) ON DELETE SET NULL;


--
-- Name: trovausati_credentials trovausati_credentials_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_credentials
    ADD CONSTRAINT trovausati_credentials_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: trovausati_models trovausati_models_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_models
    ADD CONSTRAINT trovausati_models_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.trovausati_credentials(id) ON DELETE CASCADE;


--
-- Name: trovausati_orders trovausati_orders_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_orders
    ADD CONSTRAINT trovausati_orders_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.trovausati_credentials(id) ON DELETE CASCADE;


--
-- Name: trovausati_shops trovausati_shops_branch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_shops
    ADD CONSTRAINT trovausati_shops_branch_id_fkey FOREIGN KEY (branch_id) REFERENCES public.customer_branches(id) ON DELETE SET NULL;


--
-- Name: trovausati_shops trovausati_shops_credential_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_shops
    ADD CONSTRAINT trovausati_shops_credential_id_fkey FOREIGN KEY (credential_id) REFERENCES public.trovausati_credentials(id) ON DELETE CASCADE;


--
-- Name: trovausati_shops trovausati_shops_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trovausati_shops
    ADD CONSTRAINT trovausati_shops_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id) ON DELETE SET NULL;


--
-- Name: unrepairable_reasons unrepairable_reasons_device_type_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.unrepairable_reasons
    ADD CONSTRAINT unrepairable_reasons_device_type_id_fkey FOREIGN KEY (device_type_id) REFERENCES public.device_types(id);


--
-- Name: utility_commissions utility_commissions_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_commissions
    ADD CONSTRAINT utility_commissions_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id);


--
-- Name: utility_commissions utility_commissions_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_commissions
    ADD CONSTRAINT utility_commissions_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_commissions utility_commissions_rejected_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_commissions
    ADD CONSTRAINT utility_commissions_rejected_by_fkey FOREIGN KEY (rejected_by) REFERENCES public.users(id);


--
-- Name: utility_practice_documents utility_practice_documents_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_documents
    ADD CONSTRAINT utility_practice_documents_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_practice_documents utility_practice_documents_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_documents
    ADD CONSTRAINT utility_practice_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: utility_practice_notes utility_practice_notes_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_notes
    ADD CONSTRAINT utility_practice_notes_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: utility_practice_notes utility_practice_notes_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_notes
    ADD CONSTRAINT utility_practice_notes_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_practice_products utility_practice_products_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_products
    ADD CONSTRAINT utility_practice_products_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_practice_products utility_practice_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_products
    ADD CONSTRAINT utility_practice_products_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: utility_practice_state_history utility_practice_state_history_changed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_state_history
    ADD CONSTRAINT utility_practice_state_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES public.users(id);


--
-- Name: utility_practice_state_history utility_practice_state_history_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_state_history
    ADD CONSTRAINT utility_practice_state_history_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_practice_tasks utility_practice_tasks_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_tasks
    ADD CONSTRAINT utility_practice_tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: utility_practice_tasks utility_practice_tasks_completed_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_tasks
    ADD CONSTRAINT utility_practice_tasks_completed_by_fkey FOREIGN KEY (completed_by) REFERENCES public.users(id);


--
-- Name: utility_practice_tasks utility_practice_tasks_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_tasks
    ADD CONSTRAINT utility_practice_tasks_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: utility_practice_tasks utility_practice_tasks_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_tasks
    ADD CONSTRAINT utility_practice_tasks_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_practice_timeline utility_practice_timeline_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_timeline
    ADD CONSTRAINT utility_practice_timeline_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id);


--
-- Name: utility_practice_timeline utility_practice_timeline_practice_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practice_timeline
    ADD CONSTRAINT utility_practice_timeline_practice_id_fkey FOREIGN KEY (practice_id) REFERENCES public.utility_practices(id) ON DELETE CASCADE;


--
-- Name: utility_practices utility_practices_assigned_to_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: utility_practices utility_practices_customer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id);


--
-- Name: utility_practices utility_practices_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: utility_practices utility_practices_repair_center_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_repair_center_id_fkey FOREIGN KEY (repair_center_id) REFERENCES public.repair_centers(id);


--
-- Name: utility_practices utility_practices_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- Name: utility_practices utility_practices_service_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.utility_services(id);


--
-- Name: utility_practices utility_practices_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_practices
    ADD CONSTRAINT utility_practices_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.utility_suppliers(id);


--
-- Name: utility_services utility_services_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_services
    ADD CONSTRAINT utility_services_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.utility_suppliers(id) ON DELETE CASCADE;


--
-- Name: utility_suppliers utility_suppliers_reseller_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utility_suppliers
    ADD CONSTRAINT utility_suppliers_reseller_id_fkey FOREIGN KEY (reseller_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict iBtL797lQxA1rIU8cWYIXfOgbphQwDish4smJ4Z3buL995P8MA2k0LDcsLWYEnf

