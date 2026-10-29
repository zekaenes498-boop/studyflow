
import { useState } from "react";
import { supabase } from "./lib/supabaseClient";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password.length < 6) {
      setError("Fjalëkalimi duhet t'i ketë së paku 6 karaktere.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Fjalëkalimet nuk përputhen.");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) throw error;

      setMessage("Fjalëkalimi u ndryshua me sukses! Mund të kyçesh.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Ndodhi një gabim.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-logo">S</div>
        <p className="eyebrow">STUDYFLOW</p>
        <h1>Fjalëkalim i ri</h1>
        <p className="muted">Vendose dhe konfirmoje fjalëkalimin e ri.</p>

        <label className="auth-label">
          Fjalëkalimi i ri
          <input
            type="password"
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <label className="auth-label">
          Konfirmo fjalëkalimin
          <input
            type="password"
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
