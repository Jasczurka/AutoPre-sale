# Настройка переменных окружения

## Для локальной разработки (без Docker)

Создайте файл `.env` в корне проекта `document-analysis-service/` на основе `.env.example`:

```bash
cp .env.example .env
```

Затем отредактируйте `.env` и укажите:

1. **DATABASE_URL** - строка подключения к PostgreSQL:
   - Локально: `postgresql://postgres:1234@localhost:5434/document_analysis_db`
   - В Docker: `postgresql://postgres:1234@postgres-document-analysis:5432/document_analysis_db`

2. **KAFKA_BOOTSTRAP_SERVERS** - адрес Kafka брокера:
   - Локально: `localhost:9092`
   - В Docker: `kafka:9092`

3. **MINIO_ENDPOINT** - адрес MinIO:
   - Локально: `localhost:9000`
   - В Docker: `minio:9000`

4. **MISTRAL_API_KEY** - **ОБЯЗАТЕЛЬНО** замените на ваш реальный API ключ от Mistral AI

## Для Docker Compose

Если вы используете Docker Compose, переменные окружения уже настроены в `deployments/docker-compose.yml`.

**Единственное, что нужно сделать:**
- Установите переменную окружения `MISTRAL_API_KEY` в вашей системе или в `.env` файле в директории `deployments/`:

```bash
# В PowerShell
$env:MISTRAL_API_KEY="ваш_ключ_здесь"

# Или создайте файл deployments/.env
MISTRAL_API_KEY=ваш_ключ_здесь
```

Docker Compose автоматически подхватит эту переменную из окружения системы.

## Пример полного .env файла для локальной разработки:

```env
DATABASE_URL=postgresql://postgres:1234@localhost:5434/document_analysis_db
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_CONSUMER_GROUP=document-analysis-service
KAFKA_TOPIC_FILE_UPLOADED=file-uploaded
KAFKA_TOPIC_BACKLOG_READY=backlog-ready
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=documents
MINIO_SECURE=false
MISTRAL_API_KEY=ваш_реальный_api_ключ_от_mistral
SERVICE_NAME=document-analysis-service
LOG_LEVEL=INFO
```

## Важные замечания:

1. **MISTRAL_API_KEY** - это обязательный параметр. Без него сервис не сможет анализировать документы.
2. Убедитесь, что все сервисы (PostgreSQL, Kafka, MinIO) запущены и доступны по указанным адресам.
3. Для Docker Compose все переменные (кроме MISTRAL_API_KEY) уже настроены в `docker-compose.yml`.

