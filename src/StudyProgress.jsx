
import "./StudyProgress.css";

export default function StudyProgress({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const percentage = total ? Math.round((completed / total) * 100) : 0;

  const subjects = [...new Set(
    tasks.map((task) => task.subject?.trim()).filter(Boolean)
  )];

  return (
    <div className="progress-page">
      <div className="progress-heading">
        <p className="eyebrow">ANALIZA JOTE</p>
        <h1>Progresi i studimit 📊</h1>
        <p className="muted">
          Ndiqe përparimin dhe shiko sa detyra ke përfunduar.
        </p>
      </div>

      <div className="progress-stats">
        <div className="progress-card">
          <span className="progress-card-icon">📚</span>
          <p>Gjithsej detyra</p>
          <strong>{total}</strong>
        </div>

        <div className="progress-card">
          <span className="progress-card-icon">✅</span>
          <p>Të përfunduara</p>
          <strong>{completed}</strong>
        </div>

        <div className="progress-card">
          <span className="progress-card-icon">⏳</span>
          <p>Në pritje</p>
          <strong>{pending}</strong>
        </div>
      </div>

      <div className="progress-panel">
        <div className="progress-panel-heading">
          <div>
            <p className="eyebrow">REZULTATI YT</p>
            <h2>Progresi i përgjithshëm</h2>
          </div>
          <div
            className="progress-circle"
            style={{ "--progress": `${percentage * 3.6}deg` }}
          >
            <div className="progress-circle-inner">
              <strong>{percentage}%</strong>
              <span>Progres</span>
            </div>
          </div>
        </div>

        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${percentage}%` }}
          />
        </div>

        <p className="muted">
          {total === 0
            ? "Shto detyrën e parë për të filluar."
            : percentage === 100
              ? "Fantastike! I ke përfunduar të gjitha detyrat! 🎉"
              : `Ke përfunduar ${completed} nga ${total} detyra. Vazhdo kështu!`}
        </p>
      </div>

      <div className="progress-panel">
        <p className="eyebrow">SIPAS LËNDËVE</p>
        <h2>Progresi për secilën lëndë</h2>

        {subjects.length === 0 ? (
          <p className="muted">
            Shto detyra me emrin e lëndës për të parë statistikat.
          </p>
        ) : (
          <div className="subject-progress-list">
            {subjects.map((subject) => {
              const subjectTasks = tasks.filter(
                (task) => task.subject?.trim() === subject
              );
              const subjectCompleted = subjectTasks.filter(
                (task) => task.completed
              ).length;
              const subjectPercent = Math.round(
                (subjectCompleted / subjectTasks.length) * 100
              );

              return (
                <div className="subject-progress" key={subject}>
                  <div className="subject-progress-info">
                    <strong>{subject}</strong>
                    <span>
                      {subjectCompleted}/{subjectTasks.length} detyra
                    </span>
                  </div>

                  <div className="progress-bar-track subject-track">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${subjectPercent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
