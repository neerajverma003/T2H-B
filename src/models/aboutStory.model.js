import mongoose from "mongoose";

const aboutStorySchema = new mongoose.Schema(
  {
    hero: {
      mediaUrl: { 
        type: String, 
        required: [true, "Hero background banner image or video URL is required"] 
      },
      tagline: { 
        type: String, 
        default: "EXCLUSIVE JOURNEYS" 
      },
      title: { 
        type: String, 
        default: "About Us" 
      },
      subtitle: { 
        type: String, 
        default: "Crafting beautiful honeymoon stories since 2024" 
      },
    },
    story: {
      title: { 
        type: String, 
        default: "Our Story" 
      },
      tagline: { 
        type: String, 
        default: "A SIGNATURE HAUTE EXPERIENCE" 
      },
      content: { 
        type: String, 
        required: [true, "Our story description content is required"] 
      },
    },
    stats: [
      {
        title: { type: String, required: true },
        value: { type: Number, required: true },
        suffix: { type: String, default: "+" }
      }
    ],
    mission: {
      title: { type: String, default: "Our Mission" },
      content: { type: String, required: [true, "Mission statement is required"] },
    },
    vision: {
      title: { type: String, default: "Our Vision" },
      content: { type: String, required: [true, "Vision statement is required"] },
    }
  },
  { timestamps: true } // Auto creates createdAt & updatedAt properties
);

const AboutStory = mongoose.model("AboutStory", aboutStorySchema);
export default AboutStory;
