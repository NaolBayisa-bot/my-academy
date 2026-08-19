const { validationResult } = require('express-validator');

// Validates the request against the express-validator chains that ran
// earlier in the route (the `body(...)` / `param(...)` / `query(...)`
// middleware). On failure responds with 400 and a single, clear message;
// otherwise hands control to the next middleware/controller.
//
// The response always uses the consistent `{ error: "message" }` shape.
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Join every field-message into one human-readable string so the
    // caller gets the full picture without breaking the error shape.
    const message = errors
      .array()
      .map((error) => error.msg)
      .join(', ');

    return res.status(400).json({ error: message });
  }

  next();
};

module.exports = validate;
