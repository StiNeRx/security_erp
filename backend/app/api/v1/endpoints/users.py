from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_active_user, require_admin
from app.core.database import get_db
from app.crud.crud_user import user as crud_user
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate, UserResponse

router = APIRouter()


@router.get("/", response_model=List[UserResponse])
def read_users(
    db: Session = Depends(get_db),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[UserRole] = None,
    current_user: User = Depends(require_admin),
) -> List[UserResponse]:
    """Retrieve users with optional role filtering (Admin only)."""
    if role:
        users = (
            db.query(crud_user.model)
            .filter(crud_user.model.role == role)
            .offset(skip)
            .limit(limit)
            .all()
        )
        return users
    return crud_user.get_multi(db, skip=skip, limit=limit)


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    *,
    db: Session = Depends(get_db),
    user_in: UserCreate,
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """Create a new user account (Admin only)."""
    existing = crud_user.get_by_email(db, email=user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    return crud_user.create(db, obj_in=user_in)


@router.get("/{user_id}", response_model=UserResponse)
def read_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Get a specific user by ID. Users can view their own profile; Admins can view any."""
    if current_user.role != UserRole.ADMIN and not current_user.is_superuser:
        if current_user.id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: you can only view your own user profile.",
            )

    db_user = crud_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return db_user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    user_in: UserUpdate,
    current_user: User = Depends(get_current_active_user),
) -> UserResponse:
    """Update a user. Self-update permitted (excluding role promotion); full update for Admin."""
    is_admin = current_user.is_superuser or current_user.role == UserRole.ADMIN
    if not is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: you cannot update other user profiles.",
        )

    db_user = crud_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    update_dict = user_in.model_dump(exclude_unset=True)

    # Non-admins cannot alter their role or active status
    if not is_admin:
        if "role" in update_dict:
            del update_dict["role"]
        if "is_active" in update_dict:
            del update_dict["is_active"]

    if "email" in update_dict and update_dict["email"] != db_user.email:
        existing = crud_user.get_by_email(db, email=update_dict["email"])
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered to another user.",
            )

    return crud_user.update(db, db_obj=db_user, obj_in=update_dict)


@router.delete("/{user_id}", response_model=UserResponse)
def delete_user(
    *,
    db: Session = Depends(get_db),
    user_id: int,
    current_user: User = Depends(require_admin),
) -> UserResponse:
    """Delete a user (Admin only)."""
    db_user = crud_user.get(db, id=user_id)
    if not db_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )
    return crud_user.remove(db, id=user_id)
