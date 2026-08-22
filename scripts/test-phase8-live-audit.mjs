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

async function runLiveAudit() {
  console.log('================================================================');
  console.log('  SARANG LIVING — PHASE 8 LIVE DYNAMIC INTEGRATION AUDIT        ');
  console.log('================================================================');

  let testPassedCount = 0;
  let testTotalCount = 0;

  function assert(name, condition, extra = '') {
    testTotalCount++;
    if (condition) {
      testPassedCount++;
      console.log(`✅ [PASS] ${name} ${extra ? `(${extra})` : ''}`);
    } else {
      console.error(`❌ [FAIL] ${name} ${extra ? `(${extra})` : ''}`);
    }
  }

  try {
    // -------------------------------------------------------------
    // 1. LIVE DATABASE STATUS & ROW COUNTS
    // -------------------------------------------------------------
    console.log('\n--- SECTION 1: LIVE DATABASE STATUS ---');
    const { data: prods, error: pErr } = await supabase
      .from('products')
      .select('id, sku, name, slug, price, compare_at_price, stock_quantity, is_active, category_id, images, categories ( id, name, slug )');

    const { data: cats, error: cErr } = await supabase
      .from('categories')
      .select('id, name, slug');

    assert('Products Table Query', !pErr && prods && prods.length >= 77, `Found ${prods?.length} rows in live Supabase DB`);
    assert('Categories Table Query', !cErr && cats && cats.length >= 10, `Found ${cats?.length} rows in live Supabase DB`);

    // -------------------------------------------------------------
    // 2. LIVE QUERY VERIFICATION: NO HARDCODED PRODUCTS USED
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: CATALOG DATA ACCESS LAYER (lib/products-db.ts) ---');
    const targetProd = prods.find((p) => p.sku === 'SL001');
    assert('Real Product SL001 Queried from DB', Boolean(targetProd), `Name: "${targetProd.name}", Price: ₹${targetProd.price}`);

    // Verify all categories resolved from foreign keys
    let resolvedFkCount = 0;
    prods.forEach((p) => {
      if (p.categories && p.categories.name) resolvedFkCount++;
    });
    assert('Foreign Key Category Resolution', resolvedFkCount === prods.length, `${resolvedFkCount}/${prods.length} products joined with categories table`);

    // -------------------------------------------------------------
    // 3. DYNAMIC CATEGORY QUERIES
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: DYNAMIC CATEGORY QUERIES ---');
    const categoriesMap = new Map();
    prods.forEach((p) => {
      const catName = p.categories?.name || 'Uncategorized';
      categoriesMap.set(catName, (categoriesMap.get(catName) || 0) + 1);
    });

    console.log('Live Dynamic Category Distribution:');
    categoriesMap.forEach((count, cat) => {
      console.log(`   • ${cat}: ${count} products`);
    });
    assert('Dynamic Category-to-Product Mapping', categoriesMap.size >= 10, `${categoriesMap.size} active categories`);

    // -------------------------------------------------------------
    // 4. IMAGE ARCHITECTURE VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: IMAGE ARCHITECTURE VERIFICATION ---');
    let validImagesCount = 0;
    let missingDiskFiles = 0;

    prods.forEach((p) => {
      let imgPath = Array.isArray(p.images) ? p.images[0] : p.images;
      if (imgPath) {
        validImagesCount++;
        const relativePath = imgPath.startsWith('/') ? imgPath.slice(1) : imgPath;
        const diskPath = path.join(process.cwd(), 'public', relativePath);
        if (!fs.existsSync(diskPath)) {
          missingDiskFiles++;
        }
      }
    });

    assert('Products with DB Image Paths', validImagesCount === prods.length, `${validImagesCount}/${prods.length}`);
    assert('Physical Product Asset Files in /public', missingDiskFiles === 0, `${prods.length - missingDiskFiles}/${prods.length} present on disk`);

    // -------------------------------------------------------------
    // 5. SECURITY & SERVICE ROLE KEY CHECK
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: SECURITY & CLIENT EXPOSURE AUDIT ---');
    assert('Supabase URL Configured', Boolean(supabaseUrl), supabaseUrl ? 'Set' : 'Missing');
    assert('Anon Key Configured', Boolean(supabaseKey), supabaseKey ? 'Set' : 'Missing');

    // Scan client files for service role key leak
    let leakedServiceRole = false;
    const clientDirs = ['app', 'components', 'store', 'lib'];
    
    function scanDir(dir) {
      const fullDir = path.join(process.cwd(), dir);
      if (!fs.existsSync(fullDir)) return;
      const files = fs.readdirSync(fullDir, { withFileTypes: true });
      for (const f of files) {
        const p = path.join(fullDir, f.name);
        if (f.isDirectory()) {
          scanDir(path.join(dir, f.name));
        } else if (f.isFile() && (f.name.endsWith('.ts') || f.name.endsWith('.tsx') || f.name.endsWith('.js'))) {
          const content = fs.readFileSync(p, 'utf8');
          if (content.includes('SUPABASE_SERVICE_ROLE_KEY') && !p.includes('route.ts') && !p.includes('server.ts') && !p.includes('admin.ts')) {
            console.error(`⚠️ Possible service role mention in ${p}`);
            leakedServiceRole = true;
          }
        }
      }
    }

    clientDirs.forEach(scanDir);
    assert('Zero Service Role Exposure to Client Bundles', !leakedServiceRole, 'Clean');

    // -------------------------------------------------------------
    // 6. RLS SECURITY VERIFICATION
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: ROW LEVEL SECURITY (RLS) VERIFICATION ---');
    const { error: unauthOrderErr } = await supabase.from('orders').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      total_amount: 50,
      shipping_address: {},
    });
    assert('RLS Orders Table Protection', Boolean(unauthOrderErr), unauthOrderErr?.message || 'Blocked');

    const { error: unauthAddrErr } = await supabase.from('addresses').insert({
      user_id: '00000000-0000-0000-0000-000000000000',
      recipient_name: 'Attacker',
      phone: '000',
      street: 'X',
      city: 'Y',
      state: 'Z',
      postal_code: '0',
    });
    assert('RLS Addresses Table Protection', Boolean(unauthAddrErr), unauthAddrErr?.message || 'Blocked');

    const { error: unauthProdErr } = await supabase.from('products').insert({
      sku: 'SLHACK',
      name: 'Hack',
      slug: 'hack',
      price: 1,
      category_id: cats[0].id,
    });
    assert('RLS Products Mutation Protection', Boolean(unauthProdErr), unauthProdErr?.message || 'Blocked');

    // -------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------
    console.log('\n================================================================');
    console.log(`PHASE 8 LIVE AUDIT RESULT: ${testPassedCount}/${testTotalCount} TESTS PASSED`);
    console.log('================================================================');
  } catch (err) {
    console.error('❌ Audit exception:', err);
    process.exit(1);
  }
}

runLiveAudit();
