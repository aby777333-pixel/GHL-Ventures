-- ────────────────────────────────────────────────────────────
-- Download Logs Table — Tracks every document download
-- Maps to: Admin Portal (Sales → Download Activity)
--          CS Portal  (Lead Queue → Download Context)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS download_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   TEXT NOT NULL,                    -- e.g. 'brochure', 'roadmap', 'guide', 'nav'
  document_title TEXT NOT NULL,
  document_type TEXT DEFAULT 'PDF',
  file_size     TEXT,

  -- Downloader info (captured from gate form)
  downloader_name   TEXT NOT NULL,
  downloader_email  TEXT NOT NULL,
  downloader_phone  TEXT,
  is_accredited     BOOLEAN DEFAULT false,

  -- Linked records
  lead_id               UUID REFERENCES leads(id) ON DELETE SET NULL,
  contact_submission_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL,

  -- Tracking / attribution
  page_url      TEXT,
  utm_source    TEXT,
  utm_medium    TEXT,
  utm_campaign  TEXT,
  referrer      TEXT,
  user_agent    TEXT,
  ip_country    TEXT,

  -- Timestamps
  downloaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_download_logs_document  ON download_logs(document_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_email     ON download_logs(downloader_email);
CREATE INDEX IF NOT EXISTS idx_download_logs_lead      ON download_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_time      ON download_logs(downloaded_at DESC);

-- Row-Level Security
ALTER TABLE download_logs ENABLE ROW LEVEL SECURITY;

-- Admin & staff can read all download logs
CREATE POLICY download_logs_read_admin ON download_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin', 'staff')
    )
  );

-- Staff can read download logs for their assigned leads
CREATE POLICY download_logs_read_staff ON download_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM leads
      WHERE leads.id = download_logs.lead_id
      AND leads.assigned_to = auth.uid()
    )
  );

-- Anyone can insert (from website forms — uses anon key)
CREATE POLICY download_logs_insert ON download_logs
  FOR INSERT
  WITH CHECK (true);

-- Enable realtime for live dashboard feeds
ALTER PUBLICATION supabase_realtime ADD TABLE download_logs;

-- ────────────────────────────────────────────────────────────
-- Supabase Storage Bucket for document downloads
-- ────────────────────────────────────────────────────────────

-- Create storage bucket for downloadable documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'downloads',
  'downloads',
  true,
  52428800,  -- 50 MB limit
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf']::text[];

-- Public read access for download bucket
CREATE POLICY storage_downloads_read ON storage.objects
  FOR SELECT
  USING (bucket_id = 'downloads');

-- Only admin/staff can upload to downloads bucket
CREATE POLICY storage_downloads_upload ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'downloads'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Only admin can delete from downloads bucket
CREATE POLICY storage_downloads_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'downloads'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );
