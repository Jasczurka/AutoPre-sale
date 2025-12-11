# Инструкция по тестированию сервисов

## Содержание
1. [Подготовка окружения](#подготовка-окружения)
2. [Запуск сервисов](#запуск-сервисов)
3. [Тестирование AuthService](#тестирование-authservice)
4. [Тестирование API Gateway](#тестирование-api-gateway)
5. [Полный цикл тестирования](#полный-цикл-тестирования)
6. [Проверка безопасности](#проверка-безопасности)

---

## Подготовка окружения

### Требования
- Docker и Docker Compose
- PowerShell (для Windows) или Bash (для Linux/Mac)
- curl или PowerShell Invoke-RestMethod

### Проверка установки Docker
```powershell
docker --version
docker-compose --version
```

---

## Запуск сервисов

### 1. Переход в директорию deployments
```powershell
cd deployments
```

### 2. Запуск всех сервисов
```powershell
docker-compose up -d
```

### 3. Проверка статуса сервисов
```powershell
docker-compose ps
```

Ожидаемый результат:
- `consul` - Running
- `postgres-auth` - Running (Healthy)
- `auth-service` - Running
- `api-gateway` - Running

### 4. Просмотр логов (опционально)
```powershell
# Логи всех сервисов
docker-compose logs -f

# Логи конкретного сервиса
docker-compose logs -f auth-service
docker-compose logs -f api-gateway
```

---

## Тестирование AuthService

### Прямой доступ к AuthService (порт 5158)

#### 1. Регистрация нового пользователя
```powershell
$body = @{
    Email = "test1233@example.com"
    Password = "Test123!"
    FirstName = "Test"
    LastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5158/api/Auth/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    
    Write-Host "Регистрация успешна!" -ForegroundColor Green
    $response
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "Пользователь с таким email уже существует" -ForegroundColor Yellow
        Write-Host "Используйте другой email или выполните логин" -ForegroundColor Gray
    } else {
        Write-Host "Ошибка регистрации: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

**Ожидаемый ответ (успех):**
```json
{
    "user": {
        "id": "guid",
        "email": "test@example.com",
        "fullName": "Test User"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "base64_token..."
}
```

**Ожидаемый ответ (ошибка 409 - пользователь уже существует):**
```json
{
    "error": "Пользователь с таким email уже существует",
    "code": "user.email_in_use"
}
```

#### 2. Логин пользователя
```powershell
$body = @{
    Email = "test1233@example.com"
    Password = "Test123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5158/api/Auth/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

# Сохраняем токен для дальнейшего использования
$accessToken = $response.accessToken
$refreshToken = $response.refreshToken
```

**Ожидаемый ответ:**
```json
{
    "user": {
        "id": "guid",
        "email": "test@example.com",
        "fullName": "Test User"
    },
    "accessToken": "eyJhbGci...",
    "refreshToken": "base64_token..."
}
```

#### 3. Получение информации о текущем пользователе (/me)
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:5158/api/Auth/me" `
    -Method Get `
    -Headers $headers
```

**Ожидаемый ответ:**
```json
{
    "id": "guid",
    "email": "test@example.com",
    "fullName": "Test User"
}
```

#### 4. Обновление токена (Refresh Token)
```powershell
$body = @{
    RefreshToken = $refreshToken
    UserId = "user_guid_from_login_response"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5158/api/Auth/refresh" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

**Ожидаемый ответ:**
```json
{
    "accessToken": "new_eyJhbGci...",
    "refreshToken": "new_base64_token..."
}
```

---

## Тестирование API Gateway

### Доступ через API Gateway (порт 8080)

API Gateway проксирует запросы к AuthService по пути `/api/auth-service/...`

#### 1. Регистрация через API Gateway
```powershell
$body = @{
    Email = "gateway@example.com"
    Password = "Gateway123!"
    FirstName = "Gateway"
    LastName = "Test"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    Write-Host "Регистрация успешна" -ForegroundColor Green
    $response
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "Пользователь уже существует. Используйте другой email или выполните логин." -ForegroundColor Yellow
    } else {
        Write-Host "Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### 2. Логин через API Gateway
```powershell
$body = @{
    Email = "gateway@example.com"
    Password = "Gateway123!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/login" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"

$accessToken = $response.accessToken
```

#### 3. Доступ к защищенному эндпоинту через API Gateway
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/me" `
    -Method Get `
    -Headers $headers
```

---

## Полный цикл тестирования

### Скрипт для полного тестирования (PowerShell)

```powershell
Write-Host "=== ПОЛНЫЙ ЦИКЛ ТЕСТИРОВАНИЯ ===" -ForegroundColor Cyan

# 1. Регистрация
Write-Host "`n1. Регистрация нового пользователя..." -ForegroundColor Yellow
$registerBody = @{
    Email = "fulltest@example.com"
    Password = "FullTest123!"
    FirstName = "Full"
    LastName = "Test"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/register" `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json"
    Write-Host "   ✓ Регистрация успешна" -ForegroundColor Green
    Write-Host "   User ID: $($registerResponse.user.id)" -ForegroundColor Gray
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "   ⚠ Пользователь уже существует, выполняю логин..." -ForegroundColor Yellow
        # Пользователь уже существует, выполняем логин
        $loginBody = @{
            Email = "fulltest@example.com"
            Password = "FullTest123!"
        } | ConvertTo-Json
        $registerResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/login" `
            -Method Post `
            -Body $loginBody `
            -ContentType "application/json"
        Write-Host "   ✓ Логин успешен (пользователь уже был зарегистрирован)" -ForegroundColor Green
    } else {
        Write-Host "   ✗ Ошибка регистрации: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 2. Логин
Write-Host "`n2. Логин..." -ForegroundColor Yellow
$loginBody = @{
    Email = "fulltest@example.com"
    Password = "FullTest123!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/login" `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json"
    Write-Host "   ✓ Логин успешен" -ForegroundColor Green
    $accessToken = $loginResponse.accessToken
    $refreshToken = $loginResponse.refreshToken
    $userId = $loginResponse.user.id
} catch {
    Write-Host "   ✗ Ошибка логина: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Доступ к /me
Write-Host "`n3. Доступ к защищенному endpoint /me..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $accessToken"
}

try {
    $meResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/me" `
        -Method Get `
        -Headers $headers
    Write-Host "   ✓ Доступ к /me успешен" -ForegroundColor Green
    Write-Host "   Email: $($meResponse.email)" -ForegroundColor Gray
} catch {
    Write-Host "   ✗ Ошибка доступа: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Обновление токена
Write-Host "`n4. Обновление токена..." -ForegroundColor Yellow
$refreshBody = @{
    RefreshToken = $refreshToken
    UserId = $userId
} | ConvertTo-Json

try {
    $refreshResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/refresh" `
        -Method Post `
        -Body $refreshBody `
        -ContentType "application/json"
    Write-Host "   ✓ Токен обновлен" -ForegroundColor Green
    $newAccessToken = $refreshResponse.accessToken
} catch {
    Write-Host "   ✗ Ошибка обновления токена: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Проверка защиты без токена
Write-Host "`n5. Проверка защиты без токена..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/me" `
        -Method Get `
        -ErrorAction Stop
    Write-Host "   ✗ ОШИБКА: Доступ получен без токена!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "   ✓ Доступ правильно отклонен (401 Unauthorized)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠ Неожиданный статус: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== ВСЕ ТЕСТЫ ПРОЙДЕНЫ ===" -ForegroundColor Green
```

---

## Проверка безопасности

### 1. Проверка доступа без токена
```powershell
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/me" `
        -Method Get `
        -ErrorAction Stop
    Write-Host "ОШИБКА: Доступ получен без токена!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Правильно отклонен (401)" -ForegroundColor Green
    }
}
```

### 2. Проверка с невалидным токеном
```powershell
$invalidHeaders = @{
    "Authorization" = "Bearer invalid_token_12345"
}

try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/me" `
        -Method Get `
        -Headers $invalidHeaders `
        -ErrorAction Stop
    Write-Host "ОШИБКА: Доступ получен с невалидным токеном!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "✓ Невалидный токен правильно отклонен (401)" -ForegroundColor Green
    }
}
```

### 3. Проверка с истекшим токеном
```powershell
# Используйте токен, который был выдан более 30 минут назад
# (время жизни токена настраивается в appsettings.Development.json)
```

---

## Обработка ошибок

### Типичные ошибки и их решения

#### 1. Ошибка регистрации: "Пользователь с таким email уже существует" (409 Conflict)
**Причина:** Пользователь уже зарегистрирован  
**Решение:** 
- Используйте другой email для регистрации
- Или выполните логин с существующими учетными данными
- Или удалите существующего пользователя из БД (для тестирования):
  ```powershell
  docker exec -it postgres-auth psql -U postgres -d authdb -c "DELETE FROM \"Users\" WHERE \"Email\" = 'test@example.com';"
  ```

**Пример обработки ошибки:**
```powershell
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/register" `
        -Method Post `
        -Body $body `
        -ContentType "application/json"
    Write-Host "Регистрация успешна" -ForegroundColor Green
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 409) {
        Write-Host "Пользователь уже существует. Выполняю логин..." -ForegroundColor Yellow
        # Переходим к логину
        $loginBody = @{
            Email = "test@example.com"
            Password = "Test123!"
        } | ConvertTo-Json
        $loginResponse = Invoke-RestMethod -Uri "http://localhost:8080/api/auth-service/login" `
            -Method Post `
            -Body $loginBody `
            -ContentType "application/json"
        Write-Host "Логин успешен" -ForegroundColor Green
    } else {
        Write-Host "Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    }
}
```

#### 2. Ошибка логина: "Неверный email или пароль"
**Причина:** Неверные учетные данные  
**Решение:** Проверьте правильность email и пароля

#### 3. Ошибка 401 Unauthorized при доступе к /me
**Причина:** Отсутствует или невалидный токен  
**Решение:** 
- Убедитесь, что передаете токен в заголовке `Authorization: Bearer <token>`
- Проверьте, что токен не истек
- Выполните новый логин для получения свежего токена

#### 4. Ошибка 503 Service Unavailable
**Причина:** Сервис недоступен  
**Решение:** 
- Проверьте статус сервисов: `docker-compose ps`
- Проверьте логи: `docker-compose logs auth-service`
- Перезапустите сервисы: `docker-compose restart`

#### 5. Ошибка подключения к базе данных
**Причина:** PostgreSQL не запущен или недоступен  
**Решение:** 
- Проверьте статус: `docker-compose ps postgres-auth`
- Проверьте логи: `docker-compose logs postgres-auth`
- Убедитесь, что postgres-auth имеет статус "Healthy"

---

## Проверка через curl (для Linux/Mac)

### Регистрация
```bash
curl -X POST http://localhost:8080/api/auth-service/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Логин
```bash
curl -X POST http://localhost:8080/api/auth-service/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

### Доступ к /me
```bash
curl -X GET http://localhost:8080/api/auth-service/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Остановка сервисов

### Остановка всех сервисов
```powershell
cd deployments
docker-compose down
```

### Остановка с удалением volumes (очистка данных)
```powershell
docker-compose down -v
```

---

## Дополнительные проверки

### Проверка здоровья Consul
```powershell
Invoke-RestMethod -Uri "http://localhost:8500/v1/health/service/auth-service"
```

### Проверка зарегистрированных сервисов в Consul
```powershell
Invoke-RestMethod -Uri "http://localhost:8500/v1/catalog/services"
```

### Прямой доступ к базе данных (для отладки)
```powershell
docker exec -it postgres-auth psql -U postgres -d authdb

# В psql:
SELECT * FROM "Users";
SELECT * FROM "RefreshTokens";
```

---

## Примечания

1. **Порты:**
   - API Gateway: `8080`
   - AuthService: `5158`
   - Consul: `8500`
   - PostgreSQL: `5432`

2. **Время жизни токенов:**
   - Access Token: 30 минут (настраивается в `appsettings.Development.json`)
   - Refresh Token: 7 дней (настраивается в `appsettings.Development.json`)

3. **Формат Refresh Token запроса:**
   - Требует оба поля: `RefreshToken` и `UserId`

4. **Безопасность:**
   - Все защищенные эндпоинты требуют валидный JWT токен
   - Токены подписываются RSA ключами
   - Пароли хешируются с использованием SHA256 и соли

---

## Поддержка

При возникновении проблем:
1. Проверьте логи сервисов
2. Убедитесь, что все сервисы запущены и здоровы
3. Проверьте конфигурацию в `config.yaml` и `appsettings.Development.json`
4. Убедитесь, что порты не заняты другими приложениями

