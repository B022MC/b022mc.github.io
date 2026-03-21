---
mode: plan
cwd: /Users/b022mc/project/b022mc.github.io
task: 完善当前博客项目
complexity: complex
planning_method: builtin
created_at: 2026-03-21T12:08:57+08:00
---

# Plan: 完善当前博客项目

🎯 任务概述
当前仓库已经具备博客前后端、管理后台和 K3s 部署骨架，但真实数据链路、评论体验、生产入口、CI 稳定性和自动化测试仍未闭环。该计划按“先稳住线上入口，再清理真实接口与体验，最后补齐质量与运维”的顺序推进，尽量避免一边优化界面、一边继续掩盖后端或部署问题。

📋 执行计划
1. 建立统一验收基线：把 `ROADMAP.md` 中的 P0/P1/P2 问题整理成可勾选清单，并补充“访问可用、真实数据、评论可用、部署可回滚、测试可跑”的完成定义，避免“完善博客”目标发散。
2. 盘点生产依赖与配置源：梳理 DNS、证书、Caddy、K3s、GitHub Secrets、`SITE_URL`、`API_BASE_URL` 的真实来源与生效范围，先确认哪些是代码问题，哪些是环境问题。
3. 验证公网链路现状：按“域名 -> 腾讯云主节点 -> 反向代理 -> K3s Ingress -> frontend/blog-api”逐段执行 `curl`、`kubectl` 和端口检查，定位当前 `502` 或不可达的具体断点。
4. 修复主节点反向代理上游：将 Caddy 或现有代理配置改为实际可访问的集群入口，并把端口来源、转发规则和证书目录写入运维说明，先恢复 `www` 域名的稳定访问。
5. 收口根域名与 HTTPS：统一 `b022mc.cn` 和 `www.b022mc.cn` 的 DNS 指向、TTL、证书签发和续期策略，明确主域名与 301 跳转规则，避免双入口和证书状态不一致。
6. 加固 K3s 入口配置：检查 Ingress、Service、探针、命名空间密钥和镜像拉取配置，确保前端 `/` 与后端 `/api` 的路由规则在集群内部是明确且可观测的。
7. 补齐基础健康检查：为 frontend 和 blog-api 设计可脚本化的健康检查或 smoke URL，并把这些探针作为后续 CI 部署成功与否的硬门槛。
8. 重构前端 API 错误模型：以 `frontend/src/lib/api.ts` 为中心，统一请求超时、状态码解析、业务错误对象和鉴权失败分支，替换目前只有 `throw new Error(...)` 的粗粒度报错。
9. 移除默认 mock 回退：把文章列表、详情、搜索、标签的 `mockArticles` 回退改成明确的错误态、空态或仅限本地开发的显式开关，让真实后端异常尽早暴露。
10. 统一页面数据态：首页、标签页、详情页、后台页统一补齐 loading、empty、error、retry 四种状态和埋点入口，避免页面只在成功路径上可用。
11. 合并评论组件实现：删除或替换遗留的 `frontend/src/components/comment/comment-section.tsx`，确保仓库中只保留一套被真实页面使用的评论实现，降低后续维护分叉。
12. 完善评论交互反馈：为评论加载失败、提交失败、未登录、重复提交、回复取消等场景补上用户可见提示和重试行为，避免当前静默失败。
13. 加强后台与鉴权体验：补齐 token 失效处理、未授权跳转、删除文章失败提示、请求中的按钮禁用与提交态，保证后台功能在真实接口模式下可控。
14. 强化文章编辑流：为新建/编辑文章增加必填校验、标签格式规范、内容预览、未保存离开提醒和保存失败恢复策略，提升内容生产可靠性。
15. 补齐 SEO 与站点资产：在现有全局 metadata 和 feed 基础上，为首页、文章详情、标签页补充动态 metadata、canonical、Open Graph、`sitemap.xml`、`robots.txt` 与 feed 校验。
16. 打磨阅读体验与性能：优化文章页在移动端的目录、代码块样式、图片封面、首屏渲染和滚动性能，把“能看”提升到“好读且稳定”。
17. 引入前端自动化测试：为 API 封装、鉴权 hook、关键页面状态切换和评论交互补齐最小可行测试集，并把 `test` 脚本纳入前端标准开发流程。
18. 引入后端服务测试：为 article、user、comment 业务层和 `blog-api` HTTP 路由补齐单元/集成测试，优先覆盖文章 CRUD、登录注册、评论读取与创建等核心路径。
19. 升级 CI/CD 与回滚机制：在 GitHub Actions 中接入前后端测试、构建缓存、部署后 smoke 检查、失败日志归档，并固化“回滚到上一版镜像 SHA / 上一版代理配置”的操作步骤。
20. 建立长期运维与演进机制：补充部署 Runbook、域名证书续期说明、常见故障排查、依赖升级频率、内容发布流程和下阶段 backlog，作为本轮完善的收尾里程碑。

⚠️ 风险与注意事项
- DNS、证书、Caddy 和 K3s 入口问题依赖真实线上权限；如果无法访问外部环境，计划中的第 3 至 7 步只能先完成文档和脚本层准备。
- 去掉前端 mock 回退后，现有后端接口问题会被直接暴露，前端和后端需要并行联调，否则用户感知会先变差后变好。
- 自动化测试补齐后，CI 很可能先经历一段“更多红灯”的阶段；这是暴露真实问题，不应再用跳过测试或弱化断言的方式掩盖。
- 涉及域名、Ingress 和镜像发布的改动必须保留回滚路径，优先采用“先验证新入口，再切流量”的策略，避免一次性替换导致整站不可用。

📎 参考
- `README.md:3`
- `ROADMAP.md:36`
- `frontend/src/lib/api.ts:44`
- `frontend/src/lib/api.ts:201`
- `frontend/src/components/blog/comment-section.tsx:68`
- `frontend/src/app/layout.tsx:23`
- `backend/app/blog-api/internal/server/http.go:43`
- `backend/deploy/k8s/services/frontend/ingress.yaml:1`
- `.github/workflows/ci.yaml:132`
