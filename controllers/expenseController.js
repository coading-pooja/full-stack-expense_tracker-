const express = require('express');
const User = require("../models/user");
const routes = express.Router();
const path = require("path");
const bodyParser = require('body-parser');
const Expense = require("../models/expenses");
const AWS = require("aws-sdk");
const { createSecretKey } = require('crypto');

function uploadToS3(data,filename){
        //get credentials, login to AWS and upload the file.

    const BUCKET_NAME = "fullstack-expensetracker";
    const IAM_USER_KEY = process.env.IAM_USER_KEY;
    const IAM_USER_SECRET = process.env.IAM_USER_SECRET;

    let s3bucket = new AWS.S3({
    accessKeyId: IAM_USER_KEY,
    secretAccessKey: IAM_USER_SECRET,
    // bucket:  BUCKET_NAME
    })

         //params Bucket, Key, Body as required by AWS S3
         const params = {                               
            Bucket: BUCKET_NAME,
            Key: filename,
            Body: data,
            ACL: 'public-read'
          }
      
      

          // return promise instead direct return as uploading is an asynchronous task
    return new Promise((resolve, reject)=>{
      s3bucket.upload(params, async (err, s3response)=>{
        try{
          if(err) {
            console.log("Error uploading file", err);
            reject(err);
          }else{
            console.log('File uploaded successfully', s3response)
            resolve(s3response.Location);
          }
        }catch(err){
          console.log("Waiting to login in AWS for upload", err)
        }

      })
    })
  }

  const downloadexpense = async (req, res) =>{
    try{
      const expenses = await req.user.getExpenses();
      const stringifiedExpenses = JSON.stringify(expenses);
      const filename = `expense${req.user.id}_${new Date()}.txt`;
      const fileUrl = await uploadToS3(stringifiedExpenses, filename);

      res.status(200).json({fileUrl: fileUrl, success:true, filename: filename});

    }catch(err){
      console.log("Error downloading expenses file", err);
      res.status(500).json({error: 'Error downloading expenses'});
    }

  }






// const downloadexpense = async(req,res)=>{    
//     const expenses = await req.user.getexpenses();
//     console.log(expenses);
//     const stringifiedExpenses =JSON.stringify(expenses);
//     const filename = Expense.txt;
//     const fileURl = uploadToS3();
//     res.status(200).json({fileURl,success:true})
// }





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
  