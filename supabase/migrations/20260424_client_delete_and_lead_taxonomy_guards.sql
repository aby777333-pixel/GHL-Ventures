-- Allow clients to be deleted even when a lead references them as
-- the converted client. The lead row is preserved and its
-- converted_client_id is cleared.
ALTER TABLE public.leads DROP CONSTRAINT IF EXISTS leads_converted_client_id_fkey;
ALTER TABLE public.leads
  ADD CONSTRAINT leads_converted_client_id_fkey
  FOREIGN KEY (converted_client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
