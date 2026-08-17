-- ============================================================================
-- MIGRACIÓN: CREAR TABLA REGISTRO_REPOSICIONES_INVENTARIO
-- ============================================================================
-- Ejecuta este script en el SQL Editor de tu Dashboard de Supabase.
-- Esto creará la tabla para registrar las reposiciones de inventario.

CREATE TABLE IF NOT EXISTS registro_reposiciones_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    stock_anterior INTEGER NOT NULL,
    fecha_anterior DATE NOT NULL,
    cantidad_reposicion INTEGER NOT NULL,
    fecha_reposicion DATE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Crear el índice para optimizar búsquedas por producto
CREATE INDEX IF NOT EXISTS idx_reposiciones_producto ON registro_reposiciones_inventario(producto_id);

-- Recargar el esquema de PostgREST de forma instantánea
NOTIFY pgrst, 'reload schema';
