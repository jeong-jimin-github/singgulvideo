import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, serverTimestamp } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import Footer from '../Footer';
import Up from '../Up';
import { auth, db } from '../firebase';

function extractVideoId(input) {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.replace(/^www\./, '');

    if (host === 'youtu.be') return url.pathname.split('/').filter(Boolean)[0] || null;
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (url.pathname === '/watch') return url.searchParams.get('v');
      const parts = url.pathname.split('/').filter(Boolean);
      if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1] || null;
    }
  } catch {
    return null;
  }
  return null;
}

function createShareId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  }
  return Math.random().toString(16).slice(2, 10);
}

function Upload() {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [username, setUsername] = useState('');
  const [urlValue, setUrlValue] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser || null);
      if (!nextUser) return;

      try {
        const snapshot = await getDoc(doc(db, 'users', nextUser.uid));
        setUsername(snapshot.exists() ? snapshot.data().username : nextUser.email || '사용자');
      } catch (fetchError) {
        console.error(fetchError);
        setUsername(nextUser.email || '사용자');
      }
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    const videoId = extractVideoId(urlValue);
    if (!videoId) {
      setError('올바른 YouTube 영상 주소를 입력해 주세요.');
      return;
    }
    if (!title.trim()) {
      setError('영상 제목을 입력해 주세요.');
      return;
    }
    if (!user) {
      setError('영상을 등록하려면 로그인이 필요합니다.');
      return;
    }

    setSubmitting(true);
    try {
      const rand = createShareId();
      await addDoc(collection(db, 'uploads'), {
        url: videoId,
        title: title.trim(),
        description: description.trim(),
        username: username || user.email || '사용자',
        uploaderUid: user.uid,
        creatorId: `uid_${user.uid}`,
        rand,
        view: 0,
        createdAt: serverTimestamp(),
      });
      navigate(`/video/${rand}`);
    } catch (uploadError) {
      console.error(uploadError);
      setError('영상 등록에 실패했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="app-shell">
      <Up />
      <main className="page-content upload-page">
        <section className="upload-heading">
          <span className="eyebrow">ADD VIDEO</span>
          <h1>영상 등록</h1>
          <p>YouTube 링크 하나면 충분합니다. 영상 파일을 직접 업로드하지 않습니다.</p>
        </section>

        {user === undefined ? (
          <div className="form-card compact-card"><div className="inline-loader" /> 인증 상태 확인 중…</div>
        ) : !user ? (
          <section className="state-panel gated-panel">
            <span className="state-icon">→</span>
            <h2>로그인이 필요합니다.</h2>
            <p>계정에 로그인한 뒤 영상을 등록할 수 있습니다.</p>
            <Link className="button button-primary" to="/login">로그인하러 가기</Link>
          </section>
        ) : (
          <section className="form-card upload-card" aria-labelledby="upload-form-title">
            <div className="form-card-heading">
              <span className="section-kicker">NEW LINK</span>
              <h2 id="upload-form-title">새 영상</h2>
            </div>

            <form onSubmit={handleSubmit} className="form-stack">
              <label className="field">
                <span>YouTube 주소</span>
                <input
                  type="url"
                  value={urlValue}
                  onChange={(event) => setUrlValue(event.target.value)}
                  placeholder="https://youtu.be/..."
                  inputMode="url"
                  required
                />
                <small>youtube.com, youtu.be, Shorts, Live 링크를 지원합니다.</small>
              </label>

              <label className="field">
                <span>제목</span>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="영상 제목"
                  maxLength={120}
                  required
                />
              </label>

              <label className="field">
                <span>설명 <em>선택</em></span>
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="이 영상에 대해 간단히 적어주세요."
                  rows={6}
                  maxLength={1000}
                />
              </label>

              {urlValue && extractVideoId(urlValue) && (
                <div className="upload-preview">
                  <img src={`https://img.youtube.com/vi/${extractVideoId(urlValue)}/hqdefault.jpg`} alt="영상 미리보기" />
                  <div><span>미리보기</span><strong>{title || '제목을 입력해 주세요'}</strong></div>
                </div>
              )}

              {error && <p className="form-error" role="alert">{error}</p>}

              <div className="form-actions">
                <button className="button button-secondary" type="button" onClick={() => navigate('/')}>취소</button>
                <button className="button button-primary" type="submit" disabled={submitting}>
                  {submitting ? '등록 중…' : '영상 등록'}
                </button>
              </div>
            </form>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Upload;
