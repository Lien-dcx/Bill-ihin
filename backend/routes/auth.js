const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const rateLimit = require("../middleware/rateLimit");
const { recordActivity } = require("../utils/audit");
const { email, httpError, text } = require("../utils/validation");

const router = express.Router();
const registrationLimit = rateLimit();
const loginLimit = rateLimit({ failureStatus: 401 });
const defaultSettings = {
  defaultCurrency: "PHP",
  cycleStartDay: 1,
  requireContributionProofNote: true,
  allowPartialContributions: true,
  autoAlertBudgetPct: 85,
  inAppAlerts: true,
};

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 8 * 60 * 60 * 1000,
  };
}

function setSession(res, user) {
  const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "8h",
  });
  res.cookie("billihin_session", token, cookieOptions());
}

function publicUser(user) {
  const name = user.name || user.full_name;
  return {
    id: Number(user.id),
    householdId: Number(user.householdId || user.household_id),
    name,
    email: user.email,
    phone: user.phone || "",
    role: user.role,
    relationship: user.relationship || "Household Member",
    monthlyIncomeShareNote: user.monthlyIncomeShareNote || "",
    status: user.status,
    joinedAt: user.joinedAt || user.joined_at,
    preferredChannel: user.preferredChannel || user.preferred_channel || "",
    avatarBg: user.avatarBg || user.avatar_bg || "#0E7490",
    avatarInitials: name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
  };
}

router.post("/register", registrationLimit, async (req, res) => {
  const fullName = text(req.body.fullName, "Full name", { max: 120 });
  const accountEmail = email(req.body.email);
  const password = req.body.password;
  if (typeof password !== "string" || password.length < 8 || password.length > 128) {
    throw httpError(400, "Password must be between 8 and 128 characters.");
  }
  const relationship = text(req.body.relationship || "Household Head", "Relationship", { max: 120 });
  const householdName = text(req.body.householdName, "Household name", { required: false, max: 120 });
  const inviteCode = text(req.body.inviteCode, "Invite code", { required: false, max: 40 });
  if (Boolean(householdName) === Boolean(inviteCode)) {
    throw httpError(400, "Choose either a new household or an invite code.");
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    let householdId;
    let role;
    if (householdName) {
      const code = `BH-${crypto.randomBytes(5).toString("hex").toUpperCase()}`;
      const [householdResult] = await connection.execute(
        `INSERT INTO billihin_households (name, currency, monthly_target_budget, billing_cycle_day, invite_code, settings)
         VALUES (?, 'PHP', 0, 1, ?, ?)`,
        [householdName, code, JSON.stringify(defaultSettings)]
      );
      householdId = householdResult.insertId;
      role = "Administrator";
    } else {
      const [households] = await connection.execute(
        "SELECT id FROM billihin_households WHERE invite_code = ?",
        [inviteCode.toUpperCase()]
      );
      if (!households.length) throw httpError(400, "That household invite code is not valid.");
      householdId = households[0].id;
      role = "Member";
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const [result] = await connection.execute(
      `INSERT INTO billihin_users
        (household_id, full_name, email, password_hash, role, relationship, status, avatar_bg)
       VALUES (?, ?, ?, ?, ?, ?, 'Active', '#0E7490')`,
      [householdId, fullName, accountEmail, passwordHash, role, relationship]
    );
    const user = publicUser({
      id: result.insertId,
      householdId,
      name: fullName,
      email: accountEmail,
      role,
      relationship,
      status: "Active",
      joinedAt: new Date().toISOString().slice(0, 10),
    });
    await recordActivity(connection, { householdId, name: fullName }, `${fullName} created an account`, "member");
    await connection.commit();
    setSession(res, user);
    res.status(201).json({ user, role });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "An account with this email already exists.");
    throw error;
  } finally {
    connection.release();
  }
});

router.post("/login", loginLimit, async (req, res) => {
  const accountEmail = email(req.body.email);
  if (typeof req.body.password !== "string" || !req.body.password) {
    throw httpError(400, "Password is required.");
  }
  const [users] = await db.execute(
    `SELECT id, household_id AS householdId, full_name AS name, email, password_hash AS passwordHash,
            role, status, relationship, phone, monthly_income_share_note AS monthlyIncomeShareNote,
            preferred_channel AS preferredChannel, avatar_bg AS avatarBg,
            DATE_FORMAT(joined_at, '%Y-%m-%d') AS joinedAt
     FROM billihin_users WHERE email = ? LIMIT 1`,
    [accountEmail]
  );
  const user = users[0];
  if (!user || user.status !== "Active" || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    throw httpError(401, "Email or password is incorrect.");
  }
  const safeUser = publicUser(user);
  setSession(res, safeUser);
  res.json({ user: safeUser });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("billihin_session", cookieOptions());
  res.status(204).end();
});

router.get("/me", authenticate, async (req, res) => {
  const [households] = await db.execute(
    `SELECT id, name, address, currency, currency_symbol AS currencySymbol,
            monthly_target_budget AS monthlyTargetBudget, billing_cycle_day AS billingCycleDay,
            DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt, invite_code AS inviteCode, settings
     FROM billihin_households WHERE id = ?`,
    [req.user.householdId]
  );
  const household = households[0];
  const settings = household.settings || defaultSettings;
  delete household.settings;
  res.json({ user: req.user, household, settings });
});

router.patch("/profile", authenticate, async (req, res) => {
  const fullName = text(req.body.name, "Full name", { max: 120 });
  const accountEmail = email(req.body.email);
  const phone = text(req.body.phone, "Phone", { required: false, max: 40 });
  const relationship = text(req.body.relationship, "Relationship", { required: false, max: 120 });
  const monthlyIncomeShareNote = text(req.body.monthlyIncomeShareNote, "Contribution note", { required: false, max: 500 });
  const preferredChannel = text(req.body.preferredChannel, "Preferred payment channel", { required: false, max: 100 });
  try {
    await db.execute(
      `UPDATE billihin_users SET full_name = ?, email = ?, phone = ?, relationship = ?,
         monthly_income_share_note = ?, preferred_channel = ?
       WHERE id = ? AND household_id = ?`,
      [fullName, accountEmail, phone, relationship, monthlyIncomeShareNote, preferredChannel,
        req.user.id, req.user.householdId]
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "That email is already in use.");
    throw error;
  }
  res.json({ message: "Profile updated." });
});

router.patch("/password", authenticate, async (req, res) => {
  const currentPassword = req.body.currentPassword;
  const newPassword = req.body.newPassword;
  if (typeof currentPassword !== "string" || typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128) {
    throw httpError(400, "Enter your current password and a new password of at least 8 characters.");
  }
  const [rows] = await db.execute("SELECT password_hash FROM billihin_users WHERE id = ?", [req.user.id]);
  if (!rows.length || !(await bcrypt.compare(currentPassword, rows[0].password_hash))) {
    throw httpError(400, "Current password is incorrect.");
  }
  const hash = await bcrypt.hash(newPassword, 12);
  await db.execute("UPDATE billihin_users SET password_hash = ? WHERE id = ?", [hash, req.user.id]);
  res.json({ message: "Password updated." });
});

module.exports = router;
