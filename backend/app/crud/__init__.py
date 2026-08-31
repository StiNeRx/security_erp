"""CRUD operations registry."""
from app.crud.base import CRUDBase
from app.crud.crud_user import user
from app.crud.crud_client import client
from app.crud.crud_site import site
from app.crud.crud_guard import guard
from app.crud.crud_roster import roster
from app.crud.crud_attendance import attendance
from app.crud.crud_invoice import invoice

__all__ = [
    "CRUDBase",
    "user",
    "client",
    "site",
    "guard",
    "roster",
    "attendance",
    "invoice",
]
