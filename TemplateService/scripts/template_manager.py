#!/usr/bin/env python3
"""
Template Manager - Консольный скрипт для работы с каталогом семантических блоков

Использование:
    python template_manager.py --help
    python template_manager.py list [--category <category>]
    python template_manager.py show <block-id>
    python template_manager.py search <query>
    python template_manager.py upload <file> --code <code> --name <name> [--description <desc>] [--category <cat>]
    python template_manager.py categories
    python template_manager.py interactive
"""

import argparse
import sys
import json
import requests
from typing import Optional, Dict, Any, List
from tabulate import tabulate


class TemplateServiceClient:
    """Клиент для работы с TemplateService API"""
    
    def __init__(self, base_url: str = "http://localhost:8003"):
        self.base_url = base_url.rstrip('/')
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'TemplateManager/2.0'
        })
    
    def health_check(self) -> bool:
        """Проверка доступности сервиса"""
        try:
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            return response.status_code == 200
        except Exception as e:
            print(f"❌ Ошибка подключения к сервису: {e}")
            return False
    
    def get_blocks(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Получить список всех блоков
        
        Args:
            category: Фильтр по категории (опционально)
        
        Returns:
            Список блоков в формате: [{id, code, name, previewUrl}]
        """
        url = f"{self.base_url}/api/Templates"
        params = {}
        if category:
            params['category'] = category
        
        response = self.session.get(url, params=params)
        response.raise_for_status()
        return response.json()
    
    def get_block(self, block_id: str) -> Dict[str, Any]:
        """
        Получить детальную информацию о блоке
        
        Args:
            block_id: UUID блока
        
        Returns:
            Полная информация о блоке с полями
        """
        response = self.session.get(f"{self.base_url}/api/Templates/{block_id}")
        response.raise_for_status()
        return response.json()
    
    def upload_block(
        self, 
        file_path: str, 
        code: str, 
        name: str, 
        description: Optional[str] = None,
        category: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Загрузить новый блок из PPTX файла
        
        Args:
            file_path: Путь к PPTX файлу
            code: Уникальный код блока
            name: Название блока
            description: Описание блока
            category: Категория блока
        
        Returns:
            Информация о созданном блоке
        """
        with open(file_path, 'rb') as f:
            files = {'file': (file_path.split('/')[-1], f, 'application/vnd.openxmlformats-officedocument.presentationml.presentation')}
            data = {
                'code': code,
                'name': name
            }
            if description:
                data['description'] = description
            if category:
                data['category'] = category
            
            response = self.session.post(
                f"{self.base_url}/api/Templates",
                files=files,
                data=data
            )
            response.raise_for_status()
            return response.json()


class TemplateManager:
    """Менеджер для работы с каталогом блоков"""
    
    def __init__(self, client: TemplateServiceClient):
        self.client = client
    
    def check_service(self):
        """Проверить доступность сервиса"""
        print("🔍 Проверка доступности TemplateService...")
        if not self.client.health_check():
            print("❌ TemplateService недоступен!")
            print(f"   Убедитесь, что сервис запущен на {self.client.base_url}")
            sys.exit(1)
        print("✅ TemplateService доступен")
        print()
    
    def list_blocks(self, category: Optional[str] = None):
        """Показать список блоков"""
        print("=" * 80)
        print("📚 КАТАЛОГ СЕМАНТИЧЕСКИХ БЛОКОВ")
        print("=" * 80)
        print()
        
        try:
            blocks = self.client.get_blocks(category)
            
            if not blocks:
                print("📭 Каталог пуст")
                print()
                print("💡 Блоки должны быть добавлены в базу данных вручную или через SQL скрипт")
                return
            
            # Группируем по категориям
            blocks_by_category = {}
            for block in blocks:
                cat = block.get('category', 'uncategorized')
                if cat not in blocks_by_category:
                    blocks_by_category[cat] = []
                blocks_by_category[cat].append(block)
            
            print(f"📊 Всего блоков: {len(blocks)}")
            if category:
                print(f"🔍 Фильтр по категории: {category}")
            print()
            
            # Выводим по категориям
            for cat, cat_blocks in sorted(blocks_by_category.items()):
                cat_display = cat if cat else 'Без категории'
                print(f"📁 {cat_display.upper()} ({len(cat_blocks)} блоков)")
                print("-" * 80)
                
                table_data = []
                for block in cat_blocks:
                    table_data.append([
                        block['id'][:8] + '...',
                        block['code'][:30],
                        block['name'][:40],
                        '✓' if block.get('previewUrl') else '✗'
                    ])
                
                print(tabulate(table_data, 
                              headers=['ID (short)', 'Code', 'Name', 'Preview'], 
                              tablefmt='simple'))
                print()
            
            print("💡 Для просмотра деталей блока:")
            print("   python template_manager.py show <block-id>")
            print()
            print("💡 Для фильтрации по категории:")
            print("   python template_manager.py list --category <category-name>")
            
        except Exception as e:
            print(f"❌ Ошибка получения списка блоков: {e}")
    
    def show_block(self, block_id: str):
        """Показать детальную информацию о блоке"""
        print("=" * 80)
        print("🔍 ИНФОРМАЦИЯ О БЛОКЕ")
        print("=" * 80)
        print()
        
        try:
            block = self.client.get_block(block_id)
            
            # Основная информация
            print("📋 Основная информация:")
            print(f"   🆔 ID:           {block['id']}")
            print(f"   🔑 Code:         {block['code']}")
            print(f"   📝 Name:         {block['name']}")
            print(f"   📄 Description:  {block.get('description', 'N/A')}")
            print(f"   📁 Category:     {block.get('category', 'N/A')}")
            print()
            
            # Файлы
            print("📦 Файлы:")
            print(f"   📎 PPTX:         {block['pptxFileUrl']}")
            print(f"   🖼️  Preview:      {block.get('previewUrl', 'N/A')}")
            print()
            
            # Поля
            fields = block.get('fields', [])
            if fields:
                print(f"🏷️  Поля блока ({len(fields)}):")
                print()
                
                table_data = []
                for field in fields:
                    table_data.append([
                        field.get('order_index', 0),
                        field['key'][:30],
                        field['type'],
                        '✓' if field.get('required') else '✗',
                        field.get('placeholder', 'N/A')[:40]
                    ])
                
                print(tabulate(table_data,
                              headers=['Order', 'Key', 'Type', 'Required', 'Placeholder'],
                              tablefmt='grid'))
                
                # Метаданные полей
                fields_with_metadata = [f for f in fields if f.get('metadata')]
                if fields_with_metadata:
                    print()
                    print("📊 Метаданные полей:")
                    for field in fields_with_metadata:
                        print(f"   • {field['key']}: {json.dumps(field['metadata'], indent=6)}")
            else:
                print("🏷️  Поля: Нет полей")
            
            print()
            
            # Временные метки
            print("🕐 Временные метки:")
            print(f"   Created: {block['created_at']}")
            print(f"   Updated: {block['updated_at']}")
            
        except requests.HTTPError as e:
            if e.response.status_code == 404:
                print(f"❌ Блок с ID {block_id} не найден")
            else:
                print(f"❌ Ошибка получения блока: {e}")
        except Exception as e:
            print(f"❌ Ошибка: {e}")
    
    def search_blocks(self, query: str):
        """Поиск блоков по запросу"""
        print("=" * 80)
        print(f"🔍 ПОИСК: '{query}'")
        print("=" * 80)
        print()
        
        try:
            all_blocks = self.client.get_blocks()
            
            # Простой поиск по коду и названию
            query_lower = query.lower()
            found_blocks = [
                block for block in all_blocks
                if query_lower in block['code'].lower() or query_lower in block['name'].lower()
            ]
            
            if not found_blocks:
                print(f"📭 Блоки не найдены по запросу '{query}'")
                return
            
            print(f"📊 Найдено блоков: {len(found_blocks)}")
            print()
            
            table_data = []
            for block in found_blocks:
                table_data.append([
                    block['id'][:8] + '...',
                    block['code'][:30],
                    block['name'][:40],
                    block.get('category', 'N/A')[:15]
                ])
            
            print(tabulate(table_data,
                          headers=['ID (short)', 'Code', 'Name', 'Category'],
                          tablefmt='grid'))
            print()
            print("💡 Для просмотра деталей: python template_manager.py show <block-id>")
            
        except Exception as e:
            print(f"❌ Ошибка поиска: {e}")
    
    def upload_block(self, file_path: str, code: str, name: str, description: Optional[str] = None, category: Optional[str] = None):
        """Загрузить новый блок из PPTX файла"""
        print("=" * 80)
        print("📤 ЗАГРУЗКА НОВОГО БЛОКА")
        print("=" * 80)
        print()
        
        import os
        
        # Проверяем существование файла
        if not os.path.exists(file_path):
            print(f"❌ Файл не найден: {file_path}")
            return
        
        # Проверяем расширение файла
        if not file_path.lower().endswith('.pptx'):
            print(f"❌ Неверный формат файла. Ожидается .pptx")
            return
        
        print(f"📁 Файл:        {file_path}")
        print(f"🔑 Codeвув:        {code}")
        print(f"📝 Name:        {name}")
        if description:
            print(f"📄 Description: {description}")
        if category:
            print(f"📁 Category:    {category}")
        print()
        print("🔄 Загрузка файла и создание блока...")
        
        try:
            result = self.client.upload_block(
                file_path=file_path,
                code=code,
                name=name,
                description=description,
                category=category
            )
            
            print()
            print("✅ Блок успешно создан!")
            print()
            print(f"   🆔 ID:           {result['id']}")
            print(f"   🔑 Code:         {result['code']}")
            print(f"   📝 Name:         {result['name']}")
            print(f"   📎 PPTX URL:     {result['pptxFileUrl']}")
            print(f"   🖼️  Preview URL:  {result.get('previewUrl', 'N/A')}")
            print(f"   🏷️  Fields:       {len(result.get('fields', []))} полей")
            print()
            print(f"💡 Для просмотра деталей: python template_manager.py show {result['id']}")
            
        except requests.HTTPError as e:
            print()
            print(f"❌ Ошибка загрузки: HTTP {e.response.status_code}")
            try:
                error_detail = e.response.json()
                print(f"   {error_detail.get('error', 'Unknown error')}")
                if 'details' in error_detail:
                    print(f"   Детали: {error_detail['details']}")
            except:
                print(f"   {e.response.text}")
        except Exception as e:
            print()
            print(f"❌ Ошибка: {e}")
    
    def interactive_mode(self):
        """Интерактивный режим работы"""
        print("=" * 80)
        print("🎮 ИНТЕРАКТИВНЫЙ РЕЖИМ")
        print("=" * 80)
        print()
        print("Доступные команды:")
        print("  list [category]     - Показать список блоков")
        print("  show <id>           - Показать информацию о блоке")
        print("  search <query>      - Поиск блоков")
        print("  upload              - Загрузить новый блок")
        print("  categories          - Показать все категории")
        print("  help                - Показать эту справку")
        print("  exit / quit         - Выход")
        print()
        
        while True:
            try:
                command = input("📝 Команда: ").strip()
                
                if not command:
                    continue
                
                parts = command.split(maxsplit=1)
                cmd = parts[0].lower()
                arg = parts[1] if len(parts) > 1 else None
                
                print()
                
                if cmd in ['exit', 'quit', 'q']:
                    print("👋 До свидания!")
                    break
                
                elif cmd == 'list':
                    self.list_blocks(category=arg)
                
                elif cmd == 'show':
                    if not arg:
                        print("❌ Укажите ID блока: show <block-id>")
                    else:
                        self.show_block(arg)
                
                elif cmd == 'search':
                    if not arg:
                        print("❌ Укажите поисковый запрос: search <query>")
                    else:
                        self.search_blocks(arg)
                
                elif cmd == 'upload':
                    print("📤 Загрузка нового блока")
                    print()
                    file_path = input("📁 Путь к PPTX файлу: ").strip()
                    code = input("🔑 Код блока: ").strip()
                    name = input("📝 Название блока: ").strip()
                    description = input("📄 Описание (Enter - пропустить): ").strip() or None
                    category = input("📁 Категория (Enter - пропустить): ").strip() or None
                    print()
                    
                    if file_path and code and name:
                        self.upload_block(file_path, code, name, description, category)
                    else:
                        print("❌ Обязательные поля: file_path, code, name")
                
                elif cmd == 'categories':
                    self.show_categories()
                
                elif cmd == 'help':
                    print("Доступные команды:")
                    print("  list [category]     - Показать список блоков")
                    print("  show <id>           - Показать информацию о блоке")
                    print("  search <query>      - Поиск блоков")
                    print("  categories          - Показать все категории")
                    print("  help                - Показать эту справку")
                    print("  exit / quit         - Выход")
                
                else:
                    print(f"❌ Неизвестная команда: {cmd}")
                    print("   Используйте 'help' для списка команд")
                
                print()
                
            except KeyboardInterrupt:
                print("\n👋 До свидания!")
                break
            except Exception as e:
                print(f"❌ Ошибка: {e}")
                print()
    
    def show_categories(self):
        """Показать все доступные категории"""
        print("=" * 80)
        print("📁 КАТЕГОРИИ БЛОКОВ")
        print("=" * 80)
        print()
        
        try:
            blocks = self.client.get_blocks()
            
            categories = {}
            for block in blocks:
                cat = block.get('category', 'uncategorized')
                categories[cat] = categories.get(cat, 0) + 1
            
            if not categories:
                print("📭 Нет категорий")
                return
            
            table_data = []
            for cat, count in sorted(categories.items()):
                cat_display = cat if cat else 'Без категории'
                table_data.append([cat_display, count])
            
            print(tabulate(table_data,
                          headers=['Category', 'Blocks'],
                          tablefmt='grid'))
            print()
            print("💡 Для фильтрации: python template_manager.py list --category <category-name>")
            
        except Exception as e:
            print(f"❌ Ошибка получения категорий: {e}")


def main():
    parser = argparse.ArgumentParser(
        description='Template Manager - Управление каталогом семантических блоков',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Примеры использования:
  # Показать все блоки
  python template_manager.py list
  
  # Фильтровать по категории
  python template_manager.py list --category overview
  
  # Показать информацию о блоке
  python template_manager.py show 660e8400-e29b-41d4-a716-446655440000
  
  # Поиск блоков
  python template_manager.py search "project"
  
  # Интерактивный режим
  python template_manager.py interactive
  
  # Использование другого URL сервиса
  python template_manager.py --url http://api-gateway/api/template-service list
        """
    )
    
    parser.add_argument(
        '--url',
        default='http://localhost:8003',
        help='URL TemplateService (default: http://localhost:8003)'
    )
    
    subparsers = parser.add_subparsers(dest='command', help='Команда для выполнения')
    
    # List command
    list_parser = subparsers.add_parser('list', help='Показать список блоков')
    list_parser.add_argument('--category', help='Фильтр по категории')
    
    # Show command
    show_parser = subparsers.add_parser('show', help='Показать информацию о блоке')
    show_parser.add_argument('block_id', help='ID блока (UUID)')
    
    # Search command
    search_parser = subparsers.add_parser('search', help='Поиск блоков')
    search_parser.add_argument('query', help='Поисковый запрос')
    
    # Upload command
    upload_parser = subparsers.add_parser('upload', help='Загрузить новый блок из PPTX файла')
    upload_parser.add_argument('file', help='Путь к PPTX файлу')
    upload_parser.add_argument('--code', required=True, help='Уникальный код блока')
    upload_parser.add_argument('--name', required=True, help='Название блока')
    upload_parser.add_argument('--description', help='Описание блока')
    upload_parser.add_argument('--category', help='Категория блока')
    
    # Categories command
    subparsers.add_parser('categories', help='Показать список категорий')
    
    # Interactive command
    subparsers.add_parser('interactive', help='Интерактивный режим')
    
    args = parser.parse_args()
    
    # Создаём клиент и менеджер
    client = TemplateServiceClient(args.url)
    manager = TemplateManager(client)
    
    # Проверяем сервис
    manager.check_service()
    
    # Выполняем команду
    if args.command == 'list':
        manager.list_blocks(category=getattr(args, 'category', None))
    
    elif args.command == 'show':
        manager.show_block(args.block_id)
    
    elif args.command == 'search':
        manager.search_blocks(args.query)
    
    elif args.command == 'upload':
        manager.upload_block(
            file_path=args.file,
            code=args.code,
            name=args.name,
            description=getattr(args, 'description', None),
            category=getattr(args, 'category', None)
        )
    
    elif args.command == 'categories':
        manager.show_categories()
    
    elif args.command == 'interactive':
        manager.interactive_mode()
    
    else:
        parser.print_help()


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Прервано пользователем")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Критическая ошибка: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
