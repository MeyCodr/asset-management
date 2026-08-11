-- CreateTable
CREATE TABLE `finasset` (
    `id` VARCHAR(191) NOT NULL,
    `finAssetTag` VARCHAR(191) NOT NULL,
    `assetCategory` VARCHAR(191) NOT NULL,
    `itAssetId` VARCHAR(191) NULL,
    `assetType` VARCHAR(191) NULL,
    `assetStatus` VARCHAR(191) NULL,
    `serialNumberLic` VARCHAR(191) NULL,
    `brand` VARCHAR(191) NULL,
    `model` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `finasset_finAssetTag_key`(`finAssetTag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

