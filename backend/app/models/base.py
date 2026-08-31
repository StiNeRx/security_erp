from datetime import datetime, timezone
from sqlalchemy import Column, Integer, DateTime
from app.core.database import Base


class TimestampMixin:
    """Mixin for models requiring created_at and updated_at timestamps."""
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
        nullable=False,
    )


class BaseModel(Base, TimestampMixin):
    """Abstract base model with primary key and timestamps."""
    __abstract__ = True

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
