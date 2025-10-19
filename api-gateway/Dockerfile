FROM golang:1.25-alpine AS builder
WORKDIR /build
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /usr/local/bin/gateway ./cmd

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=builder /usr/local/bin/gateway /usr/local/bin/gateway
COPY config.yaml /app/config.yaml
WORKDIR /app
EXPOSE 8080
CMD ["/usr/local/bin/gateway"]
