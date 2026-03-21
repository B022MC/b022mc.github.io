"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { PageTransition } from "@/components/animation/page-transition";

function AuthContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/";
  const reason = searchParams.get("reason");
  const infoMessage = reason === "expired"
    ? "登录状态已失效，请重新登录后继续。"
    : reason === "unauthorized"
      ? "需要登录后才能访问目标页面。"
      : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = isLogin
        ? await api.auth.login(username, password)
        : await api.auth.register(username, email, password);
      login(res.token, res.user);
      router.push(nextPath);
    } catch {
      setError(isLogin ? "登录失败，请检查用户名和密码" : "注册失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="flex min-h-[80vh] items-center justify-center px-6">
        <motion.div
          layout
          className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card"
        >
          <div className="flex border-b border-border">
            <button
              onClick={() => {
                setIsLogin(true);
                setError("");
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                isLogin
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <LogIn size={16} />
                登录
              </span>
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError("");
              }}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                !isLogin
                  ? "bg-background text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <UserPlus size={16} />
                注册
              </span>
            </button>
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={isLogin ? "login" : "register"}
              initial={{ opacity: 0, x: isLogin ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: isLogin ? 20 : -20 }}
              transition={{ duration: 0.2 }}
              onSubmit={handleSubmit}
              className="space-y-4 p-6"
            >
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  用户名
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none"
                  placeholder="请输入用户名"
                />
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="mb-1.5 block text-sm font-medium">
                    邮箱
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required={!isLogin}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors focus:border-primary focus:outline-none"
                    placeholder="请输入邮箱"
                  />
                </motion.div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  密码
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full rounded-lg border border-border bg-background px-3 py-2.5 pr-10 text-sm transition-colors focus:border-primary focus:outline-none"
                    placeholder="请输入密码"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              {!error && infoMessage && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-muted-foreground"
                >
                  {infoMessage}
                </motion.p>
              )}

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-50"
              >
                {loading ? "请稍候..." : isLogin ? "登录" : "注册"}
              </motion.button>
            </motion.form>
          </AnimatePresence>
        </motion.div>
      </div>
    </PageTransition>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <PageTransition>
          <div className="flex min-h-[80vh] items-center justify-center px-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex h-24 w-full max-w-md items-center justify-center rounded-2xl border border-border bg-card"
            >
              <span className="text-sm text-muted-foreground">加载登录状态...</span>
            </motion.div>
          </div>
        </PageTransition>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
