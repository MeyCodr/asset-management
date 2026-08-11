-- AlterTable
ALTER TABLE `finasset` ADD COLUMN `approvedFinCapexNo` VARCHAR(191) NULL,
    ADD COLUMN `dateOfPurchase` DATETIME(3) NULL,
    ADD COLUMN `department` VARCHAR(191) NULL,
    ADD COLUMN `os` VARCHAR(191) NULL,
    ADD COLUMN `plant` VARCHAR(191) NULL,
    ADD COLUMN `purchaseOrder` VARCHAR(191) NULL,
    ADD COLUMN `qty` INTEGER NULL,
    ADD COLUMN `supplier` VARCHAR(191) NULL,
    ADD COLUMN `totalAmountRm` DOUBLE NULL;

