-- ============================================
-- SCHEMA DE BASE DE DATOS - COSEFY PRO
-- ============================================
-- Copia y ejecuta este SQL en el SQL Editor de Supabase

-- 1. TABLA PERFILES (extiende auth.users)
CREATE TABLE public.perfiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255),
    nombre VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'CAJERO' CHECK (rol IN ('ADMIN', 'CAJERO')),
    sucursal_id UUID,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. TABLA SUCURSALES
CREATE TABLE public.sucursales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(50),
    activa BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. TABLA CLIENTES
CREATE TABLE public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre_completo VARCHAR(255) NOT NULL,
    telefono VARCHAR(50) NOT NULL,
    correo VARCHAR(255),
    direccion TEXT,
    notas TEXT,
    sucursal_id UUID REFERENCES public.sucursales(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TABLA TIPOS DE PRENDAS
CREATE TABLE public.prendas_tipo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    icono VARCHAR(100),
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. TABLA SERVICIOS
CREATE TABLE public.servicios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    precio_base DECIMAL(10,2) NOT NULL,
    prenda_tipo_id UUID REFERENCES public.prendas_tipo(id),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. TABLA PEDIDOS
CREATE TABLE public.pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) NOT NULL,
    sucursal_id UUID REFERENCES public.sucursales(id),
    usuario_id UUID REFERENCES public.perfiles(id) NOT NULL,
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    fecha_recepcion DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_entrega_estimada DATE NOT NULL,
    fecha_entrega_real DATE,
    estado VARCHAR(50) NOT NULL DEFAULT 'RECIBIDO' CHECK (estado IN ('RECIBIDO', 'EN_PROCESO', 'COMPLETADO', 'ENTREGADO', 'CANCELADO')),
    total DECIMAL(10,2) NOT NULL,
    observaciones TEXT,
    notificacion_enviada BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. TABLA DETALLE PEDIDOS
CREATE TABLE public.pedidos_detalle (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.pedidos(id) ON DELETE CASCADE NOT NULL,
    prenda_tipo_id UUID REFERENCES public.prendas_tipo(id) NOT NULL,
    servicio_id UUID REFERENCES public.servicios(id),
    servicio_personalizado VARCHAR(255),
    precio DECIMAL(10,2) NOT NULL,
    foto_url TEXT,
    observaciones TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. TABLA NOTIFICACIONES
CREATE TABLE public.notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID REFERENCES public.pedidos(id) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    enviada BOOLEAN DEFAULT false,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    mensaje TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_detalle ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sucursales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prendas_tipo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicios ENABLE ROW LEVEL SECURITY;

-- Policies para usuarios autenticados
CREATE POLICY "Usuarios autenticados pueden leer clientes" 
ON public.clientes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden insertar clientes" 
ON public.clientes FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Usuarios autenticados pueden actualizar clientes" 
ON public.clientes FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Usuarios autenticados pueden eliminar clientes" 
ON public.clientes FOR DELETE TO authenticated USING (true);

-- Similar para las demás tablas
CREATE POLICY "Usuarios pueden leer pedidos" ON public.pedidos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios pueden insertar pedidos" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios pueden actualizar pedidos" ON public.pedidos FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios pueden eliminar pedidos" ON public.pedidos FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios pueden leer detalles" ON public.pedidos_detalle FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios pueden insertar detalles" ON public.pedidos_detalle FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Usuarios pueden actualizar detalles" ON public.pedidos_detalle FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Usuarios pueden eliminar detalles" ON public.pedidos_detalle FOR DELETE TO authenticated USING (true);

CREATE POLICY "Usuarios pueden leer prendas" ON public.prendas_tipo FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios pueden manage prendas" ON public.prendas_tipo FOR ALL TO authenticated USING (true);

CREATE POLICY "Usuarios pueden leer servicios" ON public.servicios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios pueden manage servicios" ON public.servicios FOR ALL TO authenticated USING (true);

CREATE POLICY "Usuarios pueden leer perfiles" ON public.perfiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Usuarios pueden manage perfiles" ON public.perfiles FOR ALL TO authenticated USING (true);

-- ============================================
-- TRIGGER PARA CREAR PERFIL AL REGISTRARSE
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.perfiles (id, email, nombre, rol)
  VALUES (NEW.id, NEW.email, NEW.email, 'CAJERO');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- DATOS INICIALES
-- ============================================

-- Tipos de prendas
INSERT INTO public.prendas_tipo (nombre, icono, descripcion, activo) VALUES
('Pantalón', '👖', 'Pantalones de todo tipo', true),
('Camisa', '👔', 'Camisas formales y casuales', true),
('Vestido', '👗', 'Vestidos de fiesta y uso diario', true),
('Chaqueta', '🧥', 'Chaquetas, abrigos y sakos', true),
('Falda', '👘', 'Faldas de todo tipo', true),
('Abrigo', '🧥', 'Abrigos y capas', true),
('Traje', '👨‍💼', 'Trajes completos', true),
('Otro', '📦', 'Otros tipos de prendas', true);

-- Servicios
INSERT INTO public.servicios (nombre, descripcion, precio_base, activo) VALUES
('Dobladillo', 'Acortar o alargar', 800, true),
('Cierre', 'Cambio o reparación de cierre', 1200, true),
('Ajuste', 'Ajustar a la medida', 1500, true),
('Botón', 'Cambio de botones', 300, true),
('Costura', 'Reparación de costuras', 500, true),
('Tintado', 'Teñido de prenda', 2500, true),
('Planchado', 'Planchado profesional', 400, true),
('Limpieza', 'Limpieza en seco', 1800, true);

-- Sucursal ejemplo
INSERT INTO public.sucursales (nombre, direccion, telefono, activa) VALUES
('Casa Central', 'Av. Principal 123', '+54 11 1234 5678', true);
