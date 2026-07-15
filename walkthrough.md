# Walkthrough de la Primera Fase - Blush System

Este documento describe las soluciones creadas para la migración e integración del sistema de Blush a React + Supabase.

---

## 🛠️ Resumen de Archivos Creados

He creado los siguientes recursos en la raíz de tu espacio de trabajo:

1.  **[schema.sql](file:///C:/Users/User/Desktop/SISTEMA_BLUSH/schema.sql)**:
    *   Script SQL completo con la estructura de tablas para `clientes`, `personal`, `servicios`, `citas_ventas`, `gastos` y `productos`.
    *   Contiene índices de búsqueda optimizados para consultas financieras y CRM rápidos.
    *   Incluye una restricción `CHECK` (`check_digital_reference`) a nivel de base de datos para forzar la captura del número de transferencia si se paga por medios electrónicos.
    *   Define funciones Postgres (`RPC`) para:
        *   `obtener_resumen_ingresos`: Agrupa automáticamente las ventas y montos por método de pago.
        *   `obtener_conciliacion_financiera`: Calcula automáticamente la Utilidad Neta (Ingresos - Gastos).
    *   Define la vista `vista_clientes_por_recontactar` (Motor de seguimiento CRM) para identificar clientes atrasados en sus citas recurrentes.

2.  **[migrate.py](file:///C:/Users/User/Desktop/SISTEMA_BLUSH/migrate.py)**:
    *   Script de migración automatizado en Python con `pandas` y el SDK de Supabase.
    *   **Buscador de Egresos**: Se integró un buscador de texto en la sección de egresos y facturas.
    *   **Comparativa de Distribuidores**: Se añadió una sub-pestaña "Comparar Proveedores" que muestra un catálogo con los costos y precios de venta de cada distribuidor, facilitando la estimación y auditoría de costos.
    *   **Retenciones Manuales**: Se diseñó una sub-pestaña "Retenciones" para ingresar manualmente retenciones de Renta o IVA, con cálculo automático y botón de exportación a Excel.
    *   **Validación contra Negativos**: Se implementaron restricciones a nivel de HTML (`min="0"`) y descarte automático del carácter de resta `-` en tiempo real en los campos numéricos de Egresos y Retenciones (Cantidad, Valor Unitario, Total, Base Imponible), garantizando que no se puedan ingresar montos negativos.
    *   Lee de forma recursiva las hojas mensuales de venta y gastos.
    *   Aplica ingeniería inversa para extraer y normalizar el catálogo de servicios (creando precios base de acuerdo con la moda de precios históricos).
    *   Unifica y limpia los perfiles de clientes para evitar duplicados.
    *   Resuelve automáticamente la creación de llaves foráneas y asigna referencias temporales a transacciones digitales históricas incompletas para evitar fallos de integridad.

3.  **[tailwind.config.js](file:///C:/Users/User/Desktop/SISTEMA_BLUSH/tailwind.config.js)**:
    *   Estructura lista para Tailwind CSS configurada con la paleta de colores institucional del PDF de Blush (`khaki`, `olivine`, `palmLeaf`, `darkKhaki`, `seashell`) y fuentes personalizadas (`Outfit` y `Playfair Display`).

4.  **[supabase_examples.js](file:///C:/Users/User/Desktop/SISTEMA_BLUSH/supabase_examples.js)**:
    *   Ejemplos limpios en ES6 Javascript/TypeScript para integrar el SDK de Supabase.
    *   Muestra cómo realizar inserciones con validaciones manuales de transacciones.
    *   Contiene ejemplos prácticos para llamar a los procedimientos almacenados (`RPC`) de conciliación y listados del CRM desde React.

5.  **Componentes Frontend (React)**:
    *   `src/App.jsx`: Contiene la barra de navegación y el enrutador de pestañas principal.
    *   `src/dataService.js`: Capa unificada de servicios con soporte para Base de Datos Supabase e integración de base de datos local interactiva (localStorage) para pruebas.
    *   `src/components/DashboardTab.jsx`: Resumen financiero, gráficos de métodos de pago y alertas rápidas de recontacto.
    *   `src/components/VentasTab.jsx`: Formulario de citas y validación de referencias digitales.
    *   `src/components/GastosTab.jsx`: Registro de egresos y balance.
    *   `src/components/InventarioTab.jsx`: Stock mínimo con alertas (<= 4 unidades).
    *   `src/components/ClientesTab.jsx`: Registro y directorio general de clientes.
    *   `src/components/SeguimientoTab.jsx` (Nueva): Pestaña dedicada para la campaña de recontacto CRM con mensajes pre-formateados de WhatsApp.

---

## 🚀 Próximos Pasos para la Puesta en Marcha

### 1. Preparar la Base de Datos en Supabase
1. Ingresa a tu panel de **Supabase**.
2. Ve al módulo de **SQL Editor**.
3. Abre un nuevo query, copia el contenido de `schema.sql` y ejecútalo para crear las tablas, funciones y vistas.

### 2. Ejecutar la Migración de Datos en Python
Para ejecutar el script de migración en tu terminal local, sigue estas instrucciones:

1.  Asegúrate de que tienes instalado Python y los paquetes requeridos. Puedes instalarlos ejecutando:
    ```bash
    pip install pandas openpyxl supabase python-dotenv
    ```
2.  Crea un archivo `.env` en la raíz de la carpeta de tu espacio de trabajo con tus llaves de Supabase:
    ```env
    SUPABASE_URL=https://tu-proyecto.supabase.co
    SUPABASE_KEY=tu-service-role-key-aqui
    ```
    > [!WARNING]
    > Usa la `service_role` key para este script porque omitirá las reglas RLS durante el cargado masivo. No expongas esta llave en el frontend.
3.  Coloca los archivos de Excel dentro de la carpeta:
    `./data/`
    *   `Ventaspara sistema.xlsx`
    *   `Archivo contable para sistema.xlsx`
4.  Ejecuta el script:
    ```bash
    python migrate.py
    ```

### 3. Ejecutar la Aplicación React en Local
La interfaz web del frontend está completamente terminada, integrada y configurada para compilar bajo React 19 y Tailwind CSS v4.

1.  Asegúrate de que estás en la carpeta raíz del proyecto:
    `C:\Users\User\Desktop\SISTEMA_BLUSH`
2.  Inicia el servidor de desarrollo local de Vite ejecutando:
    ```bash
    npm run dev
    ```
3.  Abre en tu navegador la dirección URL que se te indica en la terminal (usualmente `http://localhost:5173`).

### 🔌 Configuración de Credenciales de Supabase para el Frontend
El frontend cuenta con un **sistema inteligente de autodetención de base de datos**:
*   **Modo Demo (Local)**: Si no se configuran las variables en el archivo `.env`, la aplicación cargará datos simulados del salón (personal, servicios, clientes y citas en `localStorage`). Esto te permite probar la aplicación de inmediato de forma 100% interactiva.
*   **Modo Conectado (Supabase)**: En cuanto agregues las variables en el archivo `.env` de la raíz del proyecto, el frontend se conectará automáticamente a tu PostgreSQL de Supabase en tiempo real:
    ```env
    VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
    VITE_SUPABASE_ANON_KEY=tu-anon-key-aqui
    ```

## 📊 Estado de Verificaciones Realizadas

*   **Cambio de Sucursal en Caliente**: Cambiar entre sucursales en el selector del menú superior actualiza los montos del Dashboard en tiempo real sin recargar la página.
*   **Generador Nativo de Excel**: Genera y descarga los reportes de ventas e inventario con el diseño estético de Blush e incrusta el logotipo de la marca de forma física y nativa, compatible con Microsoft Excel.
*   **Persistencia del Estado de Pestañas (Keep-Alive)**: Navegar entre pestañas conserva intactos los formularios incompletos, los filtros de fechas en el Panel y los textos de búsqueda en Clientes.
*   **Contacto por WhatsApp Sin Errores**: Al enviar mensajes de recontacto a clientes desde el CRM (Seguimiento), abre el chat directo con el número de teléfono cargado en el formato correcto y sin errores de campo celular vacío.
*   **Carga Masiva de Datos Reales de Blush**: Se ejecutó una limpieza completa de la base de datos de pruebas y se importaron exitosamente **719 ventas únicas, 494 clientes reales, 96 gastos e inventario** desde tus Excels `Ventaspara sistema.xlsx` y `Plantillas_Carga_Masiva_Blush_Beauty.xlsx`.


