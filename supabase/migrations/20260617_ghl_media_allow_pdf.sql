-- ================================================================
-- 20260617 · STORAGE — allow PDF uploads in the public ghl-media bucket
-- The admin "Add/Edit Investment Plan" form uploads both the plan image
-- and the plan PDF to ghl-media via uploadFundPlanAsset(). The bucket
-- previously allowed only image/video/audio mime types, so PDF uploads
-- failed with "mime type application/pdf is not supported".
-- Additive + idempotent: existing allowed types are preserved.
-- ================================================================

UPDATE storage.buckets
SET allowed_mime_types = array_append(allowed_mime_types, 'application/pdf')
WHERE id = 'ghl-media'
  AND NOT ('application/pdf' = ANY(allowed_mime_types));
