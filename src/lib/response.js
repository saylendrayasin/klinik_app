export function successResponse(message, data = null, statusCode = 200) {
  return new Response(
    JSON.stringify({
      message,
      data,
      status: "success",
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
}

export function errorResponse(message, statusCode = 400, data = null) {
  return new Response(
    JSON.stringify({
      message,
      data,
      status: "error",
    }),
    {
      status: statusCode,
      headers: { "Content-Type": "application/json" },
    }
  );
}
