from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.client import Client
from app.schemas.client import ClientCreate, ClientUpdate


class CRUDClient(CRUDBase[Client, ClientCreate, ClientUpdate]):
    def get_by_company_name(self, db: Session, *, company_name: str) -> Optional[Client]:
        return db.query(Client).filter(Client.company_name == company_name).first()

    def get_by_user_id(self, db: Session, *, user_id: int) -> Optional[Client]:
        return db.query(Client).filter(Client.user_id == user_id).first()

    def get_active_clients(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Client]:
        return (
            db.query(Client)
            .filter(Client.is_active.is_(True))
            .offset(skip)
            .limit(limit)
            .all()
        )


client = CRUDClient(Client)
