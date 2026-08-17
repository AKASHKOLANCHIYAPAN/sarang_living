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

console.log('--- SUPABASE CONNECTION DIAGNOSTIC ---');
console.log('Project URL:', supabaseUrl);

if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
  console.error('ERROR: Real NEXT_PUBLIC_SUPABASE_URL is missing in .env.local');
  process.exit(1);
}

if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
  console.error('ERROR: Real NEXT_PUBLIC_SUPABASE_ANON_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('products').select('count', { count: 'exact' });
    if (error) {
      console.error('Connection failed:', error.message);
      process.exit(1);
    }
    console.log('✅ SUCCESS! Supabase is properly connected.');
    console.log(`Total products in database: ${data?.length || 0}`);
  } catch (err) {
    console.error('Exception during connection test:', err);
    process.exit(1);
  }
}

testConnection();
