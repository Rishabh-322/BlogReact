import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../api/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">Marginal</span>
          <span className="brand-tag">Field notes / Vol. 04</span>
        </Link>
        <nav className="nav-links">
          <Link to="/">Index</Link>
          {user ? (
            <>
              <Link to="/new">Write</Link>
              <span style={{ color: 'var(--ink-soft)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
                {user.name.split(' ')[0]}
              </span>
              <button
                className="btn"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Sign in</Link>
              <Link to="/register" className="btn btn-solid">
                Join
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
