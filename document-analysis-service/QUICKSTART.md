# Быстрый старт - Document Analysis Service

## Шаг 1: Установите MISTRAL_API_KEY

```powershell
$env:MISTRAL_API_KEY="ваш_ключ_от_mistral"
```

> **Важно:** Получите ключ на https://console.mistral.ai/

## Шаг 2: Запустите все сервисы

```powershell
cd deployments
docker-compose up -d
```

Подождите 1-2 минуты, пока все сервисы запустятся.

## Шаг 3: Проверьте статус

```powershell
docker-compose ps
```

Все сервисы должны быть `Up` или `Up (healthy)`.

## Шаг 4: Запустите тест

```powershell
cd ..\document-analysis-service
pip install -r requirements.txt
python scripts/test_full_cycle.py
```

## Шаг 5: Проверьте результаты

### В отдельном терминале - логи сервиса:

```powershell
docker logs -f document-analysis-service
```

### Проверка базы данных:

```powershell
docker exec -it postgres-document-analysis psql -U postgres -d document_analysis_db -c "SELECT id, project_id, status, started_at FROM analysis_results ORDER BY started_at DESC LIMIT 3;"
```

### Проверка MinIO:

Откройте в браузере: http://localhost:9001
- Login: `minioadmin` / `minioadmin`
- Проверьте bucket `documents`

### Проверка событий Kafka:

```powershell
docker exec -it kafka kafka-console-consumer --bootstrap-server localhost:9092 --topic backlog-ready --from-beginning --max-messages 5
```

## Что дальше?

Подробные инструкции:
- [README.md](README.md) - полная документация
- [TESTING.md](TESTING.md) - детальное руководство по тестированию

## Остановка

```powershell
cd deployments
docker-compose down
```

