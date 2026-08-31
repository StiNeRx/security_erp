from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    billing,
    users,
    clients,
    sites,
    guards,
    rosters,
    attendances,
    invoices,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(billing.router, prefix="/billing", tags=["Billing & Invoicing"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(clients.router, prefix="/clients", tags=["Clients"])
api_router.include_router(sites.router, prefix="/sites", tags=["Sites"])
api_router.include_router(guards.router, prefix="/guards", tags=["Guards"])
api_router.include_router(rosters.router, prefix="/rosters", tags=["Shift Rosters"])
api_router.include_router(attendances.router, prefix="/attendances", tags=["Attendance"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
