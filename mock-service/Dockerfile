FROM golang:1.21-alpine AS builder

WORKDIR /app

# Настройка Go proxy для обхода проблем с сетью
ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=sum.golang.org

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o mock-service .

FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/mock-service .

EXPOSE 8081

CMD ["./mock-service"]

