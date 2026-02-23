#!/bin/bash
# Script di esportazione dati MonkeyPlan
# Esporta le tabelle di configurazione e catalogo in formato SQL

OUTPUT_FILE="monkeyplan-export.sql"

echo "-- MonkeyPlan Data Export" > "$OUTPUT_FILE"
echo "-- Generated: $(date)" >> "$OUTPUT_FILE"
echo "-- ================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

TABLES=(
  "device_types"
  "device_brands"
  "device_models"
  "unrepairable_reasons"
  "diagnostic_findings"
  "damaged_component_types"
  "estimated_repair_times"
  "accessory_types"
  "issue_types"
  "shipping_methods"
  "license_plans"
  "service_items"
  "service_item_prices"
  "utility_categories"
  "utility_services"
  "utility_suppliers"
  "warranty_products"
  "products"
  "product_prices"
  "product_suppliers"
  "product_device_compatibilities"
  "suppliers"
  "users"
  "repair_centers"
  "repair_center_settings"
  "customer_relationships"
  "reseller_settings"
  "admin_settings"
  "warehouses"
  "licenses"
  "price_lists"
  "price_list_items"
  "reseller_device_brands"
  "reseller_device_models"
  "reseller_products"
  "payment_configurations"
  "billing_data"
  "notification_preferences"
  "promotions"
)

for TABLE in "${TABLES[@]}"; do
  COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM $TABLE;" 2>/dev/null | tr -d ' ')
  if [ "$COUNT" -gt "0" ] 2>/dev/null; then
    echo "Exporting $TABLE ($COUNT rows)..."
    echo "" >> "$OUTPUT_FILE"
    echo "-- ============ $TABLE ($COUNT rows) ============" >> "$OUTPUT_FILE"
    echo "-- Clear existing data (optional - uncomment if needed)" >> "$OUTPUT_FILE"
    echo "-- DELETE FROM $TABLE;" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    pg_dump "$DATABASE_URL" --data-only --table="$TABLE" --column-inserts --no-owner --no-privileges 2>/dev/null >> "$OUTPUT_FILE"
  else
    echo "Skipping $TABLE (empty)"
  fi
done

echo ""
echo "=== Export completed ==="
echo "File: $OUTPUT_FILE"
echo "Size: $(du -h "$OUTPUT_FILE" | cut -f1)"
echo ""
echo "Per importare su Railway, usa:"
echo "  psql <RAILWAY_CONNECTION_URL> -f $OUTPUT_FILE"
