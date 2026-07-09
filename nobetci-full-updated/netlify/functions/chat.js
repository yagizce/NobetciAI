// Netlify Function: proxies chat requests to the Anthropic API.
// Your API key stays here, on the server — never in the browser.
// Set it in: Netlify dashboard → Site settings → Environment variables → ANTHROPIC_API_KEY

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "ANTHROPIC_API_KEY tanımlı değil. Netlify > Site settings > Environment variables kısmından ekleyin ve yeniden deploy edin.",
      }),
    };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: "Geçersiz istek gövdesi" }) };
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: payload.max_tokens || 1000,
        system: payload.system,
        messages: payload.messages,
      }),
    });

    const data = await response.json();
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };
  } catch (err) {
    return { statusCode: 502, body: JSON.stringify({ error: "Anthropic API'ye ulaşılamadı: " + err.message }) };
  }
};
