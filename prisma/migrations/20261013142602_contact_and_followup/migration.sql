-- AlterEnum
ALTER TYPE "FeedbackStatus" ADD VALUE 'IN_PROGRESS';

-- AlterTable
ALTER TABLE "feedback" ADD COLUMN     "contactConsentAt" TIMESTAMP(3),
ADD COLUMN     "contactEmail" TEXT,
ADD COLUMN     "contactName" TEXT,
ADD COLUMN     "contactPhone" TEXT;

-- Límites de longitud y coherencia: sin consentimiento no se guardan datos de contacto.
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_contact_lengths" CHECK (
  ("contactName" IS NULL OR char_length("contactName") <= 80) AND
  ("contactPhone" IS NULL OR char_length("contactPhone") <= 30) AND
  ("contactEmail" IS NULL OR char_length("contactEmail") <= 160)
);
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_contact_requires_consent" CHECK (
  "contactConsentAt" IS NOT NULL OR ("contactName" IS NULL AND "contactPhone" IS NULL AND "contactEmail" IS NULL)
);
