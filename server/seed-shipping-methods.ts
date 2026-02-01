import { db } from './db';
import { shippingMethods, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

async function seedShippingMethods() {
  console.log('Seeding shipping methods...');
  
  // Find admin user
  const [admin] = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  
  if (!admin) {
    console.log('No admin user found. Skipping shipping methods seed.');
    return;
  }
  
  console.log(`Found admin user: ${admin.email}`);
  
  const defaultMethods = [
    { name: 'Spedizione Standard', code: 'STD', priceCents: 699, estimatedDays: 4, isPickup: false, sortOrder: 1 },
    { name: 'Spedizione Express', code: 'EXP', priceCents: 1299, estimatedDays: 1, isPickup: false, sortOrder: 2 },
    { name: 'Ritiro in Sede', code: 'PICKUP', priceCents: 0, estimatedDays: null, isPickup: true, sortOrder: 3 },
    { name: 'Corriere Espresso', code: 'COURIER', priceCents: 999, estimatedDays: 2, isPickup: false, sortOrder: 4 },
  ];
  
  for (const method of defaultMethods) {
    // Check if method already exists for admin (createdBy = admin.id)
    const [existing] = await db.select().from(shippingMethods)
      .where(and(
        eq(shippingMethods.createdBy, admin.id),
        eq(shippingMethods.code, method.code)
      ))
      .limit(1);
    
    if (existing) {
      console.log(`Shipping method ${method.code} already exists, skipping...`);
      continue;
    }
    
    await db.insert(shippingMethods).values({
      createdBy: admin.id,
      name: method.name,
      code: method.code,
      priceCents: method.priceCents,
      estimatedDays: method.estimatedDays,
      isPickup: method.isPickup,
      isTemplate: true,
      isActive: true,
      sortOrder: method.sortOrder,
    });
    
    console.log(`Created shipping method: ${method.name}`);
  }
  
  console.log('Shipping methods seed completed!');
}

seedShippingMethods()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error seeding shipping methods:', err);
    process.exit(1);
  });
