const storeKey = "learnsphere-ai-state";

const sampleState = {
  users: [],
  session: null,
  documents: [
    {
      id: crypto.randomUUID(),
      owner: "demo@learnsphere.ai",
      name: "Machine Learning Notes.txt",
      type: "text/plain",
      topic: "Machine Learning",
      createdAt: new Date().toISOString(),
      text: "Neural networks learn representations through layers of weighted connections. Gradient descent updates weights by moving opposite the loss gradient. Overfitting happens when a model memorizes training data and performs poorly on new data. Regularization, validation splits, and early stopping improve generalization.",
    },
  ],
  chats: [],
  quizResults: [],
  studyEvents: [],
};

let state = loadState();
let view = "dashboard";

function loadState() {
  const saved = localStorage.getItem(storeKey);
  if (!saved) return structuredClone(sampleState);
  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(sampleState);
  }
}

function saveState() {
  localStorage.setItem(storeKey, JSON.stringify(state));
}

function currentUser() {
  return state.users.find((user) => user.email === state.session) || null;
}

function userDocs() {
  const user = currentUser();
  if (!user) return [];
  return state.documents.filter((doc) => doc.owner === user.email || doc.owner === "demo@learnsphere.ai");
}

function userQuizzes() {
  const user = currentUser();
  if (!user) return [];
  return state.quizResults.filter((quiz) => quiz.owner === user.email);
}

function userEvents() {
  const user = currentUser();
  if (!user) return [];
  return state.studyEvents.filter((event) => event.owner === user.email);
}

