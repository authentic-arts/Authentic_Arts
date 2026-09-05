/**
 * seed_supabase.mjs  –  run with:  node scripts/seed_supabase.mjs
 *
 * Reads credentials from .env in the project root.
 * Requires SUPABASE_SERVICE_ROLE_KEY (get it from
 * Supabase Dashboard → Project Settings → API → service_role secret).
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ── Load .env manually (no dotenv dependency needed) ────────────────────────
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, '../.env');
const envVars = {};
try {
  readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [k, ...rest] = line.split('=');
    if (k && !k.startsWith('#')) envVars[k.trim()] = rest.join('=').trim();
  });
} catch { /* .env not found – rely on process.env */ }

const SUPABASE_URL  = process.env.SUPABASE_URL  || envVars['VITE_SUPABASE_URL'];
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_ROLE_KEY || envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('\n❌  Missing credentials.\n');
  console.error('  Set SUPABASE_SERVICE_ROLE_KEY in your .env file.');
  console.error('  Get it from: Supabase Dashboard → Project Settings → API → service_role\n');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Helper ───────────────────────────────────────────────────────────────────
async function upsert(table, rows, conflict = 'id') {
  if (!rows.length) return;
  const { error } = await supabase
    .from(table)
    .upsert(rows, { onConflict: conflict, ignoreDuplicates: true });
  if (error) console.error(`  ✗ ${table}:`, error.message);
  else       console.log(`  ✓ ${table} – ${rows.length} rows`);
}

async function createAuthUser({ id, email, password, name, role }) {
  const { error } = await supabase.auth.admin.createUser({
    id, email, password,
    email_confirm: true,
    user_metadata: { name, role },
  });
  if (error && !/already (been registered|exists)/i.test(error.message)) {
    console.error(`  ✗ auth ${email}:`, error.message);
  } else {
    console.log(`  ✓ auth user: ${email}`);
  }
}

// ── Data ─────────────────────────────────────────────────────────────────────
const AUTH_USERS = [
  { id: 'a1000000-0000-0000-0000-000000000001', email: 'amara@authenticarts.com', password: 'artist123', name: 'Amara Osei',       role: 'artist'   },
  { id: 'a1000000-0000-0000-0000-000000000002', email: 'kwame@authenticarts.com', password: 'artist123', name: 'Kwame Mensah',     role: 'artist'   },
  { id: 'a1000000-0000-0000-0000-000000000003', email: 'zara@authenticarts.com',  password: 'artist123', name: 'Zara Ndlovu',      role: 'artist'   },
  { id: 'c1000000-0000-0000-0000-000000000001', email: 'james@example.com',       password: 'user123',   name: 'James Kariuki',    role: 'customer' },
  { id: 'c1000000-0000-0000-0000-000000000002', email: 'aisha@example.com',       password: 'user123',   name: 'Aisha Bello',      role: 'customer' },
  { id: 'c1000000-0000-0000-0000-000000000003', email: 'tendai@example.com',      password: 'user123',   name: 'Tendai Moyo',      role: 'customer' },
  { id: 'c1000000-0000-0000-0000-000000000004', email: 'fatima@example.com',      password: 'user123',   name: 'Fatima Al-Hassan', role: 'customer' },
  { id: 'c1000000-0000-0000-0000-000000000005', email: 'bongani@example.com',     password: 'user123',   name: 'Bongani Dlamini',  role: 'customer' },
  { id: 'adm00000-0000-0000-0000-000000000001', email: 'admin@authenticarts.com', password: 'admin123',  name: 'Dr. Chioma Eze',   role: 'admin'    },
];

