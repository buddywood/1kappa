"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(
      "🔄 Changing merchandise_type from ENUM to TEXT to support multiple values..."
    );

    // Check if merchandise_type column exists and is an ENUM
    const [columnInfo] = await queryInterface.sequelize.query(`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' 
        AND column_name = 'merchandise_type'
    `);

    if (columnInfo.length === 0) {
      console.log(
        "  ⚠️  merchandise_type column does not exist, skipping migration."
      );
      return;
    }

    const currentType = columnInfo[0].udt_name;

    // If it's already TEXT/VARCHAR, skip
    if (currentType === "text" || currentType === "varchar") {
      console.log("  ✓ merchandise_type is already TEXT/VARCHAR, skipping.");
      return;
    }

    // If it's an ENUM, convert to TEXT
    if (
      currentType === "enum_sellers_merchandise_type" ||
      currentType.includes("enum")
    ) {
      console.log("  - Converting merchandise_type from ENUM to TEXT...");

      // Convert the column to TEXT
      // PostgreSQL will automatically convert ENUM values to their string representation
      await queryInterface.sequelize.query(`
        ALTER TABLE sellers 
        ALTER COLUMN merchandise_type TYPE TEXT 
        USING merchandise_type::TEXT;
      `);

      console.log("  ✓ Successfully converted merchandise_type to TEXT.");

      // Drop the ENUM type since it's no longer needed
      console.log("  - Dropping unused ENUM type...");
      await queryInterface.sequelize.query(`
        DROP TYPE IF EXISTS "enum_sellers_merchandise_type";
      `);
      console.log("  ✓ Dropped ENUM type.");
    } else {
      console.log(
        `  ⚠️  merchandise_type has unexpected type: ${currentType}, skipping.`
      );
    }
  },

  async down(queryInterface, Sequelize) {
    console.log("🔄 Reverting merchandise_type from TEXT back to ENUM...");

    // Check current column type
    const [columnInfo] = await queryInterface.sequelize.query(`
      SELECT 
        column_name,
        data_type,
        udt_name
      FROM information_schema.columns
      WHERE table_name = 'sellers' 
        AND column_name = 'merchandise_type'
    `);

    if (columnInfo.length === 0) {
      console.log(
        "  ⚠️  merchandise_type column does not exist, skipping rollback."
      );
      return;
    }

    const currentType = columnInfo[0].udt_name;

    // If it's already ENUM, skip
    if (
      currentType === "enum_sellers_merchandise_type" ||
      currentType.includes("enum")
    ) {
      console.log("  ✓ merchandise_type is already ENUM, skipping rollback.");
      return;
    }

    // If it's TEXT/VARCHAR, convert back to ENUM
    if (currentType === "text" || currentType === "varchar") {
      console.log("  - Converting merchandise_type from TEXT back to ENUM...");

      // Ensure ENUM type exists
      await queryInterface.sequelize.query(`
        DO $$ BEGIN
          CREATE TYPE "enum_sellers_merchandise_type" AS ENUM ('KAPPA', 'NON_KAPPA');
        EXCEPTION
          WHEN duplicate_object THEN null;
        END $$;
      `);

      // Convert column back to ENUM
      // Note: This will fail if there are values that don't match the ENUM
      // We'll only convert single values, comma-separated values will need to be handled
      await queryInterface.sequelize.query(`
        ALTER TABLE sellers 
        ALTER COLUMN merchandise_type TYPE "enum_sellers_merchandise_type" 
        USING CASE 
          WHEN merchandise_type = 'KAPPA' THEN 'KAPPA'::enum_sellers_merchandise_type
          WHEN merchandise_type = 'NON_KAPPA' THEN 'NON_KAPPA'::enum_sellers_merchandise_type
          WHEN merchandise_type LIKE 'KAPPA,%' OR merchandise_type LIKE '%,KAPPA,%' OR merchandise_type LIKE '%,KAPPA' THEN 'KAPPA'::enum_sellers_merchandise_type
          WHEN merchandise_type LIKE 'NON_KAPPA,%' OR merchandise_type LIKE '%,NON_KAPPA,%' OR merchandise_type LIKE '%,NON_KAPPA' THEN 'NON_KAPPA'::enum_sellers_merchandise_type
          ELSE NULL::enum_sellers_merchandise_type
        END;
      `);

      console.log("  ✓ Successfully reverted merchandise_type to ENUM.");
      console.log(
        "  ⚠️  Note: Comma-separated values were converted to single values during rollback."
      );
      console.log("  ℹ️  The ENUM type was recreated during rollback.");
    } else {
      console.log(
        `  ⚠️  merchandise_type has unexpected type: ${currentType}, skipping rollback.`
      );
    }
  },
};




