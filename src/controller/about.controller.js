import AboutStory from "../models/aboutStory.model.js";
import Team from "../models/team.model.js";

// @desc    Get Dynamic About Us Config & Active Team List
// @route   GET /about
// @access  Public
export const getAboutPageData = async (req, res) => {
  try {
    // 1. Fetch about story details
    let storyConfig = await AboutStory.findOne();

    // 2. Production Fallback: Agar DB me koi entry nahi hai, toh crash hone ke bajaye empty structure return karein
    if (!storyConfig) {
      storyConfig = {
        hero: {
          mediaUrl: "",
          tagline: "EXCLUSIVE JOURNEYS",
          title: "About Us",
          subtitle: "Crafting beautiful honeymoon stories since 2024"
        },
        story: {
          title: "Our Story",
          tagline: "A SIGNATURE HAUTE EXPERIENCE",
          content: "Welcome to TripToHoneymoon..."
        },
        stats: [],
        mission: { title: "Our Mission", content: "" },
        vision: { title: "Our Vision", content: "" }
      };
    }

    // 3. Fetch active team members sorted by order integer
    const teamList = await Team.find({ status: true }).sort({ order: 1 });

    return res.status(200).json({
      success: true,
      msg: "Successfully fetched About Us configuration",
      storyConfig,
      teamList: teamList || []
    });
  } catch (error) {
    console.error("Error in getAboutPageData controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    });
  }
};
