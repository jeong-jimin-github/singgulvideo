import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import style from "./Main.module.css";
import logo from '../logo.svg';
import { collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
const firebaseConfig = {
  apiKey: "AIzaSyDOjM2L8Bz-BLEcWwspNmIh01HnB3YJrZw",
  authDomain: "video-e6628.firebaseapp.com",
  projectId: "video-e6628",
  storageBucket: "video-e6628.appspot.com",
  messagingSenderId: "43014284729",
  appId: "1:43014284729:web:d3f45b82aaf7d4b4764268",
  measurementId: "G-T5KJS3QFBT"
};
// Firestore 초기화
const app = initializeApp(firebaseConfig);
// Firestore 초기화
const db = getFirestore(app);

function Main() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');


  const [uploads, setUploads] = useState([]);
  const db = getFirestore();
  useEffect(() => {
    const fetchUploads = async () => {
      const querySnapshot = await getDocs(collection(db, 'uploads'));
      const uploadsData = querySnapshot.docs.map(doc => doc.data());
      setUploads(uploadsData);
    };
  
    fetchUploads();
  }, []);
  
  const handleLogout = async () => {
    try {
      await signOut(getAuth());
      setUser(null);
      setUsername('');
    } catch (error) {
      console.error(error);
    }
  };

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

  const goVideo = (rand) => {
    window.location.href = '/video/' + rand;
  }
  const goLogin = () => {
    window.location.href = '/login';
  }
  const upload = () => {
    window.location.href = '/upload';
  }
  return (
    <div className="App">
      <header className="App-header">
        <img className={style.logo} src={logo} width={300} />
        <div className="button-container">
          {user ? (
            <>
                          <button onClick={upload} className={style.upload}>업로드</button>
              <button onClick={handleLogout} className={style.login}>{username}</button>
            </>
          ) : (
            <>
              <button onClick={goLogin} className={style.login}>로그인</button>
            </>
          )}
         <div className={style.uploadsContainer}>
  {uploads.map((upload, index) => (
    <div onClick={() => goVideo(upload.rand)} className={style.video} key={index}>
      <img height={200} src={"https://img.youtube.com/vi/" + upload.url + "/0.jpg"} width={300} />
      <p>{upload.title}</p>
      <p>업로드: {upload.username}</p>
    </div>
  ))}
</div>
        </div>
      </header>
    </div>
  );
  
}

export default Main;