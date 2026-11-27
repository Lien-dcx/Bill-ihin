const bcrypt = require("bcrypt");
const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { email, enumValue, httpError, id, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate, requireAdmin);

function readMember(body) {
  return {
    name: text(body.name, "Full name", { max: 120 }),
    email: email(body.email),
    phone: text(body.phone, "Phone number", { required: false, max: 40 }),
    role: enumValue(body.role || "Member", "Role", ["Administrator", "Member"]),
    status: enumValue(body.status || "Active", "Status", ["Active", "Inactive"]),
    relationship: text(body.relationship, "Relationship", { required: false, max: 120 }),
    preferredChannel: text(body.preferredChannel, "Preferred payment channel", { required: false, max: 100 }),
    monthlyIncomeShareNote: text(body.monthlyIncomeShareNote, "Contribution note", { required: false, max: 500 }),
  };
}

router.post("/", async (req, res) => {
  const member = readMember(req.body);
  if (typeof req.body.password !== "string" || req.body.password.length < 8 || req.body.password.length > 128) {
    throw httpError(400, "Set an initial password of at least 8 characters for this account.");
  }
  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `INSERT INTO billihin_users
        (household_id, full_name, email, password_hash, role, relationship, phone,
         monthly_income_share_note, status, preferred_channel, avatar_bg)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '#0369A1')`,
      [req.user.householdId, member.name, member.email, passwordHash, member.role, member.relationship,
        member.phone, member.monthlyIncomeShareNote, member.status, member.preferredChannel]
    );
    await recordActivity(connection, req.user, `Added ${member.name} to the household`, "member");
    await connection.commit();
    res.status(201).json({ id: Number(result.insertId), ...member });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "An account with that email already exists.");
    throw error;
  } finally {
    connection.release();
  }
});

router.patch("/:id", async (req, res) => {
  const memberId = id(req.params.id, "Member");
  const member = readMember(req.body);
  if (memberId === req.user.id && (member.role !== "Administrator" || member.status !== "Active")) {
    throw httpError(409, "You cannot remove or demote your own active administrator account.");
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE billihin_users SET full_name = ?, email = ?, phone = ?, role = ?, status = ?, relationship = ?,
         preferred_channel = ?, monthly_income_share_note = ?
       WHERE id = ? AND household_id = ?`,
      [member.name, member.email, member.phone, member.role, member.status, member.relationship,
        member.preferredChannel, member.monthlyIncomeShareNote, memberId, req.user.householdId]
    );
    if (!result.affectedRows) {
      const [rows] = await connection.execute("SELECT id FROM billihin_users WHERE id = ? AND household_id = ?", [memberId, req.user.householdId]);
      if (!rows.length) throw httpError(404, "Household member not found.");
    }
    await recordActivity(connection, req.user, `Updated ${member.name}’s household profile`, "member");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "An account with that email already exists.");
    throw error;
  } finally {
    connection.release();
  }
  res.json({ id: memberId, ...member });
});

router.delete("/:id", async (req, res) => {
  const memberId = id(req.params.id, "Member");
  if (memberId === req.user.id) throw httpError(409, "You cannot remove the account you are using.");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [members] = await connection.execute(
      "SELECT id, full_name AS name, role, status FROM billihin_users WHERE id = ? AND household_id = ? FOR UPDATE",
      [memberId, req.user.householdId]
    );
    if (!members.length) throw httpError(404, "Household member not found.");
    if (members[0].status === "Active" && members[0].role === "Administrator") {
      const [[counts]] = await connection.execute(
        `SELECT COUNT(*) AS admins FROM billihin_users
         WHERE household_id = ? AND role = 'Administrator' AND status = 'Active'`, [req.user.householdId]
      );
      if (Number(counts.admins) <= 1) throw httpError(409, "A household must keep at least one active administrator.");
    }
    await connection.execute("UPDATE billihin_users SET status = 'Inactive' WHERE id = ? AND household_id = ?", [memberId, req.user.householdId]);
    await recordActivity(connection, req.user, `Removed ${members[0].name} from active household access`, "member");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.status(204).end();
});

module.exports = router;
