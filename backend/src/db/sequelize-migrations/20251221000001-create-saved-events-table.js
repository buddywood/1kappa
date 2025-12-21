module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saved_events', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_email: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      event_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add unique constraint on (user_email, event_id)
    await queryInterface.addIndex('saved_events', ['user_email', 'event_id'], {
      unique: true,
      name: 'saved_events_user_email_event_id_unique'
    });

    // Add index on user_email for performance
    await queryInterface.addIndex('saved_events', ['user_email'], {
      name: 'idx_saved_events_user_email'
    });

    // Add index on event_id for performance
    await queryInterface.addIndex('saved_events', ['event_id'], {
      name: 'idx_saved_events_event_id'
    });

    console.log('✅ Created saved_events table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('saved_events');
    console.log('✅ Dropped saved_events table');
  }
};
