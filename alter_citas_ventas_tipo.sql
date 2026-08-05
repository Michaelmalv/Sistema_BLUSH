-- ============================================================================
-- MIGRACIÓN: AGREGAR TIPO A TABLA CITAS_VENTAS
-- ============================================================================

-- Agregar la columna 'tipo' para diferenciar entre citas programadas y ventas en caja directas.
-- Por defecto todos los registros históricos serán catalogados como 'cita'.
ALTER TABLE citas_ventas ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'cita' CHECK (tipo IN ('cita', 'venta'));
