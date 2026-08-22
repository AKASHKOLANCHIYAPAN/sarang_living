import fs from 'fs';
import path from 'path';

// Read lib/products.ts
const productsFilePath = path.join(process.cwd(), 'lib', 'products.ts');
const content = fs.readFileSync(productsFilePath, 'utf8');

// Match categories array
const categoriesMatch = content.match(/export const categories: Category\[\] = (\[[\s\S]*?\n\];)/);
const productsMatch = content.match(/export const products: Product\[\] = (\[[\s\S]*?\n\];)/);

if (!categoriesMatch || !productsMatch) {
  console.error('Failed to parse categories or products from lib/products.ts');
  process.exit(1);
}

// Evaluate using Function
const categories = new Function(`return ${categoriesMatch[1].replace(/;$/, '')}`)();
const products = new Function(`return ${productsMatch[1].replace(/;$/, '')}`)();

let sql = `-- ================================================================\n`;
sql += `-- SARANG LIVING — Supabase Seed Data (Ultra-Compact)\n`;
sql += `-- Run in Supabase SQL Editor after schema.sql\n`;
sql += `-- ================================================================\n\n`;

sql += `-- 1. SEED CATEGORIES (10 items)\n`;
sql += `INSERT INTO public.categories (name, slug, parent_category, description)\nVALUES\n`;

const catRows = categories.map((c) => {
  const name = c.name.replace(/'/g, "''");
  const slug = c.slug.replace(/'/g, "''");
  const parent = c.parentCategory.replace(/'/g, "''");
  const desc = c.description ? `'${c.description.replace(/'/g, "''")}'` : 'NULL';
  return `  ('${name}', '${slug}', '${parent}', ${desc})`;
});

sql += catRows.join(',\n') + '\n';
sql += `ON CONFLICT (slug) DO UPDATE SET\n`;
sql += `  name = EXCLUDED.name,\n`;
sql += `  parent_category = EXCLUDED.parent_category,\n`;
sql += `  description = EXCLUDED.description;\n\n`;

sql += `-- 2. SEED 77 PRODUCTS (Compact format)\n`;
sql += `WITH c AS (SELECT name, id FROM public.categories)\n`;
sql += `INSERT INTO public.products (sku, name, slug, price, compare_at_price, category_id, description, images, stock_quantity, is_active)\nVALUES\n`;

const prodRows = products.map((p) => {
  const sku = p.sku.replace(/'/g, "''");
  const name = p.name.replace(/'/g, "''");
  const slug = p.slug.replace(/'/g, "''");
  const price = Number(p.price).toFixed(2);
  const compareAtPrice = p.compareAtPrice !== undefined ? Number(p.compareAtPrice).toFixed(2) : 'NULL';
  const catName = p.category.replace(/'/g, "''");
  const desc = p.description ? `'${p.description.replace(/'/g, "''")}'` : 'NULL';
  const images = JSON.stringify(p.images || []);
  const stock = p.stockQuantity ?? 0;
  const isActive = p.isActive !== false ? 'true' : 'false';

  return `  ('${sku}', '${name}', '${slug}', ${price}, ${compareAtPrice}, (SELECT id FROM c WHERE name = '${catName}'), ${desc}, '${images}'::jsonb, ${stock}, ${isActive})`;
});

sql += prodRows.join(',\n') + '\n';
sql += `ON CONFLICT (sku) DO UPDATE SET\n`;
sql += `  name = EXCLUDED.name,\n`;
sql += `  slug = EXCLUDED.slug,\n`;
sql += `  price = EXCLUDED.price,\n`;
sql += `  compare_at_price = EXCLUDED.compare_at_price,\n`;
sql += `  category_id = EXCLUDED.category_id,\n`;
sql += `  description = EXCLUDED.description,\n`;
sql += `  images = EXCLUDED.images,\n`;
sql += `  stock_quantity = EXCLUDED.stock_quantity,\n`;
sql += `  is_active = EXCLUDED.is_active,\n`;
sql += `  updated_at = NOW();\n`;

const seedFilePath = path.join(process.cwd(), 'supabase', 'seed.sql');
fs.writeFileSync(seedFilePath, sql, 'utf8');

console.log(`Generated ${seedFilePath} successfully with ${categories.length} categories and ${products.length} products. Total lines: ${sql.split('\n').length}`);
