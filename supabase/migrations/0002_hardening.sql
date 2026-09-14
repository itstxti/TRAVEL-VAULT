-- Travel Vault — endurecimiento de seguridad.
-- Ejecutar en Supabase → SQL Editor.

-- 1) Límites de longitud en texto libre, para evitar filas demasiado grandes.
alter table destinations
  add constraint destinations_name_length check (char_length(name) between 1 and 200),
  add constraint destinations_country_length check (country is null or char_length(country) <= 200),
  add constraint destinations_companions_count check (array_length(companions, 1) is null or array_length(companions, 1) <= 50);

alter table journal_entries
  add constraint journal_entries_text_length check (char_length(text) between 1 and 5000);

alter table photos
  add constraint photos_caption_length check (char_length(caption) <= 200);

-- 2) Límite de tamaño de archivo y tipos MIME permitidos en el bucket de fotos. 
update storage.buckets
set file_size_limit = 16777216, -- 16 MB, debe coincidir con MAX_PHOTO_BYTES en GalleryModal.tsx
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
where id = 'photos';

