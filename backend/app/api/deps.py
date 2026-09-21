from typing import Generator, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic import ValidationError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.crud.crud_user import user as crud_user
from app.models.user import User
from app.models.enums import UserRole
from app.schemas.token import TokenPayload

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/auth/login/access-token"
)


def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    """Validate bearer JWT token and return the authenticated user."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        token_data = TokenPayload(sub=user_id, role=payload.get("role"))
    except (JWTError, ValidationError):
        raise credentials_exception

    user = crud_user.get(db, id=int(token_data.sub))
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    """Ensure the user is active."""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account.",
        )
    return current_user


ADMIN_ROLES = [UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN]


def get_current_active_superuser(
    current_user: User = Depends(get_current_active_user),
) -> User:
    """Ensure the user is an active superuser, OWNER, or ADMIN."""
    if not (current_user.is_superuser or current_user.role in ADMIN_ROLES):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="The user does not have administrative privileges.",
        )
    return current_user


class RoleChecker:
    """Dependency for enforcing Role-Based Access Control (RBAC)."""

    def __init__(self, allowed_roles: List[UserRole], allow_super_admin: bool = True):
        self.allowed_roles = allowed_roles
        self.allow_super_admin = allow_super_admin

    def __call__(
        self, current_user: User = Depends(get_current_active_user)
    ) -> User:
        if self.allow_super_admin and (current_user.is_superuser or current_user.role in [UserRole.OWNER, UserRole.SUPER_ADMIN]):
            return current_user
        if current_user.role not in self.allowed_roles:
            role_names = [r.value for r in self.allowed_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Operation not permitted. Required role in {role_names}, but user has '{current_user.role.value}'.",
            )
        return current_user


# Pre-configured RBAC dependencies
require_owner = RoleChecker([UserRole.OWNER], allow_super_admin=False)
require_admin = RoleChecker([UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN])
require_hr_or_admin = RoleChecker([UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.HR])
require_ops_or_admin = RoleChecker([UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.OPERATIONS, UserRole.SUPERVISOR])
require_accounts_or_admin = RoleChecker([UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.ACCOUNTS])
require_client = RoleChecker([UserRole.CLIENT])
require_staff = RoleChecker([UserRole.STAFF])
require_admin_or_client = RoleChecker([UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CLIENT])
require_admin_or_staff = RoleChecker([UserRole.OWNER, UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.STAFF])

