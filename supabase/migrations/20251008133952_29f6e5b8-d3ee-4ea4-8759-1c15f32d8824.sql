-- Drop existing policies that require authentication
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update their documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete their documents" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to document assets" ON storage.objects;

-- Allow anyone to upload to document-assets bucket
CREATE POLICY "Anyone can upload to document-assets"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'document-assets');

-- Allow anyone to read from document-assets (public bucket)
CREATE POLICY "Anyone can read from document-assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'document-assets');

-- Allow anyone to update files in document-assets
CREATE POLICY "Anyone can update in document-assets"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'document-assets')
WITH CHECK (bucket_id = 'document-assets');

-- Allow anyone to delete from document-assets
CREATE POLICY "Anyone can delete from document-assets"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'document-assets');