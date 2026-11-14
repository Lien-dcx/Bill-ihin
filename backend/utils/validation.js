function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function text(value, label, { required = true, max = 255 } = {}) {
  if (typeof value !== "string") {
    if (!required && (value === undefined || value === null || value === "")) return null;
    throw httpError(400, `${label} must be text.`);
  }
  const result = value.trim();
  if (required && !result) throw httpError(400, `${label} is required.`);
  if (result.length > max) throw httpError(400, `${label} must be ${max} characters or fewer.`);
  return result || null;
}

function email(value) {
  const result = text(value, "Email address", { max: 254 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) {
    throw httpError(400, "Enter a valid email address.");
  }
  return result;
}

function positiveAmount(value, label = "Amount") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 9999999999.99) {
    throw httpError(400, `${label} must be greater than zero and within the supported range.`);
  }
  return amount.toFixed(2);
}

function nonNegativeAmount(value, label = "Amount") {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || amount > 9999999999.99) {
    throw httpError(400, `${label} cannot be negative and must be within the supported range.`);
  }
  return amount.toFixed(2);
}

function id(value, label = "Record id") {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 1) throw httpError(400, `${label} is invalid.`);
  return parsed;
}

function date(value, label = "Date", { required = true } = {}) {
  if (!required && (value === undefined || value === null || value === "")) return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `${label} must use YYYY-MM-DD format.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw httpError(400, `${label} is not a valid calendar date.`);
  }
  return value;
}

function month(value) {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    throw httpError(400, "Budget month must use YYYY-MM format.");
  }
  return `${value}-01`;
}

function enumValue(value, label, allowed) {
  if (!allowed.includes(value)) throw httpError(400, `${label} is invalid.`);
  return value;
}

module.exports = { httpError, text, email, positiveAmount, nonNegativeAmount, id, date, month, enumValue };
