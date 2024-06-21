FROM oven/bun:latest as build

WORKDIR /usr/src/app

COPY bun.lockb package.json ./

RUN bun install

COPY . .

# ENV TURSO_URL="http://localhost:8081"
RUN bun --bun run build

FROM oven/bun:latest as deps-prod

WORKDIR /usr/src/app

COPY bun.lockb package.json ./

RUN bun install --production

FROM node:lts-bookworm-slim
# FROM gcr.io/distroless/nodejs22-debian12

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package.json .
COPY --from=deps-prod /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/build ./build

USER node

EXPOSE 5173
ENV PORT=5173
ENV ORIGIN="http://localhost:5173"

CMD [ "node", "-r", "dotenv/config", "./build/index.js" ]