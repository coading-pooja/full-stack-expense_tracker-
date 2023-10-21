 const Brevo = require('@getbrevo/brevo')
const {v4:uuidv4} = require('uuid');       
const bcrypt = require('bcrypt'); 
const path = require('path'); 
const sequelize = require('../util/database');
const fs= require("fs")
     

const Password = require('../models/password');
const User = require('../models/user');
const { isUtf8 } = require('buffer');

require('dotenv').config();                       //access environment variables
const brevoAPIKey = process.env.BREVO_API_KEY;

//API to send mail for forgot password
const forgotPasswordMail = async(req, res) =>{
    try{
        const user = await User.findOne({where:{email:req.body.email}});
        
        if(!user) return res.status(400).json({status:"Fail", message:"Email not found"});

        const id = uuidv4();
       await Password.create({id, userId: user.id, isActive:true});
        console.log("i am password")
        //create a brevo instance
        const defaultClient = await Brevo.ApiClient.instance;
        var apiKey = defaultClient.authentications['api-key']; //isapi-key an argument?
        apiKey.apiKey = brevoAPIKey;
        const transEmailApi = new Brevo.TransactionalEmailsApi();
        await Promise.all([apiKey, transEmailApi]);
         const path = `http://127.0.0.1:3000/password/createNewPassword/${id}`;

      const sender = {
      email: "poojagoyal5106@gmail.com",
      name: "Code pooja",
      };
      const receivers = [req.body];

      await transEmailApi.sendTransacEmail({
      sender,
      to: receivers,
      subject: "Reset Password",
      textContent: "Click here to reset your password",
      htmlContent: `<a href="${path}">Click Here</a> to reset your password!`,
      });

     res .status(200).json({ status: "Success", message: "Password reset email sent successfully!" });
    
    } catch (error) {
       console.error("Error sending password reset link", error)
      }
     
};





const createNewPassword = async(req, res) =>{

  try{
  const createPasswordUUID = await Password.findOne({where:{id: req.params.id}})
  if(!createPasswordUUID)return res.status(400).json({status:"failed", message:"Invalid Link"})
  
  const passwordPath = path.join(__dirname,'..','views', 'password.html');

   let data = fs.readFileSync(passwordPath,"utf-8")
   data.replace("uuid",req.params.id);
  
  return res.status(200).send(data);

  }catch(err){
    console.log(err)
  }

}

const postNewPassword = async(req, res) =>{
  const { id } = req.params;
  console.log(">>>>>>>>>>>>>>>.id", id)
  const {password, confirmpassword} = req.body;      //can we get that id thru body too?  //is it necessary to check password and confirmpasswords are same here also, already have checked in frontend
  const t = await sequelize.transaction();
  
  try{
    const row = await Password.findOne({where:{id: id}});

    if(!row || !row.isActive){
  
      return res.status(400).json({status: "Failed", message: "Expired Link", success:false});
    }

    const hashedPassword = bcrypt.hashSync(password, 10);
    const UP = await Password.findOne({where:{id:id}})
    const updatedPassword = await UP.update({isActive:false}, {transaction: t});
     const user = await User.findOne({where:{id:row.userId}})
    const updatedUser =  await user.update({password: hashedPassword}, {transaction: t});
     console.log("i am run")
    await Promise.all([updatedPassword, updatedUser]);
     await t.commit();
    res.status(200).send({status:"Success", message: "Password updated successfully", success:true});

  }catch(err){
    t.rollback();
    console.log(err);
  }


}





module.exports = {
  forgotPasswordMail,
  createNewPassword,
 postNewPassword
  
}