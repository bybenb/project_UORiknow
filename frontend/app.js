const API_URL = "http://localhost:8000";
const USER_ID = 1;

const view = document.getElementById('view');
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.connect(g); g.connect(audioCtx.destination);
    if (type === 'correct') { o.type='sine'; o.frequency.setValueAtTime(800, audioCtx.currentTime); o.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime+0.1); }
    else { o.type='sawtooth'; o.frequency.setValueAtTime(150, audioCtx.currentTime); }
    g.gain.setValueAtTime(0.1, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime+0.35);
    o.start(); o.stop(audioCtx.currentTime+0.35);
}

function navigate(path) {
    history.pushState({}, "", path);
    router();
}

window.addEventListener("popstate", router);

const routes = [
    { pattern: /^\/$/, view: renderHome },
    { pattern: /^\/disciplina\/(\d+)$/, view: renderLessons },
    { pattern: /^\/licao\/(\d+)$/, view: renderQuiz },
];

async function router() {
    const path = location.pathname;
    for (const r of routes) {
        const match = path.match(r.pattern);
        if (match) {
            const params = match.slice(1);
            view.innerHTML = '<div class="text-center text-secondary mt-5">Carregando...</div>';
            await r.view(...params);
            return;
        }
    }
    view.innerHTML = '<div class="text-center mt-5"><h3>404</h3><a href="/" onclick="navigate(\'/\');return false;">Voltar</a></div>';
}

async function renderHome() {
    const res = await fetch(`${API_URL}/disciplines`);
    const data = await res.json();
    view.innerHTML = `
        <div class="container" style="max-width:1000px;">
            <div class="text-center mb-5">
                <h1 class="logo-text">UORiknow <span class="text-success">.</span></h1>
                <p class="text-secondary">Escolhe a disciplina para começar</p>
            </div>
            <div class="row g-4 justify-content-center">
                ${data.map(d => `
                    <div class="col-12 col-md-6 col-lg-4">
                        <div class="card subject-card p-3 text-center" onclick="navigate('/disciplina/${d.id}')">
                            <div class="card-body">
                                <div class="icon-box mb-3"><i class="fa-solid ${d.icon}"></i></div>
                                <h5>${d.name}</h5>
                                <p class="text-secondary small">${d.description || 'Estudar agora'}</p>
                                <button class="btn btn-success w-100 mt-3">Ver Trilha</button>
                            </div>
                        </div>
                    </div>`).join('')}
            </div>
            <div class="text-center mt-5">
                <a href="/admin.html" class="text-secondary small text-decoration-none"><i class="fa-solid fa-lock me-1"></i> Admin</a>
            </div>
        </div>`;
    view.classList.add('fade-in');
}

async function renderLessons(disciplineId) {
    const res = await fetch(`${API_URL}/disciplines/${disciplineId}/lessons`);
    const lessons = await res.json();
    const done = JSON.parse(localStorage.getItem(`done_${disciplineId}`) || "[]");

    view.innerHTML = `
        <div class="container">
            <div class="d-flex justify-content-between align-items-center mb-4">
                <button class="btn btn-link text-white text-decoration-none" onclick="navigate('/')">
                    <i class="fa-solid fa-chevron-left"></i> Voltar
                </button>
                <h4 class="m-0">Trilha de Aulas</h4>
                <span style="width:60px;"></span>
            </div>
            <div class="lesson-path">
                <div class="path-line"></div>
                ${lessons.map((l, i) => {
                    const offsets = ['offset-left', 'offset-right', 'offset-center'];
                    const off = offsets[i % 3];
                    const isDone = done.includes(l.id);
                    return `
                        <div class="lesson-node ${off} ${isDone ? 'done' : ''}" onclick="navigate('/licao/${l.id}')">
                            <i class="fa-solid ${isDone ? 'fa-check' : 'fa-star'}"></i>
                            <span class="lesson-label">${l.title}</span>
                        </div>`;
                }).join('')}
                ${lessons.length === 0 ? '<p class="text-center text-secondary mt-4">Sem aulas nesta disciplina.</p>' : ''}
            </div>
        </div>`;
    view.classList.add('fade-in');
}

