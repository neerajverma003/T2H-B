import Team from "../models/team.model.js";

// 1. GET ALL TEAM MEMBERS (Public Endpoint - Public list)
export const getTeam = async (req, res, next) => {
  try {
    const activeTeam = await Team.find({ status: true }).sort({ order: 1 });
    res.status(200).json({ success: true, data: activeTeam });
  } catch (error) {
    next(error); // Error middleware ko forward karega
  }
};

// 2. CREATE NEW MEMBER (Admin only)
export const createTeamMember = async (req, res, next) => {
  try {
    const newMember = await Team.create(req.body);
    res.status(201).json({ success: true, data: newMember });
  } catch (error) {
    next(error);
  }
};
