// `@chakra-ui/theme` is a part of the base install with `@chakra-ui/react`
import axios from 'axios';
import Cookies from 'js-cookie';
import { useEffect } from 'react';
import { Route, Routes, useNavigate } from 'react-router-dom';
import ChatPage from '../Pages/ChatPage';
import HomePage from '../Pages/HomePage';
import Styles from './App.module.css';
import { chatState } from '../Context/ChatProvider';
import ProtectedRoutes from '../utils/ProtectedRoutes';
import { Button, useColorMode, useColorModeValue } from '@chakra-ui/react';

function App() {
  const bg = useColorModeValue('rgb(26, 193, 222)', 'rgb(1, 12, 20)');

  return (
    <div className={Styles.App} style={{ background: bg }}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/chats" element={<ChatPage />} />
        </Route>
      </Routes>
    </div>
  );
}
export default App;
