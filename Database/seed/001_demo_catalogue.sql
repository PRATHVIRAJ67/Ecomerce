-- URU demo catalogue. Safe to re-run (skips existing slugs).
-- Images are intentionally empty: upload real photos from the admin dashboard (stored in R2).

insert into public.categories (name, slug, description, sort_order) values
  ('Fresh Produce',        'fresh-produce',        'Seasonal fruits and vegetables straight from village farms', 1),
  ('Spices & Masalas',     'spices-masalas',       'Stone-ground spices and family masala blends',               2),
  ('Pickles & Preserves',  'pickles-preserves',    'Traditional pickles, chutneys and preserves',               3),
  ('Snacks & Sweets',      'snacks-sweets',        'Hand-made namkeen, chakli and festive sweets',              4),
  ('Organic Staples',      'organic-staples',      'Rice, millets, pulses and cold-pressed oils',               5),
  ('Handloom & Textiles',  'handloom-textiles',    'Sarees, towels and fabrics woven by local artisans',        6),
  ('Home & Kitchen',       'home-kitchen',         'Clay, brass and wooden kitchenware',                        7),
  ('Handicrafts',          'handicrafts',          'Decor and gifts crafted in Indian villages',                8)
on conflict (slug) do nothing;

with c as (select id, slug from public.categories)
insert into public.products
  (category_id, name, slug, sku, short_description, description, unit, origin, tags, price, mrp, stock_quantity, low_stock_threshold, is_featured)
