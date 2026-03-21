import { render, screen } from "@testing-library/react";
import { TableOfContents } from "./table-of-contents";

class IntersectionObserverMock {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

const items = [
  { id: "intro", text: "简介", level: 1 },
  { id: "details", text: "细节", level: 2 },
];

describe("TableOfContents", () => {
  beforeEach(() => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders nothing when there are no headings", () => {
    const { container } = render(<TableOfContents items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a collapsible mobile toc with anchor links", () => {
    render(<TableOfContents items={items} variant="mobile" />);

    expect(screen.getByText("文章目录")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "简介" })).toHaveAttribute(
      "href",
      "#intro",
    );
    expect(screen.getByRole("link", { name: "细节" })).toHaveAttribute(
      "href",
      "#details",
    );
  });
});
