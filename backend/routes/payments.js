const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { date, httpError, id, positiveAmount, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate, requireAdmin);

function readPayment(body) {
  return {
    billId: id(body.billId, "Bill"),
    amount: positiveAmount(body.amount, "Payment amount"),
    paymentDate: date(body.paymentDate, "Payment date"),
    method: text(body.method, "Payment method", { max: 100 }),
    receiptReference: text(body.receiptReference, "Official receipt or transaction reference", { max: 120 }),
    notes: text(body.notes, "Notes", { required: false, max: 4000 }),
  };
}

async function lockBillAndCheckRemaining(connection, householdId, billId, paymentAmount, excludePaymentId = null) {
  const [bills] = await connection.execute(
    "SELECT id, title, provider, amount FROM billihin_bills WHERE id = ? AND household_id = ? FOR UPDATE",
    [billId, householdId]
  );
  if (!bills.length) throw httpError(400, "Selected bill does not belong to this household.");
  const [totals] = await connection.execute(
    `SELECT COALESCE(SUM(amount), 0) AS total
     FROM billihin_payments WHERE bill_id = ? AND household_id = ? AND (? IS NULL OR id <> ?)`,
    [billId, householdId, excludePaymentId, excludePaymentId]
  );
  const remaining = Number(bills[0].amount) - Number(totals[0].total);
  if (Number(paymentAmount) > remaining + 0.00001) {
    throw httpError(409, `This payment exceeds the remaining provider balance of ₱${Math.max(remaining, 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`);
  }
  return bills[0];
}

router.post("/", async (req, res) => {
  const payment = readPayment(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const bill = await lockBillAndCheckRemaining(connection, req.user.householdId, payment.billId, payment.amount);
    const [result] = await connection.execute(
      `INSERT INTO billihin_payments
        (household_id, bill_id, amount, payment_date, method, receipt_reference, paid_by, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Settled')`,
      [req.user.householdId, payment.billId, payment.amount, payment.paymentDate, payment.method,
        payment.receiptReference, req.user.name, payment.notes]
    );
    await recordActivity(connection, req.user,
      `Paid ₱${Number(payment.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })} directly to ${bill.provider} for ${bill.title}`,
      "payment");
    await connection.commit();
    res.status(201).json({ id: Number(result.insertId), ...payment, paidBy: req.user.name, status: "Settled" });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.patch("/:id", async (req, res) => {
  const paymentId = id(req.params.id);
  const payment = readPayment(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute(
      "SELECT id FROM billihin_payments WHERE id = ? AND household_id = ?",
      [paymentId, req.user.householdId]
    );
    if (!existing.length) throw httpError(404, "Payment record not found.");
    const bill = await lockBillAndCheckRemaining(connection, req.user.householdId, payment.billId, payment.amount, paymentId);
    const [result] = await connection.execute(
      `UPDATE billihin_payments SET bill_id = ?, amount = ?, payment_date = ?, method = ?, receipt_reference = ?, notes = ?
       WHERE id = ? AND household_id = ?`,
      [payment.billId, payment.amount, payment.paymentDate, payment.method, payment.receiptReference,
        payment.notes, paymentId, req.user.householdId]
    );
    if (!result.affectedRows) {
      const [rows] = await connection.execute("SELECT id FROM billihin_payments WHERE id = ? AND household_id = ?", [paymentId, req.user.householdId]);
      if (!rows.length) throw httpError(404, "Payment record not found.");
    }
    await recordActivity(connection, req.user, `Updated a provider payment record for ${bill.title}`, "payment");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.json({ id: paymentId, ...payment });
});

router.delete("/:id", async (req, res) => {
  const paymentId = id(req.params.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT p.id, b.title FROM billihin_payments p JOIN billihin_bills b ON b.id = p.bill_id
       WHERE p.id = ? AND p.household_id = ? FOR UPDATE`,
      [paymentId, req.user.householdId]
    );
    if (!rows.length) throw httpError(404, "Payment record not found.");
    await connection.execute("DELETE FROM billihin_payments WHERE id = ? AND household_id = ?", [paymentId, req.user.householdId]);
    await recordActivity(connection, req.user, `Deleted a provider payment record for ${rows[0].title}`, "payment");
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
