-- ============================================================
-- MIDTRANS QRIS: tambahan kolom pada tabel orders
-- Aman dijalankan berulang (idempotent).
-- Copy & paste ke Supabase SQL Editor lalu RUN.
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS midtrans_order_id text,
  ADD COLUMN IF NOT EXISTS midtrans_transaction_id text,
  ADD COLUMN IF NOT EXISTS qr_string text,
  ADD COLUMN IF NOT EXISTS qr_url text;

CREATE INDEX IF NOT EXISTS orders_midtrans_order_id_idx
  ON public.orders (midtrans_order_id);
