import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';
import style from "./Video.module.css";
function Video() {
    const  rand = useParams()["*"];
    console.log(rand);
    const [videoData, setVideoData] = useState(null);
    const db = getFirestore();
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
        return (
            <div className={style.video}>
              {videoData && (
                <>
                  <iframe
                    width="560"
                    height="315"
                    src={`https://www.youtube.com/embed/${videoData.url}`}
                    title="YouTube video player"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <h2>{videoData.title}</h2>
                  <p>업로드: {videoData.username}</p>
                  <p>설명: {videoData.description}</p>
                </>
              )}
            </div>
          );
}

export default Video;