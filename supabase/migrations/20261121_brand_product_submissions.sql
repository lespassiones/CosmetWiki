-- Espace marques (cosme-check.com/marques) : une marque propose un produit à
-- référencer, l'équipe vérifie (composition, photos, page produit officielle),
-- puis le produit entre au catalogue et la marque reçoit un mail avec sa note.
--
-- Écrit et lu UNIQUEMENT par le serveur (clé service) : RLS activée sans
-- aucune policy, droits retirés à anon et authenticated.

create table if not exists cosme_check.brand_product_submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),

  -- La marque et la personne à contacter
  brand text not null check (char_length(brand) between 1 and 120),
  company text check (company is null or char_length(company) <= 160),
  contact_name text check (contact_name is null or char_length(contact_name) <= 120),
  contact_email text not null check (char_length(contact_email) between 3 and 200),
  contact_role text check (contact_role is null or char_length(contact_role) <= 120),
  brand_website text check (brand_website is null or char_length(brand_website) <= 500),

  -- Le produit
  product_name text not null check (char_length(product_name) between 1 and 200),
  ean text check (ean is null or ean ~ '^[0-9]{8,14}$'),
  volume text not null check (char_length(volume) between 1 and 60),
  product_type text check (product_type is null or char_length(product_type) <= 120),
  zones text[] not null default '{}',
  inci text not null check (char_length(inci) between 10 and 6000),
  properties text check (properties is null or char_length(properties) <= 2000),
  made_in text check (made_in is null or char_length(made_in) <= 120),
  product_url text check (product_url is null or char_length(product_url) <= 500),
  photo_front_path text,
  photo_inci_path text,
  submitter_ip text,

  -- La revue par l'équipe
  reviewed_at timestamptz,
  reviewer_email text,
  review_note text check (review_note is null or char_length(review_note) <= 2000),
  catalog_ean text,
  score numeric,
  score_label text,
  stars smallint check (stars is null or stars between 1 and 5),
  notified_at timestamptz
);

create index if not exists brand_product_submissions_status_idx
  on cosme_check.brand_product_submissions (status, created_at desc);
create index if not exists brand_product_submissions_email_idx
  on cosme_check.brand_product_submissions (lower(contact_email));

alter table cosme_check.brand_product_submissions enable row level security;
revoke all on cosme_check.brand_product_submissions from anon, authenticated;
grant all on cosme_check.brand_product_submissions to service_role;

comment on table cosme_check.brand_product_submissions is
  'Espace marques du site : produits proposés par les marques, vérifiés par l''équipe avant référencement (admin > Modération > Marques).';

-- Note de vérification (écrite par l'équipe ou par Claude pendant la
-- vérification : page officielle consultée, écarts trouvés...). Affichée dans
-- l'admin, jamais envoyée à la marque.
alter table cosme_check.brand_product_submissions
  add column if not exists check_note text check (check_note is null or char_length(check_note) <= 4000);
