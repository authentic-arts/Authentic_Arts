-- ============================================================
-- MIGRATION: 007_storage_artworks_bucket.sql
-- Purpose: Set up Supabase Storage bucket for artwork image uploads
-- Run this in the Supabase Dashboard -> SQL Editor
-- ============================================================

-- 1. Create the 'artworks' storage bucket if it doesn't already exist
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artworks',
  'artworks',
  true,
  10485760, -- 10MB file size limit
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 2. Storage Row Level Security (RLS) Policies

-- Allow public read access to all artwork images
drop policy if exists "Public Access to Artworks" on storage.objects;
create policy "Public Access to Artworks"
on storage.objects for select
using ( bucket_id = 'artworks' );

-- Allow authenticated users (artists & admins) to upload artwork images
drop policy if exists "Authenticated users can upload artwork images" on storage.objects;
create policy "Authenticated users can upload artwork images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'artworks' );

-- Allow authenticated users to update their own artwork uploads
drop policy if exists "Users can update their artwork images" on storage.objects;
create policy "Users can update their artwork images"
on storage.objects for update
to authenticated
using ( bucket_id = 'artworks' );

-- Allow authenticated users to delete their own artwork uploads
drop policy if exists "Users can delete their artwork images" on storage.objects;
create policy "Users can delete their artwork images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'artworks' );
