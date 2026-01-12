import express from "express";
import mongoose from "mongoose";
import crypto from "crypto";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();

/* 🔥 Middlewares */
app.use(express.json());
app.use(cors({
  origin: "*", // later restrict to frontend URL
}));

/* 🔗 MongoDB Connection */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.error("❌ Mongo Error:", err));

/* 📦 Session Schema */
const telegramSessionSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now, expires: 300 } // auto delete after 5 min
});

const TelegramSession = mongoose.model(
  "TelegramSession",
  telegramSessionSchema
);

/* 🔐 Generate Telegram Session */
app.post("/auth/telegram/session", async (req, res) => {
  try {
    const sessionId = crypto.randomBytes(32).toString("hex");

    await TelegramSession.create({
      sessionId
    });

    res.status(200).json({
      success: true,
      sessionId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create session"
    });
  }
});

/* 🚀 Server Start */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
