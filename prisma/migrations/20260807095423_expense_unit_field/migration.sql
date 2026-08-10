-- AlterTable
ALTER TABLE `expense` DROP COLUMN `unitRm`,
    ADD COLUMN `unit` VARCHAR(191) NULL;

