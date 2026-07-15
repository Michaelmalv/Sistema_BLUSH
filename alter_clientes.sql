-- ========================================================================
-- SCRIPT DE MIGRACIÓN: AGREGAR COLUMNA DE FECHA DE NACIMIENTO EN CLIENTES
-- ========================================================================

-- Ejecutar en el SQL Editor de Supabase:
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS fecha_nacimiento DATE;
