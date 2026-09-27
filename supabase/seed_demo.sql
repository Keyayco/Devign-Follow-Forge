-- Demo data template. Replace the placeholders with an existing auth user id and business id after signup.
-- This file intentionally contains no secrets.

-- Example usage after creating a business in the app:
-- select id, name from public.businesses;

insert into public.customers (business_id, name, phone, whatsapp, email, address, notes) values
  ('00000000-0000-0000-0000-000000000000', 'Thandi Mokoena', '0821234567', '0821234567', 'thandi@example.com', 'Sandton, Johannesburg', 'Prefers WhatsApp updates'),
  ('00000000-0000-0000-0000-000000000000', 'Johan van der Merwe', '0835551010', '0835551010', 'johan@example.com', 'Durbanville, Cape Town', 'Repeat maintenance customer');

insert into public.leads (business_id, customer_name, phone, whatsapp, job_type, description, location, estimated_value, source, status) values
  ('00000000-0000-0000-0000-000000000000', 'Nandi Dlamini', '0712223333', '0712223333', 'Painting', 'Paint two bedrooms and repair wall cracks', 'Fourways', 6500, 'WhatsApp', 'New'),
  ('00000000-0000-0000-0000-000000000000', 'Sipho Nkosi', '0724445555', '0724445555', 'Tree felling', 'Remove fallen branch near driveway', 'Pretoria East', 2800, 'Referral', 'Contacted');
