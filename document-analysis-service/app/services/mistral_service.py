import os
from typing import Tuple
from mistralai import Mistral
from app.config.settings import settings
import logging
import json
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    RetryError
)
import httpx
import httpcore

logger = logging.getLogger(__name__)


class MistralService:
    def __init__(self):
        self.api_key = settings.mistral_api_key
        self.agent = settings.mistral_agent_id 
        
    @retry(
        stop=stop_after_attempt(5),
        wait=wait_exponential(multiplier=1, min=2, max=30),
        retry=retry_if_exception_type((httpx.ConnectError, httpcore.ConnectError, OSError)),
        reraise=True
    )
    def get_backlog(self, tz_text: str) -> Tuple[dict, str]:
        """Получает backlog из Mistral AI, возвращает (backlog_dict, conversation_id)"""
        try:
            logger.info(f"Attempting to get backlog from Mistral AI (retry enabled)")
            with Mistral(api_key=self.api_key) as mistral:
                messages = [
                    {
                        "content": f"[ТЕХНИЧЕСКОЕ ЗАДАНИЕ]\n{tz_text}\n\nВАЖНО: Для каждой работы (work_number) обязательно укажи критерии приёмки (acceptance_criteria). Критерии приёмки должны быть конкретными и измеримыми.",
                        "role": "user",
                    }
                ]
                
                response = mistral.agents.complete(
                    messages=messages,
                    agent_id=self.agent,
                    stream=False
                )
                
                # Извлекаем JSON из ответа
                # В новых версиях conversation_id не используется, возвращаем id ответа для совместимости
                content = response.choices[0].message.content
                logger.info(f"Mistral response content type: {type(content)}, length: {len(content) if content else 0}")
                logger.info(f"Mistral response content first 500 chars: {content[:500] if content else 'None'}")
                
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
                logger.info(f"Cleaned content first 200 chars: {content_clean[:200]}")
                
                # Парсим только первый JSON объект (может быть текст после JSON)
                decoder = json.JSONDecoder()
                result, idx = decoder.raw_decode(content_clean)
                logger.info(f"Successfully parsed JSON, stopped at position {idx}")
                # Используем id ответа как conversation_id (для совместимости с кодом)
                conversation_id = response.id if hasattr(response, 'id') else str(response.choices[0].index)
                return result, conversation_id
        except (httpx.ConnectError, httpcore.ConnectError, OSError) as e:
            logger.warning(f"Network error getting backlog from Mistral (will retry): {e}")
            raise
        except Exception as e:
            logger.error(f"Error getting backlog from Mistral: {e}")
            raise
    

