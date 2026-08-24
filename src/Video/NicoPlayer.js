import { useEffect, useRef, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, onSnapshot, query, serverTimestamp, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import style from './NicoPlayer.module.css';

let youtubeApiPromise;

function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);

  if (!youtubeApiPromise) {
    youtubeApiPromise = new Promise((resolve, reject) => {
      const previousReady = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof previousReady === 'function') previousReady();
        resolve(window.YT);
      };

      let script = document.querySelector('script[data-singgul-youtube-api]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.dataset.singgulYoutubeApi = 'true';
        script.onerror = () => reject(new Error('YouTube IFrame API를 불러오지 못했습니다.'));
        document.head.appendChild(script);
      }
    });
  }

  return youtubeApiPromise;
}

function formatTime(value) {
  const seconds = Math.max(0, Math.floor(Number(value) || 0));
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${minutes}:${String(rest).padStart(2, '0')}`;
}

function NicoPlayer({ videoId, videoRand, title }) {
  const frameRef = useRef(null);
  const playerMountRef = useRef(null);
  const playerRef = useRef(null);
  const commentsRef = useRef([]);
  const playingRef = useRef(false);
  const currentTimeRef = useRef(0);
  const lastTimeRef = useRef(0);
  const seenRef = useRef(new Set());
  const laneCursorRef = useRef(0);
  const renderSequenceRef = useRef(0);

  const [playerReady, setPlayerReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState([]);
  const [activeComments, setActiveComments] = useState([]);
  const [commentsVisible, setCommentsVisible] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [commentStatus, setCommentStatus] = useState('loading');
  const [commentError, setCommentError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [user, setUser] = useState(undefined);
  const [username, setUsername] = useState('');
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);

  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser || null);
      setUsername('');
      if (!nextUser) return;

      try {
        const snapshot = await getDoc(doc(db, 'users', nextUser.uid));
        setUsername(snapshot.exists() ? snapshot.data().username : nextUser.email || '사용자');
      } catch (error) {
        console.error(error);
        setUsername(nextUser.email || '사용자');
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setCommentStatus('loading');
    setCommentError('');

    const commentsQuery = query(collection(db, 'comments'), where('videoRand', '==', videoRand));
    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const nextComments = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((item) => Number.isFinite(Number(item.time)) && typeof item.text === 'string')
          .sort((a, b) => Number(a.time) - Number(b.time));
        setComments(nextComments);
        setCommentStatus('ready');
      },
      (error) => {
        console.error(error);
        setCommentStatus('error');
        setCommentError('댓글을 불러오지 못했습니다.');
      }
    );

    return unsubscribe;
  }, [videoRand]);

  useEffect(() => {
    let cancelled = false;

    setPlayerReady(false);
    setPlayerError('');
    setCurrentTime(0);
    setDuration(0);
    setActiveComments([]);
    seenRef.current.clear();
    lastTimeRef.current = 0;

    loadYouTubeApi()
      .then((YT) => {
        if (cancelled || !playerMountRef.current) return;

        playerRef.current = new YT.Player(playerMountRef.current, {
          width: '100%',
          height: '100%',
          videoId,
          playerVars: {
            autoplay: 1,
            rel: 0,
            playsinline: 1,
            fs: 0,
          },
          events: {
            onReady: (event) => {
              if (cancelled) return;
              playerRef.current = event.target;
              const iframe = event.target.getIframe?.();
              if (iframe) iframe.title = title || 'Singgul Video';
              setDuration(event.target.getDuration?.() || 0);
              setPlayerReady(true);
            },
            onStateChange: (event) => {
              if (cancelled) return;
              const isPlaying = event.data === YT.PlayerState.PLAYING;
              setPlaying(isPlaying);
              if (event.data === YT.PlayerState.ENDED) setPlaying(false);
            },
            onError: () => {
              if (!cancelled) setPlayerError('YouTube 영상을 재생하지 못했습니다.');
            },
          },
        });
      })
      .catch((error) => {
        console.error(error);
        if (!cancelled) setPlayerError('YouTube 플레이어를 불러오지 못했습니다.');
      });

    return () => {
      cancelled = true;
      setPlaying(false);
      try {
        playerRef.current?.destroy?.();
      } catch (error) {
        console.error(error);
      }
      playerRef.current = null;
    };
  }, [title, videoId]);

  useEffect(() => {
    if (!playerReady) return undefined;

    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;

      const now = Number(player.getCurrentTime()) || 0;
      const previous = lastTimeRef.current;
      const jumped = Math.abs(now - previous) > 2;
      const wentBack = now < previous - 0.6;

      currentTimeRef.current = now;
      setCurrentTime(now);

      const nextDuration = Number(player.getDuration?.()) || 0;
      if (nextDuration) setDuration(nextDuration);

      if (jumped || wentBack) {
        seenRef.current.clear();
        setActiveComments([]);
      }

      if (playingRef.current) {
        const from = now - (jumped || wentBack ? 0.35 : 1.1);
        const to = now + 0.18;
        const newItems = commentsRef.current.filter((comment) => {
          const commentTime = Number(comment.time);
          return commentTime >= from && commentTime <= to && !seenRef.current.has(comment.id);
        });

        if (newItems.length) {
          const rendered = newItems.map((comment) => {
            seenRef.current.add(comment.id);
            const lane = laneCursorRef.current % 9;
            laneCursorRef.current += 1;
            renderSequenceRef.current += 1;
            return {
              ...comment,
              lane,
              renderKey: `${comment.id}-${renderSequenceRef.current}`,
            };
          });
          setActiveComments((current) => [...current.slice(-40), ...rendered]);
        }
      }

      lastTimeRef.current = now;
    }, 140);

    return () => window.clearInterval(timer);
  }, [playerReady]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === frameRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const removeComment = (renderKey) => {
    setActiveComments((current) => current.filter((comment) => comment.renderKey !== renderKey));
  };

  const toggleComments = () => {
    setCommentsVisible((visible) => {
      if (visible) setActiveComments([]);
      return !visible;
    });
  };

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (frameRef.current?.requestFullscreen) {
        await frameRef.current.requestFullscreen();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const text = commentText.trim();
    if (!text || !user || submitting) return;

    const time = Math.max(0, Number(playerRef.current?.getCurrentTime?.()) || currentTimeRef.current || 0);
    setSubmitting(true);
    setCommentError('');

    try {
      await addDoc(collection(db, 'comments'), {
        videoRand,
        videoId,
        time: Math.round(time * 10) / 10,
        text,
        uid: user.uid,
        username: username || user.email || '사용자',
        createdAt: serverTimestamp(),
      });
      setCommentText('');
    } catch (error) {
      console.error(error);
      setCommentError('댓글 등록에 실패했습니다. Firestore 권한을 확인해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={style.root} aria-label="실시간 댓글 플레이어">
      <div className={style.frame} ref={frameRef}>
        <div className={style.player} ref={playerMountRef} />

        {commentsVisible && (
          <div className={style.overlay} aria-hidden="true">
            {activeComments.map((comment) => (
              <span
                className={style.flyingComment}
                key={comment.renderKey}
                style={{
                  top: `${6 + comment.lane * 9.2}%`,
                  animationPlayState: playing ? 'running' : 'paused',
                }}
                onAnimationEnd={() => removeComment(comment.renderKey)}
              >
                {comment.text}
              </span>
            ))}
          </div>
        )}

        <div className={style.floatingControls}>
          <button type="button" className={style.overlayButton} onClick={toggleComments} aria-pressed={commentsVisible}>
            댓글 {commentsVisible ? 'ON' : 'OFF'}
          </button>
          <button type="button" className={style.overlayButton} onClick={toggleFullscreen}>
            {fullscreen ? '축소' : '전체화면'}
          </button>
        </div>

        {!playerReady && !playerError && <div className={style.loading}>플레이어 불러오는 중…</div>}
        {playerError && <div className={style.playerError}>{playerError}</div>}
      </div>

      <div className={style.commentBar}>
        <div className={style.commentStats}>
          <span className={style.liveDot} />
          <strong>{commentStatus === 'ready' ? `${comments.length} 댓글` : '댓글 연결 중'}</strong>
          <span>{formatTime(currentTime)}{duration ? ` / ${formatTime(duration)}` : ''}</span>
        </div>

        {user ? (
          <form className={style.composer} onSubmit={handleSubmit}>
            <span className={style.timestamp}>{formatTime(currentTime)}</span>
            <input
              value={commentText}
              onChange={(event) => setCommentText(event.target.value)}
              placeholder="지금 이 장면에 댓글 남기기"
              maxLength={80}
              aria-label="실시간 댓글"
            />
            <button type="submit" disabled={!commentText.trim() || submitting || !playerReady}>
              {submitting ? '전송 중' : '전송'}
            </button>
          </form>
        ) : user === null ? (
          <p className={style.loginHint}><Link to="/login">로그인</Link>하면 현재 재생 시점에 댓글을 남길 수 있습니다.</p>
        ) : (
          <p className={style.loginHint}>로그인 상태 확인 중…</p>
        )}

        {commentError && <p className={style.errorText} role="alert">{commentError}</p>}
      </div>
    </section>
  );
}

export default NicoPlayer;
