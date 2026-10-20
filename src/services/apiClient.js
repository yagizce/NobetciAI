// Sunucu proxy'lerinin 60 saniyelik bütçesinin üzerinde; gövde okuma da süreye dahildir.
const REQUEST_TIMEOUT_MS = 65_000;

function apiError(status) {
  const error = new Error(`api_error_${status}`);
  error.status = status;
  return error;
}

/** JSON POST; HTTP hatalarında status, istemci zaman aşımında isTimeout taşır. */
export async function postJson(endpoint, payload, { timeoutMs = REQUEST_TIMEOUT_MS } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    // HTML hata sayfaları da gerçek HTTP durumuyla bildirilir.
    if (!response.ok) throw apiError(response.status);
    try {
      return await response.json();
    } catch (error) {
      if (error instanceof SyntaxError) throw apiError(502);
      throw error;
    }
  } catch (error) {
    if (error?.name === "AbortError") {
      const timeoutError = apiError(504);
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
