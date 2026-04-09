export function notFoundHandler(req, res) {
  res.status(404).json({
    message: `Route not found: ${req.originalUrl}`,
  });
}

export function errorHandler(error, _req, res, _next) {
  const status = Number(error.status || error.statusCode || 500);
  const isServerError = status >= 500;

  if (isServerError) {
    console.error(error);
  }

  res.status(status).json({
    message: isServerError ? "Internal server error" : error.message || "Request failed",
  });
}