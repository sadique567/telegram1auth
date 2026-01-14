import express from "express";
import crypto from "crypto";
import jwt from "jsonwebtoken";

const app = express();

app.get("/auth/telegram", (req, res) => {
  console.log("🔥 Telegram hit");
  console.log("QUERY:", req.query);

  const data = { ...req.query };
  const hash = data.hash;
  delete data.hash;

  if (!hash) {
    return res.status(400).send("No hash received");
  }

  const secret = crypto
    .createHash("sha256")
    .update(process.env.BOT_TOKEN)
    .digest();

  const checkString = Object.keys(data)
    .sort()
    .map(key => `${key}=${data[key]}`)
    .join("\n");

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  if (hmac !== hash) {
    console.log("❌ HASH MISMATCH");
    return res.status(403).send("Invalid Telegram login");
  }

  console.log("✅ TELEGRAM USER VERIFIED:", data);

  const token = jwt.sign(
    { telegram_id: data.id, username: data.username },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.redirect(`eazycart://telegram-login?token=${token}`);
});

app.get("/", (req, res) => {
  res.send("Server running");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server started");
});
