from pydantic import BaseModel
from datetime import datetime
from typing import List

class QuestionBase(BaseModel):
    text: str
    option_a: str
    option_b: str
    option_c: str
    option_d: str
    correct_option: str
    explanation: str

class QuestionResponse(QuestionBase):
    id: int
    discipline: str

    class Config:
        orm_mode = True

class AnswerSubmit(BaseModel):
    user_id: int
    question_id: int
    selected_option: str

class ProgressResponse(BaseModel):
    question_id: int
    is_correct: bool
    answered_at: datetime

    class Config:
        orm_mode = True