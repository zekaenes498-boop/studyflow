
import { useState } from "react";
import "./StudyCalendar.css";

export default function StudyCalendar({ tasks }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentDate.toLocaleDateString("sq-AL", {
    month: "long",
    year: "numeric",
  });

  const dateKey = (y, m, d) =>
    `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const selectedTasks = tasks.filter(
    (task) => task.due_date?.slice(0, 10) === selectedDate
  );

  const goMonth = (amount) => {
    setCurrentDate(new Date(year, month + amount, 1));
  };

  const cells = [];

  for (let i = 0; i < firstDay; i++) {
    cells.push({ empty: true, key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = dateKey(year, month, day);
    const dayTasks = tasks.filter(
      (task) => task.due_date?.slice(0, 10) === date
    );

    cells.push({
      day,
      date,
      dayTasks,
      empty: false,
    });
  }

  return (
    <div className="calendar-page">
      <div className="calendar-heading">
        <div>
          <p className="eyebrow">PLANIFIKIMI</p>
          <h1>Kalendari im 📅</h1>
          <p className="muted">
            Organizo detyrat dhe afatet e tua.
          </p>
        </div>

        <div className="calendar-month-controls">
          <button onClick={() => goMonth(-1)}>‹</button>
          <button onClick={() => setCurrentDate(new Date())}>
            Sot
          </button>
          <button onClick={() => goMonth(1)}>›</button>
        </div>
      </div>

      <div className="calendar-panel">
        <h2 className="calendar-month-title">{monthName}</h2>

        <div className="calendar-grid">
          {["Hën", "Mar", "Mër", "Enj", "Pre", "Sht", "Die"].map(
            (name) => (
              <div className="calendar-weekday" key={name}>
                {name}
              </div>
            )
          )}

          {cells.map((cell) =>
            cell.empty ? (
              <div className="calendar-day empty" key={cell.key} />
            ) : (
              <button
                className={`calendar-day ${
                  selectedDate === cell.date ? "selected" : ""
                }`}
                key={cell.date}
                onClick={() => setSelectedDate(cell.date)}
              >
                <span>{cell.day}</span>

                {cell.dayTasks.length > 0 && (
                  <div className="calendar-dots">
                    {cell.dayTasks.slice(0, 3).map((task) => (
                      <span
                        key={task.id}
                        className={`calendar-dot ${
                          task.completed ? "done" : "pending"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {cell.dayTasks.length > 0 && (
                  <small>
                    {cell.dayTasks.length}{" "}
                    {cell.dayTasks.length === 1 ? "detyrë" : "detyra"}
                  </small>
                )}
              </button>
            )
          )}
        </div>

        <div className="calendar-legend">
          <span><i className="calendar-dot pending" /> Në pritje</span>
          <span><i className="calendar-dot done" /> Përfunduar</span>
        </div>
      </div>

      <div className="calendar-panel selected-day-panel">
        <p className="eyebrow">DETYRAT E DITËS</p>
        <h2>
          {new Date(`${selectedDate}T12:00:00`).toLocaleDateString(
            "sq-AL",
            { day: "numeric", month: "long", year: "numeric" }
          )}
        </h2>

        {selectedTasks.length === 0 ? (
          <p className="muted">
            Nuk ka detyra për këtë datë. Zgjedh një ditë tjetër.
          </p>
        ) : (
          <div className="calendar-task-list">
            {selectedTasks.map((task) => (
              <div className="calendar-task" key={task.id}>
                <div className="calendar-task-icon">
                  {task.completed ? "✓" : "◷"}
                </div>
                <div className="calendar-task-info">
                  <strong>{task.title}</strong>
                  <span>{task.subject || "Pa lëndë"}</span>
                </div>
                <span
                  className={`calendar-status ${
                    task.completed ? "done" : "pending"
                  }`}
                >
                  {task.completed ? "Përfunduar" : "Në pritje"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
