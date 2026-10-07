/**
 * seed_supabase.mjs – run with: node scripts/seed_supabase.mjs
 */
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ── 1. Environment Credentials Check ─────────────────────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env');
const envVars = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#')) envVars[k.trim()] = rest.join('=').trim();
  });
} catch { /* .env fallback */ }

const SUPABASE_URL = process.env.SUPABASE_URL || envVars['VITE_SUPABASE_URL'];
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌ Missing credentials in .env file (VITE_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET_NAME = 'artworks';

// ── 2. Authentic Arts Profile Details ───────────────────────────────────────
const AUTHENTIC_ARTS_UID = '8784e879-92e7-4ed8-a96e-ba9afd0795c0';

const AUTHENTIC_ARTS_PROFILE = {
  id: AUTHENTIC_ARTS_UID,
  email: 'authentic.arts2025@gmail.com',
  name: 'Authentic Arts',
  role: 'artist',
  avatar_url: 'https://picsum.photos/seed/authenticarts/200/200',
  location: 'Nairobi, Kenya',
  join_date: '2026-10-07',
  bio: 'Official Authentic Arts curated digital and contemporary fine art gallery.',
  specialties: ['Paintings', 'Photography', 'Digital Art', 'Fine Art'],
  verified: true,
  total_sales: 0,
  total_earnings: 0,
  wallet_balance: 0,
  withdrawn: 0,
  followers: 120,
  portfolio_total_works: 14,
  portfolio_sold: 0,
  portfolio_available: 14,
  preferred_styles: [],
  is_first_time_buyer: false,
};

// ── 3. Helpers ───────────────────────────────────────────────────────────────
async function upsert(table, rows, conflict = 'id') {
  if (!rows || !rows.length) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: conflict, ignoreDuplicates: false });
  if (error) console.error(`  ✗ ${table}:`, error.message);
  else console.log(`  ✓ ${table} – ${rows.length} rows updated/inserted`);
}

// ── 4. Process Bulk Uploads ──────────────────────────────────────────────────
async function processBulkArtworks() {
  const jsonPath = resolve(__dir, '../public/artworks/artworks.json');
  const imagesDirPath = resolve(__dir, '../public/artworks/images');

  if (!existsSync(jsonPath)) {
    console.error(`  ✗ Could not find artworks.json at: ${jsonPath}`);
    return [];
  }

  const rawJson = readFileSync(jsonPath, 'utf8');
  const rawArtworks = JSON.parse(rawJson);
  const processedRows = [];

  console.log(`\n  Found ${rawArtworks.length} items in artworks.json. Starting storage uploads...`);

  for (let i = 0; i < rawArtworks.length; i++) {
    const art = rawArtworks[i];
    const fileName = art.image_filename;
    const localImagePath = resolve(imagesDirPath, fileName);

    let publicUrl = `https://picsum.photos/seed/artwork${i}/800/600`;

    if (existsSync(localImagePath)) {
      const fileBuffer = readFileSync(localImagePath);
      const ext = extname(fileName).toLowerCase();
      const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
      const storagePath = `bulk_${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, { contentType, upsert: true });

      if (uploadErr) {
        console.error(`  ✗ Storage upload error for ${fileName}:`, uploadErr.message);
      } else {
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(storagePath);
        publicUrl = urlData.publicUrl;
      }
    } else {
      console.warn(`  ⚠️ Local image missing: ${localImagePath}. Using fallback image.`);
    }

    const artworkId = `a0000001-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;

    // STRICT 1:1 MATCH WITH LIVE SUPABASE TABLE SCHEMA
    processedRows.push({
      id: artworkId,
      artist_id: AUTHENTIC_ARTS_UID,
      artist_name: 'Authentic Arts',
      title: art.title,
      description: art.description || '',
      category: art.category || 'Paintings',
      style: 'Contemporary',
      medium: art.medium || 'Fine Art',
      dimensions: '80cm x 60cm',
      year: 2026,
      origin: 'Authentic Arts Gallery, Nairobi',
      authenticity: `Certificate of Authenticity #AA-2026-${String(i + 1).padStart(3, '0')}.`,
      inspiration: art.description || '',
      tags: [art.category ? art.category.toLowerCase() : 'fine art', art.medium ? art.medium.toLowerCase() : 'paintings', 'authentic arts'],
      alt_text: art.title,
      price: Number(art.price || 1500),
      original_price: Number(art.price || 1500),
      quantity: Number(art.stock_quantity || 10),
      images: [publicUrl],
      status: 'available',
      featured: i < 4,
      best_seller: i % 2 === 0,
      sales: 0,
      average_rating: 4.9,
      review_count: 0,
    });
  }

  return processedRows;
}

// ── 5. Main Script Execution ─────────────────────────────────────────────────
async function main() {
  console.log('\n=== Authentic Arts — Profile Creation & Artwork Seed ===\n');

  console.log('Step 1/2  Upserting Authentic Arts profile...');
  await upsert('profiles', [AUTHENTIC_ARTS_PROFILE]);

  console.log('\nStep 2/2  Uploading images & seeding artworks...');
  const artworksToInsert = await processBulkArtworks();
  await upsert('artworks', artworksToInsert, 'id');

  console.log('\n=== Seed complete ✓ All artworks assigned to Authentic Arts! ===\n');
}

main().catch(err => {
  console.error('\n❌ Execution error:', err.message);
  process.exit(1);
});