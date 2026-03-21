import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AdminPage from "./page";

const fetchArticlesMock = vi.fn();
const deleteArticleMock = vi.fn();
const useAuthMock = vi.fn();
const routerPushMock = vi.fn();
const routerReplaceMock = vi.fn();
const logoutMock = vi.fn();
const routerMock = {
  push: routerPushMock,
  replace: routerReplaceMock,
};

vi.mock("next/navigation", () => ({
  useRouter: () => routerMock,
}));

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    articles: {
      delete: (...args: unknown[]) => deleteArticleMock(...args),
    },
  },
  fetchArticles: (...args: unknown[]) => fetchArticlesMock(...args),
  getApiErrorMessage: (_error: unknown, fallback: string) => `${fallback}：服务暂时不可用`,
  isAuthError: () => false,
}));

describe("AdminPage", () => {
  beforeEach(() => {
    fetchArticlesMock.mockReset();
    deleteArticleMock.mockReset();
    routerPushMock.mockReset();
    routerReplaceMock.mockReset();
    logoutMock.mockReset();
    useAuthMock.mockReturnValue({
      isLoggedIn: true,
      token: "token",
      logout: logoutMock,
      isReady: true,
    });
  });

  it("shows a retryable error state and reloads the article list", async () => {
    fetchArticlesMock
      .mockRejectedValueOnce(new Error("boom"))
      .mockResolvedValueOnce({
        items: [
          {
            id: 1,
            slug: "hello-world",
            title: "测试文章",
            summary: "摘要",
            content: "内容",
            tags: ["测试"],
            createdAt: "2026-03-21T00:00:00Z",
            updatedAt: "2026-03-21T00:00:00Z",
            viewCount: 3,
          },
        ],
        total: 1,
        page: 1,
        pageSize: 100,
      });

    render(<AdminPage />);

    expect(await screen.findByText("管理后台暂时不可用")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /重试/ }));

    expect(await screen.findByText("测试文章")).toBeInTheDocument();
    expect(fetchArticlesMock).toHaveBeenCalledTimes(2);
  });
});
