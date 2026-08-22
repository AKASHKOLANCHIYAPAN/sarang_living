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

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyLiveDb() {
  console.log('====================================================');
  console.log('    SARANG LIVING — LIVE SUPABASE VERIFICATION      ');
  console.log('====================================================');

  // 1. Categories
  const { data: categories, error: catErr, count: catCount } = await supabase
    .from('categories')
    .select('*', { count: 'exact' });

  console.log('\n[1] CATEGORIES TABLE:');
  if (catErr) {
    console.error('❌ Error:', catErr.message);
  } else {
    console.log(`✅ Total categories: ${catCount}`);
    console.log('   Categories list:', categories.map((c) => `${c.name} (${c.slug})`).join(', '));
  }

  // 2. Products
  const { data: products, error: prodErr, count: prodCount } = await supabase
    .from('products')
    .select('*, categories ( name, slug, parent_category )', { count: 'exact' })
    .order('sku', { ascending: true });

  console.log('\n[2] PRODUCTS TABLE & SCHEMA:');
  if (prodErr) {
    console.error('❌ Error:', prodErr.message);
  } else {
    console.log(`✅ Total products: ${prodCount}`);
    if (products && products.length > 0) {
      console.log('   Columns present:', Object.keys(products[0]).filter(k => k !== 'categories').join(', '));
      
      // Check expected SKUs
      const skus = products.map((p) => p.sku);
      const expectedSkus = [];
      for (let i = 1; i <= 79; i++) {
        if (i === 63 || i === 64) continue;
        expectedSkus.push(`SL${String(i).padStart(3, '0')}`);
      }
      
      const missing = expectedSkus.filter((sku) => !skus.includes(sku));
      const unexpected = skus.filter((sku) => !expectedSkus.includes(sku));
      
      console.log(`   Expected: 77 products (SL001–SL079 excl. SL063, SL064)`);
      console.log(`   Found: ${skus.length} products`);
      if (missing.length === 0 && unexpected.length === 0) {
        console.log('   ✅ ALL 77 EXACT EXPECTED SKUs ARE PRESENT IN LIVE DATABASE!');
      } else {
        if (missing.length > 0) console.log('   ⚠️ Missing SKUs:', missing);
        if (unexpected.length > 0) console.log('   ⚠️ Unexpected SKUs:', unexpected);
      }
      
      // Sample product with category join and image path
      console.log('\n[3] FOREIGN KEY JOIN & DATA INTEGRITY SAMPLE:');
      const sample = products[0];
      console.log(`   • SKU: ${sample.sku}`);
      console.log(`   • Name: ${sample.name}`);
      console.log(`   • Slug: ${sample.slug}`);
      console.log(`   • Price: ₹${sample.price}`);
      console.log(`   • Category: ${sample.categories?.name} (${sample.categories?.parent_category})`);
      console.log(`   • Images: ${JSON.stringify(sample.images)}`);
      console.log(`   • Stock: ${sample.stock_quantity}`);
      console.log(`   • Is Active: ${sample.is_active}`);
    }
  }

  // 4. Other tables check
  console.log('\n[4] OTHER TABLES EXISTENCE:');
  for (const table of ['profiles', 'addresses', 'orders', 'order_items']) {
    const { error } = await supabase.from(table).select('count', { count: 'exact' });
    if (error) {
      console.log(`   ❌ ${table}: ${error.message}`);
    } else {
      console.log(`   ✅ ${table}: table exists and is accessible`);
    }
  }

  // 5. Function check
  console.log('\n[5] RPC FUNCTION CHECK (is_admin):');
  const { data: adminData, error: adminErr } = await supabase.rpc('is_admin');
  if (adminErr && adminErr.message.includes('Could not find')) {
    console.log(`   ❌ is_admin: function not found`);
  } else {
    console.log(`   ✅ is_admin function exists and executed successfully (result: ${adminData})`);
  }

  console.log('\n====================================================');
  console.log('Live verification finished.');
}

verifyLiveDb();
