"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Reply } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";
import type { Comment } from "@/lib/api";
import Link from "next/link";

interface CommentSectionProps {
  articleId: number;
  comments: Comment[];
}

function CommentItem({
  comment,
  onReply,
}: {
  comment: Comment;
  onReply: (parentId: number) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-border bg-card p-4"
    >
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
          {comment.username[0].toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-medium">{comment.username}</span>
          <span className="ml-2 text-xs text-muted-foreground">
            {formatDate(comment.createdAt)}
          </span>
        </div>
      </div>
      <p className="mb-2 text-sm leading-relaxed text-foreground/90">
        {comment.content}
      </p>
      <button
        onClick={() => onReply(comment.id)}
        className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <Reply size={12} />
        回复
      </button>

      {comment.children && comment.children.length > 0 && (
        <div className="mt-3 ml-6 space-y-3 border-l-2 border-border pl-4">
          {comment.children.map((child) => (
            <CommentItem key={child.id} comment={child} onReply={onReply} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

export function CommentSection({ articleId, comments }: CommentSectionProps) {
  const { isLoggedIn } = useAuth();
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number>(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    // Will be wired to api.comments.create after backend integration
    console.log("Submit comment:", { articleId, content, parentId: replyTo });
    setContent("");
    setReplyTo(0);
  };

  return (
    <section className="mx-auto mt-12 max-w-4xl border-t border-border pt-8">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <MessageCircle size={20} />
        评论 ({comments.length})
      </h3>

      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"
            >
              <Reply size={12} />
              回复评论 #{replyTo}
              <button
                type="button"
                onClick={() => setReplyTo(0)}
                className="text-destructive hover:underline"
              >
                取消
              </button>
            </motion.div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的评论..."
              className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            >
              <Send size={14} />
              发送
            </motion.button>
          </div>
        </form>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8 rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground"
        >
          <Link href="/auth" className="text-primary hover:underline">
            登录
          </Link>{" "}
          后即可发表评论
        </motion.div>
      )}

      <AnimatePresence>
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={setReplyTo}
            />
          ))}
        </div>
      </AnimatePresence>
    </section>
  );
}
