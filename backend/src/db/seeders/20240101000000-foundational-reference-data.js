'use strict';

/**
 * Foundational Reference Data Seeder
 * 
 * Seeds all foundational reference data that should exist in all environments.
 * This runs automatically after migrations and is idempotent.
 * 
 * Includes:
 * - Roles (5 total)
 * - Event Types (9 total)
 * - Event Audience Types (3 total)
 * - Industries (50 total)
 * - Professions (32 total)
 * - Product Categories (10 total)
 * - Chapters (Alumni chapters - 441 total, seeded in 20240101000001-seed-chapters.js)
 * 
 * Note: Chapters are seeded in a separate seeder (20240101000001-seed-chapters.js)
 * that runs automatically after this one. Collegiate chapters require web scraping
 * and are seeded separately via seed-chapters.ts script.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🌱 Seeding foundational reference data...\n');

    // 1. Seed Roles
    try {
      const [rolesTable] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'roles' AND table_schema = 'public'
      `);
      
      if (rolesTable && rolesTable.length > 0) {
      console.log('📋 Seeding roles...');
      const roles = [
        { name: 'ADMIN', description: 'System administrator with full access', display_order: 1 },
        { name: 'SELLER', description: 'User who can sell products on the platform', display_order: 2 },
        { name: 'PROMOTER', description: 'User who can promote events', display_order: 3 },
        { name: 'GUEST', description: 'Regular user who can browse and purchase', display_order: 4 },
        { name: 'STEWARD', description: 'User who can manage steward listings', display_order: 5 }
      ];

      for (const role of roles) {
        await queryInterface.sequelize.query(`
          INSERT INTO roles (name, description, display_order, created_at, updated_at)
          VALUES (:name, :description, :display_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (name) DO NOTHING
        `, {
          replacements: role
        });
      }
      console.log('  ✅ Roles seeded\n');
      } else {
        console.log('  ⏭️  Skipping roles (table does not exist yet)\n');
      }
    } catch (error) {
      console.log('  ⏭️  Skipping roles (table does not exist yet)\n');
    }

    // 2. Seed Event Types
    try {
      const [eventTypesTable] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'event_types' AND table_schema = 'public'
      `);
      
      if (eventTypesTable && eventTypesTable.length > 0) {
      console.log('📅 Seeding event types...');
      const eventTypes = [
        { enum: 'social', description: 'Social gatherings and mixers', display_order: 1, is_active: true },
        { enum: 'philanthropy', description: 'Philanthropic events and fundraisers', display_order: 2, is_active: true },
        { enum: 'professional', description: 'Professional development and networking', display_order: 3, is_active: true },
        { enum: 'formal', description: 'Formal events and galas', display_order: 4, is_active: true },
        { enum: 'sports', description: 'Sports and athletic events', display_order: 5, is_active: true },
        { enum: 'educational', description: 'Educational workshops and seminars', display_order: 6, is_active: true },
        { enum: 'community_service', description: 'Community service and volunteer work', display_order: 7, is_active: true },
        { enum: 'alumni', description: 'Alumni events and reunions', display_order: 8, is_active: true },
        { enum: 'other', description: 'Other events', display_order: 9, is_active: true }
      ];

      for (const eventType of eventTypes) {
        await queryInterface.sequelize.query(`
          INSERT INTO event_types (enum, description, display_order, is_active, created_at, updated_at)
          VALUES (:enum, :description, :display_order, :is_active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (enum) DO NOTHING
        `, {
          replacements: eventType
        });
      }
      console.log('  ✅ Event types seeded\n');
      } else {
        console.log('  ⏭️  Skipping event types (table does not exist yet)\n');
      }
    } catch (error) {
      console.log('  ⏭️  Skipping event types (table does not exist yet)\n');
    }

    // 3. Seed Event Audience Types
    try {
      const [eventAudienceTypesTable] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'event_audience_types' AND table_schema = 'public'
      `);
      
      if (eventAudienceTypesTable && eventAudienceTypesTable.length > 0) {
      console.log('👥 Seeding event audience types...');
      const eventAudienceTypes = [
        { enum: 'all_members', description: 'All fraternity members', display_order: 1, is_active: true },
        { enum: 'chapter_specific', description: 'Specific chapter members only', display_order: 2, is_active: true },
        { enum: 'public', description: 'Open to the public', display_order: 3, is_active: true }
      ];

      for (const audienceType of eventAudienceTypes) {
        await queryInterface.sequelize.query(`
          INSERT INTO event_audience_types (enum, description, display_order, is_active, created_at, updated_at)
          VALUES (:enum, :description, :display_order, :is_active, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (enum) DO NOTHING
        `, {
          replacements: audienceType
        });
      }
      console.log('  ✅ Event audience types seeded\n');
      } else {
        console.log('  ⏭️  Skipping event audience types (table does not exist yet)\n');
      }
    } catch (error) {
      console.log('  ⏭️  Skipping event audience types (table does not exist yet)\n');
    }

    // 4. Seed Industries (50 industries)
    try {
      const [industriesTable] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'industries' AND table_schema = 'public'
      `);
      
      if (industriesTable && industriesTable.length > 0) {
      console.log('🏭 Seeding industries...');
      const industries = [
        'Technology', 'Finance', 'Healthcare', 'Education', 'Legal', 'Consulting', 'Real Estate',
        'Marketing', 'Sales', 'Engineering', 'Manufacturing', 'Retail', 'Hospitality', 'Media',
        'Entertainment', 'Sports', 'Non-Profit', 'Government', 'Energy', 'Transportation',
        'Construction', 'Agriculture', 'Food & Beverage', 'Fashion', 'Beauty', 'Fitness',
        'Travel', 'Automotive', 'Aerospace', 'Telecommunications', 'Insurance', 'Banking',
        'Investment', 'Accounting', 'Architecture', 'Design', 'Art', 'Music', 'Writing',
        'Photography', 'Videography', 'Event Planning', 'Human Resources', 'Operations',
        'Supply Chain', 'Logistics', 'Research', 'Science', 'Pharmaceuticals', 'Biotechnology'
      ];

      for (let i = 0; i < industries.length; i++) {
        await queryInterface.sequelize.query(`
          INSERT INTO industries (name, display_order, is_active, created_at, updated_at)
          VALUES (:name, :display_order, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (name) DO NOTHING
        `, {
          replacements: {
            name: industries[i],
            display_order: i + 1
          }
        });
      }
      console.log(`  ✅ ${industries.length} industries seeded\n`);
      } else {
        console.log('  ⏭️  Skipping industries (table does not exist yet)\n');
      }
    } catch (error) {
      console.log('  ⏭️  Skipping industries (table does not exist yet)\n');
    }

    // 5. Seed Professions (32 professions)
    try {
      const [professionsTable] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'professions' AND table_schema = 'public'
      `);
      
      if (professionsTable && professionsTable.length > 0) {
      console.log('💼 Seeding professions...');
      const professions = [
        'Software Engineer', 'Data Scientist', 'Product Manager', 'Business Analyst',
        'Financial Analyst', 'Accountant', 'Attorney', 'Consultant', 'Sales Manager',
        'Marketing Manager', 'Operations Manager', 'Project Manager', 'HR Manager',
        'Engineer', 'Architect', 'Designer', 'Doctor', 'Nurse', 'Teacher', 'Professor',
        'Researcher', 'Scientist', 'Entrepreneur', 'Executive', 'Director', 'VP',
        'CEO', 'CFO', 'CTO', 'Manager', 'Specialist', 'Coordinator'
      ];

      for (let i = 0; i < professions.length; i++) {
        await queryInterface.sequelize.query(`
          INSERT INTO professions (name, display_order, created_at, updated_at)
          VALUES (:name, :display_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (name) DO NOTHING
        `, {
          replacements: {
            name: professions[i],
            display_order: i + 1
          }
        });
      }
      console.log(`  ✅ ${professions.length} professions seeded\n`);
      } else {
        console.log('  ⏭️  Skipping professions (table does not exist yet)\n');
      }
    } catch (error) {
      console.log('  ⏭️  Skipping professions (table does not exist yet)\n');
    }

    // 6. Seed Product Categories (10 categories)
    try {
      const [productCategoriesTable] = await queryInterface.sequelize.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_name = 'product_categories' AND table_schema = 'public'
      `);
      
      if (productCategoriesTable && productCategoriesTable.length > 0) {
        console.log('📦 Seeding product categories...');
        const productCategories = [
          { name: 'Apparel', display_order: 1 },
          { name: 'Outerwear', display_order: 2 },
          { name: 'Footwear', display_order: 3 },
          { name: 'Accessories', display_order: 4 },
          { name: 'Electronics', display_order: 5 },
          { name: 'Home Goods', display_order: 6 },
          { name: 'Art & Prints', display_order: 7 },
          { name: 'Books & Media', display_order: 8 },
          { name: 'Heritage / Legacy Item', display_order: 9 },
          { name: 'Cigar Lounge Essentials', display_order: 10 }
        ];

        for (const category of productCategories) {
          await queryInterface.sequelize.query(`
            INSERT INTO product_categories (name, display_order, created_at, updated_at)
            VALUES (:name, :display_order, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT (name) DO NOTHING
          `, {
            replacements: category
          });
        }
        console.log(`  ✅ ${productCategories.length} product categories seeded\n`);
      } else {
        console.log('  ⏭️  Skipping product categories (table does not exist yet)\n');
      }
    } catch (error) {
      console.log('  ⏭️  Skipping product categories (table does not exist yet)\n');
    }

    console.log('✅ Foundational reference data seeding completed!');
  },

  async down(queryInterface, Sequelize) {
    // Remove seeded data (optional - usually you'd keep reference data)
    console.log('⚠️  Removing foundational reference data...');
    
    // Only delete if tables exist (use try-catch to handle missing tables gracefully)
    try {
      await queryInterface.sequelize.query('DELETE FROM product_categories').catch(() => {});
      await queryInterface.sequelize.query('DELETE FROM professions').catch(() => {});
      await queryInterface.sequelize.query('DELETE FROM industries').catch(() => {});
      await queryInterface.sequelize.query('DELETE FROM event_audience_types').catch(() => {});
      await queryInterface.sequelize.query('DELETE FROM event_types').catch(() => {});
      // Note: Don't delete roles as they might be referenced by users
    } catch (error) {
      console.warn('Warning: Error during down migration:', error.message);
    }
    
    console.log('✅ Foundational reference data removed');
  }
};

