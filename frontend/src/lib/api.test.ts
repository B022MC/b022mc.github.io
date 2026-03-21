import { api, fetchArticles, getApiErrorMessage, isAuthError } from "./api";

function jsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("api helpers", () => {
  it("classifies 401 responses as auth errors", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        { error: "token expired" },
        { status: 401, statusText: "Unauthorized" },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    let capturedError: unknown;
    try {
      await api.articles.delete(1, "expired-token");
    } catch (error) {
      capturedError = error;
    }

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(isAuthError(capturedError)).toBe(true);
    expect(getApiErrorMessage(capturedError, "删除文章失败")).toBe(
      "删除文章失败：认证状态无效",
    );
  });

  it("rethrows real API failures instead of silently falling back", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        jsonResponse(
          { error: "service unavailable" },
          { status: 500, statusText: "Internal Server Error" },
        ),
      ),
    );

    await expect(fetchArticles(1, 10)).rejects.toMatchObject({
      kind: "http",
      status: 500,
      message: "service unavailable",
    });
  });
});
