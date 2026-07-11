-- ==========================================
-- BLUSH BEAUTY STUDIO - DATABASE SCHEMA
-- ==========================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 0. Tabla de Sucursales
CREATE TABLE sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    direccion VARCHAR(255),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 00. Tabla de Usuarios y Roles
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- en producción hasheada
    nombre VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL CHECK (rol IN ('Dueño', 'Gerente', 'Administrador')),
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 1. Tabla de Clientes
CREATE TABLE clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    cedula VARCHAR(50) UNIQUE,
    celular VARCHAR(50),
    correo VARCHAR(255),
    medio_contacto VARCHAR(100),
    fecha_nacimiento DATE,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_clientes_cedula ON clientes(cedula);
CREATE INDEX idx_clientes_nombre ON clientes(nombre);

-- 2. Tabla de Personal (Estilistas / Manicuristas)
CREATE TABLE personal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    cargo VARCHAR(100) DEFAULT 'Manicurista' NOT NULL,
    activo BOOLEAN DEFAULT TRUE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Tabla de Servicios
CREATE TABLE servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    precio_base NUMERIC(10, 2) NOT NULL CHECK (precio_base >= 0),
    duracion_minutos INTEGER DEFAULT 30 NOT NULL CHECK (duracion_minutos > 0),
    frecuencia_recomendada_dias INTEGER CHECK (frecuencia_recomendada_dias > 0),
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_servicios_nombre ON servicios(nombre);

-- 4. Tabla de Citas / Ventas
CREATE TABLE citas_ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES clientes(id) ON DELETE SET NULL,
    servicio_id UUID REFERENCES servicios(id) ON DELETE RESTRICT,
    personal_id UUID REFERENCES personal(id) ON DELETE RESTRICT,
    fecha_hora TIMESTAMP WITH TIME ZONE NOT NULL,
    valor_pagado NUMERIC(10, 2) NOT NULL CHECK (valor_pagado >= 0),
    forma_pago VARCHAR(50) NOT NULL CHECK (forma_pago IN ('Efectivo', 'Deuna', 'Transferencia', 'Tarjeta')),
    no_transferencia VARCHAR(100),
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    -- Control digital de transacciones (Mitiga pérdidas financieras)
    CONSTRAINT check_digital_reference CHECK (
        (forma_pago IN ('Deuna', 'Transferencia') AND no_transferencia IS NOT NULL AND TRIM(no_transferencia) <> '') OR
        (forma_pago NOT IN ('Deuna', 'Transferencia'))
    )
);

CREATE INDEX idx_citas_ventas_fecha_hora ON citas_ventas(fecha_hora);
CREATE INDEX idx_citas_ventas_cliente_id ON citas_ventas(cliente_id);
CREATE INDEX idx_citas_ventas_personal_id ON citas_ventas(personal_id);
CREATE INDEX idx_citas_ventas_sucursal ON citas_ventas(sucursal_id);

-- 5. Tabla de Gastos (Egresos)
CREATE TABLE gastos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fecha DATE NOT NULL,
    factura VARCHAR(100),
    cantidad NUMERIC(10, 2) NOT NULL CHECK (cantidad > 0),
    concepto VARCHAR(255) NOT NULL,
    categoria VARCHAR(100) DEFAULT 'Otros' NOT NULL,
    valor_unitario NUMERIC(10, 2) NOT NULL CHECK (valor_unitario >= 0),
    total NUMERIC(10, 2) NOT NULL CHECK (total >= 0),
    forma_pago VARCHAR(100) NOT NULL,
    cuenta VARCHAR(100) NOT NULL,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_gastos_fecha ON gastos(fecha);
CREATE INDEX idx_gastos_sucursal ON gastos(sucursal_id);

-- 6. Tabla de Inventario / Productos (Soporta alertas inmediatas de stock)
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('insumo', 'reventa')),
    stock_actual INTEGER DEFAULT 0 NOT NULL CHECK (stock_actual >= 0),
    stock_minimo INTEGER DEFAULT 4 NOT NULL CHECK (stock_minimo >= 0),
    precio_venta NUMERIC(10, 2) CHECK (precio_venta >= 0),
    proveedor VARCHAR(255),
    proveedor_ruc VARCHAR(50),
    precio_costo NUMERIC(10, 2) CHECK (precio_costo >= 0),
    fecha_compra DATE,
    fecha_actualizacion_stock DATE,
    sucursal_id UUID REFERENCES sucursales(id) ON DELETE SET NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_productos_nombre ON productos(nombre);
