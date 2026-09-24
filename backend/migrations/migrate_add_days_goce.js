const { QueryInterface, Sequelize } = require('sequelize');

module.exports = {
  // For when we migrate to the sqlite database.
  async up(queryInterface) {
    await queryInterface.addColumn('solicitudes', 'dias_con_goce', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });

    await queryInterface.addColumn('solicitudes', 'dias_sin_goce', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
  },
  async down(queryInterface) {
    await queryInterface.removeColumn('solicitudes', 'dias_con_goce');
    await queryInterface.removeColumn('solicitudes', 'dias_sin_goce');
  }
};