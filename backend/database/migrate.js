require("dotenv").config();
const fs = require("node:fs");
const path = require("node:path");
const db = require("../config/db");

async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = schema
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter(Boolean);
  const connection = await db.getConnection();
  try {
    for (const statement of statements) await connection.query(statement);
    process.stdout.write(`Applied ${statements.length} Bill-ihin schema statements.\n`);
  } finally {
    connection.release();
    await db.end();
  }
}

migrate().catch((error) => {
  process.stderr.write(`Database migration failed: ${error.message}\n`);
  process.exitCode = 1;
  db.end().catch(() => {});
});
