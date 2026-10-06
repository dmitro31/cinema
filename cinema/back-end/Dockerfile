FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder
ENV DATABASE_URL=${DATABASE_URL}
RUN npx prisma generate
RUN npm run build
RUN npm prune --omit=dev

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S app && adduser -S app -G app \
  && mkdir -p /app/uploads \
  && chown -R app:app /app/uploads

COPY --from=builder --chown=app:app /app ./

USER app
EXPOSE 3001
VOLUME ["/app/uploads"]

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:prod"]
