const test = require("node:test");
const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const rateLimit = require("../middleware/rateLimit");

function sendRequest(limiter, responseStatus) {
  const req = { ip: "127.0.0.1", socket: { remoteAddress: "127.0.0.1" } };
  const res = new EventEmitter();
  res.statusCode = 200;
  res.set = () => res;
  res.status = (status) => {
    res.statusCode = status;
    return res;
  };
  res.json = (body) => {
    res.body = body;
    res.emit("finish");
    return res;
  };

  let continued = false;
  limiter(req, res, () => {
    continued = true;
    res.statusCode = responseStatus;
    res.emit("finish");
  });
  return { continued, res };
}

test("login rate limit blocks only after consecutive failed attempts", () => {
  const limitLogin = rateLimit({ limit: 2, failureStatus: 401 });

  assert.equal(sendRequest(limitLogin, 401).continued, true);
  assert.equal(sendRequest(limitLogin, 200).continued, true);
  assert.equal(sendRequest(limitLogin, 401).continued, true);
  assert.equal(sendRequest(limitLogin, 401).continued, true);

  const blocked = sendRequest(limitLogin, 401);
  assert.equal(blocked.continued, false);
  assert.equal(blocked.res.statusCode, 429);
});

test("non-authentication errors do not count as failed login attempts", () => {
  const limitLogin = rateLimit({ limit: 2, failureStatus: 401 });

  assert.equal(sendRequest(limitLogin, 401).continued, true);
  assert.equal(sendRequest(limitLogin, 400).continued, true);
  assert.equal(sendRequest(limitLogin, 401).continued, true);
  assert.equal(sendRequest(limitLogin, 401).continued, false);
});

test("standard rate limits continue counting every request", () => {
  const limitRequests = rateLimit({ limit: 2 });

  assert.equal(sendRequest(limitRequests, 200).continued, true);
  assert.equal(sendRequest(limitRequests, 200).continued, true);
  assert.equal(sendRequest(limitRequests, 200).continued, false);
});
