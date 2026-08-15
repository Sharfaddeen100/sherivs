
ALTER TABLE public.qr_tokens ADD COLUMN IF NOT EXISTS payload jsonb;
ALTER TABLE public.qr_tokens ADD COLUMN IF NOT EXISTS created_by uuid;
CREATE INDEX IF NOT EXISTS qr_tokens_token_idx ON public.qr_tokens (token);
CREATE INDEX IF NOT EXISTS fees_student_idx ON public.fees (student_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS fees_paystack_reference_uniq ON public.fees (paystack_reference) WHERE paystack_reference IS NOT NULL;
