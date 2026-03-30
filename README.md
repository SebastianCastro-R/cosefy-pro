# Cosefy Pro - Sistema de Gestión para Taller de Arreglos

Sistema de gestión integral para talleres de arreglos y tintorerías. Administra pedidos, clientes, servicios y sucursales con seguimiento en tiempo real y métricas de negocio.

---

## Características

- **Gestión de Pedidos**: Recibe, procesa y entrega pedidos con seguimiento de estado
- **Catálogo de Clientes**: Registro y gestión de clientes con historial
- **Servicios**: Dobladillo, cierre, ajuste, tintado, planchado y más
- **Múltiples Sucursales**: Administración de varias ubicaciones
- **Métricas en Tiempo Real**: Dashboard con estadísticas del negocio
- **Notificaciones**: Alertas para clientes cuando el pedido está listo
- **Autenticación Segura**: Sistema de usuarios con roles (ADMIN, CAJERO)

---

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase
- **Database**: PostgreSQL (Supabase)
- **Auth**: Supabase Auth
- **State**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Icons**: Lucide React

---

## Requisitos Previos

- Node.js 18+
- Cuenta de Supabase (gratis)

---

## Configuración

### 1. Crear proyecto en Supabase

- Ir a https://supabase.com
- Crear nuevo proyecto
- Anotar `SUPABASE_URL` y `SUPABASE_ANON_KEY`

### 2. Configurar base de datos

- Ir a SQL Editor en Supabase
- Copiar y ejecutar el contenido de `supabase/schema.sql`

### 3. Instalar dependencias

```bash
cd cosefy-pro
npm install
```

### 4. Configurar variables de entorno

```bash
cp .env.example .env.local
# Editar .env.local con tus credenciales de Supabase
```

### 5. Ejecutar desarrollo

```bash
npm run dev
```

### 6. Abrir http://localhost:3000

---

## Crear usuario admin

1. En Supabase, ir a Authentication > Users
2. Crear nuevo usuario con email y contraseña
3. Ir a la tabla `perfiles` y actualizar el rol a 'ADMIN'

---

## Estructura del Proyecto

```
src/
├── app/              # Next.js App Router
│   ├── (auth)/       # Rutas de autenticación
│   │   └── login/    # Página de login
│   └── (dashboard)/  # Rutas protegidas
│       ├── dashboard/
│       ├── clientes/
│       ├── pedidos/
│       ├── metricas/
│       └── configuracion/
├── components/
│   ├── ui/           # Componentes base (Button, Input, Card...)
│   └── shared/       # Sidebar, Header
├── lib/
│   ├── supabase.ts   # Cliente de Supabase
│   └── utils.ts      # Utilidades
├── stores/           # Zustand stores
└── types/            # TypeScript types
```

---

## Servicios Disponibles

- Dobladillo - Acortar o alargar
- Cierre - Cambio o reparación de cierre
- Ajuste - Ajustar a la medida
- Botón - Cambio de botones
- Costura - Reparación de costuras
- Tintado - Teñido de prenda
- Planchado - Planchado profesional
- Limpieza - Limpieza en seco

---

## Estados de Pedido

- **RECIBIDO**: Pedido recibido y registrado
- **EN_PROCESO**: Pedido en taller
- **COMPLETADO**: Trabajo terminado
- **ENTREGADO**: Pedido entregado al cliente
- **CANCELADO**: Pedido cancelado

---

## Licencia

MIT
