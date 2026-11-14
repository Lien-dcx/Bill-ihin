async function recordActivity(connection, user, action, kind) {
  await connection.execute(
    `INSERT INTO billihin_activities (household_id, actor, action, kind)
     VALUES (?, ?, ?, ?)`,
    [user.householdId, user.name, action, kind]
  );
}

async function notificationsEnabled(connection, householdId) {
  const [rows] = await connection.execute("SELECT settings FROM billihin_households WHERE id = ?", [householdId]);
  const settings = typeof rows[0]?.settings === "string" ? JSON.parse(rows[0].settings) : rows[0]?.settings || {};
  return settings.inAppAlerts !== false;
}

async function notifyAdmins(connection, householdId, notification) {
  if (!(await notificationsEnabled(connection, householdId))) return;
  const [admins] = await connection.execute(
    `SELECT id FROM billihin_users
     WHERE household_id = ? AND role = 'Administrator' AND status = 'Active'`,
    [householdId]
  );
  for (const admin of admins) {
    await connection.execute(
      `INSERT INTO billihin_notifications
        (household_id, user_id, title, message, type, category, target_page)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [householdId, admin.id, notification.title, notification.message, notification.type,
        notification.category, notification.targetPage]
    );
  }
}

async function notifyUser(connection, householdId, userId, notification) {
  if (!(await notificationsEnabled(connection, householdId))) return;
  await connection.execute(
    `INSERT INTO billihin_notifications
      (household_id, user_id, title, message, type, category, target_page)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [householdId, userId, notification.title, notification.message, notification.type,
      notification.category, notification.targetPage]
  );
}

module.exports = { recordActivity, notifyAdmins, notifyUser };
