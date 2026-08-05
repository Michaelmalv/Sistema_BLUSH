-- ============================================================================
-- MIGRACIÓN: AGREGAR TIPO A TABLA CITAS_VENTAS
-- ============================================================================

-- Agregar la columna 'tipo' para diferenciar entre citas programadas y ventas en caja directas.
-- Por defecto todos los registros históricos serán catalogados como 'cita'.
ALTER TABLE citas_ventas ADD COLUMN IF NOT EXISTS tipo VARCHAR(50) DEFAULT 'cita' CHECK (tipo IN ('cita', 'venta'));

-- Eliminar la restricción check_digital_reference que hacía obligatoria la referencia en transferencias y deuna.
-- De esta forma se podrá ingresar o editar la referencia en cualquier momento posterior.
ALTER TABLE citas_ventas DROP CONSTRAINT IF EXISTS check_digital_reference;
