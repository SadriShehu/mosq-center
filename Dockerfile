FROM golang:alpine AS builder

WORKDIR /app

RUN apk add --update --no-cache git

ADD . .
RUN go build -o ./run ./cmd

FROM alpine:3.19
COPY --from=builder /app/run /usr/bin/run

ENTRYPOINT [ "run" ]
