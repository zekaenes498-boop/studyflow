import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./App.css";
import StudyCalendar from "./StudyCalendar";
import StudyProgress from "./StudyProgress";
import ResetPassword from "./ResetPassword";
import StudyDashboard from "./StudyDashboard";
import AIExamCoach from "./AIExamCoach";

function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });

        if (error) throw error;

        setMessage(
          !data.session
            ? "Llogaria u krijua. Kontrollo email-in për konfirmim."
            : "Llogaria u krijua me sukses."
        );
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
      }
    } catch (err) {
      setError(err.message || "Ndodhi një gabim.");
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!email.trim()) {
      setError("Shkruaje email-in fillimisht.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/reset-password`,
        }
      );

      if (error) throw error;

      setMessage(
        "Nëse email-i është i regjistruar, do të marrësh linkun për rikthimin e fjalëkalimit."
      );
    } catch (err) {
      setError(err.message || "Dërgimi i email-it dështoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">S</div>

        <p className="eyebrow">STUDENT WORKSPACE</p>

        <h1>
          {mode === "login"
            ? "Mirë se u ktheve."
            : "Krijo llogarinë."}
        </h1>

        <p className="muted">
          {mode === "login"
            ? "Kyçu për të vazhduar me planin tënd."
            : "Organizo mësimin tënd me StudyFlow."}
        </p>

        <label className="auth-label">
          Email
          <input
            type="email"
            autoComplete="email"
            placeholder="emri@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="auth-label">
          Fjalëkalimi
          <input
            type="password"
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder="Të paktën 6 karaktere"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {mode === "login" && (
          <div className="forgot-password-row">
            <button
              className="forgot-password-button"
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              Forgot password?
            </button>
          </div>
        )}

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button
          className="primary-button auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading
            ? "Prit..."
            : mode === "login"
              ? "Kyçu"
              : "Krijo llogari"}
        </button>

        <p className="auth-switch">
          {mode === "login" ? "Nuk ke llogari?" : "E ke një llogari?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError("");
              setMessage("");
            }}
          >
            {mode === "login" ? "Regjistrohu" : "Kyçu"}
          </button>
        </p>
      </form>
    </div>
  );
}


export default function App() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState("");
  const [activePage, setActivePage] = useState("dashboard");
const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        setError(error.message);
      }

      setSession(data?.session ?? null);
      setAuthLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
  setSession(nextSession);
  setAuthLoading(false);

  if (event === "PASSWORD_RECOVERY") {
    window.history.replaceState({}, "", "/reset-password");
  }
});

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session?.user?.id) {
      setTasks([]);
      return;
    }

    let active = true;

    async function loadTasks() {
      setTasksLoading(true);
      setError("");

      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });

      if (!active) return;

      if (error) {
        setError(error.message);
      } else {
        setTasks(
          (data || []).map((task) => ({
            ...task,
            dueDate: task.due_date,
          }))
        );
      }

      setTasksLoading(false);
    }

    loadTasks();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  
async function addTask(title, subject, dueDate, priority) {
  if (!session?.user?.id) return false;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: session.user.id,
      title,
      subject,
      due_date: dueDate || null,
      priority,
      completed: false,
    })
    .select()
    .single();

  if (error) {
    setError(error.message);
    return false;
  }

  setTasks((previous) => [
    { ...data, dueDate: data.due_date },
    ...previous,
  ]);

  return true;
}


  async function toggleTask(id, completed) {
    const { error } = await supabase
      .from("tasks")
      .update({ completed: !completed })
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setTasks((previous) =>
      previous.map((task) =>
        task.id === id
          ? { ...task, completed: !completed }
          : task
      )
    );
  }

  async function deleteTask(id) {
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", id);

    if (error) {
      setError(error.message);
      return;
    }

    setTasks((previous) =>
      previous.filter((task) => task.id !== id)
    );
  }

  
async function updateTask(id, updates) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      title: updates.title,
      subject: updates.subject,
      due_date: updates.dueDate || null,
      priority: updates.priority,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    setError(error.message);
    return false;
  }

  setTasks((previous) =>
    previous.map((task) =>
      task.id === id
        ? { ...data, dueDate: data.due_date }
        : task
    )
  );

  return true;
}

  async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) setError(error.message);
  }
const completedTasks = tasks.filter(
  (task) => task.completed
).length;

const pendingTasks = tasks.length - completedTasks;

