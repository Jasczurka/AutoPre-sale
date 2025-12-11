#!/bin/sh

# Ждем пока AuthService станет доступен
until nc -z auth-service 8080; do
  echo "Waiting for auth-service to be ready..."
  sleep 2
done

# Регистрируем AuthService в Consul
curl -X PUT http://consul:8500/v1/agent/service/register -d '{
  "ID": "auth-service-8080",
  "Name": "auth-service",
  "Address": "auth-service",
  "Port": 8080,
  "Check": {
    "HTTP": "http://auth-service:8080/swagger/index.html",
    "Interval": "10s",
    "Timeout": "3s"
  }
}'

echo "AuthService registered in Consul"

