-- ────────────────────────────────────────────────────────────
-- Broadcast Module — Bulk lead list + campaign blasts to
-- email (Resend) and WhatsApp (Wati). Lives under
-- Admin → Content & Support → Broadcast.
--
-- Tables:
--   broadcast_leads       — imported contacts (CSV or manual)
--   broadcast_campaigns   — one row per send
--   broadcast_deliveries  — per-recipient send log
-- ────────────────────────────────────────────────────────────

-- ── Leads ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcast_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  email       TEXT,
  mobile      TEXT,          -- primary WhatsApp number (E.164 preferred)
  phone       TEXT,          -- secondary / landline
  location    TEXT,
  remarks     TEXT,
  source      TEXT DEFAULT 'manual',   -- 'manual', 'csv', 'import:juvlon', etc.
  tags        TEXT[] DEFAULT '{}',
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_leads_email    ON public.broadcast_leads(email);
CREATE INDEX IF NOT EXISTS idx_broadcast_leads_mobile   ON public.broadcast_leads(mobile);
CREATE INDEX IF NOT EXISTS idx_broadcast_leads_location ON public.broadcast_leads(location);
CREATE INDEX IF NOT EXISTS idx_broadcast_leads_tags     ON public.broadcast_leads USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_broadcast_leads_created  ON public.broadcast_leads(created_at DESC);

-- ── Campaigns ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcast_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  subject         TEXT,                                             -- email subject (ignored for WhatsApp-only)
  body            TEXT NOT NULL,                                    -- plain-text / simple HTML
  content_type    TEXT NOT NULL DEFAULT 'text'
                    CHECK (content_type IN ('text','image','video','pdf','link','blog','html')),
  attachment_url  TEXT,                                             -- public URL for media/pdf/link/blog
  channel         TEXT NOT NULL DEFAULT 'both'
                    CHECK (channel IN ('email','whatsapp','both')),
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sending','sent','partial','failed')),
  recipient_count INT NOT NULL DEFAULT 0,
  sent_count      INT NOT NULL DEFAULT 0,
  failed_count    INT NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_created ON public.broadcast_campaigns(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_status  ON public.broadcast_campaigns(status);

-- ── Per-recipient delivery log ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.broadcast_deliveries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id   UUID NOT NULL REFERENCES public.broadcast_campaigns(id) ON DELETE CASCADE,
  lead_id       UUID REFERENCES public.broadcast_leads(id) ON DELETE SET NULL,
  recipient_name  TEXT,
  email         TEXT,
  mobile        TEXT,
  channel       TEXT NOT NULL CHECK (channel IN ('email','whatsapp')),
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','sent','failed','skipped')),
  error         TEXT,
  provider_id   TEXT,                                               -- Resend id / Wati id
  sent_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_campaign ON public.broadcast_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_lead     ON public.broadcast_deliveries(lead_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_deliveries_status   ON public.broadcast_deliveries(status);

-- ── Row-Level Security ───────────────────────────────────────
ALTER TABLE public.broadcast_leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_campaigns  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_deliveries ENABLE ROW LEVEL SECURITY;

-- Admin + staff read; admin writes. Mirrors the broker/inquiries policy style.
DROP POLICY IF EXISTS broadcast_leads_read      ON public.broadcast_leads;
DROP POLICY IF EXISTS broadcast_leads_write     ON public.broadcast_leads;
DROP POLICY IF EXISTS broadcast_campaigns_read  ON public.broadcast_campaigns;
DROP POLICY IF EXISTS broadcast_campaigns_write ON public.broadcast_campaigns;
DROP POLICY IF EXISTS broadcast_deliveries_read ON public.broadcast_deliveries;
DROP POLICY IF EXISTS broadcast_deliveries_write ON public.broadcast_deliveries;

CREATE POLICY broadcast_leads_read ON public.broadcast_leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY broadcast_leads_write ON public.broadcast_leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

CREATE POLICY broadcast_campaigns_read ON public.broadcast_campaigns
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY broadcast_campaigns_write ON public.broadcast_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

CREATE POLICY broadcast_deliveries_read ON public.broadcast_deliveries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin','staff')
    )
  );

CREATE POLICY broadcast_deliveries_write ON public.broadcast_deliveries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.role IN ('admin','super_admin')
    )
  );

-- Updated-at trigger for leads
CREATE OR REPLACE FUNCTION public.touch_broadcast_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_broadcast_leads_updated_at ON public.broadcast_leads;
CREATE TRIGGER trg_broadcast_leads_updated_at
  BEFORE UPDATE ON public.broadcast_leads
  FOR EACH ROW EXECUTE FUNCTION public.touch_broadcast_leads_updated_at();
