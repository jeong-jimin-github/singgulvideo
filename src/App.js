import { Navigate, Route, Routes } from 'react-router-dom';
import Main from './Main/Main';
import Login from './Login/Login';
import Register from './Register/Register';
import Upload from './Upload/Upload';
import Video from './Video/Video';
import Dashboard from './Dashboard/Dashboard';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Main />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/video/:rand" element={<Video />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