const progress = tasks.length
  ? Math.round((completedTasks / tasks.length) * 100)
  : 0;
  const [filter, setFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");


const filteredTasks = tasks.filter((task) => {
  const matchesStatus =
    filter === "all" ||
    (filter === "completed" && task.completed) ||
    (filter === "pending" && !task.completed);

  const matchesSubject =
    subjectFilter === "all" ||
    task.subject === subjectFilter;

  const search = searchTerm.trim().toLowerCase();

  const matchesSearch =
    (task.title || "").toLowerCase().includes(search) ||
    (task.subject || "").toLowerCase().includes(search);

  return matchesStatus && matchesSubject && matchesSearch;
});

 
if (window.location.pathname === "/reset-password") {
  return <ResetPassword />;
}

if (authLoading) {
  return <div className="auth-page">Duke ngarkuar StudyFlow...</div>;
}

if (!session) {
  return <AuthScreen />;
}

  return (
    <div className="app dark">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon">S</span>
          <span>
            <strong>StudyFlow</strong>
            <small>STUDENT WORKSPACE</small>
          </span>
        </div>
        

<p className="nav-label">MENUJA</p>

<button
  className={`nav-button ${activePage === "dashboard" ? "active" : ""}`}
  onClick={() => setActivePage("dashboard")}
>
  🏠 Dashboard
</button>

<button
  className={`nav-button ${activePage === "tasks" ? "active" : ""}`}
  onClick={() => setActivePage("tasks")}
>
  📝 Detyrat
</button>

<button
  className={`nav-button ${activePage === "focus" ? "active" : ""}`}
  onClick={() => setActivePage("focus")}
>
  ⏱️ Fokus
</button>

<button
  className={`nav-button ${activePage === "calendar" ? "active" : ""}`}
  onClick={() => setActivePage("calendar")}
>
  📅 Kalendari
</button>

<button
  className={`nav-button ${activePage === "progress" ? "active" : ""}`}
  onClick={() => setActivePage("progress")}
>
  📊 Progresi
</button>

<button
  className={`nav-button ${activePage === "ai-coach" ? "active" : ""}`}
  onClick={() => setActivePage("ai-coach")}
>
  ✨ AI Exam Coach
</button>
     <p className="nav-label">LLOGARIA</p>

        <div className="mini-profile">
          <div className="avatar">
            {(session.user.email || "S")[0].toUpperCase()}
          </div>
          <div>
            <strong>Studenti</strong>
            <small>{session.user.email}</small>
          </div>
        </div>

        <button className="secondary-button" onClick={logout}>
          Dil nga llogaria
        </button>
      </aside>


      <main className="main-content">
        <header className="topbar">
          <strong>StudyFlow / Detyrat e mia</strong>
          <span className="today-label">
            {session.user.email}
          </span>
        </header>

        <section className="page-section">
          {activePage === "ai-coach" && (
            <AIExamCoach onAddTask={addTask} />
          )}

          {activePage === "dashboard" && (
            <StudyDashboard tasks={tasks} />
          )}

  {activePage === "tasks" && (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">ORGANIZIMI</p>
          <h1>Detyrat e mia</h1>
          <p className="muted">
            Menaxho dhe filtro detyrat e tua.
          </p>
        </div>
      </div>

      {error && <p className="auth-error">{error}</p>}

      {tasksLoading ? (
        <p className="muted">Duke ngarkuar detyrat...</p>
      ) : (
        <div className="panel">
          <div className="task-filters">
            
            <select
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
            >
              <option value="all">Të gjitha detyrat</option>
              <option value="pending">Në pritje</option>
              <option value="completed">Të përfunduara</option>
            </select>

            <select
              value={subjectFilter}
              onChange={(event) => setSubjectFilter(event.target.value)}
            >
              <option value="all">Të gjitha lëndët</option>
              {[...new Set(tasks.map((task) => task.subject).filter(Boolean))].map(
                (subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                )
              )}
            </select>
          </div>

          {filteredTasks.length === 0 ? (
            <p className="muted">
              Nuk ka detyra që përputhen me filtrat.
            </p>
          ) : (
            <div className="task-list">
              {filteredTasks.map((task) => (
                <article className="task-row" key={task.id}>
                  <button
                    className={`task-check ${task.completed ? "checked" : ""}`}
                    onClick={() => toggleTask(task.id, task.completed)}
                    aria-label="Ndrysho statusin e detyrës"
                  >
                    {task.completed ? "✓" : ""}
                  </button>

                  <div className="task-details">
                    <strong>{task.title}</strong>
                    <div className="task-meta">
                      <span>{task.subject}</span>
                      <span>·</span>
                      <span>{task.dueDate || "Pa afat"}</span>
                      <span>·</span>
                      <span>
                        {task.priority === "high"
                          ? "Prioritet i lartë"
                          : task.priority === "low"
                            ? "Prioritet i ulët"
                            : "Prioritet mesatar"}
                      </span>
                    </div>
                  </div>

                  
<div className="task-actions">
  <button
    type="button"
    className="secondary-button"
    onClick={() => setEditingTask(task)}
  >
    ✏️ Edito
  </button>

  <button
    className="delete-button"
    onClick={() => deleteTask(task.id)}
    aria-label="Fshije detyrën"
  >
    ×
  </button>
</div>

                </article>
              ))}
            </div>
          )}
        </div>
      )}

      <TaskCreator onAdd={addTask} />
      {editingTask && (
  <EditTaskForm
    task={editingTask}
    onSave={updateTask}
    onCancel={() => setEditingTask(null)}
  />
)}
    </>
  )}

  {activePage === "focus" && (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">QËNDRO I PËRQENDRUAR</p>
          <h1>Koha e fokusit</h1>
          <p className="muted">
            Puno me përqendrim dhe bëj pauza të rregullta.
          </p>
        </div>
      </div>

      <PomodoroTimer />
    </>
  )}
  
  

  {activePage === "calendar" && (
    <StudyCalendar tasks={tasks} />
  )}

  {activePage === "progress" && (
    <StudyProgress tasks={tasks} />
  )}

</section>
</main>
</div>
);
}


