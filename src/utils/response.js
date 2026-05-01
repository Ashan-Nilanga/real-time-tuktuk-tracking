
export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
}


export function sendPaginated(res, data, total, page, limit, message = 'Success') {
  const pages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data,
    meta: {
      total,
      page,
      pages,
      limit
    }
  });
}


export function sendError(res, message = 'Internal Server Error', statusCode = 500, error = null) {
  const response = {
    success: false,
    message
  };
  if (error) response.error = error;
  return res.status(statusCode).json(response);
}
