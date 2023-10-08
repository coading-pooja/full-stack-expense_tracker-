const Razorpay = require('razorpay');
const Order = require('../models/orders');
const userController = require('./userController');




const purchasePremium = async(req,res) =>{
    try{
        var rzp = new Razorpay({
            key_id: process.env.RAZORPAY_key_id,
            key_secret: process.env.RAZORPAY_key_secret
        })
        const amount = 100;
        rzp.orders.create({amount, currency: "INR"}, (err,order)=>{
            if(err){
                throw new Error(JSON.stringify(err));
            }
            console.log(order.id);
            const orderNew = Order.create({ orderid: order.id, status: 'PENDING'}).then(()=>{
                return res.status(201).json({order, key_id:rzp.key_id});
            }).catch(err  =>{
                throw new Error(err);
            })
            req.user.order = orderNew;
        })
    }
    catch(err){
        console.log(err);
        res.status(403).json({message: 'Something Went Wrong', error: err});
    }
}

const updateTransactionStatus = async (req,res) =>{
    try{
        let status = req.body.payStatus ? 'SUCCESSFUL':'FAILED';
            const order = await Order.findOne({where: {orderid : req.body.order_id}});
            if(!order){
                return res.status(404).json({ success: false, message: "Order not found" });
            }
            await Promise.all([
                order.update({paymentid: req.body.payment_id, status: status, userId: req.user.id}),
                req.user.update({ispremiumuser: true})
            ])    
            if(req.body.payStatus){
                return res.status(202).json({sucess: true, message: "Payment Successful"});
            }
            else{
                return res.json({ success: false, message: "Payment Failed" });
            }
    }
    catch(err){
        console.log(err);
        return res.status(500).json({ success: false, message: "Something went wrong" });
    }
}

module.exports = {
    purchasePremium,
    updateTransactionStatus
}
