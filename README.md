# Cosefy Pro - Sistema de Gestión de Taller de Arreglos

## 🚀 quick start

### Prerequisites
- Node.js 18+
- Cuenta de Supabase (gratis)

### Setup

1. **Crear proyecto en Supabase:**
   - Ir a https://supabase.com
   - Crear nuevo proyecto
   - Anotar `SUPABASE_URL` y `SUPABASE_ANON_KEY`

2. **Configurar base de datos:**
   - Ir a SQL Editor en Supabase
   - Copiar y ejecutar el contenido de `supabase/schema.sql`

3. **Instalar dependencias:**
   ```bash
   cd cosefy-pro
   npm install
   ```

4. **Configurar variables de entorno:**
   ```bash
   cp .env.example .env.local
   # Editar .env.local con tus credenciales de Supabase
   ```

5. **Ejecutar desarrollo:**
   ```bash
   npm run dev
   ```

6. **Abrir http://localhost:3000**

### Crear usuario admin

1. En Supabase, ir a Authentication > Users
2. Crear nuevo usuario con email y contraseña
3. Ir a la tabla `perfiles` y actualizar el rol a 'ADMIN'

---

## 📁 Estructura

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

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth
- **State:** Zustand
- **Forms:** React Hook Form + Zod
- **Charts:** Recharts
- **Icons:** Lucide React

---

## 📜 License

MIT
