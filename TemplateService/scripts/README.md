# Template Manager - Консольный скрипт для работы с каталогом семантических блоков

## Описание

Консольный скрипт для просмотра и управления каталогом семантических блоков презентаций через TemplateService API.

⚠️ **ВАЖНО:** После рефакторинга TemplateService больше не поддерживает импорт PPTX файлов через API.
Блоки должны быть добавлены в базу данных напрямую (через SQL или административный инструмент).

## Установка

```bash
cd TemplateService/scripts
pip install -r requirements.txt
```

## Использование

### 1. Просмотр каталога блоков

```bash
# Показать все блоки
python template_manager.py list

# Фильтрация по категории
python template_manager.py list --category overview
python template_manager.py list --category technical
python template_manager.py list --category roadmap
```

### 2. Информация о конкретном блоке

```bash
# По ID блока
python template_manager.py show 550e8400-e29b-41d4-a716-446655440000
```

### 3. Поиск блоков

```bash
# Поиск по коду или названию
python template_manager.py search "project"
python template_manager.py search "technical"
```

### 4. Список категорий

```bash
# Показать все доступные категории
python template_manager.py categories
```

### 5. Интерактивный режим

```bash
python template_manager.py interactive
```

В интерактивном режиме доступны команды:
- `list [category]` - показать список блоков
- `show <id>` - показать информацию о блоке
- `search <query>` - поиск блоков
- `categories` - показать категории
- `help` - справка
- `exit` / `quit` - выход

## Работа через API Gateway

```bash
python template_manager.py --url http://localhost:8080 list
python template_manager.py --url http://api-gateway/api/template-service show <block-id>
```

## Примеры сценариев

### Сценарий 1: Просмотр каталога

```bash
# 1. Проверить доступность сервиса и посмотреть все блоки
python template_manager.py list

# 2. Посмотреть только блоки категории "overview"
python template_manager.py list --category overview

# 3. Получить детали конкретного блока
python template_manager.py show <block-id>
```

### Сценарий 2: Поиск нужного блока

```bash
# 1. Посмотреть доступные категории
python template_manager.py categories

# 2. Поиск блоков с "description" в названии или коде
python template_manager.py search description

# 3. Посмотреть детали найденного блока
python template_manager.py show <block-id>
```

### Сценарий 3: Интерактивная работа

```bash
# Запустить интерактивный режим
python template_manager.py interactive

# В интерактивном режиме:
> list
> show <block-id>
> search project
> categories
> exit
```

## Возможности

✅ Просмотр каталога семантических блоков
✅ Фильтрация по категориям
✅ Детальная информация о блоках и их полях
✅ Поиск по коду и названию
✅ Просмотр всех категорий
✅ Интерактивный режим
✅ Поддержка API Gateway
✅ Красивый вывод в таблицах

## Структура блока

Каждый блок содержит:
- **Метаданные**: id, code, name, description, category
- **Файлы**: pptxFileUrl (PPTX файл), previewUrl (PNG превью)
- **Поля**: список плейсхолдеров с типами и метаданными

Пример структуры блока:
```json
{
  "id": "uuid",
  "code": "project_description",
  "name": "Описание проекта",
  "category": "overview",
  "fields": [
    {"key": "title", "type": "title", "required": true},
    {"key": "description", "type": "text", "required": false}
  ]
}
```

## Добавление блоков в каталог

Блоки добавляются напрямую в базу данных PostgreSQL:

```sql
-- Пример добавления блока
INSERT INTO template_blocks (id, code, name, description, category, pptx_file_url, preview_png_url, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'project_description',
    'Описание проекта',
    'Блок с описанием проекта',
    'overview',
    'https://minio.example.com/templates/project_description.pptx',
    'https://minio.example.com/templates/project_description.png',
    NOW(),
    NOW()
);

-- Добавление полей блока
INSERT INTO block_fields (id, block_id, field_key, placeholder, type, required, order_index)
VALUES 
    (gen_random_uuid(), (SELECT id FROM template_blocks WHERE code = 'project_description'), 
     'title', '{{ text.title }}', 'title', true, 0),
    (gen_random_uuid(), (SELECT id FROM template_blocks WHERE code = 'project_description'), 
     'description', '{{ text.description }}', 'text', false, 1);
```

## Troubleshooting

### Сервис недоступен

```bash
# Проверить статус
docker-compose ps template-service

# Посмотреть логи
docker-compose logs template-service

# Проверить health check
curl http://localhost:8003/health
```

### База данных пустая

После миграции база данных будет пустой. Это нормально. Добавьте тестовые блоки через SQL:

```bash
# Подключиться к БД
psql -h localhost -U postgres -d template_service

# Вставить тестовые данные (см. пример выше)
```

### Блок не найден

Убедитесь, что используете правильный UUID блока:
```bash
# Сначала получите список блоков
python template_manager.py list

# Затем используйте ID из списка
python template_manager.py show <correct-block-id>
```
