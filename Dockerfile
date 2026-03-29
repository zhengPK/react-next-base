# 基础镜像：Node 20 + Alpine（体积小）；命名为 base 供后续阶段复用
FROM node:20-alpine AS base

# 依赖阶段：只安装 node_modules，利用 Docker 层缓存加快重建
FROM base AS deps
# 安装 glibc 兼容层，减少部分原生 npm 包在 Alpine 上运行失败
RUN apk add --no-cache libc6-compat
# 后续命令的工作目录
WORKDIR /app

# 启用 corepack 并固定 pnpm 9，与仓库 pnpm-lock.yaml 版本一致
RUN corepack enable && corepack prepare pnpm@9 --activate

# 仅复制清单文件，依赖不变时这一层可缓存，避免重复安装
COPY package.json pnpm-lock.yaml ./
# 按锁文件安装依赖，保证与本地一致
RUN pnpm install --frozen-lockfile

# 构建阶段：编译 Next.js 生产产物
FROM base AS builder
WORKDIR /app

# 构建阶段同样需要 pnpm 执行 next build
RUN corepack enable && corepack prepare pnpm@9 --activate

# 从 deps 阶段复制已安装的 node_modules，无需再次 install
COPY --from=deps /app/node_modules ./node_modules
# 复制其余源码与配置（受 .dockerignore 过滤）
COPY . .

# 关闭 Next.js 构建遥测，减少网络请求与日志噪音
ENV NEXT_TELEMETRY_DISABLED=1

# 执行生产构建（需 next.config 中 output: "standalone"）
RUN pnpm run build

# 运行阶段：仅包含运行所需文件，镜像最小
FROM base AS runner
WORKDIR /app

# 标记为生产环境；Next 与部分库会据此优化行为
ENV NODE_ENV=production
# 运行阶段同样关闭遥测
ENV NEXT_TELEMETRY_DISABLED=1

# 创建非 root 用户与组，降低容器内权限（安全实践）
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# 复制静态资源目录（public）
COPY --from=builder /app/public ./public

# 复制 standalone 服务端入口与精简 node_modules（由 Next 输出追踪生成）
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# 复制静态资源到 .next/static，供 standalone 服务读取
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# 以下进程以 nextjs 用户运行，而非 root
USER nextjs

# 声明容器对外提供服务的端口（文档用途，实际映射用 docker run -p）
EXPOSE 8080

# Next 监听端口；绑定到所有网卡以便容器外访问
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# 容器启动命令：运行 standalone 生成的 Node 服务入口
CMD ["node", "server.js"]