CREATE INDEX idx_productos_sucursal ON productos(sucursal_id);

-- 7. Historial de Reposición de Inventario
CREATE TABLE registro_reposiciones_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    stock_anterior INTEGER NOT NULL,
    fecha_anterior DATE NOT NULL,
    cantidad_reposicion INTEGER NOT NULL,
    fecha_reposicion DATE NOT NULL,
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_reposiciones_producto ON registro_reposiciones_inventario(producto_id);

-- ==========================================
-- FUNCIONES DE NEGOCIO Y CONCILIACIÓN
-- ==========================================

-- A. Resumen de ingresos agrupados por forma de pago
CREATE OR REPLACE FUNCTION obtener_resumen_ingresos(fecha_inicio DATE, fecha_fin DATE)
RETURNS TABLE (
    forma_pago VARCHAR,
    cantidad_transacciones BIGINT,
    total_ingresos NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cv.forma_pago::VARCHAR,
        COUNT(*)::BIGINT as cantidad_transacciones,
        SUM(cv.valor_pagado)::NUMERIC as total_ingresos
    FROM citas_ventas cv
    WHERE cv.fecha_hora::DATE >= fecha_inicio AND cv.fecha_hora::DATE <= fecha_fin
    GROUP BY cv.forma_pago;
END;
$$ LANGUAGE plpgsql;

-- B. Conciliación financiera (Total Ventas - Total Gastos = Utilidad Neta)
CREATE OR REPLACE FUNCTION obtener_conciliacion_financiera(fecha_inicio DATE, fecha_fin DATE)
RETURNS TABLE (
    total_ingresos NUMERIC,
    total_egresos NUMERIC,
    utilidad_neta NUMERIC
) AS $$
DECLARE
    ingresos NUMERIC;
    egresos NUMERIC;
BEGIN
    SELECT COALESCE(SUM(valor_pagado), 0) INTO ingresos
    FROM citas_ventas
    WHERE fecha_hora::DATE >= fecha_inicio AND fecha_hora::DATE <= fecha_fin;

    SELECT COALESCE(SUM(total), 0) INTO egresos
    FROM gastos
    WHERE fecha >= fecha_inicio AND fecha <= fecha_fin;

    RETURN QUERY
    SELECT 
        ingresos,
        egresos,
        (ingresos - egresos) as utilidad_neta;
END;
$$ LANGUAGE plpgsql;

-- C. Vista para Motor de Seguimiento Automatizado (CRM)
-- Identifica clientes que necesitan ser contactados para re-agendar debido a la frecuencia del servicio
DROP VIEW IF EXISTS vista_clientes_por_recontactar;
CREATE VIEW vista_clientes_por_recontactar AS
WITH ultimas_citas AS (
    SELECT DISTINCT ON (cliente_id, servicio_id)
        cliente_id,
        servicio_id,
        fecha_hora,
        personal_id
    FROM citas_ventas
    ORDER BY cliente_id, servicio_id, fecha_hora DESC
)
SELECT 
    c.id AS cliente_id,
    c.nombre AS cliente_nombre,
    c.celular AS cliente_celular,
    c.correo AS cliente_correo,
    s.id AS servicio_id,
    s.nombre AS servicio_nombre,
    s.frecuencia_recomendada_dias,
    uc.fecha_hora AS ultima_cita_fecha,
    (uc.fecha_hora + (s.frecuencia_recomendada_dias || ' days')::INTERVAL)::DATE AS proxima_cita_sugerida,
    CURRENT_DATE - (uc.fecha_hora + (s.frecuencia_recomendada_dias || ' days')::INTERVAL)::DATE AS dias_retraso
FROM ultimas_citas uc
JOIN clientes c ON uc.cliente_id = c.id
JOIN servicios s ON uc.servicio_id = s.id
WHERE s.frecuencia_recomendada_dias IS NOT NULL
ORDER BY dias_retraso DESC;


