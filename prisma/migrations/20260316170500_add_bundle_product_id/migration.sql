ALTER TABLE "Bundle" ADD COLUMN "bundleProductId" TEXT;

CREATE INDEX "Bundle_bundleProductId_idx" ON "Bundle"("bundleProductId");
