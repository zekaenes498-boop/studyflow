
import "./StudyDashboard.css";

function getDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function StudyDashboard({ tasks = [] }) {
  const completed = tasks.filter((task) => task.completed).length;
  const pending = tasks.length - completed;
  const progress = tasks.length
    ? Math.round((completed / tasks.length) * 100)
    : 0;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Mirëmëngjes!" : hour < 18 ? "Mirëdita!" : "Mirëmbrëma!";

  // Java fillon të hënën.
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const monday = new Date(today);
  const dayOffset = (today.getDay() + 6) % 7;
  monday.setDate(today.getDate() - dayOffset);

  const weekdays = ["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"];

  const weekData = weekdays.map((day, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);

    const dateKey = getDateKey(date);
    const count = tasks.filter((task) => {
      if (!task.created_at) return false;

      return getDateKey(new Date(task.created_at)) === dateKey;
    }).length;

    return {
      day,
      dateKey,
      count,
      isToday: dateKey === getDateKey(today),
    };
  });

  const maxCount = Math.max(...weekData.map((day) => day.count), 1);

  const recentTasks = [...tasks]
    .sort((a, b) => {
      return (
        new Date(b.created_at || 0).getTime() -
        new Date(a.created_at || 0).getTime()
      );
    })
    .slice(0, 5);

  function formatDate(dateString) {
    if (!dateString) return "Pa afat";

    return new Date(`${dateString}T00:00:00`).toLocaleDateString("sq-AL", {
      day: "numeric",
      month: "short",
    });
  }

  return (
    <div className="study-dashboard">
      <section className="dashboard-hero">
        <div>
          <span className="sd-eyebrow">HAPËSIRA JOTE</span>
          <h1>{greeting}</h1>
          <p>Organizoje ditën, përqendrohu dhe ec përpara.</p>
        </div>

        <div className="sd-hero-icon">✦</div>
      </section>

      <section className="sd-stats-grid">
        <article className="sd-stat-card">
          <div className="sd-stat-top">
            <span>Gjithsej detyra</span>
            <span className="sd-stat-icon blue">▤</span>
          </div>
          <strong>{tasks.length}</strong>
          <small>Detyrat e tua</small>
        </article>

        <article className="sd-stat-card">
          <div className="sd-stat-top">
            <span>Të përfunduara</span>
            <span className="sd-stat-icon green">✓</span>
          </div>
          <strong>{completed}</strong>
          <small>Detyra të kryera</small>
        </article>

        <article className="sd-stat-card">
          <div className="sd-stat-top">
            <span>Në pritje</span>
            <span className="sd-stat-icon orange">◷</span>
          </div>
          <strong>{pending}</strong>
          <small>Detyra për t'u kryer</small>
        </article>

        <article className="sd-stat-card">
          <div className="sd-stat-top">
            <span>Progresi yt</span>
            <span className="sd-stat-icon purple">↗</span>
          </div>
          <strong>{progress}%</strong>
          <div className="sd-progress-track">
            <div
              className="sd-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </article>
      </section>

      <section className="sd-content-grid">
        <article className="sd-panel sd-chart-panel">
          <div className="sd-panel-heading">
            <div>
              <h2>Aktiviteti javor</h2>
              <p>Detyrat e krijuara gjatë kësaj jave</p>
            </div>
            <span className="sd-live-dot">Kjo javë</span>
          </div>

          <div className="sd-chart">
            {weekData.map((item) => (
              <div className="sd-chart-column" key={item.dateKey}>
                <span className="sd-bar-value">{item.count}</span>
                <div className="sd-bar-area">
                  <div
                    className={`sd-bar ${item.isToday ? "today" : ""}`}
                    style={{
                      height: `${Math.max(
                        item.count > 0 ? 12 : 4,
                        (item.count / maxCount) * 100
                      )}%`,
                    }}
                    title={`${item.count} detyra`}
                  />
                </div>
                <span className={item.isToday ? "sd-day today" : "sd-day"}>
                  {item.day}
                </span>
              </div>
            ))}
          </div>

          <p className="sd-chart-note">
            Grafiku tregon detyrat e krijuara, jo kohën e kaluar duke mësuar.
          </p>
        </article>

        <article className="sd-panel sd-progress-panel">
          <div className="sd-panel-heading">
            <div>
              <h2>Përmbledhja</h2>
              <p>Gjendja e detyrave të tua</p>
            </div>
            <span className="sd-summary-icon">◈</span>
          </div>

          <div className="sd-ring-wrap">
            <div
              className="sd-progress-ring"
              style={{
                background: `conic-gradient(#35c8ff ${progress}%, #202d43 ${progress}% 100%)`,
              }}
            >
              <div className="sd-ring-inner">
                <strong>{progress}%</strong>
                <span>Progresi</span>
              </div>
            </div>
          </div>

          <div className="sd-legend">
            <div>
              <span className="sd-legend-dot completed" />
              <span>Të përfunduara</span>
              <strong>{completed}</strong>
            </div>
            <div>
              <span className="sd-legend-dot pending" />
              <span>Në pritje</span>
              <strong>{pending}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="sd-panel sd-recent-panel">
        <div className="sd-panel-heading">
          <div>
            <h2>Detyrat e fundit</h2>
            <p>Detyrat që ke shtuar së fundmi</p>
          </div>
          <span className="sd-recent-count">{recentTasks.length} detyra</span>
        </div>

        {recentTasks.length === 0 ? (
          <div className="sd-empty-state">
            <span>✦</span>
            <strong>Fillo me detyrën tënde të parë</strong>
            <p>Detyrat që shton do të shfaqen këtu.</p>
          </div>
        ) : (
          <div className="sd-recent-list">
            {recentTasks.map((task) => (
              <div className="sd-recent-row" key={task.id}>
                <span
                  className={`sd-task-status ${
                    task.completed ? "done" : ""
                  }`}
                >
                  {task.completed ? "✓" : "○"}
                </span>

                <div className="sd-recent-details">
                  <strong className={task.completed ? "task-done" : ""}>
                    {task.title}
                  </strong>
                  <span>
                    {task.subject || "Pa lëndë"} · Afati:{" "}
                    {formatDate(task.due_date || task.dueDate)}
                  </span>
                </div>

                <span
                  className={`sd-status-badge ${
                    task.completed ? "done" : "waiting"
                  }`}
                >
                  {task.completed ? "Përfunduar" : "Në pritje"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
