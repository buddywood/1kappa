'use strict';

/**
 * Migration to mark all existing SQL migrations as applied in SequelizeMeta table
 * This preserves the migration history when switching from raw SQL migrations to Sequelize
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // List of all existing SQL migration files (42 migrations)
    const existingMigrations = [
      '001_add_chapters_status_chartered.sql',
      '002_update_sellers_table.sql',
      '003_update_promoters_table.sql',
      '004_update_members_table.sql',
      '005_add_verification_fields.sql',
      '006_update_users_table.sql',
      '007_add_chapters_stripe_account.sql',
      '008_add_seller_product_rules.sql',
      '009_add_stewards_stripe_account.sql',
      '010_add_on_delete_set_null_to_foreign_keys.sql',
      '011_make_vendor_license_optional_and_add_merchandise_type.sql',
      '012_remove_products_sponsored_chapter_id.sql',
      '013_add_product_categories.sql',
      '014_add_category_attribute_definitions.sql',
      '015_add_product_images.sql',
      '016_rename_members_to_fraternity_members.sql',
      '017_add_category_to_steward_listings.sql',
      '018_add_steward_listing_images.sql',
      '019_add_favorites_table.sql',
      '020_add_notifications_table.sql',
      '021_fix_promoter_member_constraint.sql',
      '022_add_professions_table.sql',
      '023_add_seller_stripe_business_fields.sql',
      '024_ensure_sellers_fraternity_member_id.sql',
      '025_rename_vendor_license_to_kappa_vendor_id.sql',
      '026_ensure_fraternity_member_id_columns.sql',
      '027_drop_old_members_table.sql',
      '028_add_fraternity_member_id_to_users.sql',
      '029_create_roles_table.sql',
      '030_rename_consumer_to_guest.sql',
      '031_add_event_types.sql',
      '032_add_event_audience_types.sql',
      '033_add_event_duration.sql',
      '034_add_event_link_and_featured.sql',
      '035_add_event_dress_code.sql',
      '036_update_event_dress_code_to_array.sql',
      '037_add_event_status.sql',
      '038_remove_max_attendees.sql',
      '039_drop_dress_code_type_column.sql',
      '040_change_orders_buyer_email_to_user_id.sql',
      '041_add_shipping_address_to_orders.sql',
      '042_create_user_addresses_table.sql',
      '043_ensure_promoters_fraternity_member_id.sql',
      '044_ensure_stewards_fraternity_member_id.sql'
    ];

    // Ensure SequelizeMeta table exists
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "SequelizeMeta" (
        name VARCHAR(255) NOT NULL PRIMARY KEY
      );
    `);

    // Insert all existing migrations into SequelizeMeta
    // Use INSERT ... ON CONFLICT DO NOTHING to avoid errors if already exists
    for (const migration of existingMigrations) {
      await queryInterface.sequelize.query(`
        INSERT INTO "SequelizeMeta" (name)
        VALUES ('${migration}')
        ON CONFLICT (name) DO NOTHING;
      `);
    }

    console.log(`Marked ${existingMigrations.length} existing SQL migrations as applied`);
  },

  async down(queryInterface, Sequelize) {
    // Remove all the marked migrations from SequelizeMeta
    const existingMigrations = [
      '001_add_chapters_status_chartered.sql',
      '002_update_sellers_table.sql',
      '003_update_promoters_table.sql',
      '004_update_members_table.sql',
      '005_add_verification_fields.sql',
      '006_update_users_table.sql',
      '007_add_chapters_stripe_account.sql',
      '008_add_seller_product_rules.sql',
      '009_add_stewards_stripe_account.sql',
      '010_add_on_delete_set_null_to_foreign_keys.sql',
      '011_make_vendor_license_optional_and_add_merchandise_type.sql',
      '012_remove_products_sponsored_chapter_id.sql',
      '013_add_product_categories.sql',
      '014_add_category_attribute_definitions.sql',
      '015_add_product_images.sql',
      '016_rename_members_to_fraternity_members.sql',
      '017_add_category_to_steward_listings.sql',
      '018_add_steward_listing_images.sql',
      '019_add_favorites_table.sql',
      '020_add_notifications_table.sql',
      '021_fix_promoter_member_constraint.sql',
      '022_add_professions_table.sql',
      '023_add_seller_stripe_business_fields.sql',
      '024_ensure_sellers_fraternity_member_id.sql',
      '025_rename_vendor_license_to_kappa_vendor_id.sql',
      '026_ensure_fraternity_member_id_columns.sql',
      '027_drop_old_members_table.sql',
      '028_add_fraternity_member_id_to_users.sql',
      '029_create_roles_table.sql',
      '030_rename_consumer_to_guest.sql',
      '031_add_event_types.sql',
      '032_add_event_audience_types.sql',
      '033_add_event_duration.sql',
      '034_add_event_link_and_featured.sql',
      '035_add_event_dress_code.sql',
      '036_update_event_dress_code_to_array.sql',
      '037_add_event_status.sql',
      '038_remove_max_attendees.sql',
      '039_drop_dress_code_type_column.sql',
      '040_change_orders_buyer_email_to_user_id.sql',
      '041_add_shipping_address_to_orders.sql',
      '042_create_user_addresses_table.sql',
      '043_ensure_promoters_fraternity_member_id.sql',
      '044_ensure_stewards_fraternity_member_id.sql'
    ];

    await queryInterface.bulkDelete('SequelizeMeta', {
      name: {
        [Sequelize.Op.in]: existingMigrations
      }
    });
  }
};