function render() {
  const app = document.querySelector("#app");
  if (!currentUser()) {
    app.innerHTML = renderAuth();
    bindAuth();
    return;
  }

  app.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand"><span class="brand-mark">LS</span><span>LearnSphere AI</span></div>
        <nav class="nav">
          ${navButton("dashboard", "Dashboard")}
          ${navButton("upload", "Upload")}
          ${navButton("chat", "RAG Chat")}
          ${navButton("summary", "Summaries")}
          ${navButton("quiz", "Quiz")}
          ${navButton("plan", "Study Plan")}
        </nav>
        <div class="profile-box">
          <small>Signed in as</small>
          <strong>${escapeHtml(currentUser().name)}</strong>
          <button class="btn secondary" id="logoutBtn">Log out</button>
        </div>
      </aside>
      <section class="main">
        <div class="topbar">
          <div class="title">
            <h1>${viewTitle()}</h1>
            <p>${viewSubtitle()}</p>
          </div>
          <button class="btn secondary" id="resetDemo">Reset demo data</button>
        </div>
        ${renderView()}
      </section>
    </div>
  `;

  bindShell();
  bindView();
}

function renderAuth() {
  return `
    <div class="auth-wrap">
      <section class="auth-hero">
        <div class="brand"><span class="brand-mark">LS</span><span>LearnSphere AI</span></div>
        <h1>LearnSphere AI</h1>
        <p>Upload study material, ask grounded questions, generate notes and quizzes, and turn weak topics into a focused plan.</p>
      </section>
      <section class="auth-panel">
        <form class="auth-card form" id="authForm">
          <div>
            <h2 id="authTitle">Create account</h2>
            <p class="muted">Local MVP authentication for the prototype.</p>
          </div>
          <label>Name<input id="name" autocomplete="name" required /></label>
          <label>Email<input id="email" type="email" autocomplete="email" required /></label>
          <label>Password<input id="password" type="password" autocomplete="current-password" required minlength="4" /></label>
          <button class="btn" type="submit">Continue</button>
          <button class="btn secondary" type="button" id="toggleAuth">I already have an account</button>
          <button class="btn warning" type="button" id="demoLogin">Try demo account</button>
          <p class="muted" id="authMsg"></p>
        </form>
      </section>
    </div>
  `;
}

function navButton(id, label) {
  return `<button class="${view === id ? "active" : ""}" data-view="${id}">${label}</button>`;
}

function viewTitle() {
  return {
    dashboard: "Learning Dashboard",
    upload: "Document Library",
    chat: "Citation RAG Chat",
    summary: "AI Summarization",
    quiz: "Quiz Generator",
    plan: "AI Study Plan",
  }[view];
}

function viewSubtitle() {
  return {
    dashboard: "Track documents, quizzes, streaks, progress, and recommendations.",
    upload: "Upload notes, books, PPT exports, and text-based materials.",
    chat: "Ask questions from uploaded documents with cited source snippets.",
    summary: "Create chapter summaries, key points, and exam notes.",
    quiz: "Generate MCQs, true/false questions, and short answers.",
    plan: "Build a practical revision plan from your weak topics.",
  }[view];
}

function renderView() {
  return {
    dashboard: renderDashboard,
    upload: renderUpload,
    chat: renderChat,
    summary: renderSummary,
    quiz: renderQuiz,
    plan: renderPlan,
  }[view]();
}

function renderDashboard() {
  const docs = userDocs();
  const quizzes = userQuizzes();
  const avg = quizzes.length ? Math.round(quizzes.reduce((sum, q) => sum + q.score, 0) / quizzes.length) : 0;
  const streak = studyStreak();
  const progress = Math.min(100, docs.length * 12 + quizzes.length * 10 + streak * 6);
  const weak = weakTopics();

  return `
    <div class="grid metrics">
      ${metric("Documents", docs.length)}
      ${metric("Quizzes", quizzes.length)}
      ${metric("Study streak", `${streak} days`)}
      ${metric("Avg. score", `${avg}%`)}
    </div>
    <div class="grid two" style="margin-top:16px">
      <section class="panel grid">
        <div class="row space"><strong>Progress metrics</strong><span class="tag">${progress}% ready</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${progress}%"></div></div>
        <p class="muted">Progress combines uploaded material, quiz attempts, and daily study activity.</p>
        <strong>Recent documents</strong>
        <div class="doc-list">${docs.slice(0, 4).map(renderDocCard).join("") || empty("No documents yet.")}</div>
      </section>
      <section class="panel grid">
        <strong>Personalized recommendations</strong>
        ${recommendations(avg, weak).map((item) => `<div class="insight">${item}</div>`).join("")}
        <strong>Weak topic detection</strong>
        ${weak.length ? weak.map((topic) => `<span class="tag">${escapeHtml(topic)}</span>`).join(" ") : `<p class="muted">No weak topics detected yet. Take a quiz to unlock this.</p>`}
      </section>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${label}</span><strong>${value}</strong></div>`;
}

function renderUpload() {
  return `
    <div class="grid two">
      <section class="panel grid">
        <strong>Upload learning material</strong>
        <div class="upload-zone">
          <input id="fileInput" type="file" multiple accept=".txt,.md,.csv,.pdf,.ppt,.pptx,.doc,.docx" />
          <label>Topic or chapter name<input id="topicInput" placeholder="Machine Learning, DBMS, Thermodynamics" /></label>
          <button class="btn" id="uploadBtn">Store document</button>
          <p class="muted">This MVP stores files in browser storage. In production, connect this action to Supabase Storage and save extracted text in your vector database.</p>
        </div>
      </section>
      <section class="panel grid">
        <strong>Uploaded documents</strong>
        <div class="doc-list">${userDocs().map(renderDocCard).join("") || empty("Upload your first document.")}</div>
      </section>
    </div>
  `;
}

function renderDocCard(doc) {
  const words = doc.text.trim().split(/\s+/).filter(Boolean).length;
  return `
    <article class="doc-card">
      <div class="row space"><h3>${escapeHtml(doc.name)}</h3><span class="tag">${escapeHtml(doc.topic || "General")}</span></div>
      <p class="muted">${words} words · ${new Date(doc.createdAt).toLocaleDateString()}</p>
    </article>
  `;
}

function renderChat() {
  const chat = state.chats.filter((item) => item.owner === currentUser().email);
  return `
    <div class="grid two">
      <section class="panel grid">
        <strong>Ask your documents</strong>
        <textarea id="questionInput" placeholder="Example: Explain gradient descent with exam-focused points."></textarea>
        <button class="btn" id="askBtn">Ask question</button>
        <p class="muted">Answers are generated from local indexed text and include the closest matching document citation.</p>
      </section>
      <section class="panel grid">
        <strong>Chat history</strong>
        <div class="chat-log">${chat.map(renderMessage).join("") || empty("Ask a question to begin.")}</div>
      </section>
    </div>
  `;
}

function renderMessage(item) {
  return `
    <div class="message">Q: ${escapeHtml(item.question)}</div>
    <div class="message ai">A: ${escapeHtml(item.answer)}<span class="citation">${escapeHtml(item.citation)}</span></div>
  `;
}

function renderSummary() {
  return `
    <div class="grid two">
      <section class="panel grid">
        <strong>Create study notes</strong>
        <label>Document<select id="summaryDoc">${docOptions()}</select></label>
        <label>Format<select id="summaryType"><option>Chapter summary</option><option>Key points</option><option>Exam notes</option></select></label>
        <button class="btn" id="summaryBtn">Generate summary</button>
      </section>
      <section class="panel grid">
        <strong>Output</strong>
        <div id="summaryOutput" class="message ai">Choose a document and generate notes.</div>
      </section>
    </div>
  `;
}

function renderQuiz() {
  return `
    <div class="grid two">
      <section class="panel grid">
        <strong>Generate quiz</strong>
        <label>Document<select id="quizDoc">${docOptions()}</select></label>
        <label>Question type<select id="quizType"><option>MCQs</option><option>True/False</option><option>Short answers</option></select></label>
        <button class="btn" id="quizBtn">Generate quiz</button>
      </section>
      <section class="panel grid">
        <div class="row space"><strong>Quiz workspace</strong><button class="btn secondary" id="scoreBtn">Score quiz</button></div>
        <div id="quizOutput" class="quiz-list">${empty("Generate a quiz from a document.")}</div>
      </section>
    </div>
  `;
}

function renderPlan() {
  const weak = weakTopics();
  return `
    <div class="grid two">
      <section class="panel grid">
        <strong>Generate exam preparation plan</strong>
        <label>Exam goal<input id="examGoal" value="Prepare for my next exam" /></label>
        <label>Duration<select id="planDays"><option>7</option><option>14</option><option>21</option></select></label>
        <button class="btn" id="planBtn">Generate plan</button>
        <div class="insight">Focus topics: ${weak.length ? weak.map(escapeHtml).join(", ") : "balanced revision across uploaded documents"}</div>
      </section>
      <section class="panel grid">
        <strong>Plan</strong>
        <div id="planOutput" class="doc-list">${empty("Generate a plan when you are ready.")}</div>
      </section>
    </div>
  `;
}

function docOptions() {
  return userDocs().map((doc) => `<option value="${doc.id}">${escapeHtml(doc.name)}</option>`).join("");
}

function bindAuth() {
  let loginMode = false;
  const name = document.querySelector("#name");
  const title = document.querySelector("#authTitle");
  const toggle = document.querySelector("#toggleAuth");
  const message = document.querySelector("#authMsg");

  toggle.addEventListener("click", () => {
    loginMode = !loginMode;
    name.closest("label").classList.toggle("hidden", loginMode);
    title.textContent = loginMode ? "Welcome back" : "Create account";
    toggle.textContent = loginMode ? "Create a new account" : "I already have an account";
    message.textContent = "";
  });

  document.querySelector("#demoLogin").addEventListener("click", () => {
    if (!state.users.some((user) => user.email === "demo@learnsphere.ai")) {
      state.users.push({ name: "Demo Learner", email: "demo@learnsphere.ai", password: "demo" });
    }
    state.session = "demo@learnsphere.ai";
    saveState();
    render();
  });

  document.querySelector("#authForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const email = document.querySelector("#email").value.trim().toLowerCase();
    const password = document.querySelector("#password").value;
    const existing = state.users.find((user) => user.email === email);

    if (loginMode) {
      if (!existing || existing.password !== password) {
        message.textContent = "Invalid email or password.";
        return;
      }
      state.session = email;
    } else {
      if (existing) {
        message.textContent = "Account already exists. Switch to login.";
        return;
      }
      state.users.push({ name: name.value.trim() || "Learner", email, password });
      state.session = email;
    }

    saveState();
    render();
  });
}

function bindShell() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      view = button.dataset.view;
      render();
    });
  });
  document.querySelector("#logoutBtn")?.addEventListener("click", () => {
    state.session = null;
    saveState();
    render();
  });
  document.querySelector("#resetDemo").addEventListener("click", () => {
    const session = state.session;
    state = structuredClone(sampleState);
    state.session = session;
    if (session && !state.users.some((user) => user.email === session)) {
      state.users.push(currentUser() || { name: "Learner", email: session, password: "demo" });
    }
    saveState();
    render();
  });
}

function bindView() {
  document.querySelector("#uploadBtn")?.addEventListener("click", uploadFiles);
  document.querySelector("#askBtn")?.addEventListener("click", askQuestion);
  document.querySelector("#summaryBtn")?.addEventListener("click", generateSummary);
  document.querySelector("#quizBtn")?.addEventListener("click", generateQuiz);
  document.querySelector("#scoreBtn")?.addEventListener("click", scoreQuiz);
  document.querySelector("#planBtn")?.addEventListener("click", generatePlan);
}

async function uploadFiles() {
  const files = [...document.querySelector("#fileInput").files];
  const topic = document.querySelector("#topicInput").value.trim() || "General";
  if (!files.length) return;

  for (const file of files) {
    let text = "";
    if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
      text = await file.text();
    } else {
      text = `${file.name} uploaded. Text extraction for ${file.type || "binary files"} should run on the backend before embedding. Add the extracted text here for local RAG.`;
    }
    state.documents.push({
      id: crypto.randomUUID(),
      owner: currentUser().email,
      name: file.name,
      type: file.type || "application/octet-stream",
      topic,
      createdAt: new Date().toISOString(),
      text,
    });
  }
  addStudyEvent("upload", topic);
  saveState();
  render();
}

function askQuestion() {
  const question = document.querySelector("#questionInput").value.trim();
  if (!question) return;
  const match = bestMatch(question);
  const answer = match
    ? buildAnswer(question, match.doc, match.snippet)
    : "I could not find enough matching content yet. Upload text-rich notes or paste extracted document text.";
  state.chats.push({
    owner: currentUser().email,
    question,
    answer,
    citation: match ? `Source: ${match.doc.name} · ${match.snippet.slice(0, 120)}...` : "No citation available",
    createdAt: new Date().toISOString(),
  });
  addStudyEvent("question", match?.doc.topic || "General");
  saveState();
  render();
}

function bestMatch(query) {
  const terms = keywords(query);
  let top = null;
  for (const doc of userDocs()) {
    const sentences = doc.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    for (const sentence of sentences) {
      const score = terms.filter((term) => sentence.toLowerCase().includes(term)).length;
      if (score > 0 && (!top || score > top.score)) top = { doc, snippet: sentence, score };
    }
  }
  return top;
}

function buildAnswer(question, doc, snippet) {
  const focus = keywords(question).slice(0, 3).join(", ") || doc.topic;
  return `Based on ${doc.name}, the important idea around ${focus} is: ${snippet} For exam revision, define the concept, explain why it matters, and add one short example from the chapter.`;
}

function generateSummary() {
  const doc = selectedDoc("summaryDoc");
  if (!doc) return;
  const type = document.querySelector("#summaryType").value;
  const sentences = doc.text.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, 6);
  let output = "";
  if (type === "Key points") {
    output = sentences.map((line) => `• ${escapeHtml(line)}`).join("<br>");
  } else if (type === "Exam notes") {
    output = sentences.map((line, index) => `${index + 1}. ${escapeHtml(line)}<br><strong>Exam cue:</strong> connect this to ${escapeHtml(doc.topic)}.`).join("<br><br>");
  } else {
    output = escapeHtml(sentences.join(" "));
  }
  document.querySelector("#summaryOutput").innerHTML = output || "This document needs extractable text for summaries.";
  addStudyEvent("summary", doc.topic);
  saveState();
}

function generateQuiz() {
  const doc = selectedDoc("quizDoc");
  if (!doc) return;
  const type = document.querySelector("#quizType").value;
  const sentences = doc.text.split(/(?<=[.!?])\s+/).filter((sentence) => sentence.split(" ").length > 5).slice(0, 5);
  const questions = sentences.map((sentence, index) => makeQuestion(sentence, type, index));
  document.querySelector("#quizOutput").innerHTML = questions.map((q, index) => renderQuizQuestion(q, index)).join("");
  window.activeQuiz = { doc, type, questions };
}

function makeQuestion(sentence, type, index) {
  const words = keywords(sentence);
  const answer = words[0] || "concept";
  if (type === "True/False") {
    return { prompt: `True or False: ${sentence}`, answer: "True", topic: answer };
  }
  if (type === "Short answers") {
    return { prompt: `Explain: ${sentence.split(" ").slice(0, 8).join(" ")}...`, answer, topic: answer };
  }
  return {
    prompt: `Which term best connects to this idea: "${sentence.slice(0, 110)}..."?`,
    answer,
    topic: answer,
    choices: [answer, "database", "photosynthesis", "compiler"].sort(),
  };
}

function renderQuizQuestion(q, index) {
  const input = q.choices
    ? `<select data-answer="${escapeHtml(q.answer)}" data-topic="${escapeHtml(q.topic)}">${q.choices.map((choice) => `<option>${escapeHtml(choice)}</option>`).join("")}</select>`
    : `<input data-answer="${escapeHtml(q.answer)}" data-topic="${escapeHtml(q.topic)}" placeholder="Your answer" />`;
  return `<div class="quiz-item"><p><strong>Q${index + 1}.</strong> ${escapeHtml(q.prompt)}</p><label>Your answer${input}</label></div>`;
}

function scoreQuiz() {
  const controls = [...document.querySelectorAll("#quizOutput [data-answer]")];
  if (!controls.length || !window.activeQuiz) return;
  let correct = 0;
  const mistakes = [];
  controls.forEach((control) => {
    const expected = control.dataset.answer.toLowerCase();
    const actual = control.value.trim().toLowerCase();
    const ok = actual.includes(expected) || expected.includes(actual);
    if (ok) correct += 1;
    else mistakes.push(control.dataset.topic);
  });
  const score = Math.round((correct / controls.length) * 100);
  state.quizResults.push({
    owner: currentUser().email,
    docId: window.activeQuiz.doc.id,
    topic: window.activeQuiz.doc.topic,
    score,
    mistakes,
    createdAt: new Date().toISOString(),
  });
  addStudyEvent("quiz", window.activeQuiz.doc.topic);
  saveState();
  document.querySelector("#quizOutput").insertAdjacentHTML("afterbegin", `<div class="insight">Score: ${score}%. ${mistakes.length ? `Revise ${mistakes.join(", ")}.` : "Excellent work."}</div>`);
}

function generatePlan() {
  const days = Number(document.querySelector("#planDays").value);
  const goal = document.querySelector("#examGoal").value.trim();
  const weak = weakTopics();
  const topics = weak.length ? weak : [...new Set(userDocs().map((doc) => doc.topic))];
  const items = Array.from({ length: days }, (_, index) => {
    const topic = topics[index % Math.max(topics.length, 1)] || "core concepts";
    return `<article class="doc-card"><h3>Day ${index + 1}</h3><p>${escapeHtml(goal)}: revise ${escapeHtml(topic)}, write a one-page summary, then complete 10 practice questions.</p></article>`;
  });
  document.querySelector("#planOutput").innerHTML = items.join("");
}

function selectedDoc(id) {
  return userDocs().find((doc) => doc.id === document.querySelector(`#${id}`).value);
}

