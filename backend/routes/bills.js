const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { date, httpError, id, positiveAmount, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

function readBill(body) {
  const title = text(body.title, "Bill title", { max: 180 });
  const provider = text(body.provider, "Service provider", { max: 120 });
  const accountNumber = text(body.accountNumber, "Account number", { required: false, max: 100 });
  const categoryId = id(body.categoryId, "Category");
  const amount = positiveAmount(body.amount, "Bill amount");
  const dueDate = date(body.dueDate, "Due date");
  const billingPeriod = text(body.billingPeriod, "Billing period", { required: false, max: 80 });
  const isRecurring = body.isRecurring === undefined ? false : body.isRecurring;
  if (typeof isRecurring !== "boolean") throw httpError(400, "Recurring status is invalid.");
  const notes = text(body.notes, "Notes", { required: false, max: 4000 });
  return { title, provider, accountNumber, categoryId, amount, dueDate, billingPeriod, isRecurring, notes };
}

async function ensureCategory(connection, householdId, categoryId) {
  const [rows] = await connection.execute("SELECT id FROM billihin_categories WHERE id = ? AND household_id = ?", [categoryId, householdId]);
  if (!rows.length) throw httpError(400, "Selected category does not belong to this household.");
}

router.post("/", requireAdmin, async (req, res) => {
  const bill = readBill(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureCategory(connection, req.user.householdId, bill.categoryId);
    const [result] = await connection.execute(
      `INSERT INTO billihin_bills
        (household_id, title, provider, account_number, category_id, amount, due_date, billing_period, is_recurring, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.householdId, bill.title, bill.provider, bill.accountNumber, bill.categoryId, bill.amount, bill.dueDate,
        bill.billingPeriod, bill.isRecurring, bill.notes]
    );
    await recordActivity(connection, req.user, `Added bill "${bill.title}"`, "bill");
    await connection.commit();
    res.status(201).json({ id: Number(result.insertId), ...bill, createdAt: new Date().toISOString().slice(0, 10) });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const billId = id(req.params.id);
  const bill = readBill(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await ensureCategory(connection, req.user.householdId, bill.categoryId);
    const [result] = await connection.execute(
      `UPDATE billihin_bills SET title = ?, provider = ?, account_number = ?, category_id = ?, amount = ?,
         due_date = ?, billing_period = ?, is_recurring = ?, notes = ?
       WHERE id = ? AND household_id = ?`,
      [bill.title, bill.provider, bill.accountNumber, bill.categoryId, bill.amount, bill.dueDate,
        bill.billingPeriod, bill.isRecurring, bill.notes, billId, req.user.householdId]
    );
    if (!result.affectedRows) {
      const [rows] = await connection.execute("SELECT id FROM billihin_bills WHERE id = ? AND household_id = ?", [billId, req.user.householdId]);
      if (!rows.length) throw httpError(404, "Bill not found.");
    }
    await recordActivity(connection, req.user, `Updated bill "${bill.title}"`, "bill");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.json({ id: billId, ...bill });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const billId = id(req.params.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [bills] = await connection.execute("SELECT title FROM billihin_bills WHERE id = ? AND household_id = ? FOR UPDATE", [billId, req.user.householdId]);
    if (!bills.length) throw httpError(404, "Bill not found.");
    const [[counts]] = await connection.execute(
      `SELECT (SELECT COUNT(*) FROM billihin_contributions WHERE bill_id = ?) AS contributions,
              (SELECT COUNT(*) FROM billihin_payments WHERE bill_id = ?) AS payments`,
      [billId, billId]
    );
    if (counts.contributions || counts.payments) {
      throw httpError(409, "This bill has financial records. Keep the history and update the bill instead of deleting it.");
    }
    await connection.execute("DELETE FROM billihin_bills WHERE id = ? AND household_id = ?", [billId, req.user.householdId]);
    await recordActivity(connection, req.user, `Deleted bill "${bills[0].title}"`, "bill");
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
