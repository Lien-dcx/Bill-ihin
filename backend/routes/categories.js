const express = require("express");
const db = require("../config/db");
const { authenticate, requireAdmin } = require("../middleware/auth");
const { recordActivity } = require("../utils/audit");
const { httpError, nonNegativeAmount, text, id } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

function readCategory(body) {
  const name = text(body.name, "Category name", { max: 100 });
  const description = text(body.description, "Description", { required: false, max: 500 });
  const color = text(body.color || "#00DCE5", "Category color", { max: 7 });
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw httpError(400, "Choose a valid six-digit color.");
  const monthlyAllocation = nonNegativeAmount(body.monthlyAllocation ?? 0, "Monthly allocation");
  const isActive = body.isActive === undefined ? true : body.isActive;
  if (typeof isActive !== "boolean") throw httpError(400, "Category active status is invalid.");
  return { name, description, color, monthlyAllocation, isActive };
}

router.post("/", requireAdmin, async (req, res) => {
  const category = readCategory(req.body);
  try {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      const [result] = await connection.execute(
        `INSERT INTO billihin_categories (household_id, name, description, color, monthly_allocation, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [req.user.householdId, category.name, category.description, category.color, category.monthlyAllocation, category.isActive]
      );
      await recordActivity(connection, req.user, `Added category "${category.name}"`, "category");
      await connection.commit();
      res.status(201).json({ id: Number(result.insertId), ...category });
    } catch (error) {
      await connection.rollback();
      if (error.code === "ER_DUP_ENTRY") throw httpError(409, "A category with that name already exists.");
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    throw error;
  }
});

router.patch("/:id", requireAdmin, async (req, res) => {
  const categoryId = id(req.params.id);
  const category = readCategory(req.body);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [result] = await connection.execute(
      `UPDATE billihin_categories SET name = ?, description = ?, color = ?, monthly_allocation = ?, is_active = ?
       WHERE id = ? AND household_id = ?`,
      [category.name, category.description, category.color, category.monthlyAllocation, category.isActive, categoryId, req.user.householdId]
    );
    if (!result.affectedRows) throw httpError(404, "Category not found.");
    await recordActivity(connection, req.user, `Updated category "${category.name}"`, "category");
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    if (error.code === "ER_DUP_ENTRY") throw httpError(409, "A category with that name already exists.");
    throw error;
  } finally {
    connection.release();
  }
  res.json({ id: categoryId, ...category });
});

router.delete("/:id", requireAdmin, async (req, res) => {
  const categoryId = id(req.params.id);
  const [categories] = await db.execute("SELECT name FROM billihin_categories WHERE id = ? AND household_id = ?", [categoryId, req.user.householdId]);
  if (!categories.length) throw httpError(404, "Category not found.");
  const [[usage]] = await db.execute(
    `SELECT (SELECT COUNT(*) FROM billihin_bills WHERE category_id = ?) +
            (SELECT COUNT(*) FROM billihin_budgets WHERE category_id = ?) AS count`,
    [categoryId, categoryId]
  );
  if (usage.count) throw httpError(409, "This category is used by bills or budgets. Reassign them before deleting it.");
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM billihin_categories WHERE id = ? AND household_id = ?", [categoryId, req.user.householdId]);
    await recordActivity(connection, req.user, `Deleted category "${categories[0].name}"`, "category");
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
