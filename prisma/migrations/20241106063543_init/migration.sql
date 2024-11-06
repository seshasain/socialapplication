/*
  Warnings:

  - A unique constraint covering the columns `[id,postId]` on the table `PostPlatform` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PostPlatform_id_postId_key" ON "PostPlatform"("id", "postId");
