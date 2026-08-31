from typing import Optional, List
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.site import Site
from app.schemas.site import SiteCreate, SiteUpdate


class CRUDSite(CRUDBase[Site, SiteCreate, SiteUpdate]):
    def get_by_site_code(self, db: Session, *, site_code: str) -> Optional[Site]:
        return db.query(Site).filter(Site.site_code == site_code).first()

    def get_by_client(
        self, db: Session, *, client_id: int, skip: int = 0, limit: int = 100
    ) -> List[Site]:
        return (
            db.query(Site)
            .filter(Site.client_id == client_id)
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_active_sites(
        self, db: Session, *, skip: int = 0, limit: int = 100
    ) -> List[Site]:
        return (
            db.query(Site)
            .filter(Site.is_active.is_(True))
            .offset(skip)
            .limit(limit)
            .all()
        )


site = CRUDSite(Site)
