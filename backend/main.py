from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
import models, schemas
from database import engine, get_db
from auth import (
    hash_password, verify_password, create_token, require_admin
)

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/login", response_model=schemas.TokenResponse)
def login(data: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == data.username).first()
    if not user and data.username == "thanos":
        user = models.User(username="thanos", is_admin=True)
        db.add(user)
        db.commit()
        db.refresh(user)
    if not user:
        raise HTTPException(status_code=401, detail="Utilizador inválido")
    return schemas.TokenResponse(
        access_token=create_token(user.username, user.is_admin),
        is_admin=user.is_admin
    )

@app.get("/disciplines", response_model=List[schemas.DisciplineResponse])
def get_disciplines(db: Session = Depends(get_db)):
    return db.query(models.Discipline).all()

@app.get("/disciplines/{discipline_id}/lessons", response_model=List[schemas.LessonResponse])
def get_lessons(discipline_id: int, db: Session = Depends(get_db)):
    return db.query(models.Lesson).filter(models.Lesson.discipline_id == discipline_id).order_by(models.Lesson.order).all()

@app.get("/lessons/{lesson_id}/questions", response_model=List[schemas.QuestionResponse])
def get_questions(lesson_id: int, db: Session = Depends(get_db)):
    return db.query(models.Question).filter(models.Question.lesson_id == lesson_id).all()

@app.post("/answer")
def submit_answer(answer: schemas.AnswerSubmit, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(models.Question.id == answer.question_id).first()
    if not q:
        raise HTTPException(status_code=404, detail="Questão não encontrada")
    is_correct = q.correct_option == answer.selected_option
    db.add(models.Progress(user_id=answer.user_id, question_id=q.id, is_correct=is_correct))
    db.commit()
    return {"is_correct": is_correct, "correct_option": q.correct_option, "explanation": q.explanation}

@app.post("/admin/disciplines", response_model=schemas.DisciplineResponse, dependencies=[Depends(require_admin)])
def create_discipline(data: schemas.DisciplineCreate, db: Session = Depends(get_db)):
    d = models.Discipline(**data.dict())
    db.add(d); db.commit(); db.refresh(d)
    return d

@app.delete("/admin/disciplines/{did}", dependencies=[Depends(require_admin)])
def delete_discipline(did: int, db: Session = Depends(get_db)):
    d = db.query(models.Discipline).filter(models.Discipline.id == did).first()
    if not d: raise HTTPException(404, "Não encontrada")
    db.delete(d); db.commit()
    return {"ok": True}

@app.post("/admin/lessons", response_model=schemas.LessonResponse, dependencies=[Depends(require_admin)])
def create_lesson(data: schemas.LessonCreate, db: Session = Depends(get_db)):
    l = models.Lesson(**data.dict())
    db.add(l); db.commit(); db.refresh(l)
    return l

@app.delete("/admin/lessons/{lid}", dependencies=[Depends(require_admin)])
def delete_lesson(lid: int, db: Session = Depends(get_db)):
    l = db.query(models.Lesson).filter(models.Lesson.id == lid).first()
    if not l: raise HTTPException(404, "Não encontrada")
    db.delete(l); db.commit()
    return {"ok": True}

@app.post("/admin/questions", response_model=schemas.QuestionResponse, dependencies=[Depends(require_admin)])
def create_question(data: schemas.QuestionCreate, db: Session = Depends(get_db)):
    q = models.Question(**data.dict())
    db.add(q); db.commit(); db.refresh(q)
    return q

@app.delete("/admin/questions/{qid}", dependencies=[Depends(require_admin)])
def delete_question(qid: int, db: Session = Depends(get_db)):
    q = db.query(models.Question).filter(models.Question.id == qid).first()
    if not q: raise HTTPException(404, "Não encontrada")
    db.delete(q); db.commit()
    return {"ok": True}