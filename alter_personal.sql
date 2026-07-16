-- ========================================================================
-- SCRIPT DE MIGRACIÓN: AGREGAR COLUMNA DE CÉDULA EN PERSONAL (COLABORADORAS)
-- ========================================================================

-- Ejecutar en el SQL Editor de Supabase:
ALTER TABLE personal ADD COLUMN IF NOT EXISTS cedula VARCHAR(20);
