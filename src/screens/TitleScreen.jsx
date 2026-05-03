import { useState } from 'react';
import useGameStore from '../store/useGameStore';
import './TitleScreen.css';

export default function TitleScreen() {
  const { loginWithGoogle, loginWithApple } = useGameStore();
  const [loading, setLoading]   = useState(null); // 'google' | 'apple' | null
  const [error, setError]       = useState('');

  const handleGoogle = async () => {
    if (loading) return;
    setError('');
    setLoading('google');
    try {
      await loginWithGoogle();
    } catch (e) {
      setError('Sign-in cancelled or failed. Try again.');
      setLoading(null);
    }
  };

  const handleApple = async () => {
    if (loading) return;
    setError('');
    setLoading('apple');
    try {
      await loginWithApple();
    } catch (e) {
      setError('Apple Sign-In failed. Make sure it\'s enabled in Firebase.');
      setLoading(null);
    }
  };

  return (
    <div className="title-screen">
      {/* Logo */}
      <div className="title-logo-wrap">
        <div className="title-pokeballs">
          <span className="title-pokeball">⚫</span>
          <span className="title-pokeball title-pokeball--mid">🔴</span>
          <span className="title-pokeball">⚫</span>
        </div>
        <h1 className="pixel title-logo">LVL<br />UP</h1>
        <p className="pixel title-sub">75 TUFF CHALLENGE</p>
      </div>

      {/* Sign-in buttons */}
      <div className="title-signin">
        <p className="pixel title-signin-label">BEGIN YOUR JOURNEY</p>

        <button
          className={`title-btn title-btn--google${loading === 'google' ? ' title-btn--loading' : ''}`}
          onClick={handleGoogle}
          disabled={!!loading}
        >
          {loading === 'google' ? (
            <span className="pixel" style={{ fontSize: 9 }}>SIGNING IN<span className="blink">...</span></span>
          ) : (
            <>
              <GoogleIcon />
              <span>Continue with Google</span>
            </>
          )}
        </button>

        <button
          className={`title-btn title-btn--apple${loading === 'apple' ? ' title-btn--loading' : ''}`}
          onClick={handleApple}
          disabled={!!loading}
        >
          {loading === 'apple' ? (
            <span className="pixel" style={{ fontSize: 9 }}>SIGNING IN<span className="blink">...</span></span>
          ) : (
            <>
              <AppleIcon />
              <span>Continue with Apple</span>
            </>
          )}
        </button>

        {error && (
          <p className="pixel title-error">{error}</p>
        )}

        <p className="title-fine-print">
          No account needed — one is created automatically on first sign-in.
        </p>
      </div>

      {/* Bottom flavor */}
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

function AppleIcon() {
  return (
    <svg className="title-btn-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.39.07 2.36.74 3.18.78 1.22-.24 2.39-.93 3.68-.84 1.58.13 2.77.76 3.55 1.96-3.26 1.95-2.49 5.9.7 7.05-.57 1.55-1.3 3.06-2.11 3.93zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" fill="currentColor"/>
    </svg>
  );
}
