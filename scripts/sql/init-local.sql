-- Prepara PostgreSQL para desarrollo y CI. Se ejecuta como superusuario (postgres).
--
-- La aplicación se conecta con el rol "reputacion", que NO es superusuario ni
-- tiene BYPASSRLS: así las reglas de aislamiento entre negocios (RLS) se aplican
-- igual que en producción. (El usuario que crea la imagen oficial de Docker con
-- POSTGRES_USER sí es superusuario y por eso no sirve para la app.)
CREATE ROLE reputacion LOGIN PASSWORD 'reputacion' NOSUPERUSER NOBYPASSRLS CREATEDB;
CREATE DATABASE reputacion OWNER reputacion;
CREATE DATABASE reputacion_test OWNER reputacion;  -- pruebas de integración
CREATE DATABASE reputacion_e2e OWNER reputacion;   -- pruebas E2E