const PROFILES = [
  { id:'a1000000-0000-0000-0000-000000000001', email:'amara@authenticarts.com', name:'Amara Osei',       role:'artist',   avatar_url:'https://picsum.photos/seed/amara/200/200',   location:'Accra, Ghana',               join_date:'2021-03-15', bio:'Ghanaian-born contemporary painter exploring identity, migration, and belonging.',          specialties:['Paintings','Mixed Media'],    verified:true,  total_sales:48, total_earnings:124800, wallet_balance:18750, withdrawn:106050, followers:3420, portfolio_total_works:24, portfolio_sold:18, portfolio_available:6,  preferred_styles:[],                              is_first_time_buyer:false },
  { id:'a1000000-0000-0000-0000-000000000002', email:'kwame@authenticarts.com', name:'Kwame Mensah',     role:'artist',   avatar_url:'https://picsum.photos/seed/kwame/200/200',   location:'Nairobi, Kenya',             join_date:'2020-08-22', bio:'Digital artist and sculptor merging traditional African forms with digital techniques.', specialties:['Sculptures','Digital Art'],   verified:true,  total_sales:62, total_earnings:198400, wallet_balance:22300, withdrawn:176100, followers:5100, portfolio_total_works:31, portfolio_sold:25, portfolio_available:6,  preferred_styles:[],                              is_first_time_buyer:false },
  { id:'a1000000-0000-0000-0000-000000000003', email:'zara@authenticarts.com',  name:'Zara Ndlovu',      role:'artist',   avatar_url:'https://picsum.photos/seed/zara/200/200',    location:'Cape Town, South Africa',    join_date:'2022-01-10', bio:'Fine art photographer capturing the raw beauty of everyday African life.',                specialties:['Photography','Mixed Media'],  verified:true,  total_sales:35, total_earnings:87500,  wallet_balance:14200, withdrawn:73300,  followers:2780, portfolio_total_works:18, portfolio_sold:12, portfolio_available:6,  preferred_styles:[],                              is_first_time_buyer:false },
  { id:'c1000000-0000-0000-0000-000000000001', email:'james@example.com',       name:'James Kariuki',    role:'customer', avatar_url:'https://picsum.photos/seed/james/200/200',   location:'Nairobi, Kenya',             join_date:'2022-05-10', bio:null, specialties:[], verified:false, total_sales:0, total_earnings:0, wallet_balance:0, withdrawn:0, followers:0, portfolio_total_works:0, portfolio_sold:0, portfolio_available:0, preferred_styles:['Contemporary','Abstract'],      is_first_time_buyer:false },
  { id:'c1000000-0000-0000-0000-000000000002', email:'aisha@example.com',       name:'Aisha Bello',      role:'customer', avatar_url:'https://picsum.photos/seed/aisha/200/200',   location:'Lagos, Nigeria',             join_date:'2022-11-30', bio:null, specialties:[], verified:false, total_sales:0, total_earnings:0, wallet_balance:0, withdrawn:0, followers:0, portfolio_total_works:0, portfolio_sold:0, portfolio_available:0, preferred_styles:['Photography','Fine Art'],        is_first_time_buyer:false },
  { id:'c1000000-0000-0000-0000-000000000003', email:'tendai@example.com',      name:'Tendai Moyo',      role:'customer', avatar_url:'https://picsum.photos/seed/tendai/200/200',  location:'Harare, Zimbabwe',           join_date:'2023-02-14', bio:null, specialties:[], verified:false, total_sales:0, total_earnings:0, wallet_balance:0, withdrawn:0, followers:0, portfolio_total_works:0, portfolio_sold:0, portfolio_available:0, preferred_styles:['Paintings','Expressionist'],     is_first_time_buyer:false },
  { id:'c1000000-0000-0000-0000-000000000004', email:'fatima@example.com',      name:'Fatima Al-Hassan', role:'customer', avatar_url:'https://picsum.photos/seed/fatima/200/200',  location:'Cairo, Egypt',               join_date:'2023-07-01', bio:null, specialties:[], verified:false, total_sales:0, total_earnings:0, wallet_balance:0, withdrawn:0, followers:0, portfolio_total_works:0, portfolio_sold:0, portfolio_available:0, preferred_styles:['Sculptures','Traditional Contemporary'], is_first_time_buyer:true  },
  { id:'c1000000-0000-0000-0000-000000000005', email:'bongani@example.com',     name:'Bongani Dlamini',  role:'customer', avatar_url:'https://picsum.photos/seed/bongani/200/200', location:'Johannesburg, South Africa', join_date:'2023-04-22', bio:null, specialties:[], verified:false, total_sales:0, total_earnings:0, wallet_balance:0, withdrawn:0, followers:0, portfolio_total_works:0, portfolio_sold:0, portfolio_available:0, preferred_styles:['Digital Art','Abstract'],        is_first_time_buyer:false },
  { id:'adm00000-0000-0000-0000-000000000001', email:'admin@authenticarts.com', name:'Dr. Chioma Eze',   role:'admin',    avatar_url:'https://picsum.photos/seed/chioma/200/200',  location:null,                         join_date:'2020-01-01', bio:null, specialties:[], verified:false, total_sales:0, total_earnings:0, wallet_balance:0, withdrawn:0, followers:0, portfolio_total_works:0, portfolio_sold:0, portfolio_available:0, preferred_styles:[],                              is_first_time_buyer:false },
];

