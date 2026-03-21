import { act, renderHook, waitFor } from "@testing-library/react";
import { useAuth } from "./use-auth";

const demoUser = {
  id: 1,
  username: "b022mc",
  email: "b022mc@example.com",
};

describe("useAuth", () => {
  it("hydrates the stored session after the client is ready", async () => {
    localStorage.setItem("blog_token", "stored-token");
    localStorage.setItem("blog_user", JSON.stringify(demoUser));

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isReady).toBe(true));

    expect(result.current.isLoggedIn).toBe(true);
    expect(result.current.token).toBe("stored-token");
    expect(result.current.user).toEqual(demoUser);
  });

  it("clears broken storage and keeps login/logout in sync", async () => {
    localStorage.setItem("blog_token", "bad-token");
    localStorage.setItem("blog_user", "{invalid json");

    const { result } = renderHook(() => useAuth());

    await waitFor(() => expect(result.current.isReady).toBe(true));
    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem("blog_token")).toBeNull();
    expect(localStorage.getItem("blog_user")).toBeNull();

    act(() => {
      result.current.login("fresh-token", demoUser);
    });

    expect(result.current.isLoggedIn).toBe(true);
    expect(localStorage.getItem("blog_token")).toBe("fresh-token");

    act(() => {
      result.current.logout();
    });

    expect(result.current.isLoggedIn).toBe(false);
    expect(localStorage.getItem("blog_token")).toBeNull();
    expect(localStorage.getItem("blog_user")).toBeNull();
  });
});
