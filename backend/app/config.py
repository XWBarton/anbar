from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    SECRET_KEY: str = "changeme-use-a-long-random-secret-key-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    DATABASE_URL: str = "sqlite:////data/anbar.db"

    FIRST_ADMIN_USERNAME: str = "admin"
    FIRST_ADMIN_PASSWORD: str = "changeme123"
    FIRST_ADMIN_EMAIL: str = "admin@example.com"
    FIRST_ADMIN_FULL_NAME: str = "Administrator"

    APP_VERSION: str = "1.0.0"

    CORS_ORIGINS: str = ""

    # Optional companion instances in the Tessera / Elementa / Forma family.
    # The *_INTERNAL_URL variants are used for backend→backend calls on
    # same-server or tunnelled deployments, bypassing the public URL.
    ELEMENTA_URL: str = ""
    ELEMENTA_INTERNAL_URL: str = ""
    TESSERA_URL: str = ""
    TESSERA_INTERNAL_URL: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
