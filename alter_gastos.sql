-- ==========================================================
-- ACTUALIZACIÓN DE TABLA GASTOS: PROVEEDOR Y RUC
-- Ejecutar en el SQL Editor de Supabase
-- ==========================================================

ALTER TABLE gastos ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255);
ALTER TABLE gastos ADD COLUMN IF NOT EXISTS proveedor_ruc VARCHAR(50);

-- Notificar a PostgREST para recargar el esquema
NOTIFY pgrst, 'reload schema';
