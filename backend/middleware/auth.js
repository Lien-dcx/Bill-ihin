const jwt = require("jsonwebtoken");
const db = require("../config/db");

function getSessionToken(req) {
  const authorization = req.get("authorization");
  if (authorization?.startsWith("Bearer ")) return authorization.slice(7);

  const cookie = req.headers.cookie
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("billihin_session="));
  return cookie ? decodeURIComponent(cookie.slice("billihin_session=".length)) : null;
}

async function authenticate(req, res, next) {
  try {
    const token = getSessionToken(req);
    if (!token) return res.status(401).json({ message: "Please sign in to continue." });

    const claims = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    const [users] = await db.execute(
      `SELECT id, household_id AS householdId, full_name AS name, email,
              role, status, relationship, phone, monthly_income_share_note AS monthlyIncomeShareNote,
              preferred_channel AS preferredChannel, avatar_bg AS avatarBg,
              DATE_FORMAT(joined_at, '%Y-%m-%d') AS joinedAt
       FROM billihin_users
       WHERE id = ? AND status = 'Active'`,
      [claims.sub]
    );

    if (!users.length) return res.status(401).json({ message: "This account is inactive." });
    const user = users[0];
    user.id = Number(user.id);
    user.householdId = Number(user.householdId);
    user.avatarInitials = user.name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
    req.user = user;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    next(error);
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "Administrator") {
    return res.status(403).json({ message: "Administrator access is required for this action." });
  }
  next();
}

module.exports = { authenticate, requireAdmin };
