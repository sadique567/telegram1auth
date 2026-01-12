import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();
const app = express();

/* ================= MIDDLEWARE ================= */
app.use(express.json());
app.use(cors({ origin: "*" }));

/* ================= DATABASE ================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error", err));

/* ================= SCHEMA ================= */
const telegramSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },

  status: {
    type: String,
    enum: ["pending", "approved"],
    default: "pending"
  },

  isUsed: { type: Boolean, default: false },

  telegramUser: {
    id: Number,
    first_name: String,
    username: String,
    photo_url: String
  },

  token: String,

  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // auto delete in 5 minutes
  }
});

const TelegramSession = mongoose.model(
  "TelegramSession",
  telegramSessionSchema
);

/* ================= API 1 =================
   CREATE SESSION (Flutter calls this)
=========================================== */
app.post("/auth/telegram/session", async (req, res) => {
  try {
    const sessionId = crypto.randomBytes(32).toString("hex");

    await TelegramSession.create({ sessionId });

    res.json({
      success: true,
      sessionId
    });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= API 2 =================
   TELEGRAM BOT CALLS THIS
=========================================== */
app.post("/auth/telegram/verify", async (req, res) => {
  try {
    const { id, first_name, username, photo_url, sessionId } = req.body;

    const session = await TelegramSession.findOne({
      sessionId,
      status: "pending"
    });

    if (!session) {
      return res.status(400).json({ success: false });
    }

    session.status = "approved";
    session.isUsed = true;

    session.telegramUser = {
      id,
      first_name,
      username,
      photo_url
    };

    session.token = jwt.sign(
      { telegramId: id, username },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await session.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
});

/* ================= API 3 =================
   FLUTTER POLLS THIS
=========================================== */
app.get("/auth/telegram/status/:sessionId", async (req, res) => {
  const session = await TelegramSession.findOne({
    sessionId: req.params.sessionId
  });

  if (!session) {
    return res.json({ status: "invalid" });
  }

  if (session.status === "approved") {
    return res.json({
      status: "approved",
      token: session.token
    });
  }

  return res.json({ status: "pending" });
});

/* ================= SERVER ================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
