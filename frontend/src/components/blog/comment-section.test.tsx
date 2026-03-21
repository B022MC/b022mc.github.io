import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CommentSection } from "./comment-section";

const listCommentsMock = vi.fn();
const createCommentMock = vi.fn();
const useAuthMock = vi.fn();

vi.mock("@/hooks/use-auth", () => ({
  useAuth: () => useAuthMock(),
}));

vi.mock("@/lib/api", () => ({
  api: {
    comments: {
      list: (...args: unknown[]) => listCommentsMock(...args),
      create: (...args: unknown[]) => createCommentMock(...args),
    },
  },
  getApiErrorMessage: (error: Error, fallback: string) => `${fallback}：${error.message}`,
  isAuthError: (error: { isAuth?: boolean }) => Boolean(error?.isAuth),
}));

describe("CommentSection", () => {
  beforeEach(() => {
    listCommentsMock.mockReset();
    createCommentMock.mockReset();
    useAuthMock.mockReturnValue({
      token: "token",
      isLoggedIn: true,
    });
  });

  it("keeps reply context and draft content when submit fails", async () => {
    listCommentsMock.mockResolvedValue([
      {
        id: 1,
        articleId: 1,
        parentId: 0,
        userId: 1,
        username: "alice",
        content: "第一条评论",
        createdAt: "2026-03-21T00:00:00Z",
        children: [],
      },
    ]);
    createCommentMock.mockRejectedValue({
      isAuth: true,
      message: "expired",
    });

    const user = userEvent.setup();
    const { container } = render(<CommentSection articleId={1} />);

    expect(await screen.findByText("第一条评论")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /回复/ }));
    expect(screen.getByText("回复评论 #1")).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText("写下你的评论...");
    await user.type(textarea, "新的回复");

    const submitButton = container.querySelector<HTMLButtonElement>('button[type="submit"]');
    expect(submitButton).not.toBeNull();
    await user.click(submitButton!);

    expect(
      await screen.findByText("登录状态已失效，请重新登录后再试"),
    ).toBeInTheDocument();
    expect(textarea).toHaveValue("新的回复");

    await user.type(textarea, "!");
    expect(
      screen.queryByText("登录状态已失效，请重新登录后再试"),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "取消" }));
    expect(screen.queryByText("回复评论 #1")).not.toBeInTheDocument();
  });
});
