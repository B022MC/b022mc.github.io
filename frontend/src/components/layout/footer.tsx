import Link from "next/link";
import { Github, Rss } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-6 py-8 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p>&copy; {new Date().getFullYear()} b022mc. All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link
            href="/feed.xml"
            className="transition-colors hover:text-foreground"
            aria-label="RSS Feed"
          >
            <Rss size={18} />
          </Link>
          <Link
            href="https://github.com/b022mc"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
            aria-label="GitHub"
          >
            <Github size={18} />
          </Link>
        </div>
      </div>
    </footer>
  );
}
