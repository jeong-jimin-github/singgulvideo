import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import Up from '../Up';
import { auth } from '../firebase';

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/');
    } catch (authError) {
      console.error(authError);
      setError('이메일 또는 비밀번호를 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      <Up />
      <main className="auth-page">
        <section className="auth-intro">
          <span className="eyebrow">WELCOME BACK</span>
          <h1>다시 만나서<br />반가워요.</h1>
          <p>로그인하고 영상을 등록하거나 계속 둘러보세요.</p>
        </section>

        <section className="form-card" aria-labelledby="login-title">
          <div className="form-card-heading">
            <span className="section-kicker">ACCOUNT</span>
            <h2 id="login-title">로그인</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            <label className="field">
              <span>이메일</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
                autoComplete="email"
                required
              />
            </label>

            <label className="field">
              <span>비밀번호</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 입력"
                autoComplete="current-password"
                required
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="button button-primary button-wide" type="submit" disabled={submitting}>
              {submitting ? '로그인 중…' : '로그인'}
            </button>
          </form>

          <p className="form-switch">처음 방문하셨나요? <Link to="/register">회원가입</Link></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Login;
