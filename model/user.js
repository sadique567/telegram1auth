import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  telegram_id: { type: Number, unique: true },
  telegram_username: String,
  profile_picture: String,
  auth_date: Number,
});

export default mongoose.model("User", userSchema);
