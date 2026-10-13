-- CreateTable
CREATE TABLE "google_clicks" (
    "id" TEXT NOT NULL,
    "businessId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "google_clicks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "google_clicks_businessId_createdAt_idx" ON "google_clicks"("businessId", "createdAt");

-- AddForeignKey
ALTER TABLE "google_clicks" ADD CONSTRAINT "google_clicks_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Aislamiento entre negocios (igual que las demás tablas con datos por negocio).
ALTER TABLE "google_clicks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "google_clicks" FORCE ROW LEVEL SECURITY;
CREATE POLICY "tenant_isolation" ON "google_clicks"
  USING (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true))
  WITH CHECK (current_setting('app.rls_bypass', true) = 'on' OR "businessId" = current_setting('app.business_id', true));
