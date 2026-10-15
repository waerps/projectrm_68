// A transient API failure or an empty response during a publication must not
// immediately turn a populated public page into an empty-state message.
export async function publicListRequest(load, { signal } = {}) {
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    if (signal?.aborted) throw new Error("Request canceled");
    try {
      const rows = await load();
      if (!Array.isArray(rows)) throw new Error("Invalid public list response");
      if (rows.length || attempt === 1) return rows;
    } catch (error) {
      if (signal?.aborted || error?.code === "ERR_CANCELED") throw error;
      lastError = error;
      if (attempt === 1) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  throw lastError || new Error("Public list request failed");
}
