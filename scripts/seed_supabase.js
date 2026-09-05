/**
 * seed_supabase.js
 * ----------------
 * Seeds the Supabase database with all demo data using the service-role key.
 * Run once: node scripts/seed_supabase.js
 *
 * Requires:
 *   - @supabase/supabase-js  (already installed)
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars
 *     (service-role key bypasses RLS — never expose it in the browser)
 *
 * Usage:
 *   set SUPABASE_URL=https://xxxx.supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *   node scripts/seed_supabase.js
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL          = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env vars first.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helpers ──────────────────────────────────────────────────────────────────

async function upsert(table, rows, conflictColumn = 'id') {
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: conflictColumn, ignoreDuplicates: true });
  if (error) console.error(`  ✗ ${table}:`, error.message);
  else       console.log(`  ✓ ${table}: ${rows.length} rows`);
}

// ── User accounts (Auth) ──────────────────────────────────────────────────────

async function seedAuthUser({ id, email, password, name, role }) {
  // Try creating; if the user already exists, skip silently.
  const { error } = await supabase.auth.admin.createUser({
    user_metadata: { name, role },
    email,
    password,
    email_confirm: true,
    id,
  });
  if (error && !error.message.includes('already been registered') && !error.message.includes('already exists')) {
    console.error(`  ✗ auth user ${email}:`, error.message);
  } else {
    console.log(`  ✓ auth user: ${email}`);
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n=== Seeding Supabase ===\n');

  // ── 1. Auth users ──────────────────────────────────────────────────────────
  console.log('1. Creating auth users…');
  const authUsers = [
    { id: 'a1000000-0000-0000-0000-000000000001', email: 'amara@authenticarts.com',  password: 'artist123', name: 'Amara Osei',        role: 'artist'   },
    { id: 'a1000000-0000-0000-0000-000000000002', email: 'kwame@authenticarts.com',  password: 'artist123', name: 'Kwame Mensah',      role: 'artist'   },
    { id: 'a1000000-0000-0000-0000-000000000003', email: 'zara@authenticarts.com',   password: 'artist123', name: 'Zara Ndlovu',       role: 'artist'   },
    { id: 'c1000000-0000-0000-0000-000000000001', email: 'james@example.com',        password: 'user123',   name: 'James Kariuki',     role: 'customer' },
    { id: 'c1000000-0000-0000-0000-000000000002', email: 'aisha@example.com',        password: 'user123',   name: 'Aisha Bello',       role: 'customer' },
    { id: 'c1000000-0000-0000-0000-000000000003', email: 'tendai@example.com',       password: 'user123',   name: 'Tendai Moyo',       role: 'customer' },
    { id: 'c1000000-0000-0000-0000-000000000004', email: 'fatima@example.com',       password: 'user123',   name: 'Fatima Al-Hassan',  role: 'customer' },
    { id: 'c1000000-0000-0000-0000-000000000005', email: 'bongani@example.com',      password: 'user123',   name: 'Bongani Dlamini',   role: 'customer' },
    { id: 'adm00000-0000-0000-0000-000000000001', email: 'admin@authenticarts.com',  password: 'admin123',  name: 'Dr. Chioma Eze',    role: 'admin'    },
  ];
  for (const u of authUsers) await seedAuthUser(u);

  // ── 2. Profiles ────────────────────────────────────────────────────────────
  console.log('\n2. Upserting profiles…');
  await upsert('profiles', [
    { id: 'a1000000-0000-0000-0000-000000000001', email: 'amara@authenticarts.com', name: 'Amara Osei',       role: 'artist',   avatar_url: 'https://picsum.photos/seed/amara/200/200',   location: 'Accra, Ghana',              join_date: '2021-03-15', bio: 'Ghanaian-born contemporary painter exploring identity, migration, and belonging.', specialties: ['Paintings','Mixed Media'], verified: true,  total_sales: 48, total_earnings: 124800, wallet_balance: 18750, withdrawn: 106050, followers: 3420, portfolio_total_works: 24, portfolio_sold: 18, portfolio_available: 6,  preferred_styles: [], is_first_time_buyer: false },
    { id: 'a1000000-0000-0000-0000-000000000002', email: 'kwame@authenticarts.com', name: 'Kwame Mensah',     role: 'artist',   avatar_url: 'https://picsum.photos/seed/kwame/200/200',   location: 'Nairobi, Kenya',            join_date: '2020-08-22', bio: 'Digital artist and sculptor merging traditional African forms with digital techniques.', specialties: ['Sculptures','Digital Art'], verified: true,  total_sales: 62, total_earnings: 198400, wallet_balance: 22300, withdrawn: 176100, followers: 5100, portfolio_total_works: 31, portfolio_sold: 25, portfolio_available: 6,  preferred_styles: [], is_first_time_buyer: false },
    { id: 'a1000000-0000-0000-0000-000000000003', email: 'zara@authenticarts.com',  name: 'Zara Ndlovu',      role: 'artist',   avatar_url: 'https://picsum.photos/seed/zara/200/200',    location: 'Cape Town, South Africa',   join_date: '2022-01-10', bio: 'Fine art photographer capturing the raw beauty of everyday African life.',          specialties: ['Photography','Mixed Media'], verified: true,  total_sales: 35, total_earnings: 87500,  wallet_balance: 14200, withdrawn: 73300,  followers: 2780, portfolio_total_works: 18, portfolio_sold: 12, portfolio_available: 6,  preferred_styles: [], is_first_time_buyer: false },
    { id: 'c1000000-0000-0000-0000-000000000001', email: 'james@example.com',       name: 'James Kariuki',    role: 'customer', avatar_url: 'https://picsum.photos/seed/james/200/200',   location: 'Nairobi, Kenya',            join_date: '2022-05-10', bio: null, specialties: [], verified: false, total_sales: 0, total_earnings: 0, wallet_balance: 0, withdrawn: 0, followers: 0, portfolio_total_works: 0, portfolio_sold: 0, portfolio_available: 0, preferred_styles: ['Contemporary','Abstract'],                   is_first_time_buyer: false },
    { id: 'c1000000-0000-0000-0000-000000000002', email: 'aisha@example.com',       name: 'Aisha Bello',      role: 'customer', avatar_url: 'https://picsum.photos/seed/aisha/200/200',   location: 'Lagos, Nigeria',            join_date: '2022-11-30', bio: null, specialties: [], verified: false, total_sales: 0, total_earnings: 0, wallet_balance: 0, withdrawn: 0, followers: 0, portfolio_total_works: 0, portfolio_sold: 0, portfolio_available: 0, preferred_styles: ['Photography','Fine Art'],                    is_first_time_buyer: false },
    { id: 'c1000000-0000-0000-0000-000000000003', email: 'tendai@example.com',      name: 'Tendai Moyo',      role: 'customer', avatar_url: 'https://picsum.photos/seed/tendai/200/200',  location: 'Harare, Zimbabwe',          join_date: '2023-02-14', bio: null, specialties: [], verified: false, total_sales: 0, total_earnings: 0, wallet_balance: 0, withdrawn: 0, followers: 0, portfolio_total_works: 0, portfolio_sold: 0, portfolio_available: 0, preferred_styles: ['Paintings','Expressionist'],                 is_first_time_buyer: false },
    { id: 'c1000000-0000-0000-0000-000000000004', email: 'fatima@example.com',      name: 'Fatima Al-Hassan', role: 'customer', avatar_url: 'https://picsum.photos/seed/fatima/200/200',  location: 'Cairo, Egypt',              join_date: '2023-07-01', bio: null, specialties: [], verified: false, total_sales: 0, total_earnings: 0, wallet_balance: 0, withdrawn: 0, followers: 0, portfolio_total_works: 0, portfolio_sold: 0, portfolio_available: 0, preferred_styles: ['Sculptures','Traditional Contemporary'],     is_first_time_buyer: true  },
    { id: 'c1000000-0000-0000-0000-000000000005', email: 'bongani@example.com',     name: 'Bongani Dlamini',  role: 'customer', avatar_url: 'https://picsum.photos/seed/bongani/200/200', location: 'Johannesburg, South Africa',join_date: '2023-04-22', bio: null, specialties: [], verified: false, total_sales: 0, total_earnings: 0, wallet_balance: 0, withdrawn: 0, followers: 0, portfolio_total_works: 0, portfolio_sold: 0, portfolio_available: 0, preferred_styles: ['Digital Art','Abstract'],                    is_first_time_buyer: false },
    { id: 'adm00000-0000-0000-0000-000000000001', email: 'admin@authenticarts.com', name: 'Dr. Chioma Eze',   role: 'admin',    avatar_url: 'https://picsum.photos/seed/chioma/200/200',  location: null,                        join_date: '2020-01-01', bio: null, specialties: [], verified: false, total_sales: 0, total_earnings: 0, wallet_balance: 0, withdrawn: 0, followers: 0, portfolio_total_works: 0, portfolio_sold: 0, portfolio_available: 0, preferred_styles: [],                                            is_first_time_buyer: false },
  ]);

  // ── 3. Artworks ────────────────────────────────────────────────────────────
  console.log('\n3. Upserting artworks…');
  await upsert('artworks', [
    { id: 'a0000001-0000-0000-0000-000000000001', artist_id: 'a1000000-0000-0000-0000-000000000001', artist_name: 'Amara Osei',   title: 'Golden Horizons',       description: 'A breathtaking exploration of light and landscape, capturing the moment the African sun meets the earth.',         category: 'Paintings',    style: 'Contemporary',          medium: 'Oil on linen canvas',                      dimensions: '120cm x 90cm', year: 2023, origin: 'Created in Accra, Ghana. Materials sourced locally. Painted on hand-stretched linen canvas.', authenticity: 'Certificate of Authenticity #AA-2023-001. Signed and dated on reverse.', inspiration: 'Inspired by early morning walks along the Volta River.', tags: ['landscape','light','africa','oil painting'],   alt_text: 'An oil painting titled Golden Horizons featuring a vibrant sunrise over the African landscape.', price: 2800, original_price: 2800, quantity: 1, images: ['https://picsum.photos/seed/goldenhorizons/800/600','https://picsum.photos/seed/goldenhorizons2/800/600','https://picsum.photos/seed/goldenhorizons3/800/600'], status: 'available', featured: true,  best_seller: true,  sales: 0, average_rating: 4.8, review_count: 12 },
    { id: 'a0000001-0000-0000-0000-000000000002', artist_id: 'a1000000-0000-0000-0000-000000000001', artist_name: 'Amara Osei',   title: 'Ancestral Echoes',      description: 'A deeply personal work exploring the connection between present-day Ghanaians and their ancestral heritage.',    category: 'Paintings',    style: 'Abstract',              medium: 'Acrylic and gold leaf on canvas',           dimensions: '100cm x 80cm', year: 2023, origin: 'Studio of Amara Osei, Accra, Ghana.',                                                          authenticity: 'Certificate of Authenticity #AA-2023-002. Signed and dated on reverse.', inspiration: 'Drawn from oral histories passed down through generations of the Osei family.', tags: ['abstract','heritage','symbols','gold leaf'],   alt_text: 'An abstract acrylic painting with gold leaf titled Ancestral Echoes.',                          price: 3500, original_price: 3500, quantity: 1, images: ['https://picsum.photos/seed/ancestral/800/600','https://picsum.photos/seed/ancestral2/800/600'],   status: 'available', featured: true,  best_seller: false, sales: 0, average_rating: 4.9, review_count: 8  },
    { id: 'a0000001-0000-0000-0000-000000000003', artist_id: 'a1000000-0000-0000-0000-000000000002', artist_name: 'Kwame Mensah', title: 'Urban Rhythms',         description: "A dynamic digital composition capturing the energy and chaos of Nairobi's streets.",                              category: 'Digital Art',  style: 'Contemporary',          medium: 'Digital illustration, archival print',     dimensions: '4000x3000px (print up to A1)', year: 2023, origin: 'Created digitally in Nairobi, Kenya.',                              authenticity: 'NFT-backed Certificate #KM-2023-014. Edition 3/5.',                      inspiration: "The chaotic beauty of Nairobi's CBD during rush hour.",                        tags: ['digital','urban','geometric','nairobi'],       alt_text: 'A contemporary digital illustration print titled Urban Rhythms.',               price: 950,  original_price: 950,  quantity: 5, images: ['https://picsum.photos/seed/urbanrhythms/800/600','https://picsum.photos/seed/urbanrhythms2/800/600'], status: 'available', featured: true,  best_seller: true,  sales: 3, average_rating: 4.7, review_count: 15 },
    { id: 'a0000001-0000-0000-0000-000000000004', artist_id: 'a1000000-0000-0000-0000-000000000002', artist_name: 'Kwame Mensah', title: "The Weaver's Song",     description: 'A stunning bronze sculpture depicting a woman weaving, celebrating the tradition of African textile arts.',        category: 'Sculptures',   style: 'Traditional Contemporary', medium: 'Bronze with patina',                       dimensions: '45cm H x 28cm W x 22cm D', year: 2022, origin: 'Cast at Mensah Foundry, Nairobi, Kenya.',                               authenticity: 'Certificate of Authenticity #KM-2023-008. Unique cast. Signed base.',    inspiration: "Dedicated to Kwame's grandmother, a master weaver.",                          tags: ['sculpture','bronze','weaving','tradition','figurative'], alt_text: "A bronze sculpture with patina titled The Weaver's Song.", price: 6200, original_price: 6200, quantity: 1, images: ['https://picsum.photos/seed/weaversong/800/600','https://picsum.photos/seed/weaversong2/800/600','https://picsum.photos/seed/weaversong3/800/600'], status: 'available', featured: true,  best_seller: true,  sales: 0, average_rating: 5.0, review_count: 6  },
    { id: 'a0000001-0000-0000-0000-000000000005', artist_id: 'a1000000-0000-0000-0000-000000000003', artist_name: 'Zara Ndlovu',  title: 'Solitude in Blue',      description: 'A hauntingly beautiful photograph of a lone figure against the vast expanse of the Atlantic Ocean.',                category: 'Photography',  style: 'Fine Art',              medium: 'Archival pigment print on Hahnemühle photo rag', dimensions: '90cm x 60cm',  year: 2022, origin: 'Photographed at Bloubergstrand, Cape Town, South Africa.',                    authenticity: 'Limited edition fine art print #ZN-2022-005. Edition 2/3. Hand-signed.', inspiration: 'The loneliness and freedom one feels standing at the edge of a continent.',   tags: ['photography','ocean','solitude','blue','fine art'], alt_text: 'A fine art photograph titled Solitude in Blue showing a lone figure on Cape Town beach.', price: 780,  original_price: 780,  quantity: 3, images: ['https://picsum.photos/seed/solitudeinblue/800/600','https://picsum.photos/seed/solitudeinblue2/800/600'], status: 'available', featured: false, best_seller: true,  sales: 2, average_rating: 4.6, review_count: 9  },
    { id: 'a0000001-0000-0000-0000-000000000006', artist_id: 'a1000000-0000-0000-0000-000000000003', artist_name: 'Zara Ndlovu',  title: 'Market Day, Lagos',     description: "An explosion of colour and life from Lagos's Balogun Market.",                                                    category: 'Photography',  style: 'Documentary',           medium: 'Archival pigment print on Fuji Crystal Archive', dimensions: '80cm x 60cm', year: 2022, origin: 'Photographed at Balogun Market, Lagos Island, Nigeria.',                   authenticity: 'Limited edition fine art print #ZN-2022-012. Edition 4/5. Hand-signed.', inspiration: 'The infectious energy of African markets.',                                   tags: ['photography','market','lagos','documentary','color'], alt_text: 'A documentary photograph titled Market Day, Lagos.', price: 620,  original_price: 620,  quantity: 5, images: ['https://picsum.photos/seed/marketday/800/600','https://picsum.photos/seed/marketday2/800/600'], status: 'available', featured: false, best_seller: false, sales: 4, average_rating: 4.5, review_count: 7  },
    { id: 'a0000001-0000-0000-0000-000000000007', artist_id: 'a1000000-0000-0000-0000-000000000001', artist_name: 'Amara Osei',   title: 'Fragments of Tomorrow', description: 'A large-scale mixed media work combining oil paint, collaged newspaper clippings, and textile fragments.',         category: 'Mixed Media',  style: 'Contemporary',          medium: 'Oil, collage, embroidery on canvas',        dimensions: '150cm x 110cm',year: 2023, origin: 'Created in Accra, Ghana.',                                                          authenticity: 'Certificate of Authenticity #AA-2023-007. Signed and dated.',             inspiration: 'The tension between preserving cultural memory and embracing an uncertain future.', tags: ['mixed media','collage','textile','contemporary','africa'], alt_text: 'A mixed media artwork titled Fragments of Tomorrow.', price: 4100, original_price: 4100, quantity: 1, images: ['https://picsum.photos/seed/fragments/800/600','https://picsum.photos/seed/fragments2/800/600'], status: 'available', featured: false, best_seller: false, sales: 0, average_rating: 4.9, review_count: 4  },
    { id: 'a0000001-0000-0000-0000-000000000008', artist_id: 'a1000000-0000-0000-0000-000000000002', artist_name: 'Kwame Mensah', title: 'Digital Savanna',       description: 'A mesmerizing digital artwork reimagining the African savanna through a cyberpunk lens.',                           category: 'Digital Art',  style: 'Abstract',              medium: 'Digital art, archival print',               dimensions: '5000x3750px (print up to A0)', year: 2023, origin: 'Created digitally in Nairobi, Kenya.',                              authenticity: 'NFT-backed Certificate #KM-2023-019. Edition 7/10.',                      inspiration: 'What if nature evolved alongside technology rather than being threatened by it?', tags: ['digital','savanna','wildlife','neon','cyberpunk'], alt_text: 'A digital artwork print titled Digital Savanna depicting animals in cyberpunk style.', price: 1200, original_price: 1200, quantity: 10, images: ['https://picsum.photos/seed/digitalsavanna/800/600','https://picsum.photos/seed/digitalsavanna2/800/600'], status: 'available', featured: false, best_seller: true,  sales: 7, average_rating: 4.8, review_count: 18 },
    { id: 'a0000001-0000-0000-0000-000000000009', artist_id: 'a1000000-0000-0000-0000-000000000002', artist_name: 'Kwame Mensah', title: 'Stone Sentinel',        description: 'A striking minimalist sculpture carved from Kenyan green marble.',                                                  category: 'Sculptures',   style: 'Minimalist',            medium: 'Kenyan green marble',                       dimensions: '60cm H x 20cm W x 20cm D', year: 2022, origin: 'Carved from Kenyan green marble sourced from Kisumu quarries.',             authenticity: 'Certificate of Authenticity #KM-2022-033. Unique piece. Signed base.',    inspiration: 'The silent watchfulness of ancient African stone monuments.',                 tags: ['sculpture','marble','minimalist','stone','kenya'], alt_text: 'A minimalist green marble sculpture titled Stone Sentinel.', price: 3800, original_price: 3800, quantity: 1, images: ['https://picsum.photos/seed/stonesentinel/800/600','https://picsum.photos/seed/stonesentinel2/800/600'], status: 'available', featured: false, best_seller: false, sales: 0, average_rating: 4.7, review_count: 3  },
    { id: 'a0000001-0000-0000-0000-000000000010', artist_id: 'a1000000-0000-0000-0000-000000000003', artist_name: 'Zara Ndlovu',  title: 'Rainforest Dreams',     description: 'An ethereal long-exposure photograph taken in the Daintree Rainforest.',                                          category: 'Photography',  style: 'Nature',                medium: 'Archival pigment print on Baryta paper',    dimensions: '100cm x 70cm', year: 2023, origin: 'Photographed in Daintree Rainforest, Queensland, during a residency trip.',     authenticity: 'Limited edition fine art print #ZN-2023-003. Edition 1/4. Hand-signed.', inspiration: 'The feeling of stepping back 65 million years when entering an ancient rainforest.', tags: ['photography','rainforest','nature','long exposure','mist'], alt_text: 'A long-exposure photograph titled Rainforest Dreams capturing misty green trees.', price: 890,  original_price: 890,  quantity: 4, images: ['https://picsum.photos/seed/rainforest/800/600','https://picsum.photos/seed/rainforest2/800/600'], status: 'available', featured: false, best_seller: false, sales: 1, average_rating: 4.8, review_count: 5  },
    { id: 'a0000001-0000-0000-0000-000000000011', artist_id: 'a1000000-0000-0000-0000-000000000001', artist_name: 'Amara Osei',   title: 'Fire Dance',            description: 'An energetic expressionist painting capturing the primal power of a traditional fire dance ceremony.',               category: 'Paintings',    style: 'Expressionist',         medium: 'Acrylic on canvas',                         dimensions: '90cm x 90cm',  year: 2023, origin: 'Painted in Accra, Ghana. Inspired by witnessing a Brekete fire ceremony.',     authenticity: 'Certificate of Authenticity #AA-2023-011. Signed and dated.',             inspiration: 'The electricity of a fire ceremony.',                                         tags: ['expressionist','fire','dance','ceremony','culture'], alt_text: 'An expressionist acrylic painting titled Fire Dance.', price: 2200, original_price: 2200, quantity: 1, images: ['https://picsum.photos/seed/firedance/800/600','https://picsum.photos/seed/firedance2/800/600'], status: 'available', featured: false, best_seller: false, sales: 0, average_rating: 4.6, review_count: 6  },
    { id: 'a0000001-0000-0000-0000-000000000012', artist_id: 'a1000000-0000-0000-0000-000000000002', artist_name: 'Kwame Mensah', title: 'Neon Pulse',            description: 'A hypnotic digital abstract composition pulsing with neon energy.',                                                 category: 'Digital Art',  style: 'Abstract',              medium: 'Digital art, archival print',               dimensions: '4500x4500px (square format)', year: 2023, origin: 'Created digitally. Available as archival print or canvas.',                 authenticity: 'NFT-backed Certificate #KM-2023-024. Edition 5/8.',                      inspiration: 'The intersection of biological and artificial neural networks.',               tags: ['digital','neon','abstract','neural','AI'],     alt_text: 'An abstract digital illustration print titled Neon Pulse.',             price: 750,  original_price: 750,  quantity: 8, images: ['https://picsum.photos/seed/neonpulse/800/600','https://picsum.photos/seed/neonpulse2/800/600'], status: 'available', featured: false, best_seller: false, sales: 5, average_rating: 4.5, review_count: 11 },
    { id: 'a0000001-0000-0000-0000-000000000013', artist_id: 'a1000000-0000-0000-0000-000000000001', artist_name: 'Amara Osei',   title: 'Kente Reimagined',      description: 'A stunning mixed media work incorporating real strips of Kente cloth woven into the painted surface.',              category: 'Mixed Media',  style: 'Traditional Contemporary', medium: 'Oil paint, genuine Kente cloth on canvas', dimensions: '110cm x 85cm', year: 2023, origin: 'Created in collaboration with master Kente weavers in Bonwire, Ashanti Region, Ghana.', authenticity: 'Certificate of Authenticity #AA-2023-015. Signed and dated.', inspiration: 'Honouring the Kente tradition in the contemporary art world.', tags: ['mixed media','kente','textile','ghana','heritage'], alt_text: 'A mixed media work titled Kente Reimagined weaving Kente cloth into oil paint.', price: 3200, original_price: 3200, quantity: 1, images: ['https://picsum.photos/seed/kente/800/600','https://picsum.photos/seed/kente2/800/600'], status: 'available', featured: false, best_seller: false, sales: 0, average_rating: 4.9, review_count: 4  },
  ]);

  // ── 4. Reviews ─────────────────────────────────────────────────────────────
  console.log('\n4. Upserting reviews…');
  await upsert('reviews', [
    { id: 'e0000001-0000-0000-0000-000000000001', artwork_id: 'a0000001-0000-0000-0000-000000000001', user_id: 'c1000000-0000-0000-0000-000000000001', user_name: 'James Kariuki',    user_avatar: 'https://picsum.photos/seed/james/200/200',   rating: 5, comment: 'Absolutely magnificent. The gold tones are even more stunning in person.',          verified: true, created_at: '2023-09-15T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000002', artwork_id: 'a0000001-0000-0000-0000-000000000001', user_id: 'c1000000-0000-0000-0000-000000000002', user_name: 'Aisha Bello',      user_avatar: 'https://picsum.photos/seed/aisha/200/200',   rating: 5, comment: "Amara's work is unparalleled. This painting now hangs in my living room.",         verified: true, created_at: '2023-10-02T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000003', artwork_id: 'a0000001-0000-0000-0000-000000000001', user_id: 'c1000000-0000-0000-0000-000000000003', user_name: 'Tendai Moyo',      user_avatar: 'https://picsum.photos/seed/tendai/200/200',  rating: 5, comment: 'The texture and depth of this painting is extraordinary.',                         verified: true, created_at: '2023-10-18T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000004', artwork_id: 'a0000001-0000-0000-0000-000000000003', user_id: 'c1000000-0000-0000-0000-000000000001', user_name: 'James Kariuki',    user_avatar: 'https://picsum.photos/seed/james/200/200',   rating: 5, comment: 'Urban Rhythms captures everything I love about Nairobi. The print quality is exceptional.', verified: true, created_at: '2023-08-20T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000005', artwork_id: 'a0000001-0000-0000-0000-000000000003', user_id: 'c1000000-0000-0000-0000-000000000002', user_name: 'Aisha Bello',      user_avatar: 'https://picsum.photos/seed/aisha/200/200',   rating: 4, comment: 'Great piece with incredible energy. Shipping took a bit longer than expected.',      verified: true, created_at: '2023-09-05T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000006', artwork_id: 'a0000001-0000-0000-0000-000000000004', user_id: 'c1000000-0000-0000-0000-000000000003', user_name: 'Tendai Moyo',      user_avatar: 'https://picsum.photos/seed/tendai/200/200',  rating: 5, comment: "The Weaver's Song is one of the most beautiful sculptures I have ever seen.",      verified: true, created_at: '2023-11-01T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000007', artwork_id: 'a0000001-0000-0000-0000-000000000005', user_id: 'c1000000-0000-0000-0000-000000000002', user_name: 'Aisha Bello',      user_avatar: 'https://picsum.photos/seed/aisha/200/200',   rating: 5, comment: "Zara's photography is poetic. The print quality on the Hahnemühle paper is exceptional.", verified: true, created_at: '2023-07-14T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000008', artwork_id: 'a0000001-0000-0000-0000-000000000008', user_id: 'c1000000-0000-0000-0000-000000000005', user_name: 'Bongani Dlamini',  user_avatar: 'https://picsum.photos/seed/bongani/200/200', rating: 5, comment: "Digital Savanna is visionary. It perfectly captures the future I hope we're building.", verified: true, created_at: '2023-10-25T00:00:00Z' },
    { id: 'e0000001-0000-0000-0000-000000000009', artwork_id: 'a0000001-0000-0000-0000-000000000008', user_id: 'c1000000-0000-0000-0000-000000000001', user_name: 'James Kariuki',    user_avatar: 'https://picsum.photos/seed/james/200/200',   rating: 5, comment: 'Kwame is a genius. This piece looks incredible as a large canvas print.',              verified: true, created_at: '2023-11-10T00:00:00Z' },
  ], 'artwork_id, user_id');

  // ── 5. Orders + purchased_artworks ─────────────────────────────────────────
  console.log('\n5. Upserting orders…');
  await upsert('orders', [
    { id: '0d000001-0000-0000-0000-000000000001', customer_id: 'c1000000-0000-0000-0000-000000000001', status: 'delivered', payment_method: 'mpesa',  subtotal: 1900, discount_amount: 0, total: 1900, first_time_discount_applied: false, created_at: '2023-08-01T00:00:00Z' },
    { id: '0d000001-0000-0000-0000-000000000002', customer_id: 'c1000000-0000-0000-0000-000000000002', status: 'delivered', payment_method: 'paypal', subtotal: 1400, discount_amount: 0, total: 1400, first_time_discount_applied: false, created_at: '2023-07-01T00:00:00Z' },
    { id: '0d000001-0000-0000-0000-000000000003', customer_id: 'c1000000-0000-0000-0000-000000000003', status: 'delivered', payment_method: 'mpesa',  subtotal: 2200, discount_amount: 0, total: 2200, first_time_discount_applied: false, created_at: '2023-10-01T00:00:00Z' },
    { id: '0d000001-0000-0000-0000-000000000004', customer_id: 'c1000000-0000-0000-0000-000000000005', status: 'delivered', payment_method: 'paypal', subtotal: 750,  discount_amount: 0, total: 750,  first_time_discount_applied: false, created_at: '2023-10-20T00:00:00Z' },
  ]);

  console.log('\n6. Upserting purchased_artworks…');
  await upsert('purchased_artworks', [
    { customer_id: 'c1000000-0000-0000-0000-000000000001', artwork_id: 'a0000001-0000-0000-0000-000000000003', order_id: '0d000001-0000-0000-0000-000000000001', purchased_at: '2023-08-20T00:00:00Z' },
    { customer_id: 'c1000000-0000-0000-0000-000000000001', artwork_id: 'a0000001-0000-0000-0000-000000000008', order_id: '0d000001-0000-0000-0000-000000000001', purchased_at: '2023-11-10T00:00:00Z' },
    { customer_id: 'c1000000-0000-0000-0000-000000000002', artwork_id: 'a0000001-0000-0000-0000-000000000005', order_id: '0d000001-0000-0000-0000-000000000002', purchased_at: '2023-07-14T00:00:00Z' },
    { customer_id: 'c1000000-0000-0000-0000-000000000002', artwork_id: 'a0000001-0000-0000-0000-000000000006', order_id: '0d000001-0000-0000-0000-000000000002', purchased_at: '2023-09-05T00:00:00Z' },
    { customer_id: 'c1000000-0000-0000-0000-000000000003', artwork_id: 'a0000001-0000-0000-0000-000000000011', order_id: '0d000001-0000-0000-0000-000000000003', purchased_at: '2023-10-01T00:00:00Z' },
    { customer_id: 'c1000000-0000-0000-0000-000000000005', artwork_id: 'a0000001-0000-0000-0000-000000000012', order_id: '0d000001-0000-0000-0000-000000000004', purchased_at: '2023-10-25T00:00:00Z' },
  ], 'customer_id, artwork_id');

  // ── 7. Sales analytics ─────────────────────────────────────────────────────
  console.log('\n7. Upserting sales_analytics…');
  const analyticsRows = [];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const raw = {
    'a1000000-0000-0000-0000-000000000001': [5600,8400,14000,11200,16800,22400,14000,19600,11200,8400,5600,2800].map((rev, i) => ({ sales: [2,3,5,4,6,8,5,7,4,3,2,1][i], revenue: rev })),
    'a1000000-0000-0000-0000-000000000002': [9200,11500,18400,13800,20700,25300,16100,18400,11500,9200,6900,4600].map((rev, i) => ({ sales: [4,5,8,6,9,11,7,8,5,4,3,2][i], revenue: rev })),
    'a1000000-0000-0000-0000-000000000003': [4400,6600,8800,6600,11000,13200,8800,11000,6600,4400,4400,2200].map((rev, i) => ({ sales: [2,3,4,3,5,6,4,5,3,2,2,1][i], revenue: rev })),
  };

  for (const [artistId, months] of Object.entries(raw)) {
    months.forEach((m, i) => {
      analyticsRows.push({ artist_id: artistId, month: monthNames[i], month_num: i + 1, year: 2023, sales: m.sales, revenue: m.revenue });
    });
  }
  await upsert('sales_analytics', analyticsRows, 'artist_id, year, month_num');

  console.log('\n=== Seed complete ===\n');
}

main().catch(err => { console.error(err); process.exit(1); });
