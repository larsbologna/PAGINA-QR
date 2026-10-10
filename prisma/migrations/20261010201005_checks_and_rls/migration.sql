-- ─────────────────────────────────────────────────────────────
-- Restricciones de integridad adicionales
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_rating_range" CHECK ("rating" BETWEEN 1 AND 5);
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_comment_length" CHECK ("comment" IS NULL OR char_length("comment") <= 1000);
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submission_key_length" CHECK (char_length("submissionKey") BETWEEN 8 AND 64);
ALTER TABLE "feedback_notes" ADD CONSTRAINT "feedback_notes_body_length" CHECK (char_length("body") BETWEEN 1 AND 2000);
ALTER TABLE "feedback_categories" ADD CONSTRAINT "feedback_categories_name_length" CHECK (char_length("name") BETWEEN 1 AND 40);
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_slug_format" CHECK ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("slug") BETWEEN 3 AND 60);
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_brand_color_format" CHECK ("brandColor" ~ '^#[0-9a-fA-F]{6}$');
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_thresholds" CHECK ("negativeMax" >= 1 AND "positiveMin" <= 5 AND "negativeMax" < "positiveMin");
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_retention" CHECK ("retentionMonths" BETWEEN 1 AND 120);
ALTER TABLE "businesses" ADD CONSTRAINT "businesses_logo_size" CHECK ("logoData" IS NULL OR octet_length("logoData") <= 524288);

-- ─────────────────────────────────────────────────────────────
-- Row Level Security: aislamiento entre negocios en la base de datos.
--
-- La aplicación abre una transacción por operación y define:
--   app.business_id = '<id del negocio>'   (acceso de un negocio)
--   app.rls_bypass  = 'on'                 (tareas del sistema / superadministrador)
-- Si ninguna de las dos está definida, estas tablas devuelven 0 filas y
-- rechazan escrituras. FORCE hace que la regla aplique también al dueño de
-- las tablas. Los roles SUPERUSER o con BYPASSRLS la ignoran: no los uses
-- para la conexión de la aplicación.
-- ─────────────────────────────────────────────────────────────
ALTER TABLE "feedback" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "feedback"
  USING (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true))
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true));

ALTER TABLE "feedback_notes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback_notes" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "feedback_notes"
  USING (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true))
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true));

ALTER TABLE "feedback_categories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback_categories" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "feedback_categories"
  USING (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true))
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true));

ALTER TABLE "feedback_category_selections" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedback_category_selections" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "feedback_category_selections"
  USING (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true))
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true));
