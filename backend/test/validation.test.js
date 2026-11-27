const test = require("node:test");
const assert = require("node:assert/strict");
const { date, email, id, month, nonNegativeAmount, positiveAmount, text } = require("../utils/validation");

test("text and email validation trims values and normalizes email case", () => {
  assert.equal(text("  Elena Reyes  ", "Name"), "Elena Reyes");
  assert.equal(email("  Elena@Household.PH "), "elena@household.ph");
  assert.throws(() => email("not-an-email"), { status: 400 });
});

test("amount validation rejects zero or negative contributions and payments", () => {
  assert.equal(positiveAmount("45.5"), "45.50");
  assert.equal(nonNegativeAmount("0"), "0.00");
  assert.throws(() => positiveAmount("0"), { status: 400 });
  assert.throws(() => positiveAmount("-1"), { status: 400 });
});

test("date, month, and database id validation enforce expected formats", () => {
  assert.equal(date("2026-02-28"), "2026-02-28");
  assert.equal(month("2026-11"), "2026-11-01");
  assert.equal(id("12"), 12);
  assert.throws(() => date("2026-02-30"), { status: 400 });
  assert.throws(() => month("2026-13"), { status: 400 });
  assert.throws(() => id("abc"), { status: 400 });
});
