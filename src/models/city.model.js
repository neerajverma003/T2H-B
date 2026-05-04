import mongoose from 'mongoose'


const citySchema=new mongoose.Schema({
    city_name:{
        type:String,
        required:true,
        unique:true
    },
    city_category:{
        type:[String],
        required:true,
    },
    city_image:{
        type:[String],
        required:true
    },
    visibility:{
       type:String,
       enum:['Public', 'Private'],
       required:true
    },
    state:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'DestinationInternationAndDomestic'
    }
},{timestamps:true})

const cityModel=mongoose.model('city',citySchema);
export default cityModel