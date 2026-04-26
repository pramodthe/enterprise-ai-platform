from pathlib import Path
from typing import Any, Optional

from pydantic import AliasChoices, Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Always load `backend/.env` regardless of process cwd (e.g. `npm run backend` from repo root).
_BACKEND_ROOT = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    """Runtime settings loaded from `backend/.env` (when present)."""

    model_config = SettingsConfigDict(
        env_file=_BACKEND_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        env_ignore_empty=True,
    )

    # Comma-separated origins for browser clients (e.g. https://app-xxx.run.app).
    # Use * only for local/dev; production should list the UI origin(s).
    cors_allow_origins: str = Field(
        default="*",
        validation_alias=AliasChoices("CORS_ALLOW_ORIGINS"),
    )

    openai_api_key: Optional[str] = Field(
        default=None,
        validation_alias=AliasChoices("OPENAI_API_KEY", "FIREWORKS_API_KEY"),
    )
    # When unset, resolve_openai_base_url() defaults to Fireworks. Set explicitly for OpenAI Platform.
    openai_base_url: Optional[str] = None
    openai_model: str = "accounts/fireworks/models/minimax-m2p7"
    openai_max_tokens: int = 8192
    openai_temperature: float = 0.6

    openai_embeddings_api_key: Optional[str] = None
    openai_embeddings_base_url: Optional[str] = None

    @field_validator("openai_api_key", mode="before")
    @classmethod
    def normalize_openai_api_key(cls, v: Any) -> Any:
        """Strip whitespace and wrapping quotes — common .env mistakes cause 401."""
        if v is None:
            return None
        if not isinstance(v, str):
            return v
        t = v.strip()
        if len(t) >= 2 and t[0] == t[-1] and t[0] in ("'", '"'):
            t = t[1:-1].strip()
        return t or None

    @field_validator("openai_base_url", mode="before")
    @classmethod
    def strip_openai_base_url(cls, v: Any) -> Any:
        """Keep `''` so `OPENAI_BASE_URL=` in .env means official OpenAI (not Fireworks)."""
        if v is None:
            return None
        if isinstance(v, str):
            return v.strip()
        return v

    @field_validator("openai_embeddings_base_url", mode="before")
    @classmethod
    def strip_embeddings_base_url(cls, v: Any) -> Any:
        if isinstance(v, str):
            t = v.strip()
            return t or None
        return v


settings = Settings()


def cors_origins_list() -> list[str]:
    """Split `cors_allow_origins` into a list; empty entries dropped."""
    parts = [p.strip() for p in settings.cors_allow_origins.split(",")]
    return [p for p in parts if p] or ["*"]


def resolve_openai_base_url() -> Optional[str]:
    """
    openai_base_url unset in `backend/.env` → Fireworks (MiniMax default stack).
    openai_base_url empty string → OpenAI SDK default (https://api.openai.com/v1).
    Otherwise → that base URL (trimmed, no trailing slash).
    """
    raw = settings.openai_base_url
    if raw is None:
        return "https://api.fireworks.ai/inference/v1"
    if raw == "":
        return None
    return raw.rstrip("/")


def get_openai_client_args() -> dict[str, Any]:
    if not settings.openai_api_key:
        raise RuntimeError("OPENAI_API_KEY environment variable is not set.")
    args: dict[str, Any] = {"api_key": settings.openai_api_key}
    base = resolve_openai_base_url()
    if base:
        args["base_url"] = base
    return args
