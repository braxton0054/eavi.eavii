-- ============================================================
-- Migration: Pay Hero M-Pesa Integration Tables
-- Created: 2026-05-26
-- Note: Pay Hero handles paybill/till at the account level — single global config
-- ============================================================

-- Pay Hero global config (single row, no campus column)
CREATE TABLE IF NOT EXISTS public.payhero_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id integer NOT NULL,
  paybill_no text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payhero_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payhero_config_select" ON public.payhero_config FOR SELECT USING (true);
CREATE POLICY "payhero_config_insert" ON public.payhero_config FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "payhero_config_update" ON public.payhero_config FOR UPDATE USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

INSERT INTO public.payhero_config (channel_id, paybill_no) VALUES
  (0, '000000')
ON CONFLICT DO NOTHING;

-- Pay Hero transactions (staging table for STK push tracking)
CREATE TABLE IF NOT EXISTS public.payhero_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES public.applications(id),
  installment_id uuid REFERENCES public.payment_installments(id),
  phone_number text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  stk_push_request_id text,
  payhero_reference text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  callback_payload jsonb,
  fee_payment_id uuid REFERENCES public.fee_payments(id),
  initiated_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.payhero_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payhero_tx_select" ON public.payhero_transactions FOR SELECT USING (true);
CREATE POLICY "payhero_tx_insert" ON public.payhero_transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "payhero_tx_update" ON public.payhero_transactions FOR UPDATE USING (true);

CREATE INDEX IF NOT EXISTS idx_payhero_tx_application ON public.payhero_transactions(application_id);
CREATE INDEX IF NOT EXISTS idx_payhero_tx_installment ON public.payhero_transactions(installment_id);
CREATE INDEX IF NOT EXISTS idx_payhero_tx_status ON public.payhero_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payhero_tx_payhero_ref ON public.payhero_transactions(payhero_reference);

-- Unique partial index: only one pending transaction per installment
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_pending_installment
  ON public.payhero_transactions(installment_id)
  WHERE status = 'pending';
