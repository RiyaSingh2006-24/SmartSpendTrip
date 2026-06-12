const API_ORIGIN = "https://smartspendtrip-api.onrender.com";

const toHeaderObject = (headers) => {
  const result = {};
  headers.forEach((value, key) => {
    if (!["content-encoding", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
      result[key] = value;
    }
  });
  return result;
};

module.exports = async function handler(request, response) {
  const url = new URL(request.url, `https://${request.headers.host}`);
  const targetUrl = `${API_ORIGIN}${url.pathname}${url.search}`;

  try {
    const upstream = await fetch(targetUrl, {
      method: request.method,
      headers: {
        ...request.headers,
        host: new URL(API_ORIGIN).host,
      },
      body: ["GET", "HEAD"].includes(request.method) ? undefined : request,
      duplex: ["GET", "HEAD"].includes(request.method) ? undefined : "half",
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
