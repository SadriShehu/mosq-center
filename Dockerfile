FROM node:22-alpine AS web
WORKDIR /web
COPY web/package.json web/package-lock.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --update --no-cache git

ADD . .
# Replace the placeholder with the real static export.
RUN rm -rf web/out
COPY --from=web /web/out ./web/out
RUN go build -o ./run ./cmd

FROM alpine:3.19
COPY --from=builder /app/run /usr/bin/run

ENTRYPOINT [ "run" ]
