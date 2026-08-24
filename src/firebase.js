import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDOjM2L8Bz-BLEcWwspNmIh01HnB3YJrZw',
  authDomain: 'video-e6628.firebaseapp.com',
  projectId: 'video-e6628',
  storageBucket: 'video-e6628.appspot.com',
  messagingSenderId: '43014284729',
  appId: '1:43014284729:web:d3f45b82aaf7d4b4764268',
  measurementId: 'G-T5KJS3QFBT',
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
