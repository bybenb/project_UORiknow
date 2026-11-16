const API_URL = "http://localhost:8000";
const USER_ID = 1;
let questions = [];
let currentQuestionIndex = 0;
let canAnswer = true;

const screenSubjects = document.getElementById('screen-subjects');
const screenQuiz = document.getElementById('screen-quiz');
const subjectsRow = document.getElementById('subjects-row');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackArea = document.getElementById('feedback-area');
const feedbackMessage = document.getElementById('feedback-message');
const progressBar = document.getElementById('progress-bar');
const questionCounter = document.getElementById('question-counter');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (type === 'correct') {
        o.type = 'sine';
        o.frequency.setValueAtTime(800, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
    } else {
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(150, audioCtx.currentTime);
    }
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
    o.start(); o.stop(audioCtx.currentTime + 0.35);
}

async function loadDisciplines() {
    try {
        const res = await fetch(`${API_URL}/disciplines`);
        const data = await res.json();
        subjectsRow.innerHTML = '';
        data.forEach(d => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card subject-card active" onclick="startQuiz(${d.id})">
                    <div class="card-body text-center">
                        <div class="icon-box mb-3">
                            <i class="fa-solid ${d.icon}"></i>
                        </div>
                        <h5 class="card-title">${d.name}</h5>
                        <p class="card-text text-secondary small">${d.description || 'Estudar agora'}</p>
                        <button class="btn btn-success w-100 mt-3">Estudar Agora</button>
                    </div>
                </div>`;
            subjectsRow.appendChild(col);
        });
    } catch (e) {
        subjectsRow.innerHTML = '<p class="text-center text-danger">Erro ao carregar disciplinas.</p>';
    }
}

async function startQuiz(disciplineId) {
    screenSubjects.classList.add('d-none');
    screenQuiz.classList.remove('d-none');
    screenQuiz.classList.add('fade-in');
    currentQuestionIndex = 0;
    try {
        const res = await fetch(`${API_URL}/disciplines/${disciplineId}/questions`);
        questions = await res.json();
        if (questions.length > 0) loadQuestion();
        else questionText.innerText = "Nenhuma questão nesta disciplina.";
    } catch (e) {
        questionText.innerText = "Erro ao conectar.";
    }
}

function goHome() {
    screenQuiz.classList.add('d-none');
    screenSubjects.classList.remove('d-none');
    screenSubjects.classList.add('fade-in');
}

function loadQuestion() {
    canAnswer = true;
    const q = questions[currentQuestionIndex];
    questionCounter.innerText = `${currentQuestionIndex + 1} de ${questions.length}`;
    progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
    questionText.innerText = q.text;
    optionsContainer.innerHTML = '';
    feedbackArea.classList.add('d-none');

    const opts = [
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d }
    ];

    opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span class="option-letter">${opt.key}</span><span>${opt.text}</span>`;
        btn.onclick = () => checkAnswer(opt.key, btn);
        optionsContainer.appendChild(btn);
    });
}

async function checkAnswer(selectedKey, btnElement) {
    if (!canAnswer) return;
    canAnswer = false;
    const q = questions[currentQuestionIndex];
    const allButtons = document.querySelectorAll('.option-btn');
    allButtons.forEach(b => b.disabled = true);

    try {
        const res = await fetch(`${API_URL}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: USER_ID, question_id: q.id, selected_option: selectedKey })
        });
        const result = await res.json();

        if (result.is_correct) {
            playSound('correct');
            btnElement.classList.add('correct');
            feedbackMessage.innerText = `Correto! ${result.explanation}`;
            feedbackMessage.className = 'p-3 rounded mb-3';
        } else {
            playSound('error');
            btnElement.classList.add('wrong');
            const idx = ['A', 'B', 'C', 'D'].indexOf(result.correct_option);
            allButtons[idx].classList.add('correct');
            feedbackMessage.innerText = `Incorreto. ${result.explanation}`;
            feedbackMessage.className = 'p-3 rounded mb-3 error';
        }
        feedbackArea.classList.remove('d-none');
    } catch (e) {
        feedbackMessage.innerText = "Erro ao submeter.";
        feedbackArea.classList.remove('d-none');
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) loadQuestion();
    else {
        alert("Fim do Quiz!");
        goHome();
    }
}

loadDisciplines();