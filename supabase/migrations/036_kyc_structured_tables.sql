-- =============================================
-- KYC Structured Tables Migration
-- =============================================

-- 1. KYC Basic Details
CREATE TABLE IF NOT EXISTS public.kyc_basic_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    investor_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    email_verified BOOLEAN DEFAULT FALSE,
    gender TEXT CHECK (gender IN ('male','female','other')),
    investor_type TEXT DEFAULT 'individual' CHECK (investor_type IN ('individual','huf','corporate','partnership','trust')),
    resident_type TEXT DEFAULT 'indian' CHECK (resident_type IN ('indian','nri','foreign')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. KYC Identity Details
CREATE TABLE IF NOT EXISTS public.kyc_identity_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pan_number TEXT,
    aadhar_number TEXT,
    passport_number TEXT,
    name_on_document TEXT,
    father_name TEXT,
    dob DATE,
    address TEXT,
    courier_address TEXT,
    country TEXT DEFAULT 'India',
    state TEXT,
    city TEXT,
    pincode TEXT,
    aadhar_doc_url TEXT,
    pan_doc_url TEXT,
    passport_doc_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KYC Bank Details
CREATE TABLE IF NOT EXISTS public.kyc_bank_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    account_type TEXT DEFAULT 'savings' CHECK (account_type IN ('savings','current','nro','nre')),
    account_number TEXT,
    swift_iban_code TEXT,
    account_holder_name TEXT,
    bank_name TEXT,
    bank_doc_url TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. KYC Demat Details
CREATE TABLE IF NOT EXISTS public.kyc_demat_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL UNIQUE REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    demat_account_number TEXT,
    demat_doc_url TEXT,
    skipped BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending','submitted','approved','rejected','skipped')),
    admin_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Nominees Table
CREATE TABLE IF NOT EXISTS public.nominees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    dob DATE,
    phone TEXT,
    relationship TEXT,
    percentage NUMERIC(5,2) DEFAULT 0,
    proof_url TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add kyc_step tracking to clients
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS kyc_step INTEGER DEFAULT 0;

-- 7. RLS
ALTER TABLE public.kyc_basic_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_identity_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_bank_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_demat_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;

CREATE POLICY kyc_basic_client_all ON public.kyc_basic_details FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kyc_identity_client_all ON public.kyc_identity_details FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kyc_bank_client_all ON public.kyc_bank_details FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY kyc_demat_client_all ON public.kyc_demat_details FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY nominees_client_all ON public.nominees FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
