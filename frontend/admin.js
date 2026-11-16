const API_URL = "http://localhost:8000";
let token = sessionStorage.getItem("admin_token") || "";
let disciplines = [];
let lessonsCache = [];

const $ = (id) => document.getElementById(id);

function authHeaders() {
    return { "Content-Type": "application/json", "Authorization": `Bearer ${token}` };
}

function showLogin() {
    $("login-screen").classList.remove("d-none");
    $("admin-panel").classList.add("d-none");
}
function showPanel(user) {
    $("login-screen").classList.add("d-none");
    $("admin-panel").classList.remove("d-none");
    $("who").innerText = user;
    loadAll();
}
function logout() {
    sessionStorage.removeItem("admin_token");
    sessionStorage.removeItem("admin_user");
    token = "";
    showLogin();
}

async function login() {
    const username = $("login-user").value.trim();
    $("login-err").innerText = "";
    if (!username) { $("login-err").innerText = "Escreve o nome."; return; }
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        if (!res.ok) { $("login-err").innerText = "Credenciais inválidas."; return; }
        const data = await res.json();
        if (!data.is_admin) { $("login-err").innerText = "Sem permissões de admin."; return; }
        token = data.access_token;
        sessionStorage.setItem("admin_token", token);
        sessionStorage.setItem("admin_user", username);
        showPanel(username);
    } catch (e) { $("login-err").innerText = "Erro de rede."; }
}

$("login-btn").onclick = login;
$("login-user").addEventListener("keydown", e => { if (e.key === "Enter") login(); });
$("logout-btn").onclick = logout;

async function loadAll() {
    await loadDisciplines();
    renderLessonSelects();
    renderQuestSelects();
}

async function loadDisciplines() {
    const res = await fetch(`${API_URL}/disciplines`);
    disciplines = await res.json();
    $("list-disc").innerHTML = disciplines.length === 0 ? '<p class="text-secondary">Nenhuma.</p>' :
        disciplines.map(d => `
            <div class="d-flex justify-content-between align-items-center border-bottom border-secondary py-2">
                <div><i class="fa-solid ${d.icon} me-2 text-success"></i><strong>${d.name}</strong><br>
                <small class="text-secondary">${d.description || ''}</small></div>
                <button class="btn btn-sm btn-outline-danger" onclick="removeDiscipline(${d.id})"><i class="fa-solid fa-trash"></i></button>
            </div>`).join('');
    const opts = disciplines.map(d => `<option value="${d.id}">${d.name}</option>`).join('');
    $("sel-disc-lesson").innerHTML = opts;
    $("filter-disc-lesson").innerHTML = opts;
}

async function renderLessonSelects() {
    const discId = $("filter-disc-lesson").value || (disciplines[0]?.id);
    if (!discId) return;
    const res = await fetch(`${API_URL}/disciplines/${discId}/lessons`);
    lessonsCache = await res.json();
    $("list-lessons").innerHTML = lessonsCache.length === 0 ? '<p class="text-secondary">Nenhuma.</p>' :
        lessonsCache.map(l => `
            <div class="d-flex justify-content-between border-bottom border-secondary py-2">
                <span><strong>#${l.order}</strong> ${l.title}</span>
                <button class="btn btn-sm btn-outline-danger" onclick="removeLesson(${l.id}, ${discId})"><i class="fa-solid fa-trash"></i></button>
            </div>`).join('');
    $("sel-lesson-quest").innerHTML = lessonsCache.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
    $("filter-lesson-quest").innerHTML = lessonsCache.map(l => `<option value="${l.id}">${l.title}</option>`).join('');
    if ($("filter-lesson-quest").value) renderQuests($("filter-lesson-quest").value);
}

async function renderQuests(lessonId) {
    const res = await fetch(`${API_URL}/lessons/${lessonId}/questions`);
    const qs = await res.json();
    $("list-quests").innerHTML = qs.length === 0 ? '<p class="text-secondary">Nenhuma.</p>' :
        qs.map(q => `
            <div class="border-bottom border-secondary py-2">
                <div class="d-flex justify-content-between">
                    <strong>${q.text}</strong>
                    <button class="btn btn-sm btn-outline-danger" onclick="removeQuest(${q.id}, ${lessonId})"><i class="fa-solid fa-trash"></i></button>
                </div>
                <small class="text-secondary">A) ${q.option_a} · B) ${q.option_b} · C) ${q.option_c} · D) ${q.option_d}</small><br>
                <small class="text-success">Correta: ${q.correct_option}</small>
            </div>`).join('');
}

async function removeDiscipline(id) {
    if (!confirm("Remover disciplina (e tudo dentro)?")) return;
    await fetch(`${API_URL}/admin/disciplines/${id}`, { method: "DELETE", headers: authHeaders() });
    loadAll();
}
async function removeLesson(id, discId) {
    if (!confirm("Remover aula?")) return;
    await fetch(`${API_URL}/admin/lessons/${id}`, { method: "DELETE", headers: authHeaders() });
    renderLessonSelects();
}
async function removeQuest(id, lessonId) {
    if (!confirm("Remover questão?")) return;
    await fetch(`${API_URL}/admin/questions/${id}`, { method: "DELETE", headers: authHeaders() });
    renderQuests(lessonId);
}

$("form-disc").addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const res = await fetch(`${API_URL}/admin/disciplines`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(d)
    });
    if (res.ok) { e.target.reset(); loadDisciplines(); }
    else alert("Erro: " + res.status);
});

$("form-lesson").addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.discipline_id = parseInt(d.discipline_id);
    d.order = parseInt(d.order);
    const res = await fetch(`${API_URL}/admin/lessons`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(d)
    });
    if (res.ok) { e.target.reset(); renderLessonSelects(); }
    else alert("Erro: " + res.status);
});

$("form-quest").addEventListener("submit", async e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    d.lesson_id = parseInt(d.lesson_id);
    const res = await fetch(`${API_URL}/admin/questions`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify(d)
    });
    if (res.ok) { e.target.reset(); renderQuests(d.lesson_id); }
    else alert("Erro: " + res.status);
});

$("filter-disc-lesson").addEventListener("change", renderLessonSelects);
$("filter-lesson-quest").addEventListener("change", e => renderQuests(e.target.value));

// Arranque
const saved = sessionStorage.getItem("admin_user");
if (token && saved) showPanel(saved);
else showLogin();