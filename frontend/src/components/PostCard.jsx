import { Link } from 'react-router-dom';

export default function PostCard({ post }) {
  const date = new Date(post.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Link to={`/post/${post.slug}`} className="post-card">
      <span className="stamp">{post.tag}</span>
      <h3>{post.title}</h3>
      <p>{post.excerpt}</p>
      <div className="post-card-meta">
        <span>{post.author_name}</span>
        <span>{date} · {post.read_minutes} min</span>
      </div>
    </Link>
  );
}
