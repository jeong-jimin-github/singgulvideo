import React, { useState } from 'react';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import logo from '../logo.svg';
import style from "./Register.module.css";
import { getFirestore, doc, setDoc } from "firebase/firestore";

const db = getFirestore();
const auth = getAuth();
function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Firestore에 uid와 username 저장
      await setDoc(doc(db, "users", user.uid), {
        username: username,
      });

      // 메인 화면으로 이동합니다.
      window.location.href = '/login';
    } catch (error) {
      console.error(error);
      setError('회원가입에 실패했습니다.');
    }
  };

  const gohome = () => {
    window.location.href = '/';
  }

  return (
    <><img onClick={gohome} className={style.logo} src={logo} width={300} /><div className={style.App}>
      <form onSubmit={handleSubmit}>
      <h1>회원가입</h1>
        <div className={style.formgroup}>
          <label htmlFor="exampleInputEmail1">이메일 주소</label><br></br>
          <input type="email" className={style.formcontrol} id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="이메일 입력" onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="exampleInputPassword1">비밀번호</label><br></br>
          <input type="password" className={style.formcontrol} id="exampleInputPassword1" placeholder="비밀번호 입력" onChange={e => setPassword(e.target.value)} />
        </div><br></br>
        <div className="form-group">
          <label htmlFor="exampleInputUsername">이름</label><br></br>
          <input className={style.formcontrol} id="exampleInputUsername" placeholder="이름 입력" onChange={e => setUsername(e.target.value)} />
        </div>
        <p>{error}</p>
        <button type="submit" className={style.btnprimary}>회원가입</button>
      </form>
    </div></>
  );
}

export default Register;