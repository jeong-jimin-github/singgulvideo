import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, increment, query, updateDoc, where } from 'firebase/firestore';
import { Link, useParams } from 'react-router-dom';
import Footer from '../Footer';
import Up from '../Up';
import { db } from '../firebase';
import NicoPlayer from './NicoPlayer';

function formatViews(value) {
  return (Number(value) || 0).toLocaleString('ko-KR');
}

function Video() {
  const { rand } = useParams();
  const [videoData, setVideoData] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    async function loadPage() {
      try {
        const currentQuery = query(collection(db, 'uploads'), where('rand', '==', rand));
        const [currentSnapshot, allSnapshot] = await Promise.all([
          getDocs(currentQuery),
          getDocs(collection(db, 'uploads')),
        ]);

        if (!active) return;
        const currentDocument = currentSnapshot.docs[0];
        if (!currentDocument) {
          setStatus('not-found');
          return;
        }

        setVideoData({ id: currentDocument.id, ...currentDocument.data() });
        setAllVideos(allSnapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setStatus('ready');

        const viewKey = `singgul-viewed-${rand}`;
        if (!sessionStorage.getItem(viewKey)) {
          sessionStorage.setItem(viewKey, '1');
          updateDoc(currentDocument.ref, { view: increment(1) }).catch(console.error);
        }
      } catch (error) {
        console.error(error);
        if (active) setStatus('error');
      }
    }

    loadPage();
    return () => { active = false; };
  }, [rand]);

  const recommendations = useMemo(() => {
    if (!videoData) return [];
    return allVideos
      .filter((video) => video.rand !== videoData.rand)
      .sort((a, b) => (Number(b.view) || 0) - (Number(a.view) || 0))
      .slice(0, 10);
  }, [allVideos, videoData]);

  return (
    <div className="app-shell">
      <Up />
      <main className="page-content watch-page">
        {status === 'loading' && (
          <div className="watch-layout">
            <div className="player-skeleton" />
            <div className="recommendation-skeleton" />
          </div>
        )}

        {(status === 'error' || status === 'not-found') && (
          <section className="state-panel watch-state">
            <span className="state-icon">{status === 'not-found' ? '404' : '!'}</span>
            <h1>{status === 'not-found' ? '영상을 찾을 수 없습니다.' : '영상을 불러오지 못했습니다.'}</h1>
            <p>{status === 'not-found' ? '삭제되었거나 잘못된 주소일 수 있습니다.' : '잠시 후 다시 시도해 주세요.'}</p>
            <Link className="button button-primary" to="/">홈으로 돌아가기</Link>
          </section>
        )}

        {status === 'ready' && videoData && (
          <div className="watch-layout">
            <article className="watch-main">
              <NicoPlayer
                videoId={videoData.url}
                videoRand={videoData.rand}
                title={videoData.title}
              />

              <div className="watch-info">
                <span className="section-kicker">WATCHING</span>
                <h1>{videoData.title || '제목 없는 영상'}</h1>
                <div className="watch-meta-row">
                  <div className="creator-row">
                    <div className="avatar large-avatar" aria-hidden="true">
                      {(videoData.username || 'S').slice(0, 1).toUpperCase()}
                    </div>
                    <div><strong>{videoData.username || '알 수 없는 사용자'}</strong><span>등록자</span></div>
                  </div>
                  <span className="view-count">조회수 {formatViews((Number(videoData.view) || 0) + 1)}회</span>
                </div>

                <section className="description-box">
                  <h2>설명</h2>
                  <p>{videoData.description || '등록된 설명이 없습니다.'}</p>
                </section>
              </div>
            </article>

            <aside className="recommendations" aria-labelledby="recommend-title">
              <div className="aside-heading">
                <span className="section-kicker">UP NEXT</span>
                <h2 id="recommend-title">다음 영상</h2>
              </div>

              {recommendations.length ? recommendations.map((video) => (
                <Link className="recommend-card" to={`/video/${video.rand}`} key={video.id || video.rand}>
                  <img src={`https://img.youtube.com/vi/${video.url}/mqdefault.jpg`} alt="" loading="lazy" />
                  <div>
                    <h3>{video.title || '제목 없는 영상'}</h3>
                    <p>{video.username || '알 수 없는 사용자'}</p>
                    <span>조회수 {formatViews(video.view)}회</span>
                  </div>
                </Link>
              )) : (
                <p className="muted-copy">추천할 다른 영상이 없습니다.</p>
              )}
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default Video;
