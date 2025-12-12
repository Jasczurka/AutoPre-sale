#!/bin/sh

# Ждем пока ProjectService станет доступен
until nc -z project-service 8080; do
  echo "Waiting for project-service to be ready..."
  sleep 2
done

# Регистрируем ProjectService в Consul
curl -X PUT http://consul:8500/v1/agent/service/register -d '{
  "ID": "project-service-8080",
  "Name": "project-service",
  "Address": "project-service",
  "Port": 8080,
  "Check": {
    "HTTP": "http://project-service:8080/swagger/index.html",
    "Interval": "10s",
    "Timeout": "3s"
  }
}'

echo "ProjectService registered in Consul"

