-- =====================================================================
-- SCHÉMA DE BASE DE DONNÉES POSTGRESQL - P2PRINT MARKETPLACE 3D
-- =====================================================================

CREATE TYPE user_role AS ENUM ('client', 'maker', 'admin');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'client',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
