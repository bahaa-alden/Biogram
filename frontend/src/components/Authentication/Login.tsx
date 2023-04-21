import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { useReducer, useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import axios from 'axios';
import {
  InputAction,
  authState,
  InputActionKind,
  initialState,
} from '../../types/auth';
import Cookies from 'js-cookie';
import { chatState } from '../../Context/ChatProvider';
import { storage } from '../../utils/storage';

function reducer(state: authState, action: InputAction) {
  switch (action.type) {
    case InputActionKind.CHANGE_EMAIL:
      return { ...state, email: action.payload };
    case InputActionKind.CHANGE_PASSWORD:
      return { ...state, password: action.payload };
    default:
      throw new Error();
  }
}

function Login({ bg, bgS }: any) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { setUser } = chatState();

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);

      const res = await axios({
        method: 'POST',
        url: '/api/v1/users/login',
        data: {
          email: state.email,
          password: state.password,
        },
      });

      if (res.data.status === 'success') {
        toast({
          title: 'Logged in',
          description: ' you are Logged in now',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'bottom',
        });
        const userInfo = res.data.data.user;
        storage.storeToken(res.data.token);
        setUser(userInfo);
        setTimeout(function () {
          navigate('/chats');
          setLoading(false);
        }, 100);
      }
    } catch (err: any) {
      toast({
        status: 'error',
        title: 'Error',
        description: err.response.data.message,
        duration: 2500,
        isClosable: true,
        position: 'bottom',
      });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submitHandler}>
      <VStack bg={bg} spacing="5px">
        <FormControl id="email" isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            placeholder="Enter Your Email"
            type={'email'}
            value={state.email}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_EMAIL,
                payload: e.target.value,
              });
            }}
          />
        </FormControl>
        <FormControl id="password" isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            placeholder="Enter Your Password"
            value={state.password}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_PASSWORD,
                payload: e.target.value,
              });
            }}
            type="password"
          />
        </FormControl>
        <Button
          colorScheme="blue"
          bg={bgS}
          width={'100%'}
          style={{ marginTop: '15px', marginBottom: '5px' }}
          isLoading={loading}
          type="submit"
        >
          Log in
        </Button>
      </VStack>
    </form>
  );
}

export default Login;
