const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { httpError, nonNegativeAmount, id, month, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

function readBudget(body) {
  const monthDate = month(body.month);
  const categoryId = id(body.categoryId, "Category");
  const allocatedAmount = nonNegativeAmount(body.allocatedAmount, "Allocated amount");
  const alertThresholdPct = Number(body.alertThresholdPct ?? 85);
  if (!Number.isInteger(alertThresholdPct) || alertThresholdPct < 1 || alertThresholdPct > 100) {
    throw httpError(400, "Budget alert threshold must be between 1 and 100.");
  }
  const notes = text(body.notes, "Notes", { required: false, max: 500 });
  return { monthDate, categoryId, allocatedAmount, alertThresholdPct, notes };
}

async function ensureCategory(connection, householdId, categoryId) {
  const [rows] = await connection.execute(
    "SELECT id FROM billihin_categories WHERE id = ? AND household_id = ?",
    [categoryId, householdId]
  );
  if (!rows.length) throw httpError(400, "Selected category does not belong to this household.");
}

router.post("/", requireAdmin, async (req, res) => {
  const budget = readBudget(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureCategory(connection, req.user.householdId, budget.categoryId);
    const [result] = await connection.execute(
      `INSERT INTO billihin_budgets (household_id, category_id, month, allocated_amount, alert_threshold_pct, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.householdId, budget.categoryId, budget.monthDate, budget.allocatedAmount, budget.alertThresholdPct, budget.notes]
    );
    await recordActivity(connection, req.user, "Created a category budget", "budget");
    await connection.commit();
    res.status(201).json({ id: Number(result.insertId) });
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "A budget already exists for this category and month.");
    throw error;
  } finally {
    connection.release();
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const budgetId = id(req.params.id);
  const budget = readBudget(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureCategory(connection, req.user.householdId, budget.categoryId);
    const [result] = await connection.execute(
      `UPDATE billihin_budgets SET category_id = ?, month = ?, allocated_amount = ?, alert_threshold_pct = ?, notes = ?
       WHERE id = ? AND household_id = ?`,
      [budget.categoryId, budget.monthDate, budget.allocatedAmount, budget.alertThresholdPct, budget.notes, budgetId, req.user.householdId]
    );
    if (!result.affectedRows) throw httpError(404, "Budget not found.");
    await recordActivity(connection, req.user, "Updated a category budget", "budget");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "A budget already exists for this category and month.");
    throw error;
  } finally {
    connection.release();
  }
  res.json({ message: "Budget updated." });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const budgetId = id(req.params.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute("SELECT id FROM billihin_budgets WHERE id = ? AND household_id = ?", [budgetId, req.user.householdId]);
    if (!rows.length) throw httpError(404, "Budget not found.");
    await connection.execute("DELETE FROM billihin_budgets WHERE id = ? AND household_id = ?", [budgetId, req.user.householdId]);
    await recordActivity(connection, req.user, "Removed a category budget", "budget");
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
