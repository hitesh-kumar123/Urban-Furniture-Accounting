/**
 * Standardized API response helpers
 */
const successResponse = (res, { data = null, message = 'Success', status = 200, meta = null }) => {
  const response = {
    success: true,
    message,
    data
  };
  if (meta) {
    response.meta = meta;
  }
  return res.status(status).json(response);
};

const errorResponse = (res, { message = 'An error occurred', status = 500, errors = [] }) => {
  return res.status(status).json({
    success: false,
    message,
    errors: Array.isArray(errors) ? errors : [errors]
  });
};

module.exports = {
  successResponse,
  errorResponse
};
