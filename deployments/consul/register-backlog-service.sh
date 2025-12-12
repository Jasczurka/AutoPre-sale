#!/bin/sh

# Ждем пока BacklogService станет доступен
until nc -z backlog-service 8080; do
  echo "Waiting for backlog-service to be ready..."
  sleep 2
done

# Регистрируем BacklogService в Consul
curl -X PUT http://consul:8500/v1/agent/service/register -d '{
  "ID": "backlog-service-8080",
  "Name": "backlog-service",
  "Address": "backlog-service",
  "Port": 8080,
  "Check": {
    "HTTP": "http://backlog-service:8080/swagger/index.html",
    "Interval": "10s",
    "Timeout": "3s"
  }
}'

echo "BacklogService registered in Consul"


