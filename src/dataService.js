import { supabase, isSupabaseConfigured as originalIsSupabaseConfigured } from './supabaseClient'

let isSupabaseConfigured = originalIsSupabaseConfigured;

const updateSupabaseConfigState = () => {
  const isDemo = sessionStorage.getItem('blush_demo_mode') === 'true'
  isSupabaseConfigured = isDemo ? false : originalIsSupabaseConfigured
}

// Inicializar el estado al cargar la app
updateSupabaseConfigState();


// ============================================================================
// DATOS DE PRUEBA (MOCK DATA) PARA MODO LOCAL/DEMO
// ============================================================================

const MOCK_PERSONAL = [
  { id: 'p1', nombre: 'Pamela', cedula: '1711111111', cargo: 'Manicurista', activo: true },
  { id: 'p2', nombre: 'Sofia', cedula: '1722222222', cargo: 'Manicurista', activo: true },
  { id: 'p3', nombre: 'Roxana', cedula: '1733333333', cargo: 'Manicurista', activo: true },
  { id: 'p4', nombre: 'Cecilia', cedula: '1744444444', cargo: 'Manicurista', activo: true },
  { id: 'p5', nombre: 'Silvia', cedula: '1755555555', cargo: 'Manicurista', activo: true },
  { id: 'p6', nombre: 'Liz', cedula: '1766666666', cargo: 'Manicurista', activo: true },
]

const MOCK_SERVICIOS = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Baño de acrílico', precio_base: 35.00, duracion_minutos: 60, frecuencia_recomendada_dias: 21 },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Nivelación Rubber', precio_base: 25.00, duracion_minutos: 45, frecuencia_recomendada_dias: 21 },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Pedicura tradicional', precio_base: 15.00, duracion_minutos: 30, frecuencia_recomendada_dias: 30 },
  { id: 's4', nombre: 'Retoque de acrílico', precio_base: 20.00, duracion_minutos: 45, frecuencia_recomendada_dias: 21 },
  { id: 's5', nombre: 'Keratina', precio_base: 90.00, duracion_minutos: 120, frecuencia_recomendada_dias: 90 },
  { id: 's6', nombre: 'Cejas HD', precio_base: 12.00, duracion_minutos: 20, frecuencia_recomendada_dias: 15 },
]

const MOCK_CLIENTES = [
  { id: 'c1', nombre: 'Mayra Lojano', cedula: '1723456789', celular: '0987654321', correo: 'mayra@example.com', medio_contacto: 'WhatsApp', fecha_nacimiento: '1995-04-12' },
  { id: 'c2', nombre: 'Carla Poveda', cedula: '1712345678', celular: '0998877665', correo: 'carla@example.com', medio_contacto: 'Instagram', fecha_nacimiento: '1992-09-24' },
  { id: 'c3', nombre: 'Angelita Flores', cedula: '1709876543', celular: '0988776655', correo: 'angelita@example.com', medio_contacto: 'WhatsApp', fecha_nacimiento: '1988-12-05' },
  { id: 'c4', nombre: 'Carmen Lugo', cedula: '1755443322', celular: '0977665544', correo: 'carmen@example.com', medio_contacto: 'Recomendación', fecha_nacimiento: '1990-06-25' },
  { id: 'c5', nombre: 'Pamela Armendariz', cedula: '1788990011', celular: '0955443322', correo: 'pamela.a@example.com', medio_contacto: 'WhatsApp', fecha_nacimiento: '1996-10-31' },
]

const MOCK_CITAS = [
  { id: 'v1', cliente_id: 'c1', servicio_id: '11111111-1111-1111-1111-111111111111', personal_id: 'p1', fecha_hora: '2026-06-01T10:00:00Z', valor_pagado: 35.00, forma_pago: 'Deuna', no_transferencia: 'REF998877', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'v2', cliente_id: 'c2', servicio_id: '22222222-2222-2222-2222-222222222222', personal_id: 'p2', fecha_hora: '2026-06-15T14:30:00Z', valor_pagado: 25.00, forma_pago: 'Efectivo', no_transferencia: null, sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'v3', cliente_id: 'c3', servicio_id: '33333333-3333-3333-3333-333333333333', personal_id: 'p3', fecha_hora: '2026-05-20T09:00:00Z', valor_pagado: 15.00, forma_pago: 'Transferencia', no_transferencia: 'TX123456', sucursal_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'v4', cliente_id: 'c4', servicio_id: 's5', personal_id: 'p4', fecha_hora: '2026-04-10T16:00:00Z', valor_pagado: 90.00, forma_pago: 'Tarjeta', no_transferencia: null, sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'v5', cliente_id: 'c5', servicio_id: 's6', personal_id: 'p5', fecha_hora: '2026-06-10T11:00:00Z', valor_pagado: 12.00, forma_pago: 'Deuna', no_transferencia: 'REF112233', sucursal_id: '22222222-2222-2222-2222-222222222222' },
]

const MOCK_GASTOS = [
  { id: 'g1', fecha: '2026-06-05', factura: 'FAC-001', cantidad: 10, concepto: 'Guantes de nitrilo', categoria: 'Insumos', valor_unitario: 0.50, total: 5.00, forma_pago: 'Efectivo', cuenta: 'Caja Principal', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'g2', fecha: '2026-06-10', factura: 'FAC-992', cantidad: 5, concepto: 'Pinceles de acrílico', categoria: 'Insumos', valor_unitario: 4.50, total: 22.50, forma_pago: 'Deuna', cuenta: 'Cuenta Corriente', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'g3', fecha: '2026-06-01', factura: 'ARRIENDO-JUN', cantidad: 1, concepto: 'Arriendo del Local Blush', categoria: 'Alquiler', valor_unitario: 350.00, total: 350.00, forma_pago: 'Transferencia', cuenta: 'Cuenta Corriente', sucursal_id: '11111111-1111-1111-1111-111111111111' },
]

