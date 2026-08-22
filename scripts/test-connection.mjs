import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually for node test script
const envPath = path.join(process.cwd(), '.env.local');
let supabaseUrl = '';
let supabaseKey = '';

if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  content.split('\n').forEach((line) => {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.replace('NEXT_PUBLIC_SUPABASE_URL=', '').trim();
    }
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.replace('NEXT_PUBLIC_SUPABASE_ANON_KEY=', '').trim();
    }
  });
}

console.log('═══════════════════════════════════════════════════════');
console.log('   SARANG LIVING — SUPABASE DIAGNOSTIC (PHASE 1)       ');
console.log('═══════════════════════════════════════════════════════');
console.log('Project URL:', supabaseUrl || '(not configured)');

if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
  console.error('❌ ERROR: Real NEXT_PUBLIC_SUPABASE_URL is missing in .env.local');
  process.exit(1);
}

if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
  console.error('❌ ERROR: Real NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
  try {
    console.log('\n[1/3] Testing Categories table...');
    const { data: catData, error: catError, count: catCount } = await supabase
      .from('categories')
      .select('id, name, slug, parent_category', { count: 'exact' });

    if (catError) {
      console.warn('⚠️  Categories table query error:', catError.message);
      console.log('    (Note: Run supabase/schema.sql and supabase/seed.sql in Supabase SQL Editor if you haven\'t yet.)');
    } else {
      console.log(`✅ Categories table active. Total categories: ${catCount ?? catData?.length ?? 0}`);
      if (catData && catData.length > 0) {
        console.log(`   Sample category: "${catData[0].name}" (${catData[0].slug})`);
      }
    }

    console.log('\n[2/3] Testing Products table...');
    const { data: prodData, error: prodError, count: prodCount } = await supabase
      .from('products')
      .select('id, sku, name, slug, price, compare_at_price, stock_quantity, is_active, category_id', { count: 'exact' });

    if (prodError) {
      console.warn('⚠️  Products table query error:', prodError.message);
      console.log('    (Note: Run supabase/schema.sql and supabase/seed.sql in Supabase SQL Editor if you haven\'t yet.)');
    } else {
      console.log(`✅ Products table active. Total products: ${prodCount ?? prodData?.length ?? 0}`);
      if (prodData && prodData.length > 0) {
        console.log(`   Sample product: [${prodData[0].sku || 'NO_SKU'}] "${prodData[0].name || prodData[0].title}" (₹${prodData[0].price})`);
      }
    }

    console.log('\n[3/3] Testing Products + Categories Foreign Key Join...');
    const { data: joinData, error: joinError } = await supabase
      .from('products')
      .select('sku, name, categories ( name, slug, parent_category )')
      .limit(3);

    if (joinError) {
      console.warn('⚠️  Join query error:', joinError.message);
    } else if (joinData && joinData.length > 0) {
      console.log('✅ Foreign Key relation verified successfully.');
      joinData.forEach((p) => {
        const catName = p.categories?.name || 'Unknown';
        console.log(`   • [${p.sku}] ${p.name} -> Category: ${catName}`);
      });
    }

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('Diagnostic check completed.');
  } catch (err) {
    console.error('❌ Exception during connection test:', err);
    process.exit(1);
  }
}

testDatabase();
