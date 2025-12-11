FROM golang:1.21-alpine AS builder

WORKDIR /app

# Настройка Go proxy для обхода проблем с сетью
ENV GOPROXY=https://proxy.golang.org,direct
ENV GOSUMDB=sum.golang.org

# Копируем go mod файлы
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o api-gateway ./cmd/main.go

# Финальный образ
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /app

COPY --from=builder /app/api-gateway .
COPY --from=builder /app/config.yaml ./config.yaml

EXPOSE 8080

CMD ["./api-gateway"]
