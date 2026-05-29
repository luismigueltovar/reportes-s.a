-- ============================================================
-- Tabla: app_metadata
-- Propósito: Almacenar pares clave-valor para configuración
-- y timestamps de la aplicación (ej: última carga de Excel).
-- ============================================================

CREATE TABLE IF NOT EXISTS app_metadata (
  id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  clave       TEXT NOT NULL UNIQUE,          -- ej: 'ultima_carga_excel'
  valor       TEXT,                          -- valor libre (timestamp ISO, conteo, etc.)
  updated_at  TIMESTAMPTZ DEFAULT now()      -- se actualiza en cada upsert
);

-- Índice para búsquedas rápidas por clave
CREATE INDEX IF NOT EXISTS idx_app_metadata_clave ON app_metadata (clave);

-- Row Level Security: permitir lectura y escritura a usuarios autenticados
ALTER TABLE app_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read app_metadata"
  ON app_metadata FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert app_metadata"
  ON app_metadata FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update app_metadata"
  ON app_metadata FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insertar valor inicial (sin fecha, se actualizará en la primera carga)
INSERT INTO app_metadata (clave, valor)
VALUES ('ultima_carga_excel', NULL)
ON CONFLICT (clave) DO NOTHING;
