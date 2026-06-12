const API_ORIGIN = process.env.API_ORIGIN || "https://smartspendtrip-api.onrender.com";

const buildTargetUrl = (request) => {
  const incomingUrl = new URL(request.url, `https://${request.headers.host}`);
  const apiPath = incomingUrl.pathname.startsWith("/api/")
    ? incomingUrl.pathname
    : `/api${incomingUrl.pathname}`;

  return `${API_ORIGIN}${apiPath}${incomingUrl.search}`;
};

const toHeaderObject = (headers) => {
  const result = {};
  headers.forEach((value, key) => {
    if (
      !["connection", "content-encoding", "content-length", "host", "transfer-encoding"].includes(
        key.toLowerCase(),
      )
    ) {
      result[key] = value;
    }
  });
  return result;
};

module.exports = async function handler(request, response) {
  const targetUrl = buildTargetUrl(request);
  const isReadOnlyRequest = ["GET", "HEAD"].includes(request.method);

  try {
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
