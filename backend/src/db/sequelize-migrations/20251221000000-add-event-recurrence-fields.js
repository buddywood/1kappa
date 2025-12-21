module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('events', 'is_recurring', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    });

    await queryInterface.addColumn('events', 'recurrence_rule', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('events', 'recurrence_end_date', {
      type: Sequelize.DATE,
      allowNull: true
    });

    console.log('✅ Added recurrence fields to events table');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('events', 'is_recurring');
    await queryInterface.removeColumn('events', 'recurrence_rule');
    await queryInterface.removeColumn('events', 'recurrence_end_date');
    console.log('✅ Removed recurrence fields from events table');
  }
};
