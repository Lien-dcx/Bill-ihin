const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { notifyAdmins, notifyUser, recordActivity } = require("../utils/audit");
const { date, httpError, id, positiveAmount, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

function readContribution(body) {
  return {
    billId: id(body.billId, "Bill"),
    memberId: body.memberId === undefined ? null : id(body.memberId, "Member"),
    amount: positiveAmount(body.amount, "Contribution amount"),
    contributionDate: date(body.contributionDate, "Contribution date"),
    paymentChannel: text(body.paymentChannel, "Payment channel", { max: 100 }),
    referenceNo: text(body.referenceNo, "Transfer reference", { required: false, max: 120 }),
    notes: text(body.notes, "Notes", { required: false, max: 4000 }),
  };
}

async function findRelated(connection, householdId, billId, memberId) {
  const [[billRows], [memberRows]] = await Promise.all([
    connection.execute("SELECT id, title FROM billihin_bills WHERE id = ? AND household_id = ?", [billId, householdId]),
    connection.execute("SELECT id, full_name AS name FROM billihin_users WHERE id = ? AND household_id = ? AND status = 'Active'", [memberId, householdId]),
  ]);
  if (!billRows.length) throw httpError(400, "Selected bill does not belong to this household.");
  if (!memberRows.length) throw httpError(400, "Selected member is not active in this household.");
  return { bill: billRows[0], member: memberRows[0] };
}

async function validateHouseholdContributionRules(connection, householdId, memberId, bill, contribution, excludeId = null) {
  const [households] = await connection.execute("SELECT settings FROM billihin_households WHERE id = ?", [householdId]);
  const settings = typeof households[0]?.settings === "string" ? JSON.parse(households[0].settings) : households[0]?.settings || {};
  if (settings.requireContributionProofNote && !contribution.referenceNo && !contribution.notes) {
    throw httpError(400, "Add a transfer reference or note so the administrator can verify this contribution.");
  }
  if (settings.allowPartialContributions === false) {
    const [[members]] = await connection.execute(
      "SELECT COUNT(*) AS count FROM billihin_users WHERE household_id = ? AND status = 'Active'",
      [householdId]
    );
    const memberCount = Math.max(1, Number(members.count));
    const equalShareCents = Math.round(Number(bill.amount) * 100 / memberCount);
    const amountCents = Math.round(Number(contribution.amount) * 100);
    if (amountCents !== equalShareCents) {
      throw httpError(400, `Flexible partial contributions are disabled. The equal share for this bill is ₱${(equalShareCents / 100).toLocaleString("en-PH", { minimumFractionDigits: 2 })}.`);
    }
    const [existing] = await connection.execute(
      `SELECT id FROM billihin_contributions WHERE bill_id = ? AND member_id = ? AND status <> 'Rejected'
       AND (? IS NULL OR id <> ?) LIMIT 1`,
      [contribution.billId, memberId, excludeId, excludeId]
    );
    if (existing.length) throw httpError(409, "This member already has an active contribution for this bill.");
  }
}

router.post("/", async (req, res) => {
  const contribution = readContribution(req.body);
  const memberId = req.user.role === "Administrator" && contribution.memberId
    ? contribution.memberId
    : req.user.id;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const { bill, member } = await findRelated(connection, req.user.householdId, contribution.billId, memberId);
    await validateHouseholdContributionRules(connection, req.user.householdId, memberId, bill, contribution);
    const [result] = await connection.execute(
      `INSERT INTO billihin_contributions
        (household_id, bill_id, member_id, amount, contribution_date, payment_channel, reference_no, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`,
      [req.user.householdId, contribution.billId, memberId, contribution.amount, contribution.contributionDate,
        contribution.paymentChannel, contribution.referenceNo, contribution.notes]
    );
    const formattedAmount = `₱${Number(contribution.amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    await recordActivity(connection, req.user.role === "Administrator" ? req.user : { ...req.user, name: member.name },
      `${member.name} submitted ${formattedAmount} toward ${bill.title}`, "contribution");
    await notifyAdmins(connection, req.user.householdId, {
      title: "Contribution Submitted for Verification",
      message: `${member.name} submitted ${formattedAmount} toward ${bill.title}.`,
      type: "warning", category: "Verification", targetPage: "contributions",
    });
    await connection.commit();
    res.status(201).json({ id: Number(result.insertId), status: "Pending", ...contribution, memberId });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
});

router.patch("/:id", async (req, res) => {
  const contributionId = id(req.params.id);
  const contribution = readContribution(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT member_id AS memberId, status FROM billihin_contributions WHERE id = ? AND household_id = ? FOR UPDATE",
      [contributionId, req.user.householdId]
    );
    if (!rows.length) throw httpError(404, "Contribution not found.");
    if (rows[0].status !== "Pending") throw httpError(409, "Only pending contributions can be edited.");
    if (req.user.role !== "Administrator" && Number(rows[0].memberId) !== req.user.id) {
      throw httpError(403, "You can only edit your own pending contributions.");
    }
    const memberId = req.user.role === "Administrator" && contribution.memberId ? contribution.memberId : Number(rows[0].memberId);
    const { bill } = await findRelated(connection, req.user.householdId, contribution.billId, memberId);
    await validateHouseholdContributionRules(connection, req.user.householdId, memberId, bill, contribution, contributionId);
    await connection.execute(
      `UPDATE billihin_contributions SET bill_id = ?, member_id = ?, amount = ?, contribution_date = ?,
         payment_channel = ?, reference_no = ?, notes = ?
       WHERE id = ? AND household_id = ?`,
      [contribution.billId, memberId, contribution.amount, contribution.contributionDate, contribution.paymentChannel,
        contribution.referenceNo, contribution.notes, contributionId, req.user.householdId]
    );
    await recordActivity(connection, req.user, `Updated a pending contribution for ${bill.title}`, "contribution");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.json({ id: contributionId, ...contribution });
});

router.post("/:id/verify", requireAdmin, async (req, res) => {
  const contributionId = id(req.params.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT c.member_id AS memberId, c.amount, c.status, m.full_name AS memberName, b.title AS billTitle
       FROM billihin_contributions c JOIN billihin_users m ON m.id = c.member_id JOIN billihin_bills b ON b.id = c.bill_id
       WHERE c.id = ? AND c.household_id = ? FOR UPDATE`,
      [contributionId, req.user.householdId]
    );
    if (!rows.length) throw httpError(404, "Contribution not found.");
    if (rows[0].status !== "Pending") throw httpError(409, "Only pending contributions can be confirmed.");
    await connection.execute(
      `UPDATE billihin_contributions SET status = 'Confirmed', reviewed_by = ?, reviewed_at = CURRENT_DATE, rejection_reason = NULL
       WHERE id = ?`, [req.user.id, contributionId]
    );
    const amount = `₱${Number(rows[0].amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    await recordActivity(connection, req.user, `Confirmed ${rows[0].memberName}’s ${amount} contribution for ${rows[0].billTitle}`, "verification");
    await notifyUser(connection, req.user.householdId, Number(rows[0].memberId), {
      title: "Contribution Confirmed",
      message: `Your ${amount} contribution toward ${rows[0].billTitle} was confirmed. It is now included in household collected funds.`,
      type: "success", category: "Verification", targetPage: "contributions",
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.json({ message: "Contribution confirmed." });
});

router.post("/:id/reject", requireAdmin, async (req, res) => {
  const contributionId = id(req.params.id);
  const reason = text(req.body.reason, "Rejection reason", { max: 500 });
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      `SELECT c.member_id AS memberId, c.amount, c.status, m.full_name AS memberName, b.title AS billTitle
       FROM billihin_contributions c JOIN billihin_users m ON m.id = c.member_id JOIN billihin_bills b ON b.id = c.bill_id
       WHERE c.id = ? AND c.household_id = ? FOR UPDATE`,
      [contributionId, req.user.householdId]
    );
    if (!rows.length) throw httpError(404, "Contribution not found.");
    if (rows[0].status !== "Pending") throw httpError(409, "Only pending contributions can be rejected.");
    await connection.execute(
      `UPDATE billihin_contributions SET status = 'Rejected', reviewed_by = ?, reviewed_at = CURRENT_DATE, rejection_reason = ?
       WHERE id = ?`, [req.user.id, reason, contributionId]
    );
    const amount = `₱${Number(rows[0].amount).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
    await recordActivity(connection, req.user, `Rejected ${rows[0].memberName}’s contribution for ${rows[0].billTitle}`, "verification");
    await notifyUser(connection, req.user.householdId, Number(rows[0].memberId), {
      title: "Contribution Rejected",
      message: `Your ${amount} contribution toward ${rows[0].billTitle} was rejected: ${reason}`,
      type: "danger", category: "Rejection", targetPage: "contributions",
    });
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
  res.json({ message: "Contribution rejected." });
});

router.delete("/:id", async (req, res) => {
  const contributionId = id(req.params.id);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.execute(
      "SELECT member_id AS memberId, status FROM billihin_contributions WHERE id = ? AND household_id = ? FOR UPDATE",
      [contributionId, req.user.householdId]
    );
    if (!rows.length) throw httpError(404, "Contribution not found.");
    if (rows[0].status !== "Pending") throw httpError(409, "Confirmed and rejected contribution records are retained for audit history.");
    if (req.user.role !== "Administrator" && Number(rows[0].memberId) !== req.user.id) {
      throw httpError(403, "You can only remove your own pending contributions.");
    }
    await connection.execute("DELETE FROM billihin_contributions WHERE id = ?", [contributionId]);
    await recordActivity(connection, req.user, "Removed a pending contribution", "contribution");
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
