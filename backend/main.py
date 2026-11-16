from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/questions/{discipline}", response_model=List[schemas.QuestionResponse])
def get_questions(discipline: str, db: Session = Depends(get_db)):
    questions = db.query(models.Question).filter(models.Question.discipline == discipline).all()
    return questions

@app.post("/answer")
def submit_answer(answer: schemas.AnswerSubmit, db: Session = Depends(get_db)):
    question = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    
    is_correct = question.correct_option == answer.selected_option
    
    new_progress = models.Progress(
        user_id=answer.user_id,
        question_id=answer.question_id,
        is_correct=is_correct
    )
    db.add(new_progress)
    db.commit()
    
    return {
        "is_correct": is_correct,
        "correct_option": question.correct_option,
        "explanation": question.explanation
    }

@app.get("/progress/{user_id}")
def get_user_progress(user_id: int, db: Session = Depends(get_db)):
    progress = db.query(models.Progress).filter(models.Progress.user_id == user_id).all()
    return progress