module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('event_affiliated_chapters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
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
      chapter_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'chapters',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Add unique constraint to prevent duplicate (event_id, chapter_id) pairs
    await queryInterface.addIndex('event_affiliated_chapters', ['event_id', 'chapter_id'], {
      unique: true,
      name: 'event_affiliated_chapters_event_id_chapter_id_unique'
    });

    console.log('✅ Created event_affiliated_chapters table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('event_affiliated_chapters');
    console.log('✅ Dropped event_affiliated_chapters table');
  }
};
