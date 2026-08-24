import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from './firebase';

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m21 21-4.35-4.35m2.35-5.15A7.5 7.5 0 1 1 4 11.5a7.5 7.5 0 0 1 15 0Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v5h14v-5" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
    </svg>
  );
}

function Up({ searchValue = '', onSearchChange, showSearch = false }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setUsername('');

      if (nextUser) {
        try {
          const snapshot = await getDoc(doc(db, 'users', nextUser.uid));
          setUsername(snapshot.exists() ? snapshot.data().username : nextUser.email || '사용자');
        } catch (error) {
          console.error(error);
          setUsername(nextUser.email || '사용자');
        }
      }

      setLoadingUser(false);
    });

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand" aria-label="Singgul Video 홈">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span className="brand-name">Singgul</span>
          <span className="brand-tag">VIDEO</span>
        </Link>

        {showSearch ? (
          <label className="search-box">
            <SearchIcon />
            <span className="sr-only">영상 검색</span>
            <input
              type="search"
              value={searchValue}
              onChange={(event) => onSearchChange?.(event.target.value)}
              placeholder="영상 또는 채널 검색"
            />
          </label>
        ) : <div className="header-spacer" />}

        <nav className="header-actions" aria-label="사용자 메뉴">
          {user && (
            <>
              <Link className="icon-button upload-shortcut" to="/dashboard" title="영상 관리">
                <DashboardIcon />
                <span>관리</span>
              </Link>
              <Link className="icon-button upload-shortcut" to="/upload" title="영상 등록">
                <UploadIcon />
                <span>업로드</span>
              </Link>
            </>
          )}

          {!loadingUser && (user ? (
            <div className="profile-menu">
              <div className="avatar small-avatar" aria-hidden="true">
                {(username || 'U').slice(0, 1).toUpperCase()}
              </div>
              <div className="profile-copy">
                <strong>{username || '사용자'}</strong>
                <button type="button" onClick={handleLogout}>로그아웃</button>
              </div>
            </div>
          ) : (
            <Link className="button button-ghost header-login" to="/login">로그인</Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default Up;
