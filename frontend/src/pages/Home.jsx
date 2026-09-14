import { useEffect, useState } from 'react';
import PostCard from '../components/PostCard';
import { api } from '../api/client';

const TAGS = ['all', 'devops', 'tooling', 'quality', 'security'];

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [tag, setTag] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api
      .listPosts(tag === 'all' ? {} : { tag })
      .then((res) => setPosts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tag]);

  return (
    <>
      <section className="hero">
        <div className="container">
          <div className="hero-eyebrow">Notes from production</div>
          <h1>
            Dispatches from the <em>build pipeline</em>.
          </h1>
          <p>
            Marginal is a running journal on shipping software that stays up: EKS rollouts,
            artifact hygiene, quality gates, and the vulnerabilities we almost missed.
          </p>
          <div className="hero-meta">
            <div>
              <strong>{posts.length || '—'}</strong>
              posts live
            </div>
            <div>
              <strong>EKS</strong>
              deployment target
            </div>
            <div>
              <strong>Trivy</strong>
              gate on every image
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="section-head">
          <h2>Latest entries</h2>
          <div className="tag-filter">
            {TAGS.map((t) => (
              <button
                key={t}
                className={`tag-pill ${tag === t ? 'active' : ''}`}
                onClick={() => setTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="state-msg">Couldn't reach the API — {error}</div>}

        {loading ? (
          <div className="post-grid">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 210, borderRadius: 'var(--radius)' }} />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="state-msg">No entries yet for this tag. Be the first to write one.</div>
        ) : (
          <div className="post-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
