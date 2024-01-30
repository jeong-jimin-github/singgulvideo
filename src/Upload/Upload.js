import { useState } from 'react';
import style from "./Upload.module.css";
import { collection, addDoc } from 'firebase/firestore'; // Firestore의 collection과 addDoc 함수를 가져옵니다.
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useEffect } from 'react';
import logo from '../logo.svg';
import Footer from '../Footer.js';
function Upload() {
    const [urlv, setUrl] = useState('');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [username, setUsername] = useState('');
    const [user, setUser] = useState(null);
    const db = getFirestore();
    const rand = Math.random().toString(16).substr(2, 8);
  const view = 0;
    function extractVideoId(url) {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        return urlObj.pathname.slice(1);
      } else if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
        if (urlObj.pathname === '/watch') {
          return urlObj.searchParams.get('v');
        } else if (urlObj.pathname.startsWith('/embed/')) {
          return urlObj.pathname.slice(7);
        }
      }
      return null;
    }
    useEffect(() => {
        const auth = getAuth();
        onAuthStateChanged(auth, async (user) => {
          setUser(user);
          if (user) {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              setUsername(docSnap.data().username);
            } else {
              console.log("No such document!");
            }
          }
        });
      }, []);
    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = extractVideoId(urlv);
        // Perform any necessary validation or data processing here
        console.log('Submitted:', { url, title, description });
      
        try {
          const docRef = await addDoc(collection(db, 'uploads'), {
            url,
            title,
            description,
            username,
            rand,
            view
          });
          console.log('업로드 완료: ', docRef.id);
            window.location.href = '/';
        } catch (e) {
          console.error('업로드 실패: ', e);
        }
      };

      const gohome = () => {
        window.location.href = '/';
      }
      

    return (
        <>        <img onClick={gohome} className={style.logo} src={logo} width={300} /><form onSubmit={handleSubmit}>
        <h1>영상 업로드</h1>
        <label>
          유튜브 영상 주소:
          <input type="text" value={urlv} onChange={(e) => setUrl(e.target.value)} />
        </label>
        <br />
        <label>
          제목:
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <br />
        <label>
          설명:
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        <br />
        <button type="submit">업로드</button>

      </form><Footer /></>
    );
}

export default Upload;