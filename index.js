import express from "express";
import mongoose from "mongoose";
import session from "express-session";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import User from "./model/user.js";

dotenv.config();
const app = express();
app.set("trust proxy", 1);
/* 🔗 MongoDB Connect */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* 🔥 CORS (Vercel → Render) */
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json());


app.use(express.urlencoded({ extended: true }));

/* 🔐 SESSION (PHP session equivalent) */
app.use(
  session({
    name: "telegram-session",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "none", // Cross-domain
    },
  })
);

/* 🔐 TELEGRAM AUTH CHECK (PHP SAME LOGIC) */
function checkTelegramAuthorization(authData) {
  const hash = authData.hash;
  delete authData.hash;
/*
  // const dataCheckString = Object.keys(authData)
  //   .sort()
  //   .map(key => `${key}=${authData[key]}`)
  //   .join("\n");
*/
const dataCheckString = Object.keys(authData)
  .filter(key => authData[key] !== undefined && authData[key] !== null)
  .sort()
  .map(key => `${key}=${authData[key]}`)
  .join("\n");

  
  const secretKey = crypto
    .createHash("sha256")
    .update(process.env.BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (hmac !== hash) throw new Error("Data is NOT from Telegram");

  if (Date.now() / 1000 - authData.auth_date > 86400)
    throw new Error("Data is outdated");

  return authData;
}

/* 🔥 LOGIN API (PHP auth.php clone) */
app.post("/auth/telegram", async (req, res) => {
  try {
    const user = checkTelegramAuthorization(req.body);

    let existing = await User.findOne({ telegram_id: user.id });

    if (existing) {
      // UPDATE
      existing.first_name = user.first_name;
      existing.last_name = user.last_name || null;
      existing.telegram_username = user.username || null;
      existing.profile_picture = user.photo_url || null;
      existing.auth_date = user.auth_date;
      await existing.save();
    } else {
      // CREATE
      await User.create({
        first_name: user.first_name,
        last_name: user.last_name || null,
        telegram_id: user.id,
        telegram_username: user.username || null,
        profile_picture: user.photo_url || null,
        auth_date: user.auth_date,
      });
    }

    // PHP SESSION
    req.session.loggedIn = true;
    req.session.telegram_id = user.id;

    res.json({ success: true });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

/* 👤 USER DATA (user.php replacement) */
app.get("/me", async (req, res) => {
  if (!req.session.loggedIn)
    return res.status(401).json({ error: "Not logged in" });

  const user = await User.findOne({
    telegram_id: req.session.telegram_id,
  });

  res.json(user);
});

/* 🚪 LOGOUT */
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});
// 🔐 GET ALL USERS
app.get("/users", async (req, res) => {
  if (!req.session.loggedIn) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const users = await User.find().sort({ auth_date: -1 });
  res.json({ count: users.length, users });
});


// 👤 GET USER BY TELEGRAM ID
app.get("/users/:telegramId", async (req, res) => {
  try {
    const user = await User.findOne({
      telegram_id: req.params.telegramId,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(3000, () => console.log("Backend running on Render"));
