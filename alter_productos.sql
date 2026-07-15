-- =========================================================================
-- SCRIPT DE MIGRACIÓN: AGREGAR COLUMNAS DE COSTOS Y PROVEEDORES A PRODUCTOS
-- =========================================================================
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase.
-- Esto creará los campos precio_costo, proveedor, proveedor_ruc y fechas de
-- compra/actualización para que el inventario y auditoría funcionen en producción.

-- 1. Agregar columnas a la tabla 'productos' si no existen
ALTER TABLE productos ADD COLUMN IF NOT EXISTS precio_costo NUMERIC(10, 2) CHECK (precio_costo >= 0);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor VARCHAR(255);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS proveedor_ruc VARCHAR(50);
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_compra DATE;
ALTER TABLE productos ADD COLUMN IF NOT EXISTS fecha_actualizacion_stock DATE;

-- 2. Notificar a PostgREST para recargar el esquema de forma instantánea
NOTIFY pgrst, 'reload schema';
