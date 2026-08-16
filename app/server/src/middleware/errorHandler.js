// Centralized Express error-handling middleware.
//
// Registered as the final middleware in src/index.js (after every route) so
// that any error thrown synchronously, thrown from an async handler (Express 5
// forwards rejected promises here), or explicitly passed via `next(err)` is
// caught and returned to the client in a consistent shape:
//
//     { "error": "message" }
//
// Mapping rules:
//   - err.statusCode (explicit)  -> use it (lets other middleware set 4xx).
//   - SequelizeUniqueConstraintError -> 409 conflict.
//   - SequelizeValidationError        -> 400 bad request.
//   - anything else                  -> 500 internal server error.
//
// Internal details are never leaked: server-side the full error is logged,
// while 5xx responses always surface the generic "Internal server error."
const capitalize = (str) =>
  typeof str === 'string' && str.length
    ? str.charAt(0).toUpperCase() + str.slice(1)
    : '';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  // Log the full error for server-side debugging.
  // eslint-disable-next-line no-console
  console.error(err);

  const isUniqueConstraint = err.name === 'SequelizeUniqueConstraintError';
  const isValidationError = err.name === 'SequelizeValidationError';

  // Determine the HTTP status for this error.
  let statusCode = err.statusCode || 500;
  if (isUniqueConstraint) {
    statusCode = err.statusCode || 409;
  } else if (isValidationError) {
    statusCode = err.statusCode || 400;
  }

  // Build a clear, safe message.
  let message;

  if (isUniqueConstraint) {
    const field = err.errors && err.errors.length ? err.errors[0].path : null;
    message = field ? `${capitalize(field)} already in use.` : 'Conflict.';
  } else if (isValidationError) {
    message =
      err.errors && err.errors.length
        ? err.errors[0].message
        : err.message || 'Validation error.';
  } else if (statusCode >= 500) {
    // Never leak internals on unexpected server errors.
    message = 'Internal server error.';
  } else {
    message = err.message || 'Error.';
  }

  return res.status(statusCode).json({ error: message });
};

module.exports = errorHandler;
