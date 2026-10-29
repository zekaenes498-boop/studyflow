
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";
import "./AIExamCoach.css";

export default function AIExamCoach({ onAddTask }) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [taskAdded, setTaskAdded] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function generateQuiz(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    setQuiz(null);
    setResult(null);
    setAnswers({});
    setSaved(false);
    setTaskAdded(false);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Kyçu përsëri për të vazhduar.");
      }

     const { data, error: functionError } =
  await supabase.functions.invoke("ai-exam-coach", {
    body: {
      topic: topic.trim(),
      difficulty,
      language: "sq",
    },
  });

if (functionError) {
  const details = await functionError.context
    ?.json()
    .catch(() => null);

  throw new Error(
    details?.error ||
      functionError.message ||
      "Nuk mund të lidhemi me AI Exam Coach."
  );
}

if (data?.error) {
  throw new Error(data.error);
}

      const questions = data?.quiz?.questions;

      if (
        !Array.isArray(questions) ||
        questions.length !== 5 ||
        questions.some(
          (q) =>
            typeof q.question !== "string" ||
            !Array.isArray(q.options) ||
            q.options.length !== 4 ||
            !Number.isInteger(q.answerIndex) ||
            q.answerIndex < 0 ||
            q.answerIndex > 3
        )
      ) {
        throw new Error(
          "AI nuk krijoi një kuiz të vlefshëm. Provo përsëri."
        );
      }

      setQuiz(data.quiz);
    } catch (err) {
      console.error("Quiz generation failed:", err);
      setError(
        err.message || "Nuk u krijua kuizi. Kontrollo lidhjen dhe provo përsëri."
      );
    } finally {
      setLoading(false);
    }
  }

  async function finishQuiz() {
    if (
      !quiz ||
      saving ||
      Object.keys(answers).length !== quiz.questions.length
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setNotice("");

    const score = quiz.questions.reduce(
      (total, question, index) =>
        total + (answers[index] === question.answerIndex ? 1 : 0),
      0
    );

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Sesioni ka skaduar. Kyçu përsëri.");
      }

      const { error: saveError } = await supabase
        .from("quiz_attempts")
        .insert({
          user_id: user.id,
          topic: topic.trim(),
          difficulty,
          score,
          total_questions: quiz.questions.length,
        });

      if (saveError) throw saveError;

      setResult({
        score,
        total: quiz.questions.length,
        questions: quiz.questions,
        answers: { ...answers },
      });
      setSaved(true);
    } catch (err) {
      console.error("Saving quiz result failed:", err);
      setError(
        err.message ||
          "Rezultati nuk u ruajt. Kontrollo tabelën dhe politikat RLS."
      );
    } finally {
      setSaving(false);
    }
  }

  async function addRevisionTask() {
    if (!onAddTask || taskAdded) return;

    setError("");
    setNotice("");

    try {
      const success = await onAddTask(
        `Përsëritja: ${topic.trim()}`,
        topic.trim().slice(0, 100),
        "",
        "high"
      );

      if (success === false) {
        setError("Detyra nuk u ruajt. Provo përsëri.");
        return;
      }

      setTaskAdded(true);
      setNotice("Detyra për përsëritje u shtua në listën tënde!");
    } catch (err) {
      setError(err.message || "Nuk u shtua detyra.");
    }
  }

  function resetQuiz() {
    setQuiz(null);
    setAnswers({});
    setResult(null);
    setError("");
    setNotice("");
    setSaved(false);
    setTaskAdded(false);
  }

  return (
    <div className="ai-coach">
      <header className="ai-coach-header">
        <div>
          <p className="eyebrow">STUDYFLOW INTELLIGENCE</p>
          <h1>AI Exam Coach</h1>
          <p className="muted">
            Testo njohuritë, kupto gabimet dhe planifiko përsëritjen.
          </p>
        </div>
        <div className="ai-coach-icon" aria-hidden="true">
          ✦
        </div>
      </header>

      <form className="panel ai-quiz-form" onSubmit={generateQuiz}>
        <label>
          Lënda ose tema
          <input
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder="P.sh. Algoritmet e sortimit"
            maxLength={160}
            required
            disabled={loading}
          />
        </label>

        <label>
          Niveli i vështirësisë
          <select
            value={difficulty}
            onChange={(event) => setDifficulty(event.target.value)}
            disabled={loading}
          >
            <option value="easy">E lehtë</option>
            <option value="medium">Mesatare</option>
            <option value="hard">E vështirë</option>
          </select>
        </label>

        <button
          className="primary-button"
          type="submit"
          disabled={loading || !topic.trim()}
        >
          {loading ? "✦ AI po përgatit pyetjet..." : "✦ Gjenero kuiz"}
        </button>
      </form>

      {error && (
        <p className="auth-error" role="alert">
          {error}
        </p>
      )}

      {notice && (
        <p className="auth-message" role="status">
          {notice}
        </p>
      )}

      {quiz && !result && (
        <section className="ai-questions">
          <div className="ai-section-heading">
            <div>
              <p className="eyebrow">KU I KE NJOHURITË?</p>
              <h2>{quiz.title || topic}</h2>
            </div>
            <span className="ai-count">
              {Object.keys(answers).length}/5
            </span>
          </div>

          {quiz.questions.map((question, index) => (
            <fieldset className="panel ai-question" key={index}>
              <legend>
                <span className="ai-question-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                {question.question}
              </legend>

              <div className="ai-options">
                {question.options.map((option, optionIndex) => (
                  <label
                    className={`ai-option ${
                      answers[index] === optionIndex ? "selected" : ""
                    }`}
                    key={optionIndex}
                  >
                    <input
                      type="radio"
                      name={`question-${index}`}
                      checked={answers[index] === optionIndex}
                      onChange={() =>
                        setAnswers((previous) => ({
                          ...previous,
                          [index]: optionIndex,
                        }))
                      }
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          ))}

          <button
            type="button"
            className="primary-button ai-finish"
            disabled={
              saving ||
              Object.keys(answers).length !== quiz.questions.length
            }
            onClick={finishQuiz}
          >
            {saving ? "Duke ruajtur rezultatin..." : "Përfundo kuizin"}
          </button>
        </section>
      )}

      {result && (
        <section className="panel ai-results">
          <p className="eyebrow">REZULTATI YT</p>
          <h2>
            {result.score} / {result.total}
          </h2>
          <p className="muted">
            U përgjigje saktë në{" "}
            {Math.round((result.score / result.total) * 100)}% të pyetjeve.
          </p>

          <div
            className="ai-score-track"
            role="progressbar"
            aria-label="Rezultati i kuizit"
            aria-valuenow={Math.round(
              (result.score / result.total) * 100
            )}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="ai-score-fill"
              style={{
                width: `${(result.score / result.total) * 100}%`,
              }}
            />
          </div>

          {result.questions.map((question, index) => {
            const correct =
              result.answers[index] === question.answerIndex;

            return (
              <article className="ai-review" key={index}>
                <h3>
                  <span>{correct ? "✓" : "×"}</span>
                  {question.question}
                </h3>
                <p>
                  <strong>Përgjigjja e saktë:</strong>{" "}
                  {question.options[question.answerIndex]}
                </p>
                <p className="muted">{question.explanation}</p>
              </article>
            );
          })}

          <div className="ai-next-step">
            <h3>Hapi yt i ardhshëm</h3>
            <p className="muted">
              Shto një detyrë në StudyFlow për ta përsëritur këtë temë.
            </p>
            <button
              type="button"
              className="primary-button"
              onClick={addRevisionTask}
              disabled={taskAdded || !onAddTask}
            >
              {taskAdded ? "✓ Detyra u shtua" : "Shto detyrë për përsëritje"}
            </button>
          </div>

          {saved && (
            <p className="ai-saved-label">
              ✓ Rezultati u ruajt në historikun tënd.
            </p>
          )}

          <button
            type="button"
            className="secondary-button"
            onClick={resetQuiz}
          >
            Provo një kuiz tjetër
          </button>
        </section>
      )}
    </div>
  );
}
