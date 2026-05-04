import mongoose from 'mongoose';

const paymentModeSchema=new mongoose.Schema({
    destination_type:{
        type:String,
        required:true,
        unique:true
    },
    payment_mode:{
        type:String,
        default:""
    }

})

const paymentModeModel=mongoose.model('Payment-Mode',paymentModeSchema);
export default paymentModeModel;