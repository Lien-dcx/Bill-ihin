const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { date, enumValue, httpError, id, nonNegativeAmount, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

function readAssignment(body) {
  return {
    billId: id(body.billId, "Bill"),
    memberId: id(body.memberId, "Member"),
    targetAmount: nonNegativeAmount(body.targetAmount ?? 0, "Target amount"),
    deadline: date(body.deadline, "Deadline"),
    priority: enumValue(body.priority || "Normal", "Priority", ["Low", "Normal", "High", "Urgent"]),
    notes: text(body.notes, "Notes", { required: false, max: 500 }),
  };
}

async function ensureRelated(connection, householdId, assignment) {
  const [[bills], [members]] = await Promise.all([
    connection.execute("SELECT id FROM billihin_bills WHERE id = ? AND household_id = ?", [assignment.billId, householdId]),
    connection.execute("SELECT id FROM billihin_users WHERE id = ? AND household_id = ? AND status = 'Active'", [assignment.memberId, householdId]),
  ]);
  if (!bills.length) throw httpError(400, "Selected bill does not belong to this household.");
  if (!members.length) throw httpError(400, "Selected member is not active in this household.");
}

router.post("/", requireAdmin, async (req, res) => {
  const assignment = readAssignment(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureRelated(connection, req.user.householdId, assignment);
    const [result] = await connection.execute(
      `INSERT INTO billihin_assignments (household_id, bill_id, member_id, target_amount, deadline, priority, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.user.householdId, assignment.billId, assignment.memberId, assignment.targetAmount,
        assignment.deadline, assignment.priority, assignment.notes]
    );
    await recordActivity(connection, req.user, "Assigned a bill responsibility", "assignment");
    await connection.commit();
    res.status(201).json({ id: Number(result.insertId), ...assignment });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "This member already has an assignment for this bill.");
    throw error;
  } finally {
    connection.release();
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const assignmentId = id(req.params.id);
  const assignment = readAssignment(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureRelated(connection, req.user.householdId, assignment);
    const [result] = await connection.execute(
      `UPDATE billihin_assignments SET bill_id = ?, member_id = ?, target_amount = ?, deadline = ?, priority = ?, notes = ?
       WHERE id = ? AND household_id = ?`,
      [assignment.billId, assignment.memberId, assignment.targetAmount, assignment.deadline, assignment.priority,
        assignment.notes, assignmentId, req.user.householdId]
    );
    if (!result.affectedRows) {
      const [rows] = await connection.execute("SELECT id FROM billihin_assignments WHERE id = ? AND household_id = ?", [assignmentId, req.user.householdId]);
      if (!rows.length) throw httpError(404, "Assignment not found.");
    }
    await recordActivity(connection, req.user, "Updated a bill assignment", "assignment");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "This member already has an assignment for this bill.");
    throw error;
  } finally {
    connection.release();
  }
  res.json({ id: assignmentId, ...assignment });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const assignmentId = id(req.params.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id FROM billihin_assignments WHERE id = ? AND household_id = ?", [assignmentId, req.user.householdId]);
    if (!rows.length) throw httpError(404, "Assignment not found.");
    await connection.execute("DELETE FROM billihin_assignments WHERE id = ?", [assignmentId]);
    await recordActivity(connection, req.user, "Removed a bill assignment", "assignment");
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
