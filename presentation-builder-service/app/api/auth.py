"""Authentication utilities"""
from typing import Optional
from fastapi import Header, HTTPException, status
import jwt
from jwt.exceptions import InvalidTokenError
import logging

from app.config.settings import settings

logger = logging.getLogger(__name__)


async def verify_jwt_token_optional(authorization: Optional[str] = Header(None)) -> Optional[str]:
    """
    Verify JWT token from Authorization header (optional)
    
    Args:
        authorization: Authorization header value
        
    Returns:
        JWT token string or None if no token provided
        
    Raises:
        HTTPException: If token is provided but invalid
    """
    if not authorization:
        return None
    
    try:
        # Extract token from "Bearer <token>"
        parts = authorization.split()
        if len(parts) != 2 or parts[0].lower() != "bearer":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )
        
        token = parts[1]
        
        # Verify token
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET,
                algorithms=[settings.JWT_ALGORITHM],
                audience=settings.JWT_AUDIENCE,
                issuer=settings.JWT_ISSUER
            )
            return token
        except InvalidTokenError as e:
            logger.warning(f"Invalid JWT token: {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error verifying token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Error verifying token"
        )


async def verify_jwt_token_required(authorization: Optional[str] = Header(None)) -> str:
    """
    Verify JWT token from Authorization header (required)
    
    Args:
        authorization: Authorization header value
        
    Returns:
        JWT token string
        
    Raises:
        HTTPException: If token is missing or invalid
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )
    
    token = await verify_jwt_token_optional(authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization token"
        )
    
    return token
