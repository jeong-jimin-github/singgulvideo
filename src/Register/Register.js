import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import Up from '../Up';
import { auth, db } from '../firebase';

function Register() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (username.trim().length < 2) {
      setError('이름은 2자 이상 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await setDoc(doc(db, 'users', credential.user.uid), { username: username.trim() });
      navigate('/');
    } catch (authError) {
      console.error(authError);
      setError(authError.code === 'auth/email-already-in-use'
        ? '이미 사용 중인 이메일입니다.'
        : '회원가입에 실패했습니다. 입력 내용을 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell auth-shell">
      <Up />
      <main className="auth-page">
        <section className="auth-intro">
          <span className="eyebrow">JOIN SINGGUL</span>
          <h1>좋아하는 영상을<br />한곳에 모아보세요.</h1>
          <p>간단한 계정으로 영상 링크를 등록하고 공유할 수 있습니다.</p>
        </section>

        <section className="form-card" aria-labelledby="register-title">
          <div className="form-card-heading">
            <span className="section-kicker">CREATE ACCOUNT</span>
            <h2 id="register-title">회원가입</h2>
          </div>

          <form onSubmit={handleSubmit} className="form-stack">
            <label className="field">
              <span>이름</span>
              <input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                placeholder="표시할 이름"
                autoComplete="nickname"
                maxLength={32}
                required
              />
            </label>

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
                placeholder="6자 이상"
                autoComplete="new-password"
                minLength={6}
                required
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button className="button button-primary button-wide" type="submit" disabled={submitting}>
              {submitting ? '계정 만드는 중…' : '계정 만들기'}
            </button>
          </form>

          <p className="form-switch">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default Register;
