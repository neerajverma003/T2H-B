import mongoose from 'mongoose'
//import DestinationInternationAndDomesticModel from '../models/destinationInternationAndDomestic.model.js'

const termsAndConditionSchema=new mongoose.Schema({
    destination_name:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'DestinationInternationAndDomestic',
        required:true
    },
    terms_And_condition:{
        type:String,
        required:true
    }
})

const termsAndConditionModel=mongoose.model('Terms-And-Condition',termsAndConditionSchema);
export default termsAndConditionModel;