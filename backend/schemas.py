from pydantic import BaseModel
from datetime import datetime
from typing import List, Optional

class LoginRequest(BaseModel):
    username: str
    password: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_admin: bool

class DisciplineBase(BaseModel):
    name: str
    icon: Optional[str] = "fa-book"
    description: Optional[str] = ""

class DisciplineCreate(DisciplineBase):
    pass

class DisciplineResponse(DisciplineBase):
    id: int
    class Config:
        orm_mode = True

class LessonBase(BaseModel):
    title: str
    order: Optional[int] = 0

class LessonCreate(LessonBase):
    discipline_id: int

class LessonResponse(LessonBase):
    id: int
    discipline_id: int
    class Config:
        orm_mode = True

class QuestionBase(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str

class QuestionCreate(QuestionBase):
    lesson_id: int

class QuestionResponse(QuestionBase):
    id: int
    lesson_id: int
    class Config:
        orm_mode = True

class AnswerSubmit(BaseModel):
    user_id: int
    question_id: int
    selected_option: str