// middleware/originCheck.js
const allowedOrigins = ["https://app.glitchgone.com"];

function originCheck(req, res, next) {
  const origin = req.headers.origin;

  if (allowedOrigins.includes(origin)) {
    return next();
  }

  return res.status(403).json({ message: "Forbidden: Origin not allowed" });
}

module.exports = originCheck;