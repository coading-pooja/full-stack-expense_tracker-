const Sequelize = require('sequelize');

const sequelize = new Sequelize('expense-tracker-full-stack', 'root', process.env.MYSQL_PASSWORD, {
  dialect: 'mysql',
  host: 'localhost',
 // logging: console.log
});

module.exports = sequelize;
