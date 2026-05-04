import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const uri = "mongodb+srv://DBt2h:N2wi16082002@t2h.othrcon.mongodb.net/trip_to_honeymoon?retryWrites=true&w=majority&appName=T2H";

const AdminSchema = new mongoose.Schema({
  username: { type: String },
  password: { type: String },
  role: { type: String }
}, { collection: 'adminschemas' });

const AdminModel = mongoose.model('AdminSchema', AdminSchema);

async function run() {
  await mongoose.connect(uri);
  const hash = await bcrypt.hash("admin123", 10);
  await AdminModel.updateOne({ username: 'Admin_t2h' }, { $set: { password: hash } });
  //console.log("Password for Admin_t2h reset to: admin123");
  process.exit(0);
}
run();
