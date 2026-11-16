from database import SessionLocal, engine
import models

models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

thanos = models.User(username="thanos", is_admin=True)
db.add(thanos)

disciplinas = [
    {"name": "Direito Informático", "icon": "fa-scale-balanced", "description": "Leis e crimes digitais"},
    {"name": "Matemática", "icon": "fa-calculator", "description": "Cálculo e álgebra"},
    {"name": "Programação Web", "icon": "fa-code", "description": "HTML, CSS, JS"},
    {"name": "Base de Dados", "icon": "fa-database", "description": "SQL e modelação"},
    {"name": "Redes", "icon": "fa-network-wired", "description": "Protocolos"},
    {"name": "Eng. Software", "icon": "fa-diagram-project", "description": "Metodologias"},
]

for d in disciplinas:
    db.add(models.Discipline(**d))
db.commit()

def add_lesson(disc_name, title, order, questions):
    d = db.query(models.Discipline).filter(models.Discipline.name == disc_name).first()
    l = models.Lesson(discipline_id=d.id, title=title, order=order)
    db.add(l); db.commit(); db.refresh(l)
    for q in questions:
        db.add(models.Question(lesson_id=l.id, **q))

add_lesson("Direito Informático", "Aula 1 · Introdução", 1, [
    {"text": "Após quantos meses o Salário Mínimo passa para 100.000 Kz?", "option_a": "6", "option_b": "18", "option_c": "24", "option_d": "12", "correct_option": "D", "explanation": "Artigo 1.º, n.º 2."},
    {"text": "O que é acesso ilegítimo?", "option_a": "Software pirata", "option_b": "Acesso não autorizado a sistema", "option_c": "Partilha", "option_d": "Erro", "correct_option": "B", "explanation": "Violação do artigo 6.º."},
])
add_lesson("Direito Informático", "Aula 2 · Cibercrime", 2, [
    {"text": "A Lei do Cibercrime Angolana é:", "option_a": "22/11", "option_b": "23/11", "option_c": "38/20", "option_d": "1/05", "correct_option": "B", "explanation": "Lei n.º 23/11."},
    {"text": "O que é phishing?", "option_a": "Jogo", "option_b": "Engenharia social", "option_c": "Antivírus", "option_d": "Firewall", "correct_option": "B", "explanation": "Roubo de credenciais."},
])
add_lesson("Direito Informático", "Aula 3 · Proteção de Dados", 3, [
    {"text": "Entidade que regula dados em Angola:", "option_a": "AGT", "option_b": "BNA", "option_c": "APD", "option_d": "MININT", "correct_option": "C", "explanation": "APD."},
    {"text": "Tempo de conservação de dados de tráfego:", "option_a": "3m", "option_b": "6m", "option_c": "12m", "option_d": "24m", "correct_option": "C", "explanation": "12 meses."},
])

add_lesson("Matemática", "Aula 1 · Aritmética", 1, [
    {"text": "7 × 8 = ?", "option_a": "54", "option_b": "56", "option_c": "58", "option_d": "60", "correct_option": "B", "explanation": "56."},
    {"text": "15% de 200 = ?", "option_a": "25", "option_b": "30", "option_c": "35", "option_d": "20", "correct_option": "B", "explanation": "30."},
])
add_lesson("Matemática", "Aula 2 · Cálculo", 2, [
    {"text": "Derivada de x²?", "option_a": "x", "option_b": "2x", "option_c": "x³", "option_d": "2", "correct_option": "B", "explanation": "2x."},
    {"text": "π ≈ ?", "option_a": "3.14", "option_b": "2.71", "option_c": "1.61", "option_d": "4.20", "correct_option": "A", "explanation": "3.14."},
])

add_lesson("Programação Web", "Aula 1 · HTML/CSS", 1, [
    {"text": "HTML significa?", "option_a": "HyperText Markup Language", "option_b": "Home Tool", "option_c": "Hyperlinks", "option_d": "High Tech", "correct_option": "A", "explanation": "HyperText Markup Language."},
    {"text": "Framework CSS?", "option_a": "React", "option_b": "Django", "option_c": "Bootstrap", "option_d": "Laravel", "correct_option": "C", "explanation": "Bootstrap."},
])
add_lesson("Programação Web", "Aula 2 · JavaScript", 2, [
    {"text": "Variável moderna?", "option_a": "var", "option_b": "let", "option_c": "int", "option_d": ":=", "correct_option": "B", "explanation": "let/const."},
    {"text": "fetch() serve para?", "option_a": "Gráficos", "option_b": "HTTP assíncrono", "option_c": "Cookies", "option_d": "Compilar", "correct_option": "B", "explanation": "Pedidos HTTP."},
])

db.commit()
db.close()
print("Seed concluído com trilhas.")