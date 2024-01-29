import { Route, Routes } from "react-router-dom";

import Main from './Main/Main';
import Login from './Login/Login';
import Register from './Register/Register';
import Upload from './Upload/Upload';
import Video from './Video/Video';

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<Main />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/video/*" element={<Video />} />
      </Routes>
    </div>
  );
}

export default App;