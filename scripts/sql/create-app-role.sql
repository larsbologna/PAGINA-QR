-- Rol de aplicación para PRODUCCIÓN, sin SUPERUSER ni BYPASSRLS, para que las
-- políticas de Row Level Security se apliquen. Ejecutalo como administrador de
-- la base DESPUÉS de correr las migraciones con el rol dueño.
-- Reemplazá la contraseña antes de ejecutarlo.
CREATE ROLE reputacion_app LOGIN PASSWORD 'CAMBIAR' NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE;
GRANT USAGE ON SCHEMA public TO reputacion_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO reputacion_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO reputacion_app;
-- Verificación (debe devolver f | f):
SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = 'reputacion_app';
