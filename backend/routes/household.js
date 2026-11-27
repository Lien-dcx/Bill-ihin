const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { httpError, nonNegativeAmount, text } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

router.get("/data", async (req, res) => {
  const householdId = req.user.householdId;
  const queries = [
    db.execute(
      `SELECT id, name, address, currency, currency_symbol AS currencySymbol,
              monthly_target_budget AS monthlyTargetBudget, billing_cycle_day AS billingCycleDay,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt, invite_code AS inviteCode, settings
       FROM billihin_households WHERE id = ?`, [householdId]
    ),
    db.execute(
      `SELECT id, full_name AS name, email, phone, role, relationship,
              monthly_income_share_note AS monthlyIncomeShareNote, status,
              DATE_FORMAT(joined_at, '%Y-%m-%d') AS joinedAt, avatar_bg AS avatarBg,
              preferred_channel AS preferredChannel
       FROM billihin_users WHERE household_id = ? ORDER BY status = 'Active' DESC, full_name`, [householdId]
    ),
    db.execute(
      `SELECT id, name, description, color, monthly_allocation AS monthlyAllocation, is_active AS isActive
       FROM billihin_categories WHERE household_id = ? ORDER BY name`, [householdId]
    ),
    db.execute(
      `SELECT id, DATE_FORMAT(month, '%Y-%m') AS month, category_id AS categoryId,
              allocated_amount AS allocatedAmount, alert_threshold_pct AS alertThresholdPct, notes
       FROM billihin_budgets WHERE household_id = ? ORDER BY month DESC, id`, [householdId]
    ),
    db.execute(
      `SELECT id, title, provider, account_number AS accountNumber, category_id AS categoryId,
              amount, DATE_FORMAT(due_date, '%Y-%m-%d') AS dueDate, billing_period AS billingPeriod,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt, is_recurring AS isRecurring, notes
       FROM billihin_bills WHERE household_id = ? ORDER BY due_date, id DESC`, [householdId]
    ),
    db.execute(
      `SELECT c.id, c.bill_id AS billId, c.member_id AS memberId, c.amount,
              DATE_FORMAT(c.contribution_date, '%Y-%m-%d') AS contributionDate,
              c.payment_channel AS paymentChannel, c.reference_no AS referenceNo, c.notes, c.status,
              reviewer.full_name AS reviewedBy,
              DATE_FORMAT(c.reviewed_at, '%Y-%m-%d') AS reviewedAt, c.rejection_reason AS rejectionReason,
              DATE_FORMAT(c.created_at, '%Y-%m-%d %H:%i') AS submittedAt
       FROM billihin_contributions c
       LEFT JOIN billihin_users reviewer ON reviewer.id = c.reviewed_by
       WHERE c.household_id = ? ORDER BY c.created_at DESC, c.id DESC`, [householdId]
    ),
    db.execute(
      `SELECT id, bill_id AS billId, member_id AS memberId, target_amount AS targetAmount,
              DATE_FORMAT(deadline, '%Y-%m-%d') AS deadline, priority, notes,
              DATE_FORMAT(created_at, '%Y-%m-%d') AS createdAt
       FROM billihin_assignments WHERE household_id = ? ORDER BY deadline, id DESC`, [householdId]
    ),
    db.execute(
      `SELECT id, bill_id AS billId, amount, DATE_FORMAT(payment_date, '%Y-%m-%d') AS paymentDate,
              method, receipt_reference AS receiptReference, paid_by AS paidBy, notes, status
       FROM billihin_payments WHERE household_id = ? ORDER BY payment_date DESC, id DESC`, [householdId]
    ),
    db.execute(
      `SELECT id, title, message, type, category, target_page AS targetPage,
              read_at IS NOT NULL AS \`read\`,
              DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS createdAt
       FROM billihin_notifications WHERE household_id = ? AND user_id = ? ORDER BY created_at DESC, id DESC`,
      [householdId, req.user.id]
    ),
    db.execute(
      `SELECT id, actor, action, DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS timestamp, kind
       FROM billihin_activities WHERE household_id = ? ORDER BY created_at DESC, id DESC LIMIT 100`, [householdId]
    ),
  ];
  const results = await Promise.all(queries);
  const [householdRows, members, categories, budgets, bills, contributions, assignments, payments, notifications, activities] = results.map(([rows]) => rows);
  const household = householdRows[0];
  if (!household) throw httpError(404, "Household not found.");
  const settings = household.settings && typeof household.settings === "string"
    ? JSON.parse(household.settings)
    : household.settings;
  delete household.settings;
  const normalizeIds = (rows, fields) => rows.map((row) => {
    const normalized = { ...row };
    for (const field of fields) if (normalized[field] !== null && normalized[field] !== undefined) normalized[field] = Number(normalized[field]);
    return normalized;
  });
  household.id = Number(household.id);
  for (const member of members) {
    member.id = Number(member.id);
    member.avatarInitials = member.name.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  }
  res.json({
    household,
    settings,
    members,
    categories: normalizeIds(categories, ["id"]).map((category) => ({ ...category, isActive: Boolean(category.isActive) })),
    budgets: normalizeIds(budgets, ["id", "categoryId"]),
    bills: normalizeIds(bills, ["id", "categoryId"]).map((bill) => ({ ...bill, isRecurring: Boolean(bill.isRecurring) })),
    contributions: normalizeIds(contributions, ["id", "billId", "memberId"]),
    assignments: normalizeIds(assignments, ["id", "billId", "memberId"]),
    payments: normalizeIds(payments, ["id", "billId"]),
    notifications: normalizeIds(notifications, ["id"]).map((item) => ({ ...item, read: Boolean(item.read) })),
    activities: normalizeIds(activities, ["id"]),
  });
});

