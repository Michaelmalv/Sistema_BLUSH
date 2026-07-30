-- Script de migración para la tabla de usuarios
-- Ejecuta este script en el Editor de SQL de tu panel de Supabase para añadir el campo de correo.

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS correo VARCHAR(255);
