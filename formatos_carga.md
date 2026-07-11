# 📋 Guías y Formatos de Carga de Datos Masivos

Este documento describe la estructura y el formato que deben tener los archivos (CSV/Excel) para migrar o cargar de forma masiva los datos iniciales al sistema **Blush Beauty Studio**.

---

## 📌 Recomendaciones Generales Importantes

> [!IMPORTANT]
> * **Formato de Fechas**: Todas las fechas deben ingresarse estrictamente en formato `AAAA-MM-DD` (ej. `2026-06-24`). Las fechas con hora deben usar el formato ISO `AAAA-MM-DDTHH:MM:SSZ` (ej. `2026-06-24T15:30:00Z`).
> * **Preservación de Ceros a la Izquierda (RUC y Cédula)**: Tanto las cédulas como los RUCs de Ecuador a menudo comienzan con `0` (ej. `0987654321` o `0987654321001`). En Microsoft Excel, formatee estas columnas como **Texto** antes de escribir el número, de lo contrario Excel eliminará el cero inicial.
> * **Separadores Decimales**: Utilice el punto `.` como separador decimal para valores monetarios (ej. `12.50` en lugar de `12,50`).
> * **Nombres de Columnas**: Respete las minúsculas y los guiones bajos tal como se definen en las estructuras de la base de datos de PostgreSQL en Supabase.

---

## 1. Catálogo de Inventario (`productos`)

Contiene los insumos para uso del local y los productos disponibles para la reventa al cliente final.

### Columnas y Tipos de Datos
| Columna | Tipo de Dato | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | Texto (Max 255) | **Sí** | Nombre único del producto | Esmalte Gel Pro Rosa |
| `descripcion` | Texto | No | Detalle o marca del producto | Esmalte de alta duración OPI |
| `tipo` | Texto | **Sí** | Debe ser `insumo` (uso del local) o `reventa` (venta al público) | `insumo` |
| `stock_actual` | Entero | **Sí** | Cantidad actual en inventario | `12` |
| `stock_minimo` | Entero | **Sí** | Umbral mínimo para alertas de stock (por defecto `4`) | `4` |
| `precio_venta` | Decimal | Condicional | Requerido únicamente si `tipo` es `reventa` | `7.50` |
| `proveedor` | Texto (Max 255) | No | Nombre del proveedor o distribuidor | OPI Distribuidor |
| `proveedor_ruc` | Texto (Max 50) | No | RUC de 13 dígitos del proveedor (solo números) | `1792938475001` |
| `precio_costo` | Decimal | No | Precio al que se compró el producto | `3.50` |
| `fecha_compra` | Fecha | No | Fecha de compra (`AAAA-MM-DD`) | `2026-05-01` |

### Ejemplo CSV (`productos.csv`)
```csv
nombre,descripcion,tipo,stock_actual,stock_minimo,precio_venta,proveedor,proveedor_ruc,precio_costo,fecha_compra
Esmaltes Gel Pro,Esmaltes de alta duración,insumo,12,4,,OPI Distribuidor,1792938475001,3.50,2026-05-01
Removedor de acrílico premium,Líquido removedor rápido,insumo,3,4,,Belleza Total S.A.,1792223334001,8.00,2026-05-15
Aceite de cutícula coco 15ml,Para reventa al cliente,reventa,8,4,7.50,Cosméticos Ec,1794445556001,3.00,2026-06-01
```

---

## 2. Catálogo de Servicios (`servicios`)

Lista de tratamientos y servicios que realiza Blush Beauty Studio.

### Columnas y Tipos de Datos
| Columna | Tipo de Dato | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | Texto (Max 255) | **Sí** | Nombre único del servicio | Nivelación Rubber |
| `precio_base` | Decimal | **Sí** | Precio estándar del servicio sin promociones | `25.00` |
| `duracion_minutos` | Entero | **Sí** | Duración estimada del servicio en minutos | `45` |
| `frecuencia_recomendada_dias` | Entero | No | Días recomendados para repetir el tratamiento (CRM) | `21` |

### Ejemplo CSV (`servicios.csv`)
```csv
nombre,precio_base,duracion_minutos,frecuencia_recomendada_dias
Baño de acrílico,35.00,60,21
Nivelación Rubber,25.00,45,21
Pedicura tradicional,15.00,30,30
Keratina,90.00,120,90
Cejas HD,12.00,20,15
```

---

## 3. Registro de Clientes (`clientes`)

Base de datos de clientes para marketing, CRM y fidelización.

### Columnas y Tipos de Datos
| Columna | Tipo de Dato | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `nombre` | Texto (Max 255) | **Sí** | Nombre y apellido del cliente | Mayra Lojano |
| `cedula` | Texto (Max 50) | No | Cédula de 10 dígitos (solo números) | `1723456789` |
| `celular` | Texto (Max 50) | No | Número de celular (10 dígitos) | `0987654321` |
| `correo` | Texto (Max 255) | No | Correo electrónico de contacto | `mayra@example.com` |
| `medio_contacto` | Texto (Max 100) | No | Canal preferido o cómo nos conoció | WhatsApp / Instagram |
| `fecha_nacimiento` | Fecha | No | Fecha de nacimiento / cumpleaños (`AAAA-MM-DD`) | `1995-04-12` |

