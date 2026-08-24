import { useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Footer from '../Footer';
import Up from '../Up';
import { auth, db } from '../firebase';
import { getCreatorId } from '../Video/VideoSocial';
import style from './Dashboard.module.css';

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

async function commitDeletes(refs) {
  for (let index = 0; index < refs.length; index += 450) {
    const batch = writeBatch(db);
    refs.slice(index, index + 450).forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

function Dashboard() {
  const [user, setUser] = useState(undefined);
  const [username, setUsername] = useState('');
  const [uploads, setUploads] = useState([]);
  const [subscribers, setSubscribers] = useState(0);
  const [loadingUploads, setLoadingUploads] = useState(true);
  const [editId, setEditId] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftDescription, setDraftDescription] = useState('');
  const [draftUrl, setDraftUrl] = useState('');
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    return onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser || null);
      setUsername('');
      if (!nextUser) return;
      try {
        const snapshot = await getDoc(doc(db, 'users', nextUser.uid));
        setUsername(snapshot.exists() ? snapshot.data().username : nextUser.email || '사용자');
      } catch (fetchError) {
        console.error(fetchError);
        setUsername(nextUser.email || '사용자');
      }
    });
  }, []);

  useEffect(() => {
    if (!user || !username) {
      setUploads([]);
      setLoadingUploads(user !== null);
      return undefined;
    }

    setLoadingUploads(true);
    return onSnapshot(collection(db, 'uploads'), (snapshot) => {
      const nextUploads = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((video) => video.uploaderUid === user.uid || (!video.uploaderUid && video.username === username))
        .sort((a, b) => (Number(b.view) || 0) - (Number(a.view) || 0));
      setUploads(nextUploads);
      setLoadingUploads(false);
    }, (snapshotError) => {
      console.error(snapshotError);
      setError('업로드 영상을 불러오지 못했습니다.');
      setLoadingUploads(false);
    });
  }, [user, username]);

  useEffect(() => {
    if (!user || !username) {
      setSubscribers(0);
      return undefined;
    }

    const creatorIds = new Set([
      `uid_${user.uid}`,
      `legacy_${encodeURIComponent(username)}`,
    ]);
    return onSnapshot(collection(db, 'subscriptions'), (snapshot) => {
      const subscriberUids = new Set(
        snapshot.docs
          .map((item) => item.data())
          .filter((item) => creatorIds.has(item.creatorId))
          .map((item) => item.uid)
          .filter(Boolean)
      );
      setSubscribers(subscriberUids.size);
    }, console.error);
  }, [user, username]);

  const totalViews = useMemo(
    () => uploads.reduce((sum, video) => sum + (Number(video.view) || 0), 0),
    [uploads]
  );

  const beginEdit = (video) => {
    setEditId(video.id);
    setDraftTitle(video.title || '');
    setDraftDescription(video.description || '');
    setDraftUrl(`https://youtu.be/${video.url}`);
    setError('');
  };

  const saveEdit = async (video) => {
    const title = draftTitle.trim();
    const videoId = extractVideoId(draftUrl);
    if (!title) {
      setError('제목을 입력해 주세요.');
      return;
    }
    if (!videoId) {
      setError('올바른 YouTube 주소를 입력해 주세요.');
      return;
    }

    setBusyId(video.id);
    setError('');
    try {
      await updateDoc(doc(db, 'uploads', video.id), {
        title,
        description: draftDescription.trim(),
        url: videoId,
        uploaderUid: user.uid,
        creatorId: getCreatorId(video),
        username: username || user.email || '사용자',
        updatedAt: serverTimestamp(),
      });
      setEditId('');
    } catch (saveError) {
      console.error(saveError);
      setError('영상 수정에 실패했습니다.');
    } finally {
      setBusyId('');
    }
  };

  const deleteVideo = async (video) => {
    const confirmed = window.confirm(`“${video.title || '제목 없는 영상'}”을 삭제할까요? 관련 댓글과 평가도 함께 삭제됩니다.`);
    if (!confirmed) return;

    setBusyId(video.id);
    setError('');
    try {
      const [commentsSnapshot, videoReactionSnapshot, commentReactionSnapshot] = await Promise.all([
        getDocs(query(collection(db, 'comments'), where('videoRand', '==', video.rand))),
        getDocs(query(collection(db, 'videoReactions'), where('videoRand', '==', video.rand))),
        getDocs(query(collection(db, 'commentReactions'), where('videoRand', '==', video.rand))),
      ]);
      const refs = [
        doc(db, 'uploads', video.id),
        ...commentsSnapshot.docs.map((item) => item.ref),
        ...videoReactionSnapshot.docs.map((item) => item.ref),
        ...commentReactionSnapshot.docs.map((item) => item.ref),
      ];
      await commitDeletes(refs);
      if (editId === video.id) setEditId('');
    } catch (deleteError) {
      console.error(deleteError);
      setError('영상 삭제에 실패했습니다. Firestore 권한을 확인해 주세요.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="app-shell">
      <Up />
      <main className={`page-content ${style.page}`}>
        <section className={style.heading}>
          <div>
            <span className="eyebrow">CREATOR STUDIO</span>
            <h1>영상 관리</h1>
            <p>업로드한 영상을 수정하고 채널 현황을 확인합니다.</p>
          </div>
          {user && <Link className="button button-primary" to="/upload">새 영상 등록</Link>}
        </section>

        {user === undefined && <div className="form-card compact-card">인증 상태 확인 중…</div>}

        {user === null && (
          <section className="state-panel">
            <span className="state-icon">→</span>
            <h2>로그인이 필요합니다.</h2>
            <p>본인이 업로드한 영상을 관리하려면 로그인해 주세요.</p>
            <Link className="button button-primary" to="/login">로그인</Link>
          </section>
        )}

        {user && (
          <>
            <section className={style.stats} aria-label="채널 통계">
              <div><span>업로드</span><strong>{uploads.length.toLocaleString('ko-KR')}</strong><small>개 영상</small></div>
              <div><span>총 조회수</span><strong>{totalViews.toLocaleString('ko-KR')}</strong><small>회</small></div>
              <div><span>구독자</span><strong>{subscribers.toLocaleString('ko-KR')}</strong><small>명</small></div>
            </section>

            {error && <p className={style.error} role="alert">{error}</p>}

            <section className={style.library}>
              <div className={style.sectionHeading}>
                <div><span>MY LIBRARY</span><h2>업로드한 영상</h2></div>
                <strong>{uploads.length}개</strong>
              </div>

              {loadingUploads ? (
                <div className={style.empty}>영상 목록을 불러오는 중…</div>
              ) : uploads.length === 0 ? (
                <div className={style.empty}>
                  <h3>아직 업로드한 영상이 없습니다.</h3>
                  <p>첫 YouTube 영상을 등록해 보세요.</p>
                </div>
              ) : (
                <div className={style.videoList}>
                  {uploads.map((video) => (
                    <article className={style.videoRow} key={video.id}>
                      <Link className={style.thumbnail} to={`/video/${video.rand}`}>
                        <img src={`https://img.youtube.com/vi/${video.url}/mqdefault.jpg`} alt="" />
                      </Link>

                      {editId === video.id ? (
                        <div className={style.editor}>
                          <label><span>제목</span><input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} maxLength={120} /></label>
                          <label><span>YouTube 주소</span><input value={draftUrl} onChange={(event) => setDraftUrl(event.target.value)} /></label>
                          <label><span>설명</span><textarea value={draftDescription} onChange={(event) => setDraftDescription(event.target.value)} rows={4} maxLength={1000} /></label>
                          <div className={style.editorActions}>
                            <button type="button" onClick={() => setEditId('')} disabled={busyId === video.id}>취소</button>
                            <button type="button" className={style.primaryAction} onClick={() => saveEdit(video)} disabled={busyId === video.id}>저장</button>
                          </div>
                        </div>
                      ) : (
                        <div className={style.videoInfo}>
                          <div>
                            <h3>{video.title || '제목 없는 영상'}</h3>
                            <p>{video.description || '설명 없음'}</p>
                            <span>조회수 {(Number(video.view) || 0).toLocaleString('ko-KR')}회 · ID {video.rand}</span>
                            {!video.uploaderUid && <em>레거시 영상 · 수정 시 계정 소유권이 연결됩니다.</em>}
                          </div>
                          <div className={style.rowActions}>
                            <Link to={`/video/${video.rand}`}>보기</Link>
                            <button type="button" onClick={() => beginEdit(video)} disabled={Boolean(busyId)}>수정</button>
                            <button type="button" className={style.danger} onClick={() => deleteVideo(video)} disabled={Boolean(busyId)}>{busyId === video.id ? '처리 중…' : '삭제'}</button>
                          </div>
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Dashboard;
