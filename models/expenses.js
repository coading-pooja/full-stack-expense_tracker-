const Sequelize = require('sequelize');
const sequelize = require('../util/database');
const User = require("../models/user");


const Expense =sequelize.define('expenses', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },

    amount: {type: Sequelize.INTEGER},
    description:{type: Sequelize.STRING},
    category: {type: Sequelize.STRING},
    userId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }

})
// Create a foreign key association with the User model
Expense.belongsTo(User, { foreignKey: 'userId' });

module.exports = Expense