select c.id, v.name, v.slug, v.sku, v.short_description, v.description, v.unit, v.origin, v.tags, v.price, v.mrp, v.stock, v.threshold, v.featured
from (values
  ('fresh-produce',     'Alphonso Mangoes',            'alphonso-mangoes',            'URU-FP-001', 'Naturally ripened, GI-tagged Alphonso',        'Hand-picked Alphonso mangoes ripened in hay, no carbide. Packed the day they ship.', '1 dozen', 'Ratnagiri, Maharashtra', array['seasonal','fruit'],      899.00, 1099.00,  40, 8,  true),
  ('fresh-produce',     'Tender Coconut',              'tender-coconut',              'URU-FP-002', 'Sweet water coconuts from coastal farms',       'Freshly harvested tender coconuts, rich in natural electrolytes.',                    'Pack of 4','Udupi, Karnataka',       array['fresh'],                  220.00,  260.00,  60, 10, false),
  ('spices-masalas',    'Byadgi Chilli Powder',        'byadgi-chilli-powder',        'URU-SP-001', 'Deep red colour, gentle heat',                   'Sun-dried Byadgi chillies, stone ground in small batches. No added colour.',          '250 g',    'Byadagi, Karnataka',     array['spice','bestseller'],     185.00,  220.00, 120, 15, true),
  ('spices-masalas',    'Malabar Black Pepper',        'malabar-black-pepper',        'URU-SP-002', 'Bold, aromatic whole pepper',                    'Hand-sorted Tellicherry-grade black pepper from Malabar hill farms.',                 '200 g',    'Wayanad, Kerala',        array['spice','whole'],          320.00,  380.00,  80, 10, false),
  ('spices-masalas',    'Udupi Sambar Powder',         'udupi-sambar-powder',         'URU-SP-003', 'Temple-style sambar masala',                     'A family recipe of roasted lentils, coriander, fenugreek and Byadgi chillies.',       '200 g',    'Udupi, Karnataka',       array['masala','bestseller'],    160.00,  190.00,   4, 10, true),
  ('pickles-preserves', 'Mango Appe Midi Pickle',      'appe-midi-pickle',            'URU-PK-001', 'Rare tender-mango heirloom pickle',              'Whole tender Appe Midi mangoes cured in brine and mustard, the Malnad way.',         '500 g',    'Sagara, Karnataka',      array['pickle','heritage'],      349.00,  399.00,  30, 6,  true),
  ('pickles-preserves', 'Lemon Ginger Pickle',         'lemon-ginger-pickle',         'URU-PK-002', 'Tangy, sun-cured, no preservatives',             'Lemons and ginger slow-cured in the sun with cold-pressed sesame oil.',              '300 g',    'Coorg, Karnataka',       array['pickle'],                 210.00,  240.00,   0, 6,  false),
  ('snacks-sweets',     'Kodubale Rings',              'kodubale-rings',              'URU-SN-001', 'Crunchy rice-flour rings with a spicy kick',     'Hand-shaped kodubale fried in groundnut oil. Perfect with evening coffee.',          '400 g',    'Mysuru, Karnataka',      array['snack','crunchy'],        199.00,  229.00,  75, 10, false),
  ('snacks-sweets',     'Dharwad Peda',                'dharwad-peda',                'URU-SN-002', 'GI-tagged caramelised milk sweet',               'Slow-cooked milk peda from Dharwad''s century-old sweet makers.',                    '500 g',    'Dharwad, Karnataka',     array['sweet','gi-tag'],         340.00,  380.00,  50, 8,  true),
  ('organic-staples',   'Rajamudi Red Rice',           'rajamudi-red-rice',           'URU-OS-001', 'Heritage red rice, unpolished',                  'Once grown for the Wodeyar kings — fibre-rich, nutty and naturally unpolished.',     '1 kg',     'Hassan, Karnataka',      array['rice','heritage'],        145.00,  170.00, 200, 20, false),
  ('organic-staples',   'Cold-Pressed Coconut Oil',    'cold-pressed-coconut-oil',    'URU-OS-002', 'Wood-pressed (ghani) virgin oil',                'Extracted in a traditional wooden ghani at low temperature to keep the aroma.',      '1 L',      'Kasaragod, Kerala',      array['oil','organic'],          420.00,  480.00,  45, 8,  true),
  ('organic-staples',   'Foxtail Millet',              'foxtail-millet',              'URU-OS-003', 'Naturally gluten-free millet',                   'Cleaned and destoned foxtail millet from rain-fed farms.',                            '1 kg',     'Tumakuru, Karnataka',    array['millet','organic'],       120.00,  140.00,  90, 15, false),
  ('handloom-textiles', 'Ilkal Handloom Saree',        'ilkal-handloom-saree',        'URU-HT-001', 'Traditional Ilkal weave with tope teni pallu',   'Handwoven on pit looms with the signature red pallu. Each saree takes 7 days.',     '1 piece',  'Ilkal, Karnataka',       array['saree','handloom'],      2850.00, 3400.00,  12, 3,  true),
  ('handloom-textiles', 'Cotton Thorthu Towel',        'cotton-thorthu-towel',        'URU-HT-002', 'Soft, quick-dry handloom towel',                 'Light Kerala-style thorthu towels that get softer with every wash.',                 'Pack of 2','Balaramapuram, Kerala',  array['towel','cotton'],         299.00,  349.00,  65, 10, false),
  ('home-kitchen',      'Clay Cooking Pot',            'clay-cooking-pot',            'URU-HK-001', 'Unglazed terracotta pot for slow cooking',       'Hand-thrown by village potters; seasoned and ready for curries and rice.',          '2 L',      'Channapatna, Karnataka', array['clay','cookware'],        549.00,  650.00,  18, 5,  false),
  ('handicrafts',       'Channapatna Wooden Toy Set',  'channapatna-wooden-toy-set',  'URU-HC-001', 'Lacquered toys with natural dyes',               'GI-tagged Channapatna toys turned from ivory wood and coloured with vegetable dyes.', 'Set of 5', 'Channapatna, Karnataka', array['toys','gi-tag','gift'],   799.00,  899.00,  25, 5,  true)
) as v(category_slug, name, slug, sku, short_description, description, unit, origin, tags, price, mrp, stock, threshold, featured)
join c on c.slug = v.category_slug
where not exists (select 1 from public.products p where p.slug = v.slug and p.deleted_at is null);

insert into public.inventory_movements (product_id, change, stock_after, reason, note)
select p.id, p.stock_quantity, p.stock_quantity, 'initial', 'Seed stock'
from public.products p
where p.stock_quantity > 0
  and not exists (select 1 from public.inventory_movements m where m.product_id = p.id);
