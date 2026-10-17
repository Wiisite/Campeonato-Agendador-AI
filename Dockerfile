# Etapa 1: instala tudo e gera o build (frontend + servidor)
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Etapa 2: imagem final só com dependências de produção
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund && npm cache clean --force
COPY --from=build /app/dist ./dist
EXPOSE 5000
USER node
CMD ["node", "dist/index.cjs"]
