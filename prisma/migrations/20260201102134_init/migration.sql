-- CreateTable
CREATE TABLE "people" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "people_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" SERIAL NOT NULL,
    "person_id" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "related_ticker" TEXT NOT NULL,
    "price_then" DOUBLE PRECISION NOT NULL,
    "price_now" DOUBLE PRECISION NOT NULL,
    "context" TEXT,
    "said_at" TEXT,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "people_slug_key" ON "people"("slug");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_person_id_fkey" FOREIGN KEY ("person_id") REFERENCES "people"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
