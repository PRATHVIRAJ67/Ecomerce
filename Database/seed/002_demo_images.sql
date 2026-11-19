-- URU demo photography for the demo catalogue (001_demo_catalogue.sql). Safe to re-run.
-- Photos: Unsplash (https://unsplash.com/license — free for commercial use), resized and served
-- from the R2 bucket `uru-media` via https://uru-store.prathviholla67.workers.dev/media/demo/*.
-- Only fills products / categories that have NO image yet, so real photos uploaded from the
-- admin dashboard are never overwritten. Replace any image any time from Admin → Products.

with base as (select 'https://uru-store.prathviholla67.workers.dev/media/demo/' as u),
img(slug, file, alt, sort_order) as (values
  ('alphonso-mangoes',           'mango',       'Ripe Alphonso mangoes in a bowl',             0),
  ('tender-coconut',             'coconut2',    'Fresh green tender coconut',                  0),
  ('tender-coconut',             'coconut',     'Pile of tender coconuts',                     1),
  ('byadgi-chilli-powder',       'chilli',      'Red chilli powder with dried chillies',       0),
  ('byadgi-chilli-powder',       'chilli2',     'A spoonful of red chilli powder',             1),
  ('malabar-black-pepper',       'pepper2',     'Whole black peppercorns on a spoon',          0),
  ('malabar-black-pepper',       'pepper',      'Close-up of black peppercorns',               1),
  ('udupi-sambar-powder',        'sambar',      'Sambar masala in a brass bowl with spices',   0),
  ('udupi-sambar-powder',        'spices3',     'Spoons of ground spices',                     1),
  ('appe-midi-pickle',           'mangopickle', 'Tender raw mangoes on the tree',              0),
  ('lemon-ginger-pickle',        'lemonpickle', 'Lemons in a glass jar',                       0),
  ('kodubale-rings',             'snack2',      'Crunchy golden snacks',                       0),
  ('dharwad-peda',               'peda',        'Traditional Indian milk sweets',              0),
  ('rajamudi-red-rice',          'redrice',     'Unpolished red and heritage rice grains',     0),
  ('cold-pressed-coconut-oil',   'coconutoil',  'Cold-pressed coconut oil with fresh coconut', 0),
  ('cold-pressed-coconut-oil',   'coconut',     'Fresh coconuts',                              1),
  ('foxtail-millet',             'millet',      'Cooked millet with tomatoes',                 0),
  ('cotton-thorthu-towel',       'towel',       'Folded handloom cotton towels',               0),
  ('clay-cooking-pot',           'claypot',     'Clay pot cooking on a wood fire',             0),
  ('clay-cooking-pot',           'claypot2',    'Handmade terracotta pots',                    1),
  ('channapatna-wooden-toy-set', 'toys',        'Colourful wooden toys',                       0)
)
insert into public.product_images (product_id, url, alt, sort_order)
select p.id, base.u || img.file || '.jpg', img.alt, img.sort_order
from img
join public.products p on p.slug = img.slug and p.deleted_at is null
cross join base
where not exists (
  select 1 from public.product_images pi
  where pi.product_id = p.id and (pi.url not like base.u || '%' or pi.url = base.u || img.file || '.jpg')
);

-- Category tiles
update public.categories c
set image_url = 'https://uru-store.prathviholla67.workers.dev/media/demo/' || v.file || '.jpg'
from (values
  ('fresh-produce', 'mango'), ('spices-masalas', 'chilli'), ('pickles-preserves', 'lemonpickle'),
  ('snacks-sweets', 'peda'), ('organic-staples', 'redrice'),
  ('home-kitchen', 'claypot2'), ('handicrafts', 'banner-pots')
) as v(slug, file)
where c.slug = v.slug and c.image_url is null;

-- Home banners (only added once; edit or switch off from Admin → Banners)
insert into public.banners (title, subtitle, image_url, cta_label, link_url, placement, sort_order)
select v.title, v.subtitle, 'https://uru-store.prathviholla67.workers.dev/media/demo/' || v.file || '.jpg', v.cta, v.link, v.placement, v.sort_order
from (values
  ('Spices, stone-ground the old way', 'Byadgi chilli, Malabar pepper and family masalas from small farms.', 'banner-spices-goa', 'Shop spices', '/category/spices-masalas', 'home_hero', 1),
  ('From the village, to your door', 'Seasonal produce and heirloom staples, packed fresh.', 'banner-village', 'Explore the store', '/shop', 'home_hero', 2),
  ('Handmade by village potters', 'Clay cookware and terracotta, shaped by hand.', 'banner-pots', 'Shop home & kitchen', '/category/home-kitchen', 'home_strip', 1),
  ('Alphonso season is here', 'Naturally ripened Ratnagiri Alphonso, no carbide.', 'mango', 'Order mangoes', '/product/alphonso-mangoes', 'home_strip', 2)
) as v(title, subtitle, file, cta, link, placement, sort_order)
where not exists (select 1 from public.banners b where b.image_url like '%/media/demo/%');
