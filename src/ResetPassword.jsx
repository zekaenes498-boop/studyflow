
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Fjalëkalimi u ndryshua me sukses! Tani mund të kyçesh.");
      setPassword("");
    }

    setLoading(false);
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">S</div>
        <p className="eyebrow">STUDYFLOW</p>
        <h1>Fjalëkalim i ri</h1>
        <p className="muted">
          Shkruaje fjalëkalimin tënd të ri.
        </p>

        <label className="auth-label">
          Fjalëkalimi i ri
          <input
            type="password"
            placeholder="Të paktën 6 karaktere"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button
          className="primary-button auth-submit"
          type="submit"
          disabled={loading}
        >
          {loading ? "Duke ruajtur..." : "Ndrysho fjalëkalimin"}
        </button>
      </form>
    </div>
  );
}
