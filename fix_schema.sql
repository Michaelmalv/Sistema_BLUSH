-- ============================================================================
-- SCRIPT DE AJUSTE PARA SUPABASE: CREAR TABLA SUCURSALES Y COLUMNAS FALTANTES
-- ============================================================================

-- 1. Crear tabla de sucursales (si no se creó previamente)
CREATE TABLE IF NOT EXISTS sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2. Insertar las tres sucursales por defecto con IDs estándar UUID
INSERT INTO sucursales (id, nombre, direccion) VALUES
('11111111-1111-1111-1111-111111111111', 'Matriz Central', 'Av. de los Granados y Av. Eloy Alfaro'),
('22222222-2222-2222-2222-222222222222', 'Sucursal Norte', 'Av. El Inca y Amazonas'),
('33333333-3333-3333-3333-333333333333', 'Sucursal Sur', 'Av. Maldonado y El Recreo')
ON CONFLICT (id) DO NOTHING;

-- 3. Crear tabla de usuarios (si no se creó previamente)
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('Dueño', 'Gerente', 'Administrador')),
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. Agregar columna sucursal_id a citas_ventas
ALTER TABLE citas_ventas 
ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL;

-- 5. Agregar columna sucursal_id a gastos
ALTER TABLE gastos 
ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL;

-- 6. Agregar columna sucursal_id a productos
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL;
