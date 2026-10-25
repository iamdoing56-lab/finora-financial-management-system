/**
 * Finora Database Seed Script
 *
 * Run with: node src/prisma/seed.js
 * Or: npm run db:seed
 *
 * This script:
 * 1. Creates 8 default system-wide categories (userId = null, isDefault = true).
 * 2. Creates the default admin user (credentials from environment variables).
 * 3. Seeds 2 default SystemSettings (platform_name, maintenance_mode).
 *
 * It is safe to run multiple times — it uses upsert so it won't duplicate data.
 */

require('dotenv').config();

const { PrismaClient } = require('@prisma/client');
const { hashPassword } = require('../utils/authUtils');

const prisma = new PrismaClient();

// Default categories that every user sees (shared, not user-specific)
const DEFAULT_CATEGORIES = [
  // Income categories
  { name: 'Salary',         type: 'INCOME',  color: '#10B981', isDefault: true },
  { name: 'Freelance',      type: 'INCOME',  color: '#0D9488', isDefault: true },
  { name: 'Investments',    type: 'INCOME',  color: '#0284C7', isDefault: true },
  // Expense categories
  { name: 'Food',           type: 'EXPENSE', color: '#F59E0B', isDefault: true },
  { name: 'Rent',           type: 'EXPENSE', color: '#EF4444', isDefault: true },
  { name: 'Transport',      type: 'EXPENSE', color: '#8B5CF6', isDefault: true },
  { name: 'Entertainment',  type: 'EXPENSE', color: '#EC4899', isDefault: true },
  { name: 'Utilities',      type: 'EXPENSE', color: '#6366F1', isDefault: true },
  { name: 'Healthcare',     type: 'EXPENSE', color: '#14B8A6', isDefault: true },
  // Special fallback category (used for "reassign on delete")
  { name: 'Other',          type: 'EXPENSE', color: '#6B7280', isDefault: true },
  { name: 'Other',          type: 'INCOME',  color: '#6B7280', isDefault: true },
];

// Default platform settings
const DEFAULT_SETTINGS = [
  { key: 'platform_name',    value: 'Finora',  description: 'Display name of the platform' },
  { key: 'maintenance_mode', value: 'false',   description: 'Set to true to put the platform in maintenance mode' },
];

async function main() {
  console.log('🌱 Starting Finora database seed...');

  // ── 1. Seed Default Categories ──────────────────────────────────────────
  console.log('  Creating default categories...');
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        userId: null,
        name: cat.name,
        type: cat.type,
      },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: { color: cat.color },
      });
    } else {
      await prisma.category.create({
        data: {
          userId:    null,
          name:      cat.name,
          type:      cat.type,
          color:     cat.color,
          isDefault: cat.isDefault,
        },
      });
    }
  }
  console.log(`  ✅ ${DEFAULT_CATEGORIES.length} default categories seeded.`);

  // ── 2. Seed Admin User ──────────────────────────────────────────────────
  const adminEmail    = process.env.SEED_ADMIN_EMAIL    || 'admin@finora.app';
  const adminName     = process.env.SEED_ADMIN_NAME     || 'Admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'Admin@123456';

  console.log(`  Creating admin user: ${adminEmail}`);
  const passwordHash = await hashPassword(adminPassword);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {}, // Don't overwrite existing admin data
    create: {
      name:         adminName,
      email:        adminEmail,
      passwordHash: passwordHash,
      role:         'ADMIN',
      isActive:     true,
      currency:     '$',
    },
  });
  console.log('  ✅ Admin user seeded.');

  // ── 3. Seed System Settings ─────────────────────────────────────────────
  console.log('  Creating system settings...');
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {}, // Don't overwrite if changed by admin
      create: {
        key:         setting.key,
        value:       setting.value,
        description: setting.description,
      },
    });
  }
  console.log(`  ✅ ${DEFAULT_SETTINGS.length} system settings seeded.`);

  console.log('\n🎉 Database seed complete!');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
