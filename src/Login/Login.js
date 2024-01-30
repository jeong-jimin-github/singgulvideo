import { useState } from 'react';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import style from "./Login.module.css";
import logo from '../logo.svg';
import Footer from '../Footer.js';
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const auth = getAuth();

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // 로그인 성공 후, 메인 화면으로 이동합니다.
      window.location.href = '/';
    } catch (error) {
      console.error(error);
    }
  };
  const gohome = () => {
    window.location.href = '/';
  }

  return (
    <><img onClick={gohome} className={style.logo} src={logo} width={300} /><div className={style.App}>
      <form onSubmit={handleSubmit}>
      <h1>로그인</h1>
        <div className={style.formgroup}>
          <label htmlFor="exampleInputEmail1">이메일 주소</label><br></br>
          <input type="email" className={style.formcontrol} id="exampleInputEmail1" aria-describedby="emailHelp" placeholder="이메일 입력" onChange={e => setEmail(e.target.value)} />
        </div>
        <div className="form-group">
          <label htmlFor="exampleInputPassword1">비밀번호</label><br></br>
          <input type="password" className={style.formcontrol} id="exampleInputPassword1" placeholder="비밀번호 입력" onChange={e => setPassword(e.target.value)} />
          <br></br><br></br><a href="/register">계정이 없으신가요?</a>
        </div>
        <br></br>
        <button type="submit" className={style.btnprimary}>로그인</button>
      </form>

    </div>
    <Footer /></>
  );
}

export default Login;