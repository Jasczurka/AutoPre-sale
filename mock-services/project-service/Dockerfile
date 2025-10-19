FROM golang:1.25-alpine AS builder
WORKDIR /build
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /usr/local/bin/project-service main.go

FROM alpine:3.18
RUN apk add --no-cache ca-certificates
COPY --from=builder /usr/local/bin/project-service /usr/local/bin/project-service
EXPOSE 9001
CMD ["/usr/local/bin/project-service"]
