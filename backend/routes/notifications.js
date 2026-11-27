const express = require("express");
const db = require("../config/db");
const { authenticate } = require("../middleware/auth");
const { httpError, id } = require("../utils/validation");

const router = express.Router();
router.use(authenticate);

router.patch("/read-all", async (req, res) => {
  await db.execute(
    "UPDATE billihin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE household_id = ? AND user_id = ?",
    [req.user.householdId, req.user.id]
  );
  res.json({ message: "Notifications marked as read." });
});

router.patch("/:id/read", async (req, res) => {
  const notificationId = id(req.params.id, "Notification");
  const [result] = await db.execute(
    `UPDATE billihin_notifications SET read_at = COALESCE(read_at, CURRENT_TIMESTAMP)
     WHERE id = ? AND household_id = ? AND user_id = ?`,
    [notificationId, req.user.householdId, req.user.id]
  );
  if (!result.affectedRows) throw httpError(404, "Notification not found.");
  res.json({ message: "Notification marked as read." });
});

router.delete("/:id", async (req, res) => {
  const notificationId = id(req.params.id, "Notification");
  const [result] = await db.execute(
    "DELETE FROM billihin_notifications WHERE id = ? AND household_id = ? AND user_id = ?",
    [notificationId, req.user.householdId, req.user.id]
  );
  if (!result.affectedRows) throw httpError(404, "Notification not found.");
  res.status(204).end();
});

module.exports = router;