const MOCK_PRODUCTOS = [
  { id: '4591ea37-076d-47b7-9e83-f839900c8d05', nombre: 'Esmaltes Gel Pro', descripcion: 'Esmaltes de alta duración', tipo: 'insumo', stock_actual: 12, stock_minimo: 4, precio_venta: null, proveedor: 'OPI Distribuidor', proveedor_ruc: '1792938475001', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '77beedbf-c3e1-4451-8a77-d3c08dbb6f22', nombre: 'Removedor de acrílico premium', descripcion: 'Líquido removedor rápido', tipo: 'insumo', stock_actual: 3, stock_minimo: 4, precio_venta: null, proveedor: 'Belleza Total S.A.', proveedor_ruc: '1792223334001', precio_costo: 2.09, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'fa32a9c4-c967-4676-8f95-8cd199ed6a49', nombre: 'Aceite de cutícula coco 15ml', descripcion: 'Para reventa al cliente', tipo: 'reventa', stock_actual: 8, stock_minimo: 4, precio_venta: 7.5, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'eaa180eb-d7e7-4cc7-89a7-85699cb7ffb8', nombre: 'mascarillas facial', descripcion: 'Insumo para mascarillas facial', tipo: 'insumo', stock_actual: 50, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.22, fecha_compra: '2026-01-28', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '64609f40-8675-48b8-8567-ac015c5b5e32', nombre: 'lamparas', descripcion: 'mesa manicura', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 10.87, fecha_compra: '2026-04-28', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b358a600-59fd-4322-86c6-457ae5809c75', nombre: 'drill', descripcion: 'lima electrica', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 29.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3d69ec16-879f-46e8-ab2e-82fa6cc67a4a', nombre: 'mascara ploma', descripcion: 'Insumo para mascara ploma', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.80, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '2af3b204-6658-4dc5-8e90-7b33db12cd33', nombre: 'palos con algodón', descripcion: 'limpiar bordes', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b710d547-206f-44c9-8c00-0a04a8d5c958', nombre: 'cepillos de pies', descripcion: 'cepillos de pies', tipo: 'insumo', stock_actual: 22, stock_minimo: 22, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.04, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1a2f4ab5-64ac-4cbe-9387-8894ed1aa5e5', nombre: 'limas  100/180', descripcion: 'limas de uñas', tipo: 'insumo', stock_actual: 22, stock_minimo: 22, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '088a6f3d-5d24-428f-9e96-5b7a2c5f6b2d', nombre: 'limas 100/240', descripcion: 'limas de uñas', tipo: 'insumo', stock_actual: 18, stock_minimo: 18, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'bd74d780-560a-40ce-8a72-563c3d8c35f6', nombre: 'lima 100/240 ESPONGI', descripcion: 'limas de uñas', tipo: 'insumo', stock_actual: 4, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'cb2a135c-b3ba-4110-ba0e-7835b494b28d', nombre: 'palos de colores rosados con algodón', descripcion: 'limpiar bordes', tipo: 'insumo', stock_actual: 5, stock_minimo: 5, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'e0804fa8-b88c-482f-9aa7-5345724b3e12', nombre: 'cepillos de cejas rosados', descripcion: 'para cejas', tipo: 'insumo', stock_actual: 138, stock_minimo: 138, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.04, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '24006ab9-70fe-4123-9b8a-3a557a8688ca', nombre: 'caja de paletas', descripcion: 'para cera', tipo: 'insumo', stock_actual: 45, stock_minimo: 45, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 5.72, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'e34aaa27-7b9b-4830-960d-77e8c8214cc3', nombre: 'wipe magic 5 x 5 cm', descripcion: 'para retiro de esmalte', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '6ff0d74f-b005-43a6-892c-4d03875a245e', nombre: 'papel fim,rosados pestañas y cejas', descripcion: 'pestañas y cejas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.91, fecha_compra: '2026-03-15', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'c6fca68f-72e6-456f-acf2-ad2c9bbe2909', nombre: 'Glam beauty', descripcion: 'lifting pestañas', tipo: 'insumo', stock_actual: 26, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '132358ce-fde0-45ff-bc47-22e21e546775', nombre: 'parches funda ploma', descripcion: 'parches', tipo: 'insumo', stock_actual: 23, stock_minimo: 23, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.20, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '47f0efa5-c163-4009-b9d1-47484f3b7afb', nombre: 'discos reemplazable sandig', descripcion: 'podo', tipo: 'insumo', stock_actual: 1, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'f2c604ad-a54a-48b6-84f4-ccda8b4d791a', nombre: 'Glue bolm 15 gr inconsign', descripcion: 'balsamo de pigmentacion trans', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.13, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '5b06141a-bee8-4803-ae69-56fe66b76038', nombre: 'rizadores de pestañas', descripcion: 'rizador de pestaña', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.91, fecha_compra: '2026-03-15', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '029686bf-d066-4120-90b2-78ea6126e749', nombre: 'frasco crema de manos', descripcion: 'crema de manos', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.22, fecha_compra: '2026-06-15', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'efd627b6-da41-4cee-90c2-4d0b6c972c3c', nombre: 'frasco de alcohol', descripcion: 'alcohol', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 7.50, fecha_compra: '2026-03-25', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'cc89c56a-f36a-4957-8707-8227eb784756', nombre: 'caja de acrilico wite', descripcion: 'acrilico uñas', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.09, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '5d1ab5ec-71f0-4138-8f6a-feb79a37a414', nombre: 'caja de acrilico  clear', descripcion: 'acrilico de uñas', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.09, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '41c3e088-b908-4996-a7e1-d52b20437bfe', nombre: 'caja de acrilico cover pink', descripcion: 'acrilico de uñas', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.09, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'd9b02e6a-5220-498f-bd9b-73f9090d1092', nombre: 'Master Nail moldeador acrigel', descripcion: 'moldeador de uñas', tipo: 'insumo', stock_actual: 5, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b5b2fe90-29ed-4726-95bd-a9e400eaab6d', nombre: 'Master Nail smart gel royal clear', descripcion: 'gel moldeador de uñas', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'e86dfe68-7ecf-4ee4-85dd-8386ba55588f', nombre: 'Master Nail smar gel cover nude', descripcion: 'gel moldeador de uñas', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '4998429c-8ce9-4424-91b0-5e008d92e9e6', nombre: 'Master Nail smet gel Pink', descripcion: 'gel moldeador de uñas', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b0a4e60a-d227-4689-8a5e-1b92052a9f12', nombre: 'Master Nail smart royal white', descripcion: 'gel moldeador de uñas', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '98effd40-58c4-4ef5-be1d-22349bf872fa', nombre: 'frasco de acetona pequeño', descripcion: 'acetona', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'c1991c52-2bc0-4936-99ec-7a2326a521da', nombre: 'frasco gotero  monomero', descripcion: 'monomero', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '85424aef-9d10-4a0d-9244-4722afbe6b88', nombre: 'frasco o gotero removedor de cuticula', descripcion: 'removedor de ccuticula', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '7ba1f418-44b3-421c-bf74-e47659c16361', nombre: 'ablandador de callos', descripcion: 'ablandador de callos', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'fb8df4f4-2fe1-41d7-a1ec-06c3979acd2a', nombre: 'frascos de disolvente de esmalte', descripcion: 'disolvente de esmalte', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.43, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'f924a5a9-0f7e-40ed-9bcd-169f0de7e289', nombre: 'Master top coat', descripcion: 'protector de uñas', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.96, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '22157d62-a256-4eb4-91df-bd9d63b22a5e', nombre: 'Tarro master polvo acrilico clear 460', descripcion: 'plvo acrilico', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.91, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '7bbe08b2-42a4-4ce0-953a-c9c8e884331d', nombre: 'tarro master polvo acrilico wite', descripcion: 'polvo acrilico', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.91, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a1f1783a-bd4d-46a9-8143-d2f14d1b6fb8', nombre: 'tarro master polvo acrilico cover pink', descripcion: 'polvo acrilico', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.91, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1edc2705-eaf1-4418-b55e-6aa9d2f33e1e', nombre: 'brochas limpiador rosada', descripcion: 'brochas limpiadoras', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1840ba67-2f00-4375-a298-34204468e0b8', nombre: 'brpchas kolinsky numero 2', descripcion: 'brochas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 13.48, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '4dbc7583-2eb3-4963-bfea-da696c118d20', nombre: 'pinceles estuche rosado', descripcion: 'pincel', tipo: 'insumo', stock_actual: 5, stock_minimo: 5, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 5.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '9186ab3c-305d-4299-9449-d70e72b42adb', nombre: 'punteros', descripcion: 'punteros', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'd4b9ee7d-334b-4774-a314-836f46cd2abd', nombre: 'cucharas de  palo', descripcion: 'cuchara de palo', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '860729cb-914c-4d30-972e-ce98bc22513f', nombre: 'perfiladores largos 3 paquetes', descripcion: 'perfiladores largos', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'aeb7434a-5731-4699-884d-7272b3491136', nombre: 'perfiladores mediano 3 unidades', descripcion: 'perfiladores medianos', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.80, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3aef57ac-13c4-4f5b-a56c-129c5cf53513', nombre: 'tijeras', descripcion: 'tijeras', tipo: 'insumo', stock_actual: 5, stock_minimo: 5, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.39, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'e62b596f-db20-451d-95db-d1bcee7c1c11', nombre: 'pinceles con brocha y cepillo', descripcion: 'pinceles', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '05ec9a3e-ae60-42cb-ae57-47453e726882', nombre: 'pincel dorado', descripcion: 'pincel dorado', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.35, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b080ab08-51f4-4f3e-bd05-4c99d7654cc7', nombre: 'imanes', descripcion: 'iman', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.17, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a98abbbf-2341-4a39-a919-387a9b20d537', nombre: 'anillos para esmalte', descripcion: 'anillos de esmalte', tipo: 'insumo', stock_actual: 4, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a19b6a38-4419-4630-9eb4-a2cebbcad3d6', nombre: 'depiladores metalicos', descripcion: 'depilador', tipo: 'insumo', stock_actual: 8, stock_minimo: 8, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.91, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'f202eef9-f605-48c5-909d-08ec8b364688', nombre: 'repunjador metalico de pedicura', descripcion: 'rempujador pedicura', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.07, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '4ad086b4-c604-4ce9-bc40-827d3a9da10e', nombre: 'paquete  de repunjador metalico', descripcion: 'rempujador pedicura', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '8b2a507a-e811-4b3b-8d67-d07fbd5f5faa', nombre: 'coquetas base coat', descripcion: 'proteccion de uña', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.52, fecha_compra: '2026-06-08', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '8bc2a7e7-5813-4229-9bc6-2ae2ef043dcc', nombre: 'coqueta extremebond', descripcion: 'preparador de uñas', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.30, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '535d7028-d064-450d-a236-9ce9c848eb00', nombre: 'coqueta blooming', descripcion: 'expandir el esmalte en base humeda', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '01fdd899-4218-4145-81cf-96f5c0fcb157', nombre: 'coqueta nail pro', descripcion: 'prepara la uña natural', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.30, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '826945c3-c7cf-4988-9f3b-5cec793e91f1', nombre: 'ez flow nail sistema natural nail primer', descripcion: 'cuidado esculpidoy decoracion', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.83, fecha_compra: '2026-04-16', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1d72b8ae-5971-438c-a5ca-9135db45a37d', nombre: 'Mia secret xtrabon nail primer 1-2', descripcion: 'maxima duracion de esmalte', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.83, fecha_compra: '2026-04-16', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '6fa0aeaa-7d2d-44c7-b195-0565c4bf533a', nombre: 'Mia secret  Nail prep', descripcion: 'remueve los aceites naturales de la uña', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 7.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '207b5ca2-ad9b-4171-b838-930eafed15d6', nombre: 'glan nails gel polish traslucido', descripcion: 'deja ver la uña natural', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '6a5c8012-4b32-4fe3-9104-1288790cb408', nombre: 'thuya cola duo pestañas', descripcion: 'pega los moldes de siliconaal parpado', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 24.33, fecha_compra: '2026-02-17', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3f1423c8-7f73-4f4a-b3cc-a8fa970ed80b', nombre: 'miss summer top coat', descripcion: 'mejor adhesion i maxima duracion del esmalte', tipo: 'insumo', stock_actual: 4, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.96, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '50e82c65-5cbf-4ae3-b3aa-24ef391c0b1d', nombre: 'coquetas glue nail decorations', descripcion: 'papel foil  crea diseños', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.30, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '62e11181-b474-4191-8e58-2bcb399af4a8', nombre: 'gotas astricare mollie', descripcion: 'astringente que seca la piel', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'c5508be7-ff48-4f91-84f0-1dd89ca1cd1b', nombre: 'nail glue the original', descripcion: 'pega de tips', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.13, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b5b13260-bcc5-45a1-acdf-505e645ab012', nombre: 'solon pro hair bonding glue', descripcion: 'pega pestañas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.13, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1a2261c2-8ddd-4029-9af2-9393465b433d', nombre: 'addict pro rubber base coat', descripcion: 'capa protectora para uñas debiles', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.52, fecha_compra: '2026-06-08', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a43454f0-0686-4b12-955b-b5f2c2d383fd', nombre: 'magic removedor am beauty', descripcion: 'removedor de esmalte', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'bd92e483-39d3-431a-9d69-959564e4fef7', nombre: 'mate top coat', descripcion: 'esmalte transparente quita el brillo de la uña', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.96, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'ea7b9864-ee97-4a88-a821-43375f23fed7', nombre: 'miss summer aceite cuticula', descripcion: 'aceite de cuticula', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'bb6adcb7-4add-411c-bdf3-d2815df9787d', nombre: 'ten coco aceite de cuticula', descripcion: 'aceite de cuticula', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a45e328f-1009-4f73-8f9d-3f7103225760', nombre: 'secado rapido de esmalte ·# 45', descripcion: 'secado de esmalte', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.43, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'e8fa537f-1f55-4891-8ead-8dc2bd29cf80', nombre: 'base Rodher', descripcion: 'base de esmalte tradicional', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.43, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'c54950bc-b12f-40bb-93e1-6028ec278487', nombre: 'esmaltes Rodhert tradicional', descripcion: 'esmalte tradicional', tipo: 'insumo', stock_actual: 96, stock_minimo: 96, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.43, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '52b285db-ed83-495a-b785-7c6a0b104f2a', nombre: 'master nail Rubber', descripcion: 'gel espeso,escudo flexible para uñas', tipo: 'insumo', stock_actual: 10, stock_minimo: 10, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '73814a5a-1755-4091-ae4a-8db9cf865a4c', nombre: 'master nail esmalte', descripcion: 'esmalte permanente', tipo: 'insumo', stock_actual: 53, stock_minimo: 53, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.17, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '249569f8-72cc-4a2e-b88e-f940e13f2238', nombre: 'esmalte saphir', descripcion: 'esmalte permanente', tipo: 'insumo', stock_actual: 87, stock_minimo: 87, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.17, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '85a7ffee-59a3-4391-98a8-74eceb2a43b8', nombre: 'frasco monomero', descripcion: 'monomero', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'd584c341-f1c8-4161-bd6e-c12a35cf12a3', nombre: 'fundas diseño de uñas', descripcion: 'diseño de uñas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3e4b51e6-e829-498f-ab4f-7b8ef5b006d9', nombre: 'fundas de sacheto pps', descripcion: 'empujador de manicura', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.80, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '4cb26234-72ce-4969-94f8-3d0e710dfd04', nombre: 'beauty tool cuchillas', descripcion: 'ccuchillas paquete', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'ea6dfb14-56f9-40cf-8d63-9d91d2465111', nombre: 'glan beauty pinzas para las pestañas', descripcion: 'pinza de pestañas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.70, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '2742700e-e99a-48bc-ae68-507bd413d34d', nombre: 'Mia secret implemento para pedicura', descripcion: 'pinza pedicura', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 7.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'f3237b8a-8271-4bdb-91e2-09d8a7e48e41', nombre: 'glan nail profesional tools', descripcion: 'Insumo para glan nail profesional tools', tipo: 'insumo', stock_actual: 0, stock_minimo: 4, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '31777285-1b1f-4807-89e6-a5c3bfba4f4e', nombre: 'perfiladores de beauty eyebrow razo', descripcion: '2 paquete perfiladores', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.80, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '040bc9bc-a373-47c2-aef6-01019da872fb', nombre: 'demert nail enamel dryer tarro rojo', descripcion: 'spray para secar esmalte tradicional', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 7.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '93315d86-5bdb-435e-9e75-1150f8cd97a8', nombre: 'parafina real honey', descripcion: 'parafina', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.13, fecha_compra: '2026-02-24', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3e29ffa1-4e16-41d6-8be5-d38593494198', nombre: 'parafina Aloe Vera', descripcion: 'parafina', tipo: 'insumo', stock_actual: 5, stock_minimo: 5, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.13, fecha_compra: '2026-02-24', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '62c0c189-df69-44b3-bac8-1cc914805f08', nombre: 'galon de exfoliante manos', descripcion: 'exfolia manos', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 33.48, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b3fcea42-53da-49e1-bdde-945296c333a4', nombre: 'galon de exfoliante pies', descripcion: 'exfolia pies', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 33.48, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'd0d2e5d9-238c-4174-91cf-ba0b5c3f9230', nombre: 'galon de alcohol', descripcion: 'alcohol', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 7.50, fecha_compra: '2026-03-25', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b46566e1-cac4-48a6-8bf2-a6d92e2c5b4e', nombre: 'galon de quita esmalte', descripcion: 'quita esmalte', tipo: 'insumo', stock_actual: 112, stock_minimo: 112, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 19.13, fecha_compra: '2026-04-12', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '488054c7-ed48-46a3-9034-9c18dd99da85', nombre: 'sandalias paquete + 8 pares', descripcion: 'sandalias pedicura', tipo: 'insumo', stock_actual: 18, stock_minimo: 18, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.80, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '5ea1500d-ee0c-49b1-b61c-739ad2f6d137', nombre: 'galon removedor de cuticula', descripcion: 'removedor cuticula', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '272fc0d0-e310-466c-9f2c-b0c98b96255d', nombre: 'frasco de acetona pura', descripcion: 'acetona pura', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 13.04, fecha_compra: '2026-05-26', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '5efd8cd6-83a6-4cf2-9dae-26ee6842b23c', nombre: 'monomero', descripcion: 'monomero', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'f5bbd069-bfaf-46b2-a78b-c04eba488aa2', nombre: 'paquete desmaquillante', descripcion: 'desmaquillantes', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.60, fecha_compra: '2026-06-24', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '83696b40-f03d-4a22-967c-0295b9b281eb', nombre: 'wipe  algodón', descripcion: 'wipe algodón', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '7f189958-9523-45b9-aa8d-5666af66666d', nombre: 'wipe normal', descripcion: 'wipe normal', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.52, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a33f3c1b-59da-47cf-8440-d2b29b0ed08c', nombre: 'fundas pedicura', descripcion: 'fundas pedicura', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.07, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '41a532e8-46ba-4928-b512-9d23cc03b486', nombre: 'separadores rosados', descripcion: 'separador pedicura', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.43, fecha_compra: '2025-11-30', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '91ee542c-d406-4fd7-9eb7-f410634c53de', nombre: 'cofias', descripcion: 'cofias depilacion', tipo: 'insumo', stock_actual: 32, stock_minimo: 32, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '3b5cd29c-160a-48e7-b14b-d3f44903697e', nombre: 'agua de rosas', descripcion: 'agua de rosas', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 10.43, fecha_compra: '2026-06-26', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '223d5a65-07b5-4518-950a-24b5187edde4', nombre: 'aceite de naranja', descripcion: 'aceite naranja', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'c1ff62f6-01fb-4835-9054-50506368ee43', nombre: 'bulder gel clear Master nail', descripcion: 'tecnica de pintar', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '76efb4a3-3c2f-4e0f-bcec-734bac134ac0', nombre: 'bulder gel sky pink Master nail', descripcion: 'tecnica de pintar', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '50f5c27d-cf60-4fd6-aa98-53256350609e', nombre: 'white Master nail', descripcion: 'tecnica de pintado', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 6.83, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'c5c39667-4767-4140-a994-e923eccd5d23', nombre: 'bulder gel soft nude Master nail', descripcion: 'tecnica de pintado', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '98934b73-4880-421a-abd9-9e3ee7fb5dff', nombre: 'glan nails pink', descripcion: 'tecnica de pintado', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '84e98420-bb97-4835-8228-f383b9911adf', nombre: 'xeijayi', descripcion: 'gel solido', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '63266f7a-2821-406c-bc25-53974c0727b6', nombre: 'coqueta rubber base 4', descripcion: 'fortaleze  la uña', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.52, fecha_compra: '2026-02-11', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '54cd1533-89cb-438c-bc2f-c8f8f7d15bbe', nombre: 'coqueta rubber base 10', descripcion: 'fortaleze  la uña', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.52, fecha_compra: '2026-02-11', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '69e2b85f-b078-4d2c-ad21-909865350159', nombre: 'coqueta rubber 6', descripcion: 'fortaleze  la uña', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.30, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'e7f237e2-9cc6-43d2-8f1c-6e73f41af1c2', nombre: 'coqueta rubber  18', descripcion: 'fortaleze  la uña', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.30, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'ca2a7ba6-1ed7-4e06-8a04-c2486e734427', nombre: 'esmalte xeijayi', descripcion: 'Esmaltes de alta duración', tipo: 'insumo', stock_actual: 20, stock_minimo: 20, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '61f49481-c608-4876-8284-c7943a8ce6a1', nombre: 'ojo de gato linda', descripcion: 'ojo de gato', tipo: 'insumo', stock_actual: 11, stock_minimo: 11, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.17, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a93886dc-16f2-4c16-bb63-a8b5fe699e8a', nombre: 'coqueta superbright ojo de gato', descripcion: 'ojo de gato', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.17, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'ae46ed56-9fd9-4c63-8941-32f6bf9a9f11', nombre: 'L &D OJO  de gato', descripcion: 'ojo de gato', tipo: 'insumo', stock_actual: 6, stock_minimo: 6, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.61, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '2ccef1a9-bdf2-42cf-9034-58e3d6832a78', nombre: 'Addict ojo de gato', descripcion: 'ojo de gato', tipo: 'insumo', stock_actual: 3, stock_minimo: 3, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'b25f25f1-9161-4ddc-919a-b6389b72e45f', nombre: 'linda escarcha', descripcion: 'esmalte escarcha de uña', tipo: 'insumo', stock_actual: 7, stock_minimo: 7, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 2.17, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1d7fa04c-fc64-4ebc-99fb-00a3aa0e53c9', nombre: 'glan nail gel polish', descripcion: 'gel de uñas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '317a601b-1965-4631-8e60-79a800e91164', nombre: 'bolas efervecentes', descripcion: 'bola efervecente', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 10.00, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '0775e01f-4e15-4093-ba1c-53cca0ae5c21', nombre: 'caja de peitn de temo', descripcion: 'peitin', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.20, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '8339006b-1c9f-45fb-96e0-f7fa13675377', nombre: 'caja de esponjas para difuminar', descripcion: 'para difuminar', tipo: 'insumo', stock_actual: 1, stock_minimo: 1, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 0.87, fecha_compra: '2026-01-14', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '242cc8c8-134d-4b4f-9f76-ad3200505dbe', nombre: 'aceite para cuticula revitalizador', descripcion: 'revitalizador de cuticula', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 1.74, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'a4f67943-f24d-4925-b722-9551dcbd4846', nombre: 'rimel gel rosemary', descripcion: 'rimel', tipo: 'insumo', stock_actual: 5, stock_minimo: 5, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '1ef527e1-65ef-4381-91de-c6998d92f81f', nombre: 'rimel  prosa  mascara', descripcion: 'rimel lifting', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 4.35, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: '2617e60d-35c6-4b32-ba58-4a1c680721a6', nombre: 'piedreria', descripcion: 'piedras decorativas uñas', tipo: 'insumo', stock_actual: 12, stock_minimo: 12, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.50, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'bbe45958-69ac-4b81-a4a2-ea8e8127906b', nombre: 'cajas de sof gel tips', descripcion: 'uñas postizas', tipo: 'insumo', stock_actual: 2, stock_minimo: 2, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.22, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
  { id: 'dc5434c7-0942-4c69-8503-6ff541ea84fc', nombre: 'cajas de polygel', descripcion: 'uñas postizas', tipo: 'insumo', stock_actual: 5, stock_minimo: 5, precio_venta: null, proveedor: 'Distribuidor General', proveedor_ruc: 'None', precio_costo: 3.00, fecha_compra: '2026-06-01', fecha_actualizacion_stock: '2026-06-01', sucursal_id: '11111111-1111-1111-1111-111111111111' },
]

const MOCK_SUCURSALES = [
  { id: '11111111-1111-1111-1111-111111111111', nombre: 'Matriz Central', direccion: 'Av. de los Granados y Av. Eloy Alfaro' },
  { id: '22222222-2222-2222-2222-222222222222', nombre: 'Sucursal Norte', direccion: 'Av. El Inca y Amazonas' },
  { id: '33333333-3333-3333-3333-333333333333', nombre: 'Sucursal Sur', direccion: 'Av. Maldonado y El Recreo' }
]

const MOCK_USUARIOS = [
  { id: 'u1', username: 'dueno', password: '123', nombre: 'Propietaria General', rol: 'Dueño', sucursal_id: null },
  { id: 'u2', username: 'gerente_norte', password: '123', nombre: 'Gerente Norte', rol: 'Gerente', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'u3', username: 'admin_norte', password: '123', nombre: 'Admin Norte', rol: 'Administrador', sucursal_id: '22222222-2222-2222-2222-222222222222' },
  { id: 'u4', username: 'gerente_sur', password: '123', nombre: 'Gerente Sur', rol: 'Gerente', sucursal_id: '33333333-3333-3333-3333-333333333333' },
  { id: 'u5', username: 'admin_sur', password: '123', nombre: 'Admin Sur', rol: 'Administrador', sucursal_id: '33333333-3333-3333-3333-333333333333' }
]

// Inicializar almacenamiento local si no existe para el modo demo
const initLocalStorage = () => {
  if (!localStorage.getItem('blush_personal')) localStorage.setItem('blush_personal', JSON.stringify(MOCK_PERSONAL))
  if (!localStorage.getItem('blush_servicios')) localStorage.setItem('blush_servicios', JSON.stringify(MOCK_SERVICIOS))
  if (!localStorage.getItem('blush_clientes')) localStorage.setItem('blush_clientes', JSON.stringify(MOCK_CLIENTES))
  if (!localStorage.getItem('blush_citas')) localStorage.setItem('blush_citas', JSON.stringify(MOCK_CITAS))
  if (!localStorage.getItem('blush_gastos')) localStorage.setItem('blush_gastos', JSON.stringify(MOCK_GASTOS))
  const storedProds = localStorage.getItem('blush_productos')
  if (!storedProds || JSON.parse(storedProds).length <= 4) {
    localStorage.setItem('blush_productos', JSON.stringify(MOCK_PRODUCTOS))
  }
  if (!localStorage.getItem('blush_sucursales')) localStorage.setItem('blush_sucursales', JSON.stringify(MOCK_SUCURSALES))
  if (!localStorage.getItem('blush_usuarios')) localStorage.setItem('blush_usuarios', JSON.stringify(MOCK_USUARIOS))
  if (!localStorage.getItem('blush_reposiciones')) localStorage.setItem('blush_reposiciones', JSON.stringify([]))
}
initLocalStorage()

const getLocal = (key) => JSON.parse(localStorage.getItem(key))
const setLocal = (key, data) => localStorage.setItem(key, JSON.stringify(data))

// ============================================================================
// CONEXIÓN INTEGRAL - DB O LOCAL STORAGE
// ============================================================================

export const dataService = {
  // In-memory cache for high-speed local data fetching (Senior usability performance)
  _cache: {
    personal: null,
    servicios: null,
    clientes: null,
    citas: null,
    gastos: null,
    productos: null,
    sucursales: null
  },

  clearCache(key) {
    if (key) {
      this._cache[key] = null
    } else {
      Object.keys(this._cache).forEach(k => {
        this._cache[k] = null
      })
    }
  },

  isDemoMode() {
    return sessionStorage.getItem('blush_demo_mode') === 'true'
  },

  setDemoMode(active) {
    sessionStorage.setItem('blush_demo_mode', active ? 'true' : 'false')
    updateSupabaseConfigState()
    this.clearCache()
  },

  restablecerBaseDemo() {
    localStorage.removeItem('blush_personal')
    localStorage.removeItem('blush_servicios')
    localStorage.removeItem('blush_clientes')
    localStorage.removeItem('blush_citas')
    localStorage.removeItem('blush_gastos')
    localStorage.removeItem('blush_productos')
    localStorage.removeItem('blush_sucursales')
    localStorage.removeItem('blush_usuarios')
    localStorage.removeItem('blush_reposiciones')
    initLocalStorage()
    this.clearCache()
  },

  // --- PERSONAL ---
  async getPersonal() {
    if (this._cache.personal) return this._cache.personal
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('personal').select('*').order('nombre')
      if (error) throw error
      this._cache.personal = data
      return data
    }
    const local = getLocal('blush_personal')
    this._cache.personal = local
    return local
  },

  async registrarPersonal(persona) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('personal').insert([persona]).select()
      if (error) throw error
      this.clearCache('personal')
      return data[0]
    }
    const list = getLocal('blush_personal') || []
    const nuevo = { ...persona, id: 'p_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_personal', list)
    this.clearCache('personal')
    return nuevo
  },

  async actualizarPersonal(id, persona) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('personal').update(persona).eq('id', id).select()
      if (error) throw error
      this.clearCache('personal')
      return data[0]
    }
    const list = getLocal('blush_personal') || []
    const index = list.findIndex(i => i.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...persona }
      setLocal('blush_personal', list)
      this.clearCache('personal')
      return list[index]
    }
  },

  resolverNombreEstandar(nombre) {
    if (!nombre) return 'Sin asignar'
    const n = nombre.toLowerCase().trim()
    if (n.startsWith('sof') || n.startsWith('sop')) return 'Sofia'
    if (n.startsWith('liz')) return 'Liz'
    if (n.startsWith('pam') || n === 'pame') return 'Pamela'
    if (n.startsWith('rox') || n === 'roxy') return 'Roxana'
    if (n.startsWith('cec') || n === 'ceci') return 'Cecilia'
    if (n.startsWith('silv') || n === 'silvy') return 'Silvia'
    return nombre.charAt(0).toUpperCase() + nombre.slice(1)
  },

  // --- SERVICIOS ---
  async getServicios() {
    if (this._cache.servicios) return this._cache.servicios
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').select('*').order('nombre')
      if (error) throw error
      this._cache.servicios = data
      return data
    }
    const local = getLocal('blush_servicios')
    this._cache.servicios = local
    return local
  },

  async registrarServicio(svc) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').insert([svc]).select()
      if (error) throw error
      this.clearCache('servicios')
      return data[0]
    }
    const list = getLocal('blush_servicios')
    const nuevo = { ...svc, id: 's_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_servicios', list)
    this.clearCache('servicios')
    return nuevo
  },

  async actualizarServicio(id, svc) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('servicios').update(svc).eq('id', id).select()
      if (error) throw error
      this.clearCache('servicios')
      return data[0]
    }
    const list = getLocal('blush_servicios')
    const index = list.findIndex(i => i.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...svc }
      setLocal('blush_servicios', list)
      this.clearCache('servicios')
      return list[index]
    }
  },

  async eliminarServicio(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('servicios').delete().eq('id', id)
      if (error) throw error
      this.clearCache('servicios')
      return true
    }
    const list = getLocal('blush_servicios')
    const filtered = list.filter(i => i.id !== id)
    setLocal('blush_servicios', filtered)
    this.clearCache('servicios')
    return true
  },

  // --- CLIENTES ---
  async getClientes() {
    if (this._cache.clientes) return this._cache.clientes
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('clientes').select('*').order('nombre')
      if (error) throw error
      this._cache.clientes = data
      return data
    }
    const local = getLocal('blush_clientes')
    this._cache.clientes = local
    return local
  },

  async registrarCliente(cliente) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('clientes').insert([cliente]).select()
      if (error) throw error
      this.clearCache('clientes')
      return data[0]
    }
    const list = getLocal('blush_clientes')
    const nuevo = { ...cliente, id: 'c_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_clientes', list)
    this.clearCache('clientes')
    return nuevo
  },

  async actualizarCliente(id, cliente) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('clientes').update(cliente).eq('id', id).select()
      if (error) throw error
      this.clearCache('clientes')
      return data[0]
    }
    const list = getLocal('blush_clientes')
    const index = list.findIndex(c => c.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...cliente }
      setLocal('blush_clientes', list)
      this.clearCache('clientes')
      return list[index]
    }
  },

  async eliminarCliente(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('clientes').delete().eq('id', id)
      if (error) throw error
      this.clearCache('clientes')
      return true
    }
    const list = getLocal('blush_clientes')
    const filtered = list.filter(c => c.id !== id)
    setLocal('blush_clientes', filtered)
    this.clearCache('clientes')
    return true
  },

  async eliminarGrupoCitas(clienteId, fechaHora) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('citas_ventas').delete().eq('cliente_id', clienteId).eq('fecha_hora', fechaHora)
      if (error) throw error
      this.clearCache('citas')
      return true
    }
    const list = getLocal('blush_citas')
    const filtered = list.filter(c => !(c.cliente_id === clienteId && c.fecha_hora === fechaHora))
    setLocal('blush_citas', filtered)
    this.clearCache('citas')
    return true
  },

  // --- CITAS / VENTAS ---
  async getCitasVentas() {
    const branchId = this.getSelectedBranchId()
    let data;
    if (this._cache.citas) {
      data = this._cache.citas
    } else {
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase
          .from('citas_ventas')
          .select(`
            id, fecha_hora, valor_pagado, forma_pago, no_transferencia, sucursal_id,
            cliente_id, servicio_id, personal_id,
            clientes (id, nombre, cedula, celular, correo),
            servicios (id, nombre, precio_base, frecuencia_recomendada_dias),
            personal (id, nombre)
          `)
        if (error) throw error
        const mapped = dbData.map(c => {
          if (c.personal && c.personal.nombre) {
            c.personal.nombre = this.resolverNombreEstandar(c.personal.nombre)
          }
          return c
        })
        this._cache.citas = mapped
        data = mapped
      } else {
        const citas = getLocal('blush_citas') || []
        const clientes = getLocal('blush_clientes') || []
        const servicios = getLocal('blush_servicios') || []
        const personal = getLocal('blush_personal') || []
        
        const localJoined = citas.map(c => {
          const pers = personal.find(p => p.id === c.personal_id) || {}
          if (pers.nombre) {
            pers.nombre = this.resolverNombreEstandar(pers.nombre)
          }
          return {
            ...c,
            clientes: clientes.find(cl => cl.id === c.cliente_id) || {},
            servicios: servicios.find(s => s.id === c.servicio_id) || {},
            personal: pers
          }
        })
        this._cache.citas = localJoined
        data = localJoined
      }
    }

    const filtered = branchId ? data.filter(c => c.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora))
  },

  async registrarCitaVenta(cita) {
    if (['Deuna', 'Transferencia'].includes(cita.forma_pago) && (!cita.no_transferencia || cita.no_transferencia.trim() === '')) {
      throw new Error(`El número de transferencia/referencia es requerido para ${cita.forma_pago}`)
    }

    // Auto-asignar sucursal del creador
    const user = this.getCurrentUser()
    const citaConSucursal = { 
      ...cita, 
      sucursal_id: cita.sucursal_id || (user ? user.sucursal_id : null) 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('citas_ventas').insert([citaConSucursal]).select()
      if (error) throw error
      this.clearCache('citas')
      return data[0]
    }

    const list = getLocal('blush_citas')
    const nuevo = { ...citaConSucursal, id: 'v_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_citas', list)
    this.clearCache('citas')
    return nuevo
  },

  async registrarGrupoCitas(citasArray) {
    const user = this.getCurrentUser()
    const citasConSucursal = citasArray.map(c => ({
      ...c,
      sucursal_id: c.sucursal_id || (user ? user.sucursal_id : null)
    }))

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('citas_ventas').insert(citasConSucursal).select()
      if (error) throw error
      this.clearCache('citas')
      return data
    }
    const list = getLocal('blush_citas')
    const nuevos = citasConSucursal.map((c, idx) => ({ 
      ...c, 
      id: 'v_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2, 9) 
    }))
    list.push(...nuevos)
    setLocal('blush_citas', list)
    this.clearCache('citas')
    return nuevos
  },

  async actualizarComprobanteMasivo(idsArray, comprobante) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('citas_ventas')
        .update({ no_transferencia: comprobante })
        .in('id', idsArray)
        .select()
      if (error) throw error
      this.clearCache('citas')
      return data
    }
    const list = getLocal('blush_citas')
    const updated = list.map(c => {
      if (idsArray.includes(c.id)) {
        return { ...c, no_transferencia: comprobante }
      }
      return c
    })
    setLocal('blush_citas', updated)
    this.clearCache('citas')
    return true
  },

  // --- GASTOS ---
  async getGastos() {
    const branchId = this.getSelectedBranchId()
    let data;
    if (this._cache.gastos) {
      data = this._cache.gastos
    } else {
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase.from('gastos').select('*')
        if (error) throw error
        this._cache.gastos = dbData
        data = dbData
      } else {
        const local = getLocal('blush_gastos') || []
        this._cache.gastos = local
        data = local
      }
    }
    const filtered = branchId ? data.filter(g => g.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
  },

  async registrarGasto(gasto) {
    const user = this.getCurrentUser()
    const gastoConSucursal = { 
      ...gasto, 
      sucursal_id: gasto.sucursal_id || (user ? user.sucursal_id : null) 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('gastos').insert([gastoConSucursal]).select()
      if (error) throw error
      this.clearCache('gastos')
      return data[0]
    }
    const list = getLocal('blush_gastos')
    const nuevo = { ...gastoConSucursal, id: 'g_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_gastos', list)
    this.clearCache('gastos')
    return nuevo
  },

  // --- PRODUCTOS (INVENTARIO) ---
  async getProductos() {
    const branchId = this.getSelectedBranchId()
    let data;
    if (this._cache.productos) {
      data = this._cache.productos
    } else {
      if (isSupabaseConfigured) {
        const { data: dbData, error } = await supabase.from('productos').select('*')
        if (error) throw error
        this._cache.productos = dbData
        data = dbData
      } else {
        const local = getLocal('blush_productos') || []
        this._cache.productos = local
        data = local
      }
    }
    const filtered = branchId ? data.filter(p => p.sucursal_id === branchId) : data
    return [...filtered].sort((a, b) => a.nombre.localeCompare(b.nombre))
  },

  async registrarProducto(prod) {
    const user = this.getCurrentUser()
    const prodConSucursal = { 
      ...prod, 
      sucursal_id: prod.sucursal_id || (user ? user.sucursal_id : null) 
    }

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('productos').insert([prodConSucursal]).select()
      if (error) throw error
      this.clearCache('productos')
      return data[0]
    }
    const list = getLocal('blush_productos')
    const nuevo = { ...prodConSucursal, id: 'pr_' + Date.now() }
    list.push(nuevo)
    setLocal('blush_productos', list)
    this.clearCache('productos')
    return nuevo
  },

  async actualizarProducto(id, prod) {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('productos').update(prod).eq('id', id).select()
      if (error) throw error
      this.clearCache('productos')
      return data[0]
    }
    const list = getLocal('blush_productos')
    const index = list.findIndex(i => i.id === id)
    if (index !== -1) {
      list[index] = { ...list[index], ...prod }
      setLocal('blush_productos', list)
      this.clearCache('productos')
      return list[index]
    }
  },

  async eliminarProducto(id) {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('productos').delete().eq('id', id)
      if (error) throw error
      this.clearCache('productos')
      return true
    }
    const list = getLocal('blush_productos')
    const filtered = list.filter(i => i.id !== id)
    setLocal('blush_productos', filtered)
    this.clearCache('productos')
    return true
  },

  // ============================================================================
  // CÁLCULOS FINANCIEROS Y CRM (OPTIMIZACIÓN SENIOR - 0ms NETWORK RETRIES)
  // ============================================================================

  // Conciliación Financiera (Ingresos - Egresos = Utilidad)
  async getConciliacionFinanciera(fechaInicio, fechaFin) {
    const citas = await this.getCitasVentas()
    const gastos = await this.getGastos()

    const start = new Date(fechaInicio + 'T00:00:00')
    const end = new Date(fechaFin + 'T23:59:59')

    const totalIngresos = citas
      .filter(c => {
        const d = new Date(c.fecha_hora)
        return d >= start && d <= end
      })
      .reduce((sum, c) => sum + Number(c.valor_pagado), 0)

    const totalEgresos = gastos
      .filter(g => {
        const d = new Date(g.fecha + 'T00:00:00')
        return d >= start && d <= end
      })
      .reduce((sum, g) => sum + Number(g.total), 0)

    return {
      total_ingresos: totalIngresos,
      total_egresos: totalEgresos,
      utilidad_neta: totalIngresos - totalEgresos
    }
  },

  // Ingresos agrupados por forma de pago
  async getIngresosAgrupados(fechaInicio, fechaFin) {
    const citas = await this.getCitasVentas()
    const start = new Date(fechaInicio + 'T00:00:00')
    const end = new Date(fechaFin + 'T23:59:59')

    const filtrados = citas.filter(c => {
      const d = new Date(c.fecha_hora)
      return d >= start && d <= end
    })

    const agrupados = filtrados.reduce((acc, c) => {
      const fp = c.forma_pago
      if (!acc[fp]) {
        acc[fp] = { forma_pago: fp, cantidad_transacciones: 0, total_ingresos: 0 }
      }
      acc[fp].cantidad_transacciones += 1
      acc[fp].total_ingresos += Number(c.valor_pagado)
      return acc
    }, {})

    return Object.values(agrupados)
  },

  // CRM: Clientes por recontactar (Solución del error sucursal_id de la vista DB)
  async getClientesPorRecontactar() {
    const branchId = this.getSelectedBranchId()
    
    // Fetch base tables with memory caching
    const citas = await this.getCitasVentas()
    const clientes = await this.getClientes()
    const servicios = await this.getServicios()

    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    // Agrupar última cita de cada cliente para cada servicio
    const ultimasCitas = {}
    const citasFiltradas = branchId ? citas.filter(c => c.sucursal_id === branchId) : citas
    
    citasFiltradas.forEach(c => {
      const clienteId = c.cliente_id || (c.clientes ? c.clientes.id : null)
      const servicioId = c.servicio_id || (c.servicios ? c.servicios.id : null)
      if (!clienteId || !servicioId) return

      const key = `${clienteId}_${servicioId}`
      const cDate = new Date(c.fecha_hora)
      if (!ultimasCitas[key] || cDate > new Date(ultimasCitas[key].fecha_hora)) {
        ultimasCitas[key] = {
          ...c,
          clienteId,
          servicioId
        }
      }
    })

    const porRecontactar = []
    Object.values(ultimasCitas).forEach(uc => {
      const servicio = servicios.find(s => s.id === uc.servicioId)
      if (!servicio || !servicio.frecuencia_recomendada_dias) return

      const cliente = clientes.find(c => c.id === uc.clienteId)
      if (!cliente) return

      const fechaUltima = new Date(uc.fecha_hora)
      fechaUltima.setHours(0,0,0,0)
      
      const proximaFecha = new Date(fechaUltima)
      proximaFecha.setDate(fechaUltima.getDate() + servicio.frecuencia_recomendada_dias)

      const diffTime = hoy - proximaFecha
      const diasRetraso = Math.round(diffTime / (1000 * 60 * 60 * 24))

      porRecontactar.push({
        cliente_id: cliente.id,
        cliente_nombre: cliente.nombre,
        cliente_celular: cliente.celular || 'N/A',
        cliente_correo: cliente.correo || 'N/A',
        servicio_id: servicio.id,
        servicio_nombre: servicio.nombre,
        frecuencia_recomendada_dias: servicio.frecuencia_recomendada_dias,
        ultima_cita_fecha: uc.fecha_hora.includes('T') ? uc.fecha_hora.split('T')[0] : uc.fecha_hora,
        proxima_cita_sugerida: proximaFecha.toISOString().split('T')[0],
        dias_retraso: diasRetraso,
        sucursal_id: uc.sucursal_id
      })
    })

    return porRecontactar.sort((a, b) => b.dias_retraso - a.dias_retraso)
  },

  // --- SUCURSALES ---
  async getSucursales() {
    if (this._cache.sucursales) return this._cache.sucursales
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('sucursales').select('*').order('nombre')
      if (error) throw error
      this._cache.sucursales = data
      return data
    }
    const local = getLocal('blush_sucursales') || MOCK_SUCURSALES
    this._cache.sucursales = local
    return local
  },

  // --- HISTORIAL DE REPOSICIÓN ---
  async getReposiciones(productoId) {
    if (isSupabaseConfigured) {
      const { data: dbData, error } = await supabase.from('registro_reposiciones_inventario').select('*').eq('producto_id', productoId).order('creado_en', { ascending: false })
      if (error) throw error
      return dbData
    }
    const repos = getLocal('blush_reposiciones') || []
    return repos.filter(r => r.producto_id === productoId).sort((a,b) => new Date(b.creado_en) - new Date(a.creado_en))
  },

  async getTodasReposiciones() {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase.from('registro_reposiciones_inventario').select('*').order('creado_en', { ascending: false })
      if (error) throw error
      return data
    }
    return getLocal('blush_reposiciones') || []
  },

  async registrarReposicion(productoId, cantidad, fecha) {
    const reposiciones = getLocal('blush_reposiciones') || []
    const productos = getLocal('blush_productos') || []
    
    const prodIdx = productos.findIndex(p => p.id === productoId)
    if (prodIdx === -1) throw new Error('Producto no encontrado.')
    
    const p = productos[prodIdx]
    const stockAnterior = p.stock_actual
    const fechaAnterior = p.fecha_actualizacion_stock || p.fecha_compra || new Date().toISOString().split('T')[0]
    
    const nuevoStock = stockAnterior + cantidad
    productos[prodIdx] = { 
      ...p, 
      stock_actual: nuevoStock,
      fecha_actualizacion_stock: fecha
    }
    setLocal('blush_productos', productos)

    const nuevaReposicion = {
      id: 'rep_' + Date.now(),
      producto_id: productoId,
      stock_anterior: stockAnterior,
      fecha_anterior: fechaAnterior,
      cantidad_reposicion: cantidad,
      fecha_reposicion: fecha,
      creado_en: new Date().toISOString()
    }

    if (isSupabaseConfigured) {
      const { error: err1 } = await supabase.from('productos').update({ stock_actual: nuevoStock, fecha_actualizacion_stock: fecha }).eq('id', productoId)
      if (err1) throw err1
      const { error: err2 } = await supabase.from('registro_reposiciones_inventario').insert([nuevaReposicion])
      if (err2) throw err2
    }

    reposiciones.push(nuevaReposicion)
    setLocal('blush_reposiciones', reposiciones)
    this.clearCache('productos')
    return nuevaReposicion;
  },

  // --- AUTENTICACIÓN ---
  _currentBranchId: null,

  setSelectedBranchId(id) {
    this._currentBranchId = id;
    sessionStorage.setItem('blush_selected_branch_id', id || 'todas');
  },

  getSelectedBranchId() {
    if (!this._currentBranchId) {
      const stored = sessionStorage.getItem('blush_selected_branch_id');
      this._currentBranchId = (stored === 'todas') ? null : (stored || null);
    }
    return this._currentBranchId;
  },

  getCurrentUser() {
    const userStr = sessionStorage.getItem('blush_current_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  validarCedulaEcuatoriana(cedula) {
    if (typeof cedula !== 'string') return false;
    if (!/^\d{10}$/.test(cedula)) return false;

    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || (provincia > 24 && provincia !== 30)) {
      return false;
    }

    const tercerDigito = parseInt(cedula.charAt(2), 10);
    if (tercerDigito < 0 || tercerDigito > 5) {
      return false;
    }

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula.charAt(i), 10) * coeficientes[i];
      if (valor >= 10) {
        valor -= 9;
      }
      suma += valor;
    }

    const verificadorObtenido = (10 - (suma % 10)) % 10;
    const verificadorReal = parseInt(cedula.charAt(9), 10);

    return verificadorObtenido === verificadorReal;
  },

  async login(username, password) {
    const users = getLocal('blush_usuarios') || MOCK_USUARIOS;
    const found = users.find(u => u.username.toLowerCase() === username.toLowerCase().trim() && u.password === password);
    if (!found) {
      throw new Error('Usuario o contraseña incorrectos.');
    }
    sessionStorage.setItem('blush_current_user', JSON.stringify(found));
    if (found.rol === 'Dueño') {
      this.setSelectedBranchId(null);
    } else {
      this.setSelectedBranchId(found.sucursal_id);
    }
    return found;
  },

  async logout() {
    sessionStorage.removeItem('blush_current_user');
    sessionStorage.removeItem('blush_selected_branch_id');
    this._currentBranchId = null;
  }
}
