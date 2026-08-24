import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import Footer from '../Footer';
import Up from '../Up';
import { db } from '../firebase';

function formatViews(value) {
  const views = Number(value) || 0;
  if (views >= 10000) return `${(views / 10000).toFixed(views >= 100000 ? 0 : 1)}만`;
  if (views >= 1000) return `${(views / 1000).toFixed(views >= 10000 ? 0 : 1)}천`;
  return views.toLocaleString('ko-KR');
}

function VideoCard({ video }) {
  return (
    <Link className="video-card" to={`/video/${video.rand}`}>
      <div className="thumbnail-wrap">
        <img
          className="thumbnail"
          src={`https://img.youtube.com/vi/${video.url}/hqdefault.jpg`}
          alt=""
          loading="lazy"
        />
        <span className="thumbnail-badge">YouTube</span>
      </div>
      <div className="video-card-body">
        <div className="avatar" aria-hidden="true">
          {(video.username || 'S').slice(0, 1).toUpperCase()}
        </div>
        <div className="video-card-copy">
          <h3>{video.title || '제목 없는 영상'}</h3>
          <p className="channel-name">{video.username || '알 수 없는 사용자'}</p>
          <p className="meta">조회수 {formatViews(video.view)}회</p>
        </div>
      </div>
    </Link>
  );
}

function Main() {
  const [uploads, setUploads] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;

    async function fetchUploads() {
      try {
        const snapshot = await getDocs(collection(db, 'uploads'));
        if (!active) return;
        setUploads(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
        setStatus('ready');
      } catch (error) {
        console.error(error);
        if (active) setStatus('error');
      }
    }

    fetchUploads();
    return () => { active = false; };
  }, []);

  const visibleUploads = useMemo(() => {
    const normalized = search.trim().toLocaleLowerCase('ko-KR');
    const sorted = [...uploads].sort((a, b) => (Number(b.view) || 0) - (Number(a.view) || 0));
    if (!normalized) return sorted;
    return sorted.filter((video) =>
      [video.title, video.username, video.description]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('ko-KR').includes(normalized))
    );
  }, [search, uploads]);

  return (
    <div className="app-shell">
      <Up searchValue={search} onSearchChange={setSearch} showSearch />

      <main className="page-content home-page">
        <section className="hero-strip">
          <div>
            <span className="eyebrow">SINGGUL VIDEO</span>
            <h1>가볍게 올리고,<br />바로 함께 보는 영상 공간.</h1>
          </div>
          <p>좋아하는 YouTube 영상을 링크로 등록하고 한 곳에서 발견하세요.</p>
        </section>

        <section className="feed-section" aria-labelledby="feed-title">
          <div className="section-heading">
            <div>
              <span className="section-kicker">DISCOVER</span>
              <h2 id="feed-title">지금 볼 영상</h2>
            </div>
            {status === 'ready' && <span className="result-count">{visibleUploads.length}개</span>}
          </div>

          {status === 'loading' && (
            <div className="video-grid" aria-label="영상 불러오는 중">
              {Array.from({ length: 8 }).map((_, index) => <div className="video-skeleton" key={index} />)}
            </div>
          )}

          {status === 'error' && (
            <div className="state-panel">
              <span className="state-icon">!</span>
              <h3>영상을 불러오지 못했습니다.</h3>
              <p>잠시 후 페이지를 새로고침해 주세요.</p>
            </div>
          )}

          {status === 'ready' && visibleUploads.length > 0 && (
            <div className="video-grid">
              {visibleUploads.map((video) => <VideoCard key={video.id || video.rand} video={video} />)}
            </div>
          )}

          {status === 'ready' && visibleUploads.length === 0 && (
            <div className="state-panel">
              <span className="state-icon">⌕</span>
              <h3>{search ? '검색 결과가 없습니다.' : '아직 등록된 영상이 없습니다.'}</h3>
              <p>{search ? '다른 제목이나 채널 이름으로 검색해 보세요.' : '로그인한 뒤 첫 영상을 등록해 보세요.'}</p>
              {!search && <Link className="button button-primary" to="/upload">영상 등록하기</Link>}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Main;
