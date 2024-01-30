import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import style from "./Main.module.css";
import logo from '../logo.svg';
import { collection, getDocs } from 'firebase/firestore';
import { initializeApp } from 'firebase/app';
import Footer from '../Footer.js';
import Up from '../Up.js';
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

function Main() {

  const [uploads, setUploads] = useState([]);
  const db = getFirestore(app);
  useEffect(() => {
    const fetchUploads = async () => {
      const querySnapshot = await getDocs(collection(db, 'uploads'));
      const uploadsData = querySnapshot.docs.map(doc => doc.data());
      setUploads(uploadsData);
    };
  
    fetchUploads();
  }, []);
  

  const goVideo = (rand) => {
    window.location.href = '/video/' + rand;
  }
  return (
    <div className="App">
      <header className="App-header">
        <img className={style.logo} src={logo} width={300} />
<Up />
         <div className={style.uploadsContainer}>
  {uploads.map((upload, index) => (
    <div onClick={() => goVideo(upload.rand)} className={style.video} key={index}>
      <img height={200} src={"https://img.youtube.com/vi/" + upload.url + "/0.jpg"} width={300} />
      <b>{upload.title}</b>
      <p>업로드: {upload.username}</p>
    </div>
  ))}
</div>
      </header>
      <Footer />
    </div>
  );
  
}

export default Main;