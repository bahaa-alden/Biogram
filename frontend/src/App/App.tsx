import { Route, Routes } from 'react-router-dom';
import ChatPage from '../Pages/ChatPage';
import HomePage from '../Pages/HomePage';
import Styles from './App.module.css';
import AuthenticatedRoute from '../utils/AuthenticatedRoute';
import { useColorModeValue } from '@chakra-ui/react';
import NotAuthenticatedRoute from '../utils/NotAuthenticatedRoute';

function App() {
  const bg = useColorModeValue('brand.50', 'dark.bg');

  return (
    <div className={Styles.App} style={{ background: bg }}>
      <Routes>
        <Route path="/">
          <Route element={<NotAuthenticatedRoute />}>
            <Route path="" element={<HomePage />} />
          </Route>
          <Route element={<AuthenticatedRoute />}>
            <Route path="chats" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
    </div>
  );
}
export default App;