let quizState = null;

async function renderQuiz(lessonId) {
    const res = await fetch(`${API_URL}/lessons/${lessonId}/questions`);
    const questions = await res.json();
    if (questions.length === 0) {
        view.innerHTML = '<div class="text-center mt-5 text-secondary">Sem questões nesta aula.</div>';
        return;
    }
    quizState = { questions, index: 0, lessonId, canAnswer: true };

    view.innerHTML = `
        <div class="quiz-container fade-in">
            <div class="d-flex justify-content-between align-items-center mb-4 text-secondary">
                <button class="btn btn-link text-white text-decoration-none" onclick="navigate('/disciplina/${history.state?.disc || ''}'); history.length > 1 ? history.back() : navigate('/')">
                    <i class="fa-solid fa-chevron-left"></i> Voltar
                </button>
                <span id="counter"></span>
                <i class="fa-regular fa-lightbulb"></i>
            </div>
            <div class="progress mb-4" style="height: 6px;">
                <div id="bar" class="progress-bar bg-success" style="width:0%"></div>
            </div>
            <h3 id="qtxt" class="mb-4"></h3>
            <div id="opts" class="d-grid gap-3"></div>
            <div id="fb" class="mt-4 d-none">
                <div id="fbmsg" class="p-3 rounded mb-3"></div>
                <button class="btn btn-outline-light w-100 py-3 rounded-pill" onclick="nextQ()">Seguinte <i class="fa-solid fa-arrow-right"></i></button>
            </div>
        </div>`;
    loadQ();
}

function loadQ() {
    const { questions, index } = quizState;
    const q = questions[index];
    quizState.canAnswer = true;
    document.getElementById('counter').innerText = `${index + 1} de ${questions.length}`;
    document.getElementById('bar').style.width = `${((index + 1) / questions.length) * 100}%`;
    document.getElementById('qtxt').innerText = q.text;
    const fb = document.getElementById('fb'); fb.classList.add('d-none');
    const opts = document.getElementById('opts'); opts.innerHTML = '';
    [['A', q.option_a], ['B', q.option_b], ['C', q.option_c], ['D', q.option_d]].forEach(([k, t]) => {
        const b = document.createElement('button');
        b.className = 'option-btn';
        b.innerHTML = `<span class="option-letter">${k}</span><span>${t}</span>`;
        b.onclick = () => answerQ(k, b);
        opts.appendChild(b);
    });
}

async function answerQ(key, btn) {
    if (!quizState.canAnswer) return;
    quizState.canAnswer = false;
    document.querySelectorAll('.option-btn').forEach(b => b.disabled = true);
    const q = quizState.questions[quizState.index];
    const res = await fetch(`${API_URL}/answer`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: USER_ID, question_id: q.id, selected_option: key })
    });
    const r = await res.json();
    const fb = document.getElementById('fb');
    const fbmsg = document.getElementById('fbmsg');
    if (r.is_correct) {
        playSound('correct'); btn.classList.add('correct');
        fbmsg.innerText = `Correto! ${r.explanation}`;
        fbmsg.className = 'p-3 rounded mb-3';
    } else {
        playSound('error'); btn.classList.add('wrong');
        const idx = ['A','B','C','D'].indexOf(r.correct_option);
        document.querySelectorAll('.option-btn')[idx].classList.add('correct');
        fbmsg.innerText = `Incorreto. ${r.explanation}`;
        fbmsg.className = 'p-3 rounded mb-3 error';
    }
    fb.classList.remove('d-none');
}

function nextQ() {
    quizState.index++;
    if (quizState.index < quizState.questions.length) loadQ();
    else {
        const id = quizState.lessonId;
        const discId = document.referrer.split('/').pop();
        const done = JSON.parse(localStorage.getItem(`done_${discId}`) || "[]");
        if (!done.includes(id)) { done.push(id); localStorage.setItem(`done_${discId}`, JSON.stringify(done)); }
        alert("Aula concluída!");
        history.back();
    }
}

router();