import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, onSnapshot, query, serverTimestamp, setDoc, where } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import style from './VideoSocial.module.css';

function getCreatorId(video) {
  if (video.uploaderUid) return `uid_${video.uploaderUid}`;
  return `legacy_${encodeURIComponent(video.username || 'unknown')}`;
}

function VideoSocial({ video, viewCount }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(undefined);
  const [subscribers, setSubscribers] = useState([]);
  const [reactions, setReactions] = useState([]);
  const [busy, setBusy] = useState('');
  const creatorId = getCreatorId(video);

  useEffect(() => onAuthStateChanged(auth, (nextUser) => setUser(nextUser || null)), []);

  useEffect(() => {
    const subscriptionQuery = query(collection(db, 'subscriptions'), where('creatorId', '==', creatorId));
    return onSnapshot(subscriptionQuery, (snapshot) => {
      setSubscribers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, console.error);
  }, [creatorId]);

  useEffect(() => {
    const reactionQuery = query(collection(db, 'videoReactions'), where('videoRand', '==', video.rand));
    return onSnapshot(reactionQuery, (snapshot) => {
      setReactions(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })));
    }, console.error);
  }, [video.rand]);

  const myReaction = user ? reactions.find((item) => item.uid === user.uid)?.reaction || '' : '';
  const subscribed = Boolean(user && subscribers.some((item) => item.uid === user.uid));
  const likes = reactions.filter((item) => item.reaction === 'like').length;
  const dislikes = reactions.filter((item) => item.reaction === 'dislike').length;
  const ownChannel = Boolean(user && video.uploaderUid && user.uid === video.uploaderUid);

  const requireLogin = () => {
    if (user) return true;
    navigate('/login');
    return false;
  };

  const toggleSubscription = async () => {
    if (!requireLogin() || busy) return;
    const ref = doc(db, 'subscriptions', `${user.uid}__${creatorId}`);
    setBusy('subscription');
    try {
      if (subscribed) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          uid: user.uid,
          creatorId,
          creatorUid: video.uploaderUid || null,
          creatorName: video.username || '알 수 없는 사용자',
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBusy('');
    }
  };

  const toggleReaction = async (reaction) => {
    if (!requireLogin() || busy) return;
    const ref = doc(db, 'videoReactions', `${user.uid}__${video.rand}`);
    setBusy(reaction);
    try {
      if (myReaction === reaction) {
        await deleteDoc(ref);
      } else {
        await setDoc(ref, {
          uid: user.uid,
          videoRand: video.rand,
          videoId: video.id || null,
          reaction,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className={style.socialRow}>
      <div className={style.creatorBlock}>
        <div className={style.avatar} aria-hidden="true">
          {(video.username || 'S').slice(0, 1).toUpperCase()}
        </div>
        <div className={style.creatorCopy}>
          <strong>{video.username || '알 수 없는 사용자'}</strong>
          <span>구독자 {subscribers.length.toLocaleString('ko-KR')}명 · 조회수 {Number(viewCount || 0).toLocaleString('ko-KR')}회</span>
        </div>
        {!ownChannel && (
          <button
            type="button"
            className={`${style.subscribeButton} ${subscribed ? style.subscribed : ''}`}
            onClick={toggleSubscription}
            disabled={busy === 'subscription'}
          >
            {subscribed ? '구독중' : '구독'}
          </button>
        )}
      </div>

      <div className={style.reactionGroup} aria-label="영상 평가">
        <button
          type="button"
          className={myReaction === 'like' ? style.activeReaction : ''}
          onClick={() => toggleReaction('like')}
          disabled={Boolean(busy)}
          aria-pressed={myReaction === 'like'}
        >
          <span aria-hidden="true">👍</span> {likes.toLocaleString('ko-KR')}
        </button>
        <button
          type="button"
          className={myReaction === 'dislike' ? style.activeReaction : ''}
          onClick={() => toggleReaction('dislike')}
          disabled={Boolean(busy)}
          aria-pressed={myReaction === 'dislike'}
        >
          <span aria-hidden="true">👎</span> {dislikes.toLocaleString('ko-KR')}
        </button>
      </div>
    </div>
  );
}

export { getCreatorId };
export default VideoSocial;
