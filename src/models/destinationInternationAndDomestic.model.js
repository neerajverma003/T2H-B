import mongoose from 'mongoose';

const DestinationInternationAndDomesticSchema = new mongoose.Schema(
  {
    domestic_or_international: {
      type: String,
      required: true,
    },
    destination_name: {
      type: String,
      required: true,
    },
    title_image: {
      type: [String],
      required:true
    },
    show_image:{
     type:[String],
     required:true
    },
    destination_type: {
      type: [String],
      required: true,
    },
    best_time: {
      type: String,
    },
    ideal_duration: {
      type: String,
    },
    short_description: {
      type: String,
      maxLength: 150
    },
    slug: {
      type: String,
      unique: true,
      index: true,
      sparse: true, // Crucial for production: allows old destinations to not have a slug without throwing duplicate null errors
    }

  },
  { timestamps: true }
);

const DestinationInternationAndDomesticModel = mongoose.model(
  'DestinationInternationAndDomestic',
  DestinationInternationAndDomesticSchema
);

export default DestinationInternationAndDomesticModel;
