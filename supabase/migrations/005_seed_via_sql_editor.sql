-- ============================================================
-- 005_seed_via_sql_editor.sql
-- Paste this entire file into the Supabase SQL Editor and run.
-- It seeds auth.users, profiles, artworks, reviews, orders,
-- purchased_artworks, and sales_analytics in one shot.
-- The SQL editor runs as postgres (superuser) so RLS is bypassed.
-- ============================================================

-- ── auth.users ───────────────────────────────────────────────
-- Passwords below are bcrypt hashes:
--   artist123  →  $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh
--   user123    →  $2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
--   admin123   →  $2a$10$Xv1l6e.MaFIu2Q/k/0QXKeVGE.s7XHm5sR0tqJUEf7JBl7X9bAEeO

insert into auth.users
  (id, aud, role, email, encrypted_password, email_confirmed_at,
   raw_user_meta_data, created_at, updated_at)
values
  ('a1000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'amara@authenticarts.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh',
   now(), '{"name":"Amara Osei","role":"artist"}'::jsonb, now(), now()),

  ('a1000000-0000-0000-0000-000000000002','authenticated','authenticated',
   'kwame@authenticarts.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh',
   now(), '{"name":"Kwame Mensah","role":"artist"}'::jsonb, now(), now()),

  ('a1000000-0000-0000-0000-000000000003','authenticated','authenticated',
   'zara@authenticarts.com',
   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh',
   now(), '{"name":"Zara Ndlovu","role":"artist"}'::jsonb, now(), now()),

  ('c1000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'james@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   now(), '{"name":"James Kariuki","role":"customer"}'::jsonb, now(), now()),

  ('c1000000-0000-0000-0000-000000000002','authenticated','authenticated',
   'aisha@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   now(), '{"name":"Aisha Bello","role":"customer"}'::jsonb, now(), now()),

  ('c1000000-0000-0000-0000-000000000003','authenticated','authenticated',
   'tendai@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   now(), '{"name":"Tendai Moyo","role":"customer"}'::jsonb, now(), now()),

  ('c1000000-0000-0000-0000-000000000004','authenticated','authenticated',
   'fatima@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   now(), '{"name":"Fatima Al-Hassan","role":"customer"}'::jsonb, now(), now()),

  ('c1000000-0000-0000-0000-000000000005','authenticated','authenticated',
   'bongani@example.com',
   '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
   now(), '{"name":"Bongani Dlamini","role":"customer"}'::jsonb, now(), now()),

  ('ad000000-0000-0000-0000-000000000001','authenticated','authenticated',
   'admin@authenticarts.com',
   '$2a$10$Xv1l6e.MaFIu2Q/k/0QXKeVGE.s7XHm5sR0tqJUEf7JBl7X9bAEeO',
   now(), '{"name":"Dr. Chioma Eze","role":"admin"}'::jsonb, now(), now())
on conflict (id) do nothing;

-- ── profiles ─────────────────────────────────────────────────
insert into public.profiles
  (id, email, name, role, avatar_url, location, join_date,
   bio, specialties, verified,
   total_sales, total_earnings, wallet_balance, withdrawn, followers,
   portfolio_total_works, portfolio_sold, portfolio_available,
   preferred_styles, is_first_time_buyer)
values
  ('a1000000-0000-0000-0000-000000000001','amara@authenticarts.com','Amara Osei','artist',
   'https://picsum.photos/seed/amara/200/200','Accra, Ghana','2021-03-15',
   'Ghanaian-born contemporary painter exploring identity, migration, and belonging.',
   array['Paintings','Mixed Media'],true,
   48,124800,18750,106050,3420,24,18,6,array[]::text[],false),

  ('a1000000-0000-0000-0000-000000000002','kwame@authenticarts.com','Kwame Mensah','artist',
   'https://picsum.photos/seed/kwame/200/200','Nairobi, Kenya','2020-08-22',
   'Digital artist and sculptor merging traditional African forms with digital techniques.',
   array['Sculptures','Digital Art'],true,
   62,198400,22300,176100,5100,31,25,6,array[]::text[],false),

  ('a1000000-0000-0000-0000-000000000003','zara@authenticarts.com','Zara Ndlovu','artist',
   'https://picsum.photos/seed/zara/200/200','Cape Town, South Africa','2022-01-10',
   'Fine art photographer capturing the raw beauty of everyday African life.',
   array['Photography','Mixed Media'],true,
   35,87500,14200,73300,2780,18,12,6,array[]::text[],false),

  ('c1000000-0000-0000-0000-000000000001','james@example.com','James Kariuki','customer',
   'https://picsum.photos/seed/james/200/200','Nairobi, Kenya','2022-05-10',
   null,array[]::text[],false,0,0,0,0,0,0,0,0,
   array['Contemporary','Abstract'],false),

  ('c1000000-0000-0000-0000-000000000002','aisha@example.com','Aisha Bello','customer',
   'https://picsum.photos/seed/aisha/200/200','Lagos, Nigeria','2022-11-30',
   null,array[]::text[],false,0,0,0,0,0,0,0,0,
   array['Photography','Fine Art'],false),

  ('c1000000-0000-0000-0000-000000000003','tendai@example.com','Tendai Moyo','customer',
   'https://picsum.photos/seed/tendai/200/200','Harare, Zimbabwe','2023-02-14',
   null,array[]::text[],false,0,0,0,0,0,0,0,0,
   array['Paintings','Expressionist'],false),

  ('c1000000-0000-0000-0000-000000000004','fatima@example.com','Fatima Al-Hassan','customer',
   'https://picsum.photos/seed/fatima/200/200','Cairo, Egypt','2023-07-01',
   null,array[]::text[],false,0,0,0,0,0,0,0,0,
   array['Sculptures','Traditional Contemporary'],true),

  ('c1000000-0000-0000-0000-000000000005','bongani@example.com','Bongani Dlamini','customer',
   'https://picsum.photos/seed/bongani/200/200','Johannesburg, South Africa','2023-04-22',
   null,array[]::text[],false,0,0,0,0,0,0,0,0,
   array['Digital Art','Abstract'],false),

  ('ad000000-0000-0000-0000-000000000001','admin@authenticarts.com','Dr. Chioma Eze','admin',
   'https://picsum.photos/seed/chioma/200/200',null,'2020-01-01',
   null,array[]::text[],false,0,0,0,0,0,0,0,0,
   array[]::text[],false)
on conflict (id) do nothing;

-- ── artworks ─────────────────────────────────────────────────
insert into public.artworks
  (id,artist_id,artist_name,title,description,category,style,medium,dimensions,year,
   origin,authenticity,inspiration,tags,alt_text,
   price,original_price,quantity,images,status,featured,best_seller,
   sales,average_rating,review_count)
values
  ('a0000001-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','Amara Osei',
   'Golden Horizons','A breathtaking exploration of light and landscape, capturing the moment the African sun meets the earth.',
   'Paintings','Contemporary','Oil on linen canvas','120cm x 90cm',2023,
   'Created in Accra, Ghana. Materials sourced locally.',
   'Certificate of Authenticity #AA-2023-001. Signed and dated on reverse.',
   'Inspired by early morning walks along the Volta River.',
   array['landscape','light','africa','oil painting'],
   'An oil painting titled Golden Horizons.',
   2800,2800,1,
   array['https://picsum.photos/seed/goldenhorizons/800/600','https://picsum.photos/seed/goldenhorizons2/800/600','https://picsum.photos/seed/goldenhorizons3/800/600'],
   'available',true,true,0,4.8,12),

  ('a0000001-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','Amara Osei',
   'Ancestral Echoes','A deeply personal work exploring the connection between present-day Ghanaians and their ancestral heritage.',
   'Paintings','Abstract','Acrylic and gold leaf on canvas','100cm x 80cm',2023,
   'Studio of Amara Osei, Accra, Ghana.',
   'Certificate of Authenticity #AA-2023-002. Signed and dated on reverse.',
   'Drawn from oral histories passed down through generations of the Osei family.',
   array['abstract','heritage','symbols','gold leaf'],
   'An abstract acrylic painting with gold leaf titled Ancestral Echoes.',
   3500,3500,1,
   array['https://picsum.photos/seed/ancestral/800/600','https://picsum.photos/seed/ancestral2/800/600'],
   'available',true,false,0,4.9,8),

  ('a0000001-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','Kwame Mensah',
   'Urban Rhythms','A dynamic digital composition capturing the energy and chaos of Nairobi''s streets.',
   'Digital Art','Contemporary','Digital illustration, archival print','4000x3000px (print up to A1)',2023,
   'Created digitally in Nairobi, Kenya.',
   'NFT-backed Certificate #KM-2023-014. Edition 3/5.',
   'The chaotic beauty of Nairobi''s CBD during rush hour.',
   array['digital','urban','geometric','nairobi'],
   'A digital illustration print titled Urban Rhythms.',
   950,950,5,
   array['https://picsum.photos/seed/urbanrhythms/800/600','https://picsum.photos/seed/urbanrhythms2/800/600'],
   'available',true,true,3,4.7,15),

  ('a0000001-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','Kwame Mensah',
   'The Weaver''s Song','A stunning bronze sculpture depicting a woman weaving, celebrating the tradition of African textile arts.',
   'Sculptures','Traditional Contemporary','Bronze with patina','45cm H x 28cm W x 22cm D',2022,
   'Cast at Mensah Foundry, Nairobi, Kenya.',
   'Certificate of Authenticity #KM-2023-008. Unique cast. Signed base.',
   'Dedicated to Kwame''s grandmother, a master weaver.',
   array['sculpture','bronze','weaving','tradition','figurative'],
   'A bronze sculpture with patina titled The Weaver''s Song.',
   6200,6200,1,
   array['https://picsum.photos/seed/weaversong/800/600','https://picsum.photos/seed/weaversong2/800/600','https://picsum.photos/seed/weaversong3/800/600'],
   'available',true,true,0,5.0,6),

  ('a0000001-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000003','Zara Ndlovu',
   'Solitude in Blue','A hauntingly beautiful photograph of a lone figure against the vast expanse of the Atlantic Ocean.',
   'Photography','Fine Art','Archival pigment print on Hahnemühle photo rag','90cm x 60cm',2022,
   'Photographed at Bloubergstrand, Cape Town, South Africa.',
   'Limited edition fine art print #ZN-2022-005. Edition 2/3. Hand-signed.',
   'The loneliness and freedom one feels standing at the edge of a continent.',
   array['photography','ocean','solitude','blue','fine art'],
   'A fine art photograph titled Solitude in Blue.',
   780,780,3,
   array['https://picsum.photos/seed/solitudeinblue/800/600','https://picsum.photos/seed/solitudeinblue2/800/600'],
   'available',false,true,2,4.6,9),

  ('a0000001-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000003','Zara Ndlovu',
   'Market Day, Lagos','An explosion of colour and life from Lagos''s Balogun Market.',
   'Photography','Documentary','Archival pigment print on Fuji Crystal Archive','80cm x 60cm',2022,
   'Photographed at Balogun Market, Lagos Island, Nigeria.',
   'Limited edition fine art print #ZN-2022-012. Edition 4/5. Hand-signed.',
   'The infectious energy of African markets.',
   array['photography','market','lagos','documentary','color'],
   'A documentary photograph titled Market Day, Lagos.',
   620,620,5,
   array['https://picsum.photos/seed/marketday/800/600','https://picsum.photos/seed/marketday2/800/600'],
   'available',false,false,4,4.5,7),

  ('a0000001-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001','Amara Osei',
   'Fragments of Tomorrow','A large-scale mixed media work combining oil paint, collaged newspaper clippings, and textile fragments.',
   'Mixed Media','Contemporary','Oil, collage, embroidery on canvas','150cm x 110cm',2023,
   'Created in Accra, Ghana.',
   'Certificate of Authenticity #AA-2023-007. Signed and dated.',
   'The tension between preserving cultural memory and embracing an uncertain future.',
   array['mixed media','collage','textile','contemporary','africa'],
   'A mixed media artwork titled Fragments of Tomorrow.',
   4100,4100,1,
   array['https://picsum.photos/seed/fragments/800/600','https://picsum.photos/seed/fragments2/800/600'],
   'available',false,false,0,4.9,4),

  ('a0000001-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000002','Kwame Mensah',
   'Digital Savanna','A mesmerizing digital artwork reimagining the African savanna through a cyberpunk lens.',
   'Digital Art','Abstract','Digital art, archival print','5000x3750px (print up to A0)',2023,
   'Created digitally in Nairobi, Kenya.',
   'NFT-backed Certificate #KM-2023-019. Edition 7/10.',
   'What if nature evolved alongside technology rather than being threatened by it?',
   array['digital','savanna','wildlife','neon','cyberpunk'],
   'A digital artwork print titled Digital Savanna.',
   1200,1200,10,
   array['https://picsum.photos/seed/digitalsavanna/800/600','https://picsum.photos/seed/digitalsavanna2/800/600'],
   'available',false,true,7,4.8,18),

  ('a0000001-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000002','Kwame Mensah',
   'Stone Sentinel','A striking minimalist sculpture carved from Kenyan green marble.',
   'Sculptures','Minimalist','Kenyan green marble','60cm H x 20cm W x 20cm D',2022,
   'Carved from Kenyan green marble sourced from Kisumu quarries.',
   'Certificate of Authenticity #KM-2022-033. Unique piece. Signed base.',
   'The silent watchfulness of ancient African stone monuments.',
   array['sculpture','marble','minimalist','stone','kenya'],
   'A minimalist green marble sculpture titled Stone Sentinel.',
   3800,3800,1,
   array['https://picsum.photos/seed/stonesentinel/800/600','https://picsum.photos/seed/stonesentinel2/800/600'],
   'available',false,false,0,4.7,3),

  ('a0000001-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000003','Zara Ndlovu',
   'Rainforest Dreams','An ethereal long-exposure photograph taken in the Daintree Rainforest.',
   'Photography','Nature','Archival pigment print on Baryta paper','100cm x 70cm',2023,
   'Photographed in Daintree Rainforest, Queensland, during a residency trip.',
   'Limited edition fine art print #ZN-2023-003. Edition 1/4. Hand-signed.',
   'The feeling of stepping back 65 million years when entering an ancient rainforest.',
   array['photography','rainforest','nature','long exposure','mist'],
   'A long-exposure photograph titled Rainforest Dreams.',
   890,890,4,
   array['https://picsum.photos/seed/rainforest/800/600','https://picsum.photos/seed/rainforest2/800/600'],
   'available',false,false,1,4.8,5),

  ('a0000001-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000001','Amara Osei',
   'Fire Dance','An energetic expressionist painting capturing the primal power of a traditional fire dance ceremony.',
   'Paintings','Expressionist','Acrylic on canvas','90cm x 90cm',2023,
   'Painted in Accra, Ghana. Inspired by witnessing a Brekete fire ceremony.',
   'Certificate of Authenticity #AA-2023-011. Signed and dated.',
   'The electricity of a fire ceremony.',
   array['expressionist','fire','dance','ceremony','culture'],
   'An expressionist acrylic painting titled Fire Dance.',
   2200,2200,1,
   array['https://picsum.photos/seed/firedance/800/600','https://picsum.photos/seed/firedance2/800/600'],
   'available',false,false,0,4.6,6),

  ('a0000001-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000002','Kwame Mensah',
   'Neon Pulse','A hypnotic digital abstract composition pulsing with neon energy.',
   'Digital Art','Abstract','Digital art, archival print','4500x4500px (square format)',2023,
   'Created digitally. Available as archival print or canvas.',
   'NFT-backed Certificate #KM-2023-024. Edition 5/8.',
   'The intersection of biological and artificial neural networks.',
   array['digital','neon','abstract','neural','AI'],
   'An abstract digital illustration print titled Neon Pulse.',
   750,750,8,
   array['https://picsum.photos/seed/neonpulse/800/600','https://picsum.photos/seed/neonpulse2/800/600'],
   'available',false,false,5,4.5,11),

  ('a0000001-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000001','Amara Osei',
   'Kente Reimagined','A stunning mixed media work incorporating real strips of Kente cloth woven into the painted surface.',
   'Mixed Media','Traditional Contemporary','Oil paint, genuine Kente cloth on canvas','110cm x 85cm',2023,
   'Created in collaboration with master Kente weavers in Bonwire, Ashanti Region, Ghana.',
   'Certificate of Authenticity #AA-2023-015. Signed and dated.',
   'Honouring the Kente tradition by bringing it into the contemporary art world.',
   array['mixed media','kente','textile','ghana','heritage'],
   'A mixed media work titled Kente Reimagined.',
   3200,3200,1,
   array['https://picsum.photos/seed/kente/800/600','https://picsum.photos/seed/kente2/800/600'],
   'available',false,false,0,4.9,4)
on conflict (id) do nothing;

-- ── reviews ──────────────────────────────────────────────────
insert into public.reviews
  (id,artwork_id,user_id,user_name,user_avatar,rating,comment,verified,created_at)
values
  ('e0000001-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'James Kariuki','https://picsum.photos/seed/james/200/200',
   5,'Absolutely magnificent. The gold tones are even more stunning in person.',true,'2023-09-15'),

  ('e0000001-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000002',
   'Aisha Bello','https://picsum.photos/seed/aisha/200/200',
   5,'Amara''s work is unparalleled. This painting now hangs in my living room.',true,'2023-10-02'),

  ('e0000001-0000-0000-0000-000000000003','a0000001-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000003',
   'Tendai Moyo','https://picsum.photos/seed/tendai/200/200',
   5,'The texture and depth of this painting is extraordinary.',true,'2023-10-18'),

  ('e0000001-0000-0000-0000-000000000004','a0000001-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000001',
   'James Kariuki','https://picsum.photos/seed/james/200/200',
   5,'Urban Rhythms captures everything I love about Nairobi. The print quality is exceptional.',true,'2023-08-20'),

  ('e0000001-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000002',
   'Aisha Bello','https://picsum.photos/seed/aisha/200/200',
   4,'Great piece with incredible energy. Shipping took a bit longer than expected.',true,'2023-09-05'),

  ('e0000001-0000-0000-0000-000000000006','a0000001-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000003',
   'Tendai Moyo','https://picsum.photos/seed/tendai/200/200',
   5,'The Weaver''s Song is one of the most beautiful sculptures I have ever seen.',true,'2023-11-01'),

  ('e0000001-0000-0000-0000-000000000007','a0000001-0000-0000-0000-000000000005','c1000000-0000-0000-0000-000000000002',
   'Aisha Bello','https://picsum.photos/seed/aisha/200/200',
   5,'Zara''s photography is poetic. The print quality on the Hahnemühle paper is exceptional.',true,'2023-07-14'),

  ('e0000001-0000-0000-0000-000000000008','a0000001-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000005',
   'Bongani Dlamini','https://picsum.photos/seed/bongani/200/200',
   5,'Digital Savanna is visionary. It perfectly captures the future I hope we''re building.',true,'2023-10-25'),

  ('e0000001-0000-0000-0000-000000000009','a0000001-0000-0000-0000-000000000008','c1000000-0000-0000-0000-000000000001',
   'James Kariuki','https://picsum.photos/seed/james/200/200',
   5,'Kwame is a genius. This piece looks incredible as a large canvas print.',true,'2023-11-10')
on conflict (artwork_id, user_id) do nothing;

-- ── orders ───────────────────────────────────────────────────
insert into public.orders
  (id,customer_id,status,payment_method,subtotal,discount_amount,total,
   first_time_discount_applied,created_at)
values
  ('0d000001-0000-0000-0000-000000000001','c1000000-0000-0000-0000-000000000001',
   'delivered','mpesa',1900,0,1900,false,'2023-08-01'),
  ('0d000001-0000-0000-0000-000000000002','c1000000-0000-0000-0000-000000000002',
   'delivered','paypal',1400,0,1400,false,'2023-07-01'),
  ('0d000001-0000-0000-0000-000000000003','c1000000-0000-0000-0000-000000000003',
   'delivered','mpesa',2200,0,2200,false,'2023-10-01'),
  ('0d000001-0000-0000-0000-000000000004','c1000000-0000-0000-0000-000000000005',
   'delivered','paypal',750,0,750,false,'2023-10-20')
on conflict (id) do nothing;

-- ── purchased_artworks ───────────────────────────────────────
insert into public.purchased_artworks
  (customer_id,artwork_id,order_id,purchased_at)
values
  ('c1000000-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000003','0d000001-0000-0000-0000-000000000001','2023-08-20'),
  ('c1000000-0000-0000-0000-000000000001','a0000001-0000-0000-0000-000000000008','0d000001-0000-0000-0000-000000000001','2023-11-10'),
  ('c1000000-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000005','0d000001-0000-0000-0000-000000000002','2023-07-14'),
  ('c1000000-0000-0000-0000-000000000002','a0000001-0000-0000-0000-000000000006','0d000001-0000-0000-0000-000000000002','2023-09-05'),
  ('c1000000-0000-0000-0000-000000000003','a0000001-0000-0000-0000-000000000011','0d000001-0000-0000-0000-000000000003','2023-10-01'),
  ('c1000000-0000-0000-0000-000000000005','a0000001-0000-0000-0000-000000000012','0d000001-0000-0000-0000-000000000004','2023-10-25')
on conflict (customer_id, artwork_id) do nothing;

-- ── sales_analytics ──────────────────────────────────────────
insert into public.sales_analytics (artist_id,month,month_num,year,sales,revenue) values
  ('a1000000-0000-0000-0000-000000000001','Jan',1,2023,2,5600),
  ('a1000000-0000-0000-0000-000000000001','Feb',2,2023,3,8400),
  ('a1000000-0000-0000-0000-000000000001','Mar',3,2023,5,14000),
  ('a1000000-0000-0000-0000-000000000001','Apr',4,2023,4,11200),
  ('a1000000-0000-0000-0000-000000000001','May',5,2023,6,16800),
  ('a1000000-0000-0000-0000-000000000001','Jun',6,2023,8,22400),
  ('a1000000-0000-0000-0000-000000000001','Jul',7,2023,5,14000),
  ('a1000000-0000-0000-0000-000000000001','Aug',8,2023,7,19600),
  ('a1000000-0000-0000-0000-000000000001','Sep',9,2023,4,11200),
  ('a1000000-0000-0000-0000-000000000001','Oct',10,2023,3,8400),
  ('a1000000-0000-0000-0000-000000000001','Nov',11,2023,2,5600),
  ('a1000000-0000-0000-0000-000000000001','Dec',12,2023,1,2800),
  ('a1000000-0000-0000-0000-000000000002','Jan',1,2023,4,9200),
  ('a1000000-0000-0000-0000-000000000002','Feb',2,2023,5,11500),
  ('a1000000-0000-0000-0000-000000000002','Mar',3,2023,8,18400),
  ('a1000000-0000-0000-0000-000000000002','Apr',4,2023,6,13800),
  ('a1000000-0000-0000-0000-000000000002','May',5,2023,9,20700),
  ('a1000000-0000-0000-0000-000000000002','Jun',6,2023,11,25300),
  ('a1000000-0000-0000-0000-000000000002','Jul',7,2023,7,16100),
  ('a1000000-0000-0000-0000-000000000002','Aug',8,2023,8,18400),
  ('a1000000-0000-0000-0000-000000000002','Sep',9,2023,5,11500),
  ('a1000000-0000-0000-0000-000000000002','Oct',10,2023,4,9200),
  ('a1000000-0000-0000-0000-000000000002','Nov',11,2023,3,6900),
  ('a1000000-0000-0000-0000-000000000002','Dec',12,2023,2,4600),
  ('a1000000-0000-0000-0000-000000000003','Jan',1,2023,2,4400),
  ('a1000000-0000-0000-0000-000000000003','Feb',2,2023,3,6600),
  ('a1000000-0000-0000-0000-000000000003','Mar',3,2023,4,8800),
  ('a1000000-0000-0000-0000-000000000003','Apr',4,2023,3,6600),
  ('a1000000-0000-0000-0000-000000000003','May',5,2023,5,11000),
  ('a1000000-0000-0000-0000-000000000003','Jun',6,2023,6,13200),
  ('a1000000-0000-0000-0000-000000000003','Jul',7,2023,4,8800),
  ('a1000000-0000-0000-0000-000000000003','Aug',8,2023,5,11000),
  ('a1000000-0000-0000-0000-000000000003','Sep',9,2023,3,6600),
  ('a1000000-0000-0000-0000-000000000003','Oct',10,2023,2,4400),
  ('a1000000-0000-0000-0000-000000000003','Nov',11,2023,2,4400),
  ('a1000000-0000-0000-0000-000000000003','Dec',12,2023,1,2200)
on conflict (artist_id, year, month_num) do nothing;
