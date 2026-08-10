-- CreateTable
CREATE TABLE `expense` (
    `id` VARCHAR(191) NOT NULL,
    `nature` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `subCategory` VARCHAR(191) NULL,
    `amp` VARCHAR(191) NULL,
    `costCtr` VARCHAR(191) NULL,
    `supplier` VARCHAR(191) NOT NULL,
    `dateEntry` DATETIME(3) NULL,
    `phnRefLetter` VARCHAR(191) NULL,
    `agreementPo` VARCHAR(191) NULL,
    `typeOfRenewal` VARCHAR(191) NULL,
    `quotationNo` VARCHAR(191) NULL,
    `invoiceNo` VARCHAR(191) NULL,
    `doNo` VARCHAR(191) NULL,
    `services` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `licenseProductId` VARCHAR(191) NULL,
    `qty` DOUBLE NULL,
    `unitPrice` DOUBLE NULL,
    `unitRm` DOUBLE NULL,
    `sstRm` DOUBLE NULL,
    `sstTotalRm` DOUBLE NULL,
    `grandTotalRm` DOUBLE NULL,
    `effectiveDate` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

