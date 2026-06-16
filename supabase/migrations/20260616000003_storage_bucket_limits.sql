-- Seul le bucket 'resources' avait file_size_limit/allowed_mime_types.
-- Tous les autres buckets publics (avatars, post-images, offer-images,
-- event-images, course-thumbnails) et payment-proofs acceptaient n'importe
-- quel fichier de n'importe quelle taille au niveau serveur — la limite
-- 8 Mo / "image/*" côté client est contournable par un appel API direct
-- à l'API Storage. Risque : explosion de coûts de stockage, hébergement
-- de fichiers arbitraires (y compris exécutables ou SVG avec script) sur
-- des buckets publics.

UPDATE storage.buckets SET
  file_size_limit = 5242880,  -- 5 Mo
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'avatars';

UPDATE storage.buckets SET
  file_size_limit = 8388608,  -- 8 Mo (aligné sur la limite client)
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'post-images';

UPDATE storage.buckets SET
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'offer-images';

UPDATE storage.buckets SET
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'event-images';

UPDATE storage.buckets SET
  file_size_limit = 8388608,
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif']
WHERE id = 'course-thumbnails';

UPDATE storage.buckets SET
  file_size_limit = 10485760,  -- 10 Mo
  allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf']
WHERE id = 'payment-proofs';
