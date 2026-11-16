const API_URL = "http://localhost:8000";
const USER_ID = 1;
let questions = [];
let currentQuestionIndex = 0;
let canAnswer = true;

const screenSubjects = document.getElementById('screen-subjects');
const screenQuiz = document.getElementById('screen-quiz');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const feedbackArea = document.getElementById('feedback-area');
const feedbackMessage = document.getElementById('feedback-message');
const progressBar = document.getElementById('progress-bar');
const questionCounter = document.getElementById('question-counter');

const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    if (type === 'correct') {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.3);
    } else {
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
    }
}

async function startQuiz(discipline) {
    screenSubjects.classList.add('d-none');
    screenQuiz.classList.remove('d-none');
    screenQuiz.classList.add('fade-in');
    currentQuestionIndex = 0;
    
    try {
        const response = await fetch(`${API_URL}/questions/${discipline}`);
        questions = await response.json();
        if(questions.length > 0) {
            loadQuestion();
        } else {
            questionText.innerText = "Nenhuma questão encontrada.";
        }
    } catch (error) {
        questionText.innerText = "Erro ao conectar com o servidor.";
    }
}

function goHome() {
    screenQuiz.classList.add('d-none');
    screenSubjects.classList.remove('d-none');
}

function loadQuestion() {
    canAnswer = true;
    const q = questions[currentQuestionIndex];
    
    questionCounter.innerText = `${currentQuestionIndex + 1} de ${questions.length}`;
    progressBar.style.width = `${((currentQuestionIndex + 1) / questions.length) * 100}%`;
    questionText.innerText = q.text;
    optionsContainer.innerHTML = '';
    feedbackArea.classList.add('d-none');

    const options = [
        { key: 'A', text: q.option_a },
        { key: 'B', text: q.option_b },
        { key: 'C', text: q.option_c },
        { key: 'D', text: q.option_d }
    ];

    options.forEach((opt, index) => {
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
    allButtons.forEach(btn => btn.disabled = true);

    try {
        const response = await fetch(`${API_URL}/answer`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: USER_ID,
                question_id: q.id,
                selected_option: selectedKey
            })
        });

        const result = await response.json();

        if (result.is_correct) {
            playSound('correct');
            btnElement.classList.add('correct');
            feedbackMessage.innerText = `Correto! ${result.explanation}`;
            feedbackMessage.className = 'p-3 rounded mb-3';
        } else {
            playSound('error');
            btnElement.classList.add('wrong');
            const correctBtnIndex = ['A', 'B', 'C', 'D'].indexOf(result.correct_option);
            allButtons[correctBtnIndex].classList.add('correct');
            feedbackMessage.innerText = `Incorreto. ${result.explanation}`;
            feedbackMessage.className = 'p-3 rounded mb-3 error';
        }
        feedbackArea.classList.remove('d-none');
    } catch (error) {
        feedbackMessage.innerText = "Erro ao submeter resposta.";
        feedbackArea.classList.remove('d-none');
    }
}

function nextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < questions.length) {
        loadQuestion();
    } else {
        alert("Fim do Quiz!");
        goHome();
    }
}