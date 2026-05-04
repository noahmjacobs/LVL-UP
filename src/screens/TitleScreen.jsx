import { useState, useEffect } from 'react';
import useGameStore from '../store/useGameStore';
import { playTitleTheme } from '../audio';
import './TitleScreen.css';

export default function TitleScreen() {
  const { loginWithGoogle } = useGameStore();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    playTitleTheme();
  }, []);

  const handleGoogle = async () => {
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      setError('Sign-in cancelled or failed. Try again.');
      setLoading(false);
    }
  };

  return (
    <div className="title-screen">
      <div className="title-logo-wrap">
        <div className="title-pokeballs">
          <img src="/sprites/greatball.png" className="title-pokeball" alt="great ball" />
          <img src="/sprites/pokeball.png"  className="title-pokeball title-pokeball--mid" alt="poke ball" />
          <img src="/sprites/ultraball.png" className="title-pokeball" alt="ultra ball" />
        </div>
        <h1 className="pixel title-logo">
          <span style={{ color: 'var(--red)' }}>LVL</span><br />
          <span style={{ color: 'var(--white)' }}>UP</span>
        </h1>
        <p className="pixel title-sub">75 TUFF CHALLENGE</p>
      </div>

      <div className="title-signin">
        <p className="pixel title-signin-label">BEGIN YOUR JOURNEY</p>

        <button
          className={`title-btn title-btn--google${loading ? ' title-btn--loading' : ''}`}
          onClick={handleGoogle}
          disabled={loading}
        >
          {loading ? (
            <span className="pixel" style={{ fontSize: 9 }}>SIGNING IN<span className="blink">...</span></span>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {error && <p className="pixel title-error">{error}</p>}

        <p className="title-fine-print">
          No account needed — one is created automatically on first sign-in.
        </p>
      </div>

      <p className="pixel title-flavor">
        75 days. 6 tasks. No excuses.
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="title-btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}
