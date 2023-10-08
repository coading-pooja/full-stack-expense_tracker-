const Sequelize = require('sequelize');

const sequelize = new Sequelize('expense-tracker-full-stack', 'root', 'Hare@krishna123#', {
  dialect: 'mysql',
  host: 'localhost',
 // logging: console.log
});

module.exports = sequelize;
