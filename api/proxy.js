const API_ORIGIN = process.env.API_ORIGIN || "https://smartspendtrip-api.onrender.com";

const buildTargetUrl = (request) => {
  const host = request.headers?.host || request.headers?.["x-forwarded-host"] || "localhost";
  const incomingUrl = new URL(request.url || "/", `https://${host}`);
  const apiPath = incomingUrl.pathname.startsWith("/api/")
    ? incomingUrl.pathname
    : `/api${incomingUrl.pathname}`;

  return `${API_ORIGIN}${apiPath}${incomingUrl.search}`;
};

const toHeaderObject = (headers) => {
  const result = {};

  const entries =
    typeof headers.forEach === "function"
      ? Array.from(headers.entries())
      : Object.entries(headers || {});

  entries.forEach(([key, value]) => {
    if (
      !["connection", "content-encoding", "content-length", "host", "transfer-encoding"].includes(
        key.toLowerCase(),
      )
    ) {
      result[key] = Array.isArray(value) ? value.join(", ") : value;
    }
  });

  return result;
};

module.exports = async function handler(request, response) {
  try {
    if (request.method === "OPTIONS") {
      response.setHeader("Access-Control-Allow-Origin", "*");
      response.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      response.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
      response.status(204).end();
      return;
    }

    const targetUrl = buildTargetUrl(request);
    const isReadOnlyRequest = ["GET", "HEAD"].includes(request.method);

    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...toHeaderObject(request.headers),
      },
      body: isReadOnlyRequest ? undefined : request,
      duplex: isReadOnlyRequest ? undefined : "half",
    });

    response.status(upstream.status);
    response.setHeader("Access-Control-Allow-Origin", "*");

    for (const [key, value] of Object.entries(toHeaderObject(upstream.headers))) {
      response.setHeader(key, value);
    }

    const body = await upstream.arrayBuffer();
    response.send(Buffer.from(body));
  } catch (error) {
    response.status(502).json({
      success: false,
      message: "Vercel could not reach the Render API.",
      details: error instanceof Error ? error.message : "Unknown proxy error",
    });
  }
};
