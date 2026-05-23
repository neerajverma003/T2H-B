import mongoose from "mongoose";
import dotenv from "dotenv";
import Team from "./models/team.model.js";

dotenv.config();

const mongoUri = process.env.MONGO_URI;

const teamData = [
  {
    name: "Sandeep",
    designation: "CEO & Founder",
    image: "https://img.freepik.com/premium-vector/flat-illustration-men-wearing-jacket-brown-black-color-combination_981536-1552.jpg?semt=ais_hybrid&w=740&q=80",
    order: 1,
    status: true
  },
  {
    name: "Sampurna Nand Jha",
    designation: "Manager",
    image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQcJl1roiHJ4EVjqGhYo-pHRun5CrOQE8JAR4CIgjPNOg&s",
    order: 2,
    status: true
  },
  {
    name: "Vikesh Kumar",
    designation: "Head of Digital Marketing",
    image: "https://png.pngtree.com/png-clipart/20230930/original/pngtree-man-avatar-isolated-png-image_13022161.png",
    order: 3,
    status: true
  },
  {
    name: "Tannu Sharma",
    designation: "HR Admin",
    image: "https://t4.ftcdn.net/jpg/11/66/06/77/360_F_1166067709_2SooAuPWXp20XkGev7oOT7nuK1VThCsN.jpg",
    order: 4,
    status: true
  },
  {
    name: "Neeraj Verma",
    designation: "Head of IT",
    image: "https://png.pngtree.com/png-clipart/20230927/original/pngtree-man-avatar-image-for-profile-png-image_13001882.png",
    order: 5,
    status: true
  }
];

async function seed() {
  try {
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in your .env configuration!");
    }
    console.log("Connecting to Database Cluster...");
    await mongoose.connect(mongoUri);
    console.log("Successfully connected! Cleaning old team collection...");
    
    await Team.deleteMany({});
    console.log("Database cleared. Inserting dynamic roster in sort orders...");

    await Team.insertMany(teamData);
    console.log("✨ Seeding completed successfully! 5 Team members are now registered in Database.");
    
    await mongoose.disconnect();
    console.log("Disconnected from database.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