function addStudyEvent(type, topic) {
  state.studyEvents.push({ owner: currentUser().email, type, topic, createdAt: new Date().toISOString() });
}

function studyStreak() {
  const days = new Set(userEvents().map((event) => new Date(event.createdAt).toDateString()));
  let streak = 0;
  const cursor = new Date();
  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function weakTopics() {
  const mistakes = userQuizzes().flatMap((quiz) => quiz.score < 60 ? [quiz.topic, ...quiz.mistakes] : quiz.mistakes);
  const counts = mistakes.reduce((map, topic) => map.set(topic, (map.get(topic) || 0) + 1), new Map());
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([topic]) => topic);
}

function recommendations(avg, weak) {
  const items = [];
  if (avg && avg < 60 && weak.length) items.push(`You scored ${avg}% on recent quizzes. Revise ${escapeHtml(weak.slice(0, 2).join(" and "))} before attempting another quiz.`);
  if (!userDocs().length) items.push("Upload at least one chapter or note set to unlock grounded chat and quiz generation.");
  if (userDocs().length && !userQuizzes().length) items.push("Generate one quiz from your newest document to establish a baseline score.");
  if (studyStreak() < 2) items.push("Study today to start a streak. Summarize one document and answer three questions from it.");
  if (!items.length) items.push("You are on track. Keep alternating summaries, chat questions, and quizzes for stronger retention.");
  return items;
}

function keywords(text) {
  const stop = new Set(["the", "and", "for", "with", "from", "this", "that", "what", "when", "where", "which", "into", "your", "are", "how"]);
  return text.toLowerCase().match(/[a-z0-9]+/g)?.filter((word) => word.length > 3 && !stop.has(word)) || [];
}

function empty(text) {
  return `<p class="muted">${text}</p>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

render();