### Ejemplo CSV (`clientes.csv`)
```csv
nombre,cedula,celular,correo,medio_contacto,fecha_nacimiento
Mayra Lojano,1723456789,0987654321,mayra@example.com,WhatsApp,1995-04-12
Carla Poveda,1712345678,0998877665,carla@example.com,Instagram,1992-09-24
Angelita Flores,1709876543,0988776655,angelita@example.com,WhatsApp,1988-12-05
```

---

## 4. Registro de Egresos / Gastos (`gastos`)

Salidas de caja por concepto de arriendos, compras de insumos, comisiones u otros egresos.

### Columnas y Tipos de Datos
| Columna | Tipo de Dato | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `fecha` | Fecha | **Sí** | Fecha en que se realizó el egreso (`AAAA-MM-DD`) | `2026-06-05` |
| `factura` | Texto (Max 100) | No | Código de factura, recibo o nota de venta | `FAC-001` |
| `cantidad` | Decimal | **Sí** | Cantidad de artículos o servicios pagados | `10` |
| `concepto` | Texto (Max 255) | **Sí** | Descripción o motivo de la compra | Guantes de nitrilo |
| `categoria` | Texto (Max 100) | **Sí** | Debe ser: `Insumos`, `Alquiler`, `Servicios Básicos`, `Nómina / Comisiones`, `Marketing / Publicidad`, `Equipos / Mobiliario` u `Otros` | `Insumos` |
| `valor_unitario` | Decimal | **Sí** | Costo unitario de la compra | `0.50` |
| `total` | Decimal | **Sí** | Valor total de la transacción (`cantidad * valor_unitario`) | `5.00` |
| `forma_pago` | Texto | **Sí** | Medio de pago: `Efectivo`, `Deuna`, `Transferencia` o `Tarjeta` | `Efectivo` |
| `cuenta` | Texto | **Sí** | Origen del dinero: `Caja Principal` o `Cuenta Corriente` | `Caja Principal` |

### Ejemplo CSV (`gastos.csv`)
```csv
fecha,factura,cantidad,concepto,categoria,valor_unitario,total,forma_pago,cuenta
2026-06-05,FAC-001,10,Guantes de nitrilo,Insumos,0.50,5.00,Efectivo,Caja Principal
2026-06-10,FAC-992,5,Pinceles de acrílico,Insumos,4.50,22.50,Deuna,Cuenta Corriente
2026-06-01,ARRIENDO-JUN,1,Arriendo del Local Blush,Alquiler,350.00,350.00,Transferencia,Cuenta Corriente
```

---

## 5. Transacciones / Citas y Ventas (`citas_ventas`)

Registro histórico de servicios prestados y cobrados.

> [!CAUTION]
> Para asociar citas a clientes, servicios o personal, se deben usar los IDs correctos (UUIDs) ya existentes en las tablas respectivas. Si está cargando datos de manera directa a la base de datos, primero cargue clientes, servicios y personal, y luego use sus IDs correspondientes en este archivo.

### Columnas y Tipos de Datos
| Columna | Tipo de Dato | Requerido | Descripción | Ejemplo |
| :--- | :--- | :--- | :--- | :--- |
| `cliente_id` | UUID / Texto | **Sí** | ID único del cliente de la tabla `clientes` | `c1` |
| `servicio_id` | UUID / Texto | **Sí** | ID único del servicio de la tabla `servicios` | `s1` |
| `personal_id` | UUID / Texto | **Sí** | ID único de la estilista de la tabla `personal` | `p1` |
| `fecha_hora` | Fecha + Hora | **Sí** | Fecha y hora del turno en formato ISO | `2026-06-01T10:00:00Z` |
| `valor_pagado` | Decimal | **Sí** | Valor neto cobrado al cliente | `35.00` |
| `forma_pago` | Texto | **Sí** | Medio de pago: `Efectivo`, `Deuna`, `Transferencia` o `Tarjeta` | `Deuna` |
| `no_transferencia` | Texto (Max 100) | Condicional | **Obligatorio** si `forma_pago` es `Deuna` o `Transferencia`. Número de referencia bancaria o comprobante. | `REF998877` |
| `sucursal_id` | UUID / Texto | No | ID de la sucursal donde se realizó la cita | `s1` |

### Ejemplo CSV (`citas_ventas.csv`)
```csv
cliente_id,servicio_id,personal_id,fecha_hora,valor_pagado,forma_pago,no_transferencia,sucursal_id
c1,s1,p1,2026-06-01T10:00:00Z,35.00,Deuna,REF998877,s1
c2,s2,p2,2026-06-15T14:30:00Z,25.00,Efectivo,,s2
c3,s3,p3,2026-05-20T09:00:00Z,15.00,Transferencia,TX123456,s3
```
