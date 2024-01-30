import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { updateDoc, increment, getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import style from "./Video.module.css";
import logo from '../logo.svg';
import Up from '../Up.js';
import YouTube from '@u-wave/react-youtube';

function Video() {
    const  rand = useParams()["*"];
    console.log(rand);
    const [videoData, setVideoData] = useState(null);
    const db = getFirestore();
    const [randomVideos, setRandomVideos] = useState([]);

useEffect(() => {
  const fetchRandomVideos = async () => {
    const q = query(collection(db, 'uploads'));
    const querySnapshot = await getDocs(q);
    const matchedData = querySnapshot.docs.map(doc => doc.data());
    setRandomVideos(matchedData);
  };

  fetchRandomVideos();
}, []);
    useEffect(() => {
        const fetchVideoData = async () => {
          if (rand) { // rand 값이 있는 경우에만 쿼리 실행
            const q = query(collection(db, 'uploads'), where('rand', '==', rand));
            const querySnapshot = await getDocs(q);
            const matchedData = querySnapshot.docs.map(doc => doc.data());
            setVideoData(matchedData[0]);
          }
        };
      
        fetchVideoData();
      }, [rand]);
      useEffect(() => {
        const incrementViewCount = async () => {
          if (rand) {
            const q = query(collection(db, 'uploads'), where('rand', '==', rand));
            const querySnapshot = await getDocs(q);
            const doc = querySnapshot.docs[0];

            if (doc) {
              await updateDoc(doc.ref, { view: increment(1) });
            }
          }
        };

        if (rand) {
          incrementViewCount();
        }
      }, [rand]);
      const gohome = () => {
        window.location.href = '/';
      }

      const goVideo = (rand) => {
        window.location.href = `/video/${rand}`;
      }
        return (
            <><img onClick={gohome} className={style.logo} src={logo} width={300} /><Up /><div className={style.videocontainer}>
            {videoData && (
              <>
                <YouTube
                  className={style.videoplayer}
                  video={videoData.url}
                  width="1024px"
                  height="576px"
                  autoplay
                />
                <h2>{videoData.title}</h2>
                <div className={style.kb}><img width={30} style={{borderRadius: 90}} height={30} src={'https://avatar.oxro.io/avatar.svg?name=' + videoData.username} /><p style={{margin: 10}}>{videoData.username}</p></div> 
                <p>설명</p>
                <hr width={1280}></hr>
                <p>{videoData.description}</p>
              </>
            )}
          </div>    
        <div className={style.randomvideos}>
        {randomVideos.filter(video => video.rand !== videoData.rand).sort(() => Math.random() - 0.5).map((video, index) => (
  <div onClick={() => goVideo(video.rand)} key={index} className={style.videoitem} style={{ top: `${index * 300}px` }}>
    <img width={200} height={150} style={{borderRadius: 10}} src={`https://img.youtube.com/vi/${video.url}/0.jpg`} alt={video.title} />
    <h3>{video.title}</h3>
    <h4>{video.username}</h4>
  </div>
))}
            </div></>
          );
}

export default Video;