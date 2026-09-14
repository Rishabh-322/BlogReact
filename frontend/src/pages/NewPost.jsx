import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../api/AuthContext';

export default function NewPost() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', tag: 'devops', excerpt: '', body: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return <div className="state-msg">Sign in to write an entry.</div>;
  }

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { slug } = await api.createPost(form);
      navigate(`/post/${slug}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-shell wide">
      <h1>New entry</h1>
      <p className="sub">Write it like a field note — specific, and a little unpolished is fine.</p>
      <form onSubmit={submit}>
        <div className="field">
          <label>Title</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </div>
        <div className="field">
          <label>Tag</label>
          <input value={form.tag} onChange={(e) => setForm({ ...form, tag: e.target.value })} />
        </div>
        <div className="field">
          <label>Excerpt (optional)</label>
          <input value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
        </div>
        <div className="field">
          <label>Body</label>
          <textarea
            required
            minLength={20}
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            placeholder="Start with the incident, the decision, or the number that surprised you…"
          />
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="form-actions">
          <button className="btn btn-solid" disabled={loading}>
            {loading ? 'Publishing…' : 'Publish entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