function TaskCreator({ onAdd }) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Programim");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("medium");
  const [saving, setSaving] = useState(false);

  async function submit(event) {
    event.preventDefault();

    if (!title.trim()) return;

    setSaving(true);

    try {
      await onAdd(
        title.trim(),
        subject,
        dueDate,
        priority
      );

      setTitle("");
      setDueDate("");
      setPriority("medium");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form task-creator" onSubmit={submit}>
      <h2>Shto detyrë</h2>

      <label>
        Emri i detyrës
        <input
          required
          maxLength={100}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="P.sh. Përgatit prezantimin"
        />
      </label>

      <label>
        Lënda
        <select
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
        >
          <option>Programim</option>
          <option>Matematikë</option>
          <option>Fizikë</option>
          <option>Biologji</option>
          <option>Kimi</option>
          <option>Gjuhë shqipe</option>
          <option>Anglisht</option>
          <option>Tjetër</option>
        </select>
      </label>

      <label>
        Afati
        <input
          type="date"
          value={dueDate}
          onChange={(event) => setDueDate(event.target.value)}
        />
      </label>

      <label>
        Prioriteti
        <select
          value={priority}
          onChange={(event) => setPriority(event.target.value)}
        >
          <option value="high">I lartë</option>
          <option value="medium">Mesatar</option>
          <option value="low">I ulët</option>
        </select>
      </label>

      <button
        className="primary-button"
        type="submit"
        disabled={saving}
      >
        {saving ? "Duke ruajtur..." : "Ruaje detyrën"}
      </button>
    </form>
  );
}
function PomodoroTimer() {
  const [minutes, setMinutes] = useState(25);
  const [seconds, setSeconds] = useState(0);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("focus");

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      if (seconds === 0 && minutes === 0) {
        setRunning(false);
        alert(
          mode === "focus"
            ? "Koha për pauzë! 🎉"
            : "Pauza përfundoi! Kthehu te mësimi 💪"
        );
        return;
      }

      if (seconds === 0) {
        setMinutes((m) => m - 1);
        setSeconds(59);
      } else {
        setSeconds((s) => s - 1);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [running, minutes, seconds, mode]);

  function changeMode(nextMode) {
    setMode(nextMode);
    setRunning(false);
    setMinutes(nextMode === "focus" ? 25 : 5);
    setSeconds(0);
  }

  function reset() {
    setRunning(false);
    setMinutes(mode === "focus" ? 25 : 5);
    setSeconds(0);
  }

  return (
    <div className="panel pomodoro">
      <p className="eyebrow">KOHA E FOKUSIT</p>
      <h2>
        {mode === "focus" ? "Koha për mësim" : "Koha për pauzë"}
      </h2>

      <div className="timer-display">
        {String(minutes).padStart(2, "0")}:
        {String(seconds).padStart(2, "0")}
      </div>

      <div className="timer-modes">
        <button
          className={mode === "focus" ? "primary-button" : "secondary-button"}
          onClick={() => changeMode("focus")}
        >
          Fokus · 25 min
        </button>
        <button
          className={mode === "break" ? "primary-button" : "secondary-button"}
          onClick={() => changeMode("break")}
        >
          Pauzë · 5 min
        </button>
      </div>

      <div className="timer-actions">
        <button
          className="primary-button"
          onClick={() => setRunning((value) => !value)}
        >
          {running ? "Ndalo" : "Fillo"}
        </button>
        <button className="secondary-button" onClick={reset}>
          Rifillo
        </button>
      </div>
    </div>
  );
}


function EditTaskForm({ task, onSave, onCancel }) {
  const [title, setTitle] = useState(task.title || "");
  const [subject, setSubject] = useState(task.subject || "Programim");
  const [dueDate, setDueDate] = useState(
    task.due_date || task.dueDate || ""
  );
  const [priority, setPriority] = useState(task.priority || "medium");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const success = await onSave(task.id, {
        title: title.trim(),
        subject,
        dueDate,
        priority,
      });

      if (success) onCancel();
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <h3>✏️ Edito detyrën</h3>

      <label>
        Emri
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </label>

      <label>
        Lënda
        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </label>

      <label>
        Afati
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </label>

      <label>
        Prioriteti
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="high">I lartë</option>
          <option value="medium">Mesatar</option>
          <option value="low">I ulët</option>
        </select>
      </label>

      <button className="primary-button" disabled={saving}>
        {saving ? "Duke ruajtur..." : "Ruaji ndryshimet"}
      </button>

      <button
        type="button"
        className="secondary-button"
        onClick={onCancel}
      >
        Anulo
      </button>
    </form>
  );
}
