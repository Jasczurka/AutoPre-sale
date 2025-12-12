# Consul Service Registration

Этот сервис автоматически регистрирует все микросервисы в Consul при запуске через `docker compose up`.

## Как это работает

1. Сервис `consul-register` запускается после того, как все основные сервисы (consul, auth-service, project-service, backlog-service) запущены
2. Скрипт ожидает готовности каждого сервиса (проверяя доступность Swagger UI)
3. После готовности сервис регистрируется в Consul с health check
4. Consul автоматически мониторит зарегистрированные сервисы через health checks

## Регистрируемые сервисы

- **auth-service** (порт 8080)
- **project-service** (порт 8080)
- **backlog-service** (порт 8080)

## Использование

Автоматическая регистрация происходит при запуске:

```bash
docker compose up
```

Сервисы будут автоматически зарегистрированы в Consul и станут доступны через API Gateway.

## Проверка регистрации

Проверить зарегистрированные сервисы можно через Consul UI:
- Откройте http://localhost:8500
- Перейдите в раздел "Services"

Или через API:
```bash
curl http://localhost:8500/v1/agent/services
```

## Логи

Логи регистрации можно посмотреть через:
```bash
docker logs consul-register
```

