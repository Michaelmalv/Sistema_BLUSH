-- ==========================================================
-- ACTUALIZACIÓN COMPLETA DE TABLA GASTOS EN SUPABASE
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

ALTER TABLE gastos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) DEFAULT 'Otros';
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS proveedor_ruc VARCHAR(50);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS cantidad NUMERIC(10, 2) DEFAULT 1;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS valor_unitario NUMERIC(10, 2) DEFAULT 0;
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS cuenta VARCHAR(100) DEFAULT 'Caja Principal';
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL;

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
