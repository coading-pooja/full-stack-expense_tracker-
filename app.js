const express = require('express');
const app = express();



//  middleware
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
app.use(bodyParser.json());
app.use(cors());
app.use(express.json()); // to parse JSON request bodies



//use static files
app.use(express.static('views'));



//import models and database
const sequelize = require('./util/database');
const User = require('./models/user')
const Expense = require('./models/expenses')
const Order = require('./models/orders');


//import routes
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const purchaseRoutes = require('./routes/purchaseRoutes');
const premiumRoutes = require('./routes/premiumRoutes');






// Routes directs
app.use('/user', userRoutes);
app.use('/expense',expenseRoutes);
app.use('/purchase',purchaseRoutes);
app.use('/premium', premiumRoutes)




//models relations
User.hasMany(Expense);
Expense.belongsTo(User); 
User.hasMany(Order);
Order.belongsTo(User); 





// Start the server
const PORT =3000;
sequelize.sync(
    //  {force:true}
)
// This will create the tables if they don't exist.
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error syncing database:', error);
  });
