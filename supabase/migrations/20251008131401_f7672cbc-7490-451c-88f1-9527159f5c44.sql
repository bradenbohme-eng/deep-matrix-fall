-- Create RLS policies for document-assets storage bucket

-- Allow anyone to view files in document-assets (since bucket is public)
CREATE POLICY "Public access to document-assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'document-assets');

-- Allow authenticated users to upload files to document-assets
CREATE POLICY "Authenticated users can upload to document-assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'document-assets');

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their own document-assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'document-assets' AND owner = auth.uid())
WITH CHECK (bucket_id = 'document-assets');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own document-assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'document-assets' AND owner = auth.uid());