router.put("/", requireAdmin, async (req, res) => {
  const name = text(req.body.name, "Household name", { max: 120 });
  const address = text(req.body.address, "Address", { required: false, max: 255 });
  const monthlyTargetBudget = nonNegativeAmount(req.body.monthlyTargetBudget, "Monthly target budget");
  const billingCycleDay = Number(req.body.billingCycleDay);
  if (!Number.isInteger(billingCycleDay) || billingCycleDay < 1 || billingCycleDay > 28) {
    throw httpError(400, "Billing cycle day must be between 1 and 28.");
  }
  const inviteCode = text(req.body.inviteCode, "Invite code", { max: 40 }).toUpperCase();
  if (!/^[A-Z0-9-]{4,40}$/.test(inviteCode)) throw httpError(400, "Invite code may contain letters, numbers, and hyphens.");
  const requestedSettings = req.body.settings;
  if (!requestedSettings || typeof requestedSettings !== "object" || Array.isArray(requestedSettings)) {
    throw httpError(400, "Household settings are invalid.");
  }
  const allowedKeys = ["defaultCurrency", "cycleStartDay", "requireContributionProofNote", "allowPartialContributions", "autoAlertBudgetPct", "inAppAlerts"];
  const settings = {};
  for (const key of allowedKeys) if (key in requestedSettings) settings[key] = requestedSettings[key];
  if (settings.defaultCurrency !== undefined && settings.defaultCurrency !== "PHP") throw httpError(400, "Only PHP currency is currently supported.");
  for (const key of ["requireContributionProofNote", "allowPartialContributions", "inAppAlerts"]) {
    if (settings[key] !== undefined && typeof settings[key] !== "boolean") throw httpError(400, `${key} must be a boolean.`);
  }
  if (settings.autoAlertBudgetPct !== undefined && (!Number.isInteger(Number(settings.autoAlertBudgetPct)) || Number(settings.autoAlertBudgetPct) < 50 || Number(settings.autoAlertBudgetPct) > 100)) {
    throw httpError(400, "Budget warning threshold must be between 50 and 100.");
  }
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [currentRows] = await connection.execute("SELECT settings FROM billihin_households WHERE id = ? FOR UPDATE", [req.user.householdId]);
    const currentSettings = typeof currentRows[0]?.settings === "string" ? JSON.parse(currentRows[0].settings) : currentRows[0]?.settings || {};
    const mergedSettings = { ...currentSettings, ...settings, cycleStartDay: billingCycleDay };
    await connection.execute(
      `UPDATE billihin_households SET name = ?, address = ?, monthly_target_budget = ?, billing_cycle_day = ?, invite_code = ?, settings = ?
       WHERE id = ?`,
      [name, address, monthlyTargetBudget, billingCycleDay, inviteCode, JSON.stringify(mergedSettings), req.user.householdId]
    );
    await recordActivity(connection, req.user, "Updated household settings", "settings");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "That invite code is already in use.");
    throw error;
  } finally {
    connection.release();
  }
  res.json({ message: "Household settings updated." });
});

module.exports = router;
