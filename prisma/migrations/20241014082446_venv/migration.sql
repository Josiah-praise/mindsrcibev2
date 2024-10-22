/*
  Warnings:

  - Made the column `bannerUrl` on table `Post` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Post" ALTER COLUMN "bannerUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "avatarUrl" SET DEFAULT 'https://mindsrcibe.s3.amazonaws.com/defaultBanner.jpg';
