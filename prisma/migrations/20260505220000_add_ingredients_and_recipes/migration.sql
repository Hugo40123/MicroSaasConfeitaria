ALTER TABLE "Product"
  ADD COLUMN "costAutoCalculated" DECIMAL(10, 2),
  ADD COLUMN "marginPercent" DECIMAL(5, 2) NOT NULL DEFAULT 0,
  ADD COLUMN "suggestedPrice" DECIMAL(10, 2);

CREATE TABLE "Ingredient" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "costPerUnit" DECIMAL(10, 4) NOT NULL,
  "stockQuantity" DECIMAL(12, 3) NOT NULL DEFAULT 0,
  "lowStockAlert" DECIMAL(12, 3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Ingredient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductRecipeItem" (
  "id" TEXT NOT NULL,
  "storeId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "ingredientId" TEXT NOT NULL,
  "quantity" DECIMAL(12, 3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductRecipeItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Ingredient_storeId_idx" ON "Ingredient"("storeId");
CREATE UNIQUE INDEX "Ingredient_storeId_name_key" ON "Ingredient"("storeId", "name");

CREATE INDEX "ProductRecipeItem_storeId_idx" ON "ProductRecipeItem"("storeId");
CREATE INDEX "ProductRecipeItem_productId_idx" ON "ProductRecipeItem"("productId");
CREATE INDEX "ProductRecipeItem_ingredientId_idx" ON "ProductRecipeItem"("ingredientId");
CREATE UNIQUE INDEX "ProductRecipeItem_productId_ingredientId_key" ON "ProductRecipeItem"("productId", "ingredientId");

ALTER TABLE "Ingredient"
  ADD CONSTRAINT "Ingredient_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductRecipeItem"
  ADD CONSTRAINT "ProductRecipeItem_storeId_fkey"
  FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProductRecipeItem_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "ProductRecipeItem_ingredientId_fkey"
  FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
