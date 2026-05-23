import AboutStory from "../../models/aboutStory.model.js";
import Team from "../../models/team.model.js";

// ==========================================
//  1. BRAND STORY OPERATIONS
// ==========================================

// @desc    Update Brand Story Configuration
// @route   PUT /admin/about-settings
// @access  Private (Admin Only)
export const updateAboutStory = async (req, res) => {
  try {
    let story = await AboutStory.findOne();
    
    if (!story) {
      // Database empty ho toh naya config create karein
      story = await AboutStory.create(req.body);
    } else {
      // Configuration already exists, use ID to update it
      story = await AboutStory.findByIdAndUpdate(story._id, req.body, {
        new: true, // returns the updated document
        runValidators: true, // runs schema validations
      });
    }

    return res.status(200).json({
      success: true,
      msg: "About configuration updated successfully",
      data: story,
    });
  } catch (error) {
    console.error("Error in updateAboutStory admin controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// ==========================================
// 👥 2. TEAM DIRECTORY CRUD OPERATIONS
// ==========================================

// @desc    Create a New Team Member
// @route   POST /admin/team
// @access  Private (Admin Only)
export const createTeamMember = async (req, res) => {
  try {
    const member = await Team.create(req.body);
    return res.status(201).json({
      success: true,
      msg: "Team member added successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error in createTeamMember admin controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// @desc    Update Team Member Details
// @route   PATCH /admin/team/:id
// @access  Private (Admin Only)
export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Team.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!member) {
      return res.status(404).json({
        success: false,
        msg: "Team member not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Team member details updated successfully",
      data: member,
    });
  } catch (error) {
    console.error("Error in updateTeamMember admin controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

// @desc    Delete a Team Member
// @route   DELETE /admin/team/:id
// @access  Private (Admin & Superadmin)
export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const member = await Team.findByIdAndDelete(id);

    if (!member) {
      return res.status(404).json({
        success: false,
        msg: "Team member not found",
      });
    }

    return res.status(200).json({
      success: true,
      msg: "Team member deleted successfully from directory",
    });
  } catch (error) {
    console.error("Error in deleteTeamMember admin controller:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
