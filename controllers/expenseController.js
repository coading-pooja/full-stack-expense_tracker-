const express = require('express');
const User = require("../models/user");
const routes = express.Router();
const path = require("path");
const bodyParser = require('body-parser');
const Expense = require("../models/expenses");
const AWS = require("aws-sdk");
const { createSecretKey } = require('crypto');
const UserServices = require("../services/userservices")
const S3Service = require("../services/S3services")


  const downloadexpense = async (req, res) =>{
    try{
      const expenses = await UserServices.getExpenses(req);
      const stringifiedExpenses = JSON.stringify(expenses);
      const filename = `expense${req.user.id}_${new Date()}.txt`;
      const fileUrl = await S3Service.uploadToS3(stringifiedExpenses, filename);

      res.status(200).json({fileUrl: fileUrl, success:true, filename: filename});

    }catch(err){
      console.log("Error downloading expenses file", err);
      res.status(500).json({error: 'Error downloading expenses'});
    }

  }

  
const addexpense = async (req, res) => {
    try {
        console.log(req.body);
        const amount = req.body.amount;
        const desc = req.body.description;
        const cat = req.body.category;
        const userId = req.user.id;
        console.log(req.user.id);



          const expense = await Expense.create({ amount: amount, description: desc, category: cat,userId:userId})
        //  res.status(201).json({ data: expense });
        //  const expense = await Expense.create({ amountExp: amount, description: desc, category: cat, userId:req.user.id });
         const totalExpenseData = await User.findByPk(req.user.id)
             .then((user)=>{
                 let newTotalExpense = 0;
                 console.log(typeof newTotalExpense)
                 if(user.total === null){
                     newTotalExpense = amount;
                 }
                 else{
                     newTotalExpense = user.total+parseFloat(amount);
                 }
                 User.update({total:newTotalExpense}, {where: {id:userId}})

                 return newTotalExpense;
             });
             console.log(totalExpenseData);
         res.status(201).json({ data: expense, totalExpenseData: totalExpenseData });
     }
     catch (err) {
         console.log(err);
     }
 }
 
 
  const deleteexpense = async (req, res) => {
    try {
        console.log(req.body)

        console.log(req.user.id);
        const oldExpense =await Expense.findOne({where:{id:req.body.id}})
     await Expense.destroy({
            where: { id: req.body.id },
        });
        // changing the totalExpense data in the user table
        console.log(req.user)
        
        // Find the user by primary key and update the total
        const user = await User.findByPk(req.user.id);
        console.log(oldExpense,user)
        if (user) {
            const newTotalExpense = user.total - parseFloat(oldExpense.amount);
            console.log(user.total)
            console.log(req.body.amount)
            console.log(newTotalExpense);

            // Update the user's total
            await user.update({ total: newTotalExpense });

            console.log("expense deleted");
            res.sendStatus(204);
        } else {
            // Handle the case where the user with the given ID was not found
            console.log("User not found");
            res.sendStatus(404);
        }
    }
    catch (err) {        
        console.log(err);
        res.sendStatus(500); // Handle other errors accordingly

    }
  }
  
  const getexpenses =  async(req, res) => {
    try {
        const allExpense = await Expense.findAll({where:{userId:req.user.id}});
        console.log(allExpense);
        res.status(200).json({allExpense : allExpense});
        
    }
    
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
  }
  
  module.exports = {
    addexpense,
    deleteexpense,
    getexpenses,
    downloadexpense
  }
  