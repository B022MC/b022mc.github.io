"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Reply, Send, Loader2, LogIn } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import type { Comment } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { formatDate } from "@/lib/utils";

interface CommentItemProps {
  comment: Comment;
  onReply: (parentId: number) => void;
  depth?: number;
}

function CommentItem({ comment, onReply, depth = 0 }: CommentItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={depth > 0 ? "ml-8 border-l-2 border-border pl-4" : ""}
    >
      <div className="rounded-lg bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
              {comment.username.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium">{comment.username}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatDate(comment.createdAt)}
          </span>
        </div>
        <p className="mb-2 text-sm leading-relaxed text-muted-foreground">
          {comment.content}
        </p>
        <button
          onClick={() => onReply(comment.id)}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-primary"
        >
          <Reply size={12} />
          回复
        </button>
      </div>
      {comment.children && comment.children.length > 0 && (
        <div className="mt-3 space-y-3">
          {comment.children.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              onReply={onReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}

interface CommentSectionProps {
  articleId: number;
}

export function CommentSection({ articleId }: CommentSectionProps) {
  const { token, isLoggedIn } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [replyTo, setReplyTo] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const data = await api.comments.list(articleId);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [articleId]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !token) return;
    setSubmitting(true);
    try {
      await api.comments.create(articleId, content.trim(), replyTo, token);
      setContent("");
      setReplyTo(0);
      await loadComments();
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (parentId: number) => {
    setReplyTo(parentId);
    document.getElementById("comment-input")?.focus();
  };

  const totalCount = comments.reduce((acc, c) => {
    let count = 1;
    if (c.children) count += c.children.length;
    return acc + count;
  }, 0);

  return (
    <section className="mx-auto mt-12 max-w-4xl border-t border-border pt-8">
      <h3 className="mb-6 flex items-center gap-2 text-lg font-semibold">
        <MessageSquare size={20} />
        评论 {totalCount > 0 && `(${totalCount})`}
      </h3>

      {/* Comment form */}
      {isLoggedIn ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo > 0 && (
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>回复评论 #{replyTo}</span>
              <button
                type="button"
                onClick={() => setReplyTo(0)}
                className="text-primary hover:underline"
              >
                取消
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <textarea
              id="comment-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的评论..."
              rows={3}
              className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-3 text-sm transition-colors placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={!content.trim() || submitting}
              className="self-end rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </motion.button>
          </div>
        </form>
      ) : (
        <div className="mb-8 rounded-lg border border-border bg-card p-6 text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            登录后即可发表评论
          </p>
          <Link
            href="/auth"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <LogIn size={14} />
            前往登录
          </Link>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-4">
            {comments.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                暂无评论，来发表第一条评论吧
              </p>
            ) : (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  onReply={handleReply}
                />
              ))
            )}
          </div>
        </AnimatePresence>
      )}
    </section>
  );
}
