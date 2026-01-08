import crypto from "crypto";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false });
  }

  const BOT_TOKEN = process.env.BOT_TOKEN;
  const user = req.body;

  const authData = { ...user };
  const hash = authData.hash;
  delete authData.hash;

  const sorted = Object.keys(authData)
    .sort()
    .map(k => `${k}=${authData[k]}`)
    .join("\n");

  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const hmac = crypto
    .createHmac("sha256", secret)
    .update(sorted)
    .digest("hex");

  if (hmac !== hash) {
    return res.status(401).json({ success: false });
  }

  return res.json({
    success: true,
    user: {
      id: user.id,
      first_name: user.first_name,
      username: user.username,
      photo_url: user.photo_url
    }
  });
}
