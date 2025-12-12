import os
from mistralai import Mistral
from app.config.settings import settings
import logging
import json

logger = logging.getLogger(__name__)


class MistralTKPService:
    """Сервис для получения ТКП от Mistral AI"""
    
    def __init__(self):
        self.api_key = settings.mistral_api_key
        self.agent = settings.mistral_agent_tkp_id
      

    def get_tkp(self, conversation_id: str, tz_text: str) -> dict:
        """Получает ТКП из Mistral AI (продолжение разговора)"""
        try:
            with Mistral(api_key=self.api_key) as mistral:
                messages = [
                    {
                        "content": f"[ТЕХНИЧЕСКОЕ ЗАДАНИЕ]\n{tz_text}\n\nТеперь сформируй технико-коммерческое предложение (ТКП) на основе этого ТЗ.",
                        "role": "user",
                    }
                ]
                
                response = mistral.agents.complete(
                    messages=messages,
                    agent_id=self.agent,
                    stream=False
                )
                
                # Извлекаем JSON из ответа
                content = response.choices[0].message.content
                logger.info(f"TKP response content type: {type(content)}, length: {len(content) if content else 0}")
                
                if not content:
                    raise ValueError("Empty response content from Mistral AI")
                
                # Пытаемся найти JSON в ответе (может быть обернут в markdown)
                content_clean = content.strip()
                # Если ответ начинается с ```json или ```, удаляем markdown разметку
                if content_clean.startswith("```json"):
                    content_clean = content_clean[7:]  # Убираем ```json
                elif content_clean.startswith("```"):
                    content_clean = content_clean[3:]  # Убираем ```
                
                # Убираем закрывающие ```
                if content_clean.endswith("```"):
                    content_clean = content_clean[:-3]
                
                content_clean = content_clean.strip()
                logger.info(f"TKP cleaned content first 200 chars: {content_clean[:200]}")
                
                # Парсим только первый JSON объект (может быть текст после JSON)
                decoder = json.JSONDecoder()
                result, idx = decoder.raw_decode(content_clean)
                logger.info(f"Successfully parsed TKP JSON, stopped at position {idx}")
                
                return result
        except Exception as e:
            logger.error(f"Error getting TKP from Mistral: {e}")
            raise


