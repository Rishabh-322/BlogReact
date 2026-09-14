import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReadingSpine from '../components/ReadingSpine';
import { api } from '../api/client';
import { useAuth } from '../api/AuthContext';

export default function PostDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [post, setPost] = useState(null);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const load = () => api.getPost(slug).then(setPost).catch((err) => setError(err.message));

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await api.addComment(slug, comment);
      setComment('');
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  if (error && !post) return <div className="state-msg">{error}</div>;
  if (!post) return <div className="state-msg">Loading entry…</div>;

  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="article-shell">
      <ReadingSpine />
      <article>
        <span className="article-tag">{post.tag}</span>
        <h1>{post.title}</h1>
        <div className="article-byline">
          <span>{post.author_name}</span>
          <span>{date}</span>
          <span>{post.read_minutes} min read</span>
        </div>
        <div className="article-body">{post.body}</div>

        <section className="comments">
          <h2 style={{ fontSize: 20, marginBottom: 20 }}>
            Notes in the margin ({post.comments.length})
          </h2>
          {post.comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="comment-author">
                {c.author_name} · {new Date(c.created_at).toLocaleDateString()}
              </div>
              <p style={{ margin: '6px 0 0' }}>{c.body}</p>
            </div>
          ))}

          {user ? (
            <form onSubmit={submitComment} style={{ marginTop: 24 }}>
              <div className="field">
                <label>Add a note</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="What stood out to you?"
                />
              </div>
              <div className="form-actions">
                <button className="btn btn-solid" disabled={posting}>
                  {posting ? 'Posting…' : 'Post note'}
                </button>
              </div>
            </form>
          ) : (
            <p style={{ marginTop: 20, color: 'var(--ink-soft)', fontSize: 14 }}>
              Sign in to leave a note in the margin.
            </p>
          )}
        </section>
      </article>
    </div>
  );
}
