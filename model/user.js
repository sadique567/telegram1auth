import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  telegram_id: { type: Number, unique: true },
  telegram_username: String,
  profile_picture: String,
  auth_date: Number,
});

const User = mongoose.model("User", userSchema);

export default User;



// const userSchema = new mongoose.Schema({
//   first_name: String,
//   last_name: String,
//   telegram_id: { type: Number, unique: true },
//   telegram_username: String,
//   profile_picture: String,
//   auth_date: Number,
// });

// export default mongoose.model("User", userSchema);



// await User.create({
//   first_name: user.first_name,
//   last_name: user.last_name || null,
//   telegram_id: user.id,
//   telegram_username: user.username || null,
//   profile_picture: user.photo_url || null,
//   auth_date: user.auth_date,
// });