const A1 = 'a1000000-0000-0000-0000-000000000001';
const A2 = 'a1000000-0000-0000-0000-000000000002';
const A3 = 'a1000000-0000-0000-0000-000000000003';

const ARTWORKS = [
  { id:'a0000001-0000-0000-0000-000000000001', artist_id:A1, artist_name:'Amara Osei',   title:'Golden Horizons',       category:'Paintings',   style:'Contemporary',          medium:'Oil on linen canvas',                        dimensions:'120cm x 90cm',            year:2023, price:2800, original_price:2800, quantity:1,  status:'available', featured:true,  best_seller:true,  sales:0, average_rating:4.8, review_count:12, origin:'Created in Accra, Ghana.', authenticity:'Certificate of Authenticity #AA-2023-001. Signed and dated on reverse.', inspiration:'Inspired by early morning walks along the Volta River.', description:'A breathtaking exploration of light and landscape, capturing the moment the African sun meets the earth.', tags:['landscape','light','africa','oil painting'],          alt_text:'An oil painting titled Golden Horizons.',                   images:['https://picsum.photos/seed/goldenhorizons/800/600','https://picsum.photos/seed/goldenhorizons2/800/600','https://picsum.photos/seed/goldenhorizons3/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000002', artist_id:A1, artist_name:'Amara Osei',   title:'Ancestral Echoes',      category:'Paintings',   style:'Abstract',              medium:'Acrylic and gold leaf on canvas',             dimensions:'100cm x 80cm',            year:2023, price:3500, original_price:3500, quantity:1,  status:'available', featured:true,  best_seller:false, sales:0, average_rating:4.9, review_count:8,  origin:'Studio of Amara Osei, Accra, Ghana.', authenticity:'Certificate of Authenticity #AA-2023-002.', inspiration:'Drawn from oral histories passed down through generations of the Osei family.', description:'A deeply personal work exploring the connection between present-day Ghanaians and their ancestral heritage.', tags:['abstract','heritage','symbols','gold leaf'],          alt_text:'An abstract acrylic painting titled Ancestral Echoes.',    images:['https://picsum.photos/seed/ancestral/800/600','https://picsum.photos/seed/ancestral2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000003', artist_id:A2, artist_name:'Kwame Mensah', title:'Urban Rhythms',         category:'Digital Art', style:'Contemporary',          medium:'Digital illustration, archival print',       dimensions:'4000x3000px',             year:2023, price:950,  original_price:950,  quantity:5,  status:'available', featured:true,  best_seller:true,  sales:3, average_rating:4.7, review_count:15, origin:'Created digitally in Nairobi, Kenya.', authenticity:'NFT-backed Certificate #KM-2023-014. Edition 3/5.', inspiration:"The chaotic beauty of Nairobi's CBD during rush hour.", description:"A dynamic digital composition capturing the energy and chaos of Nairobi's streets.", tags:['digital','urban','geometric','nairobi'],             alt_text:'A digital illustration print titled Urban Rhythms.',       images:['https://picsum.photos/seed/urbanrhythms/800/600','https://picsum.photos/seed/urbanrhythms2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000004', artist_id:A2, artist_name:'Kwame Mensah', title:"The Weaver's Song",     category:'Sculptures',  style:'Traditional Contemporary', medium:'Bronze with patina',                       dimensions:'45cm H x 28cm W x 22cm D',year:2022, price:6200, original_price:6200, quantity:1,  status:'available', featured:true,  best_seller:true,  sales:0, average_rating:5.0, review_count:6,  origin:'Cast at Mensah Foundry, Nairobi, Kenya.', authenticity:'Certificate of Authenticity #KM-2023-008. Unique cast.', inspiration:"Dedicated to Kwame's grandmother, a master weaver.", description:'A stunning bronze sculpture depicting a woman weaving, celebrating African textile arts.', tags:['sculpture','bronze','weaving','tradition'],              alt_text:"A bronze sculpture titled The Weaver's Song.",              images:['https://picsum.photos/seed/weaversong/800/600','https://picsum.photos/seed/weaversong2/800/600','https://picsum.photos/seed/weaversong3/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000005', artist_id:A3, artist_name:'Zara Ndlovu',  title:'Solitude in Blue',      category:'Photography', style:'Fine Art',              medium:'Archival pigment print on Hahnemühle photo rag', dimensions:'90cm x 60cm',          year:2022, price:780,  original_price:780,  quantity:3,  status:'available', featured:false, best_seller:true,  sales:2, average_rating:4.6, review_count:9,  origin:'Photographed at Bloubergstrand, Cape Town.', authenticity:'Limited edition #ZN-2022-005. Edition 2/3. Hand-signed.', inspiration:'The loneliness and freedom standing at the edge of a continent.', description:'A hauntingly beautiful photograph of a lone figure against the vast expanse of the Atlantic Ocean.', tags:['photography','ocean','solitude','blue'],             alt_text:'A fine art photograph titled Solitude in Blue.',           images:['https://picsum.photos/seed/solitudeinblue/800/600','https://picsum.photos/seed/solitudeinblue2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000006', artist_id:A3, artist_name:'Zara Ndlovu',  title:'Market Day, Lagos',     category:'Photography', style:'Documentary',           medium:'Archival pigment print on Fuji Crystal Archive', dimensions:'80cm x 60cm',         year:2022, price:620,  original_price:620,  quantity:5,  status:'available', featured:false, best_seller:false, sales:4, average_rating:4.5, review_count:7,  origin:'Photographed at Balogun Market, Lagos Island, Nigeria.', authenticity:'Limited edition #ZN-2022-012. Edition 4/5.', inspiration:'The infectious energy of African markets.', description:"An explosion of colour and life from Lagos's Balogun Market.", tags:['photography','market','lagos','documentary'],           alt_text:'A documentary photograph titled Market Day, Lagos.',       images:['https://picsum.photos/seed/marketday/800/600','https://picsum.photos/seed/marketday2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000007', artist_id:A1, artist_name:'Amara Osei',   title:'Fragments of Tomorrow', category:'Mixed Media', style:'Contemporary',          medium:'Oil, collage, embroidery on canvas',         dimensions:'150cm x 110cm',           year:2023, price:4100, original_price:4100, quantity:1,  status:'available', featured:false, best_seller:false, sales:0, average_rating:4.9, review_count:4,  origin:'Created in Accra, Ghana.', authenticity:'Certificate of Authenticity #AA-2023-007.', inspiration:'The tension between preserving cultural memory and embracing an uncertain future.', description:'A large-scale mixed media work combining oil paint, collaged newspaper clippings, and textile fragments.', tags:['mixed media','collage','textile','africa'],            alt_text:'A mixed media artwork titled Fragments of Tomorrow.',      images:['https://picsum.photos/seed/fragments/800/600','https://picsum.photos/seed/fragments2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000008', artist_id:A2, artist_name:'Kwame Mensah', title:'Digital Savanna',       category:'Digital Art', style:'Abstract',              medium:'Digital art, archival print',                dimensions:'5000x3750px',             year:2023, price:1200, original_price:1200, quantity:10, status:'available', featured:false, best_seller:true,  sales:7, average_rating:4.8, review_count:18, origin:'Created digitally in Nairobi, Kenya.', authenticity:'NFT-backed Certificate #KM-2023-019. Edition 7/10.', inspiration:'What if nature evolved alongside technology?', description:'A mesmerizing digital artwork reimagining the African savanna through a cyberpunk lens.', tags:['digital','savanna','wildlife','neon','cyberpunk'],    alt_text:'A digital artwork titled Digital Savanna.',                images:['https://picsum.photos/seed/digitalsavanna/800/600','https://picsum.photos/seed/digitalsavanna2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000009', artist_id:A2, artist_name:'Kwame Mensah', title:'Stone Sentinel',        category:'Sculptures',  style:'Minimalist',            medium:'Kenyan green marble',                        dimensions:'60cm H x 20cm W x 20cm D',year:2022, price:3800, original_price:3800, quantity:1,  status:'available', featured:false, best_seller:false, sales:0, average_rating:4.7, review_count:3,  origin:'Carved from Kenyan green marble sourced from Kisumu quarries.', authenticity:'Certificate of Authenticity #KM-2022-033.', inspiration:'The silent watchfulness of ancient African stone monuments.', description:'A striking minimalist sculpture carved from Kenyan green marble.', tags:['sculpture','marble','minimalist','stone'],              alt_text:'A minimalist marble sculpture titled Stone Sentinel.',     images:['https://picsum.photos/seed/stonesentinel/800/600','https://picsum.photos/seed/stonesentinel2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000010', artist_id:A3, artist_name:'Zara Ndlovu',  title:'Rainforest Dreams',     category:'Photography', style:'Nature',                medium:'Archival pigment print on Baryta paper',     dimensions:'100cm x 70cm',            year:2023, price:890,  original_price:890,  quantity:4,  status:'available', featured:false, best_seller:false, sales:1, average_rating:4.8, review_count:5,  origin:'Photographed in Daintree Rainforest, Queensland.', authenticity:'Limited edition #ZN-2023-003. Edition 1/4.', inspiration:'The feeling of stepping back 65 million years.', description:'An ethereal long-exposure photograph taken in the Daintree Rainforest.', tags:['photography','rainforest','nature','mist'],            alt_text:'A long-exposure photograph titled Rainforest Dreams.',     images:['https://picsum.photos/seed/rainforest/800/600','https://picsum.photos/seed/rainforest2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000011', artist_id:A1, artist_name:'Amara Osei',   title:'Fire Dance',            category:'Paintings',   style:'Expressionist',         medium:'Acrylic on canvas',                          dimensions:'90cm x 90cm',             year:2023, price:2200, original_price:2200, quantity:1,  status:'available', featured:false, best_seller:false, sales:0, average_rating:4.6, review_count:6,  origin:'Painted in Accra, Ghana.', authenticity:'Certificate of Authenticity #AA-2023-011.', inspiration:'The electricity of a fire ceremony.', description:'An energetic expressionist painting capturing the primal power of a traditional fire dance ceremony.', tags:['expressionist','fire','dance','ceremony'],            alt_text:'An expressionist acrylic painting titled Fire Dance.',     images:['https://picsum.photos/seed/firedance/800/600','https://picsum.photos/seed/firedance2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000012', artist_id:A2, artist_name:'Kwame Mensah', title:'Neon Pulse',            category:'Digital Art', style:'Abstract',              medium:'Digital art, archival print',                dimensions:'4500x4500px',             year:2023, price:750,  original_price:750,  quantity:8,  status:'available', featured:false, best_seller:false, sales:5, average_rating:4.5, review_count:11, origin:'Created digitally.', authenticity:'NFT-backed Certificate #KM-2023-024. Edition 5/8.', inspiration:'The intersection of biological and artificial neural networks.', description:'A hypnotic digital abstract composition pulsing with neon energy.', tags:['digital','neon','abstract','neural','AI'],             alt_text:'An abstract digital print titled Neon Pulse.',             images:['https://picsum.photos/seed/neonpulse/800/600','https://picsum.photos/seed/neonpulse2/800/600'] },
  { id:'a0000001-0000-0000-0000-000000000013', artist_id:A1, artist_name:'Amara Osei',   title:'Kente Reimagined',      category:'Mixed Media', style:'Traditional Contemporary', medium:'Oil paint, genuine Kente cloth on canvas', dimensions:'110cm x 85cm',            year:2023, price:3200, original_price:3200, quantity:1,  status:'available', featured:false, best_seller:false, sales:0, average_rating:4.9, review_count:4,  origin:'Created with master Kente weavers in Bonwire, Ashanti Region, Ghana.', authenticity:'Certificate of Authenticity #AA-2023-015.', inspiration:'Honouring the Kente tradition in the contemporary art world.', description:'A stunning mixed media work incorporating real strips of Kente cloth woven into the painted surface.', tags:['mixed media','kente','textile','ghana'],              alt_text:'A mixed media work titled Kente Reimagined.',              images:['https://picsum.photos/seed/kente/800/600','https://picsum.photos/seed/kente2/800/600'] },
];

const C1='c1000000-0000-0000-0000-000000000001', C2='c1000000-0000-0000-0000-000000000002',
      C3='c1000000-0000-0000-0000-000000000003', C5='c1000000-0000-0000-0000-000000000005';

const REVIEWS = [
  { id:'e0000001-0000-0000-0000-000000000001', artwork_id:'a0000001-0000-0000-0000-000000000001', user_id:C1, user_name:'James Kariuki',   user_avatar:'https://picsum.photos/seed/james/200/200',   rating:5, comment:'Absolutely magnificent. The gold tones are even more stunning in person.',            verified:true, created_at:'2023-09-15T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000002', artwork_id:'a0000001-0000-0000-0000-000000000001', user_id:C2, user_name:'Aisha Bello',     user_avatar:'https://picsum.photos/seed/aisha/200/200',   rating:5, comment:"Amara's work is unparalleled. This painting now hangs in my living room.",          verified:true, created_at:'2023-10-02T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000003', artwork_id:'a0000001-0000-0000-0000-000000000001', user_id:C3, user_name:'Tendai Moyo',     user_avatar:'https://picsum.photos/seed/tendai/200/200',  rating:5, comment:'The texture and depth of this painting is extraordinary.',                          verified:true, created_at:'2023-10-18T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000004', artwork_id:'a0000001-0000-0000-0000-000000000003', user_id:C1, user_name:'James Kariuki',   user_avatar:'https://picsum.photos/seed/james/200/200',   rating:5, comment:'Urban Rhythms captures everything I love about Nairobi. The print quality is exceptional.', verified:true, created_at:'2023-08-20T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000005', artwork_id:'a0000001-0000-0000-0000-000000000003', user_id:C2, user_name:'Aisha Bello',     user_avatar:'https://picsum.photos/seed/aisha/200/200',   rating:4, comment:'Great piece with incredible energy. Shipping took a bit longer than expected.',        verified:true, created_at:'2023-09-05T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000006', artwork_id:'a0000001-0000-0000-0000-000000000004', user_id:C3, user_name:'Tendai Moyo',     user_avatar:'https://picsum.photos/seed/tendai/200/200',  rating:5, comment:"The Weaver's Song is one of the most beautiful sculptures I have ever seen.",        verified:true, created_at:'2023-11-01T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000007', artwork_id:'a0000001-0000-0000-0000-000000000005', user_id:C2, user_name:'Aisha Bello',     user_avatar:'https://picsum.photos/seed/aisha/200/200',   rating:5, comment:"Zara's photography is poetic. The print quality on the Hahnemühle paper is exceptional.", verified:true, created_at:'2023-07-14T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000008', artwork_id:'a0000001-0000-0000-0000-000000000008', user_id:C5, user_name:'Bongani Dlamini', user_avatar:'https://picsum.photos/seed/bongani/200/200', rating:5, comment:"Digital Savanna is visionary. It perfectly captures the future I hope we're building.", verified:true, created_at:'2023-10-25T00:00:00Z' },
  { id:'e0000001-0000-0000-0000-000000000009', artwork_id:'a0000001-0000-0000-0000-000000000008', user_id:C1, user_name:'James Kariuki',   user_avatar:'https://picsum.photos/seed/james/200/200',   rating:5, comment:'Kwame is a genius. This piece looks incredible as a large canvas print.',              verified:true, created_at:'2023-11-10T00:00:00Z' },
];

const ORDERS = [
  { id:'0d000001-0000-0000-0000-000000000001', customer_id:C1, status:'delivered', payment_method:'mpesa',  subtotal:1900, discount_amount:0, total:1900, first_time_discount_applied:false, created_at:'2023-08-01T00:00:00Z' },
  { id:'0d000001-0000-0000-0000-000000000002', customer_id:C2, status:'delivered', payment_method:'paypal', subtotal:1400, discount_amount:0, total:1400, first_time_discount_applied:false, created_at:'2023-07-01T00:00:00Z' },
  { id:'0d000001-0000-0000-0000-000000000003', customer_id:C3, status:'delivered', payment_method:'mpesa',  subtotal:2200, discount_amount:0, total:2200, first_time_discount_applied:false, created_at:'2023-10-01T00:00:00Z' },
  { id:'0d000001-0000-0000-0000-000000000004', customer_id:C5, status:'delivered', payment_method:'paypal', subtotal:750,  discount_amount:0, total:750,  first_time_discount_applied:false, created_at:'2023-10-20T00:00:00Z' },
];

const PURCHASED = [
  { customer_id:C1, artwork_id:'a0000001-0000-0000-0000-000000000003', order_id:'0d000001-0000-0000-0000-000000000001', purchased_at:'2023-08-20T00:00:00Z' },
  { customer_id:C1, artwork_id:'a0000001-0000-0000-0000-000000000008', order_id:'0d000001-0000-0000-0000-000000000001', purchased_at:'2023-11-10T00:00:00Z' },
  { customer_id:C2, artwork_id:'a0000001-0000-0000-0000-000000000005', order_id:'0d000001-0000-0000-0000-000000000002', purchased_at:'2023-07-14T00:00:00Z' },
  { customer_id:C2, artwork_id:'a0000001-0000-0000-0000-000000000006', order_id:'0d000001-0000-0000-0000-000000000002', purchased_at:'2023-09-05T00:00:00Z' },
  { customer_id:C3, artwork_id:'a0000001-0000-0000-0000-000000000011', order_id:'0d000001-0000-0000-0000-000000000003', purchased_at:'2023-10-01T00:00:00Z' },
  { customer_id:C5, artwork_id:'a0000001-0000-0000-0000-000000000012', order_id:'0d000001-0000-0000-0000-000000000004', purchased_at:'2023-10-25T00:00:00Z' },
];

const MN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const ANALYTICS = [
  ...[5600,8400,14000,11200,16800,22400,14000,19600,11200,8400,5600,2800].map((rev,i) => ({ artist_id:A1, month:MN[i], month_num:i+1, year:2023, sales:[2,3,5,4,6,8,5,7,4,3,2,1][i], revenue:rev })),
  ...[9200,11500,18400,13800,20700,25300,16100,18400,11500,9200,6900,4600].map((rev,i) => ({ artist_id:A2, month:MN[i], month_num:i+1, year:2023, sales:[4,5,8,6,9,11,7,8,5,4,3,2][i], revenue:rev })),
  ...[4400,6600,8800,6600,11000,13200,8800,11000,6600,4400,4400,2200].map((rev,i)  => ({ artist_id:A3, month:MN[i], month_num:i+1, year:2023, sales:[2,3,4,3,5,6,4,5,3,2,2,1][i],  revenue:rev })),
];

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n=== Authentic Arts — Supabase Seed ===\n');

  console.log('Step 1/7  Creating auth users…');
  for (const u of AUTH_USERS) await createAuthUser(u);

  console.log('\nStep 2/7  Upserting profiles…');
  await upsert('profiles', PROFILES);

  console.log('\nStep 3/7  Upserting artworks…');
  await upsert('artworks', ARTWORKS);

  console.log('\nStep 4/7  Upserting reviews…');
  await upsert('reviews', REVIEWS, 'artwork_id, user_id');

  console.log('\nStep 5/7  Upserting orders…');
  await upsert('orders', ORDERS);

  console.log('\nStep 6/7  Upserting purchased_artworks…');
  await upsert('purchased_artworks', PURCHASED, 'customer_id, artwork_id');

  console.log('\nStep 7/7  Upserting sales_analytics…');
  await upsert('sales_analytics', ANALYTICS, 'artist_id, year, month_num');

  console.log('\n=== Seed complete ✓ ===\n');
}

main().catch(err => { console.error('\n❌', err.message); process.exit(1); });
