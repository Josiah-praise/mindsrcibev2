/*
  Warnings:

  - You are about to drop the column `isLiked` on the `CommentLike` table. All the data in the column will be lost.
  - You are about to drop the column `isLiked` on the `PostLike` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CommentLike" DROP COLUMN "isLiked";

-- AlterTable
ALTER TABLE "PostLike" DROP COLUMN "isLiked";
