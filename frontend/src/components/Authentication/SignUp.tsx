import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react';
import { FormEvent, useEffect, useReducer, useState } from 'react';
import { useToast } from '@chakra-ui/react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  InputAction,
  InputActionKind,
  authState,
  initialState,
} from '../../types/auth';
import Cookies from 'js-cookie';
import { chatState } from '../../Context/ChatProvider';
import { storage } from '../../utils/storage';

function reducer(state: authState, action: InputAction) {
  switch (action.type) {
    case InputActionKind.CHANGE_NAME:
      return { ...state, name: action.payload };
    case InputActionKind.CHANGE_EMAIL:
      return { ...state, email: action.payload };
    case InputActionKind.CHANGE_PASSWORD:
      return { ...state, password: action.payload };
    case InputActionKind.CHANGE_PASSWORD_CONFIRM:
      return { ...state, passwordConfirm: action.payload };
    case InputActionKind.SET_IMAGE:
      return { ...state, pic: action.payload };
    default:
      throw new Error();
  }
}

function SignUp({ bg, bgS }: any) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { setUser } = chatState();

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (state.password !== state.passwordConfirm) {
        toast({
          title: 'Passwords are not the same',
          status: 'error',
          isClosable: true,
          duration: 1000,
        });
        setLoading(false);
        return;
      }
      const res = await axios({
        method: 'POST',
        url: '/api/v1/users/signup',
        data: {
          email: state.email,
          name: state.name,
          password: state.password,
        },
      });
      const token = res.data.token;

      if (state.pic !== '') {
        const PicData = new FormData();
        PicData.append('photo', state.pic);
        const pic = await axios({
          method: 'PATCH',
          url: '/api/v1/users/updateMe',
          headers: { Authorization: `Bearer ${token}` },
          data: PicData,
        });
      }
      if (res.data.status === 'success') {
        toast({
          title: 'Account created',
          description: 'Congratulation you are one of our users',
          status: 'success',
          duration: 1500,
          isClosable: true,
          position: 'bottom',
        });
        const cookieOptions = {
          expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          httpOnly: false,
          secure: true,
        };
        const userInfo = res.data.data.user;
        storage.storeToken(res.data.token);
        setUser(userInfo);
        navigate('/chats');
        setLoading(false);
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
    <VStack bg={bg} spacing="5px">
      <form onSubmit={submitHandler}>
        <FormControl key={'name'} id="name" isRequired>
          <FormLabel>Name</FormLabel>
          <Input
            placeholder="Enter Your Name"
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_NAME,
                payload: e.target.value,
              });
            }}
          />
        </FormControl>
        <FormControl id="email-sign" isRequired>
          <FormLabel>Email</FormLabel>
          <Input
            type={'email'}
            placeholder="Enter Your Email"
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_EMAIL,
                payload: e.target.value,
              });
            }}
          />
        </FormControl>
        <FormControl id="password-sign" isRequired>
          <FormLabel>Password</FormLabel>
          <Input
            placeholder="Enter Your Password"
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_PASSWORD,
                payload: e.target.value,
              });
            }}
            type="password"
          />
        </FormControl>
        <FormControl id="passwordConfirm" isRequired>
          <FormLabel>Password Confirm</FormLabel>
          <Input
            placeholder="Password Confirm"
            type="password"
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_PASSWORD_CONFIRM,
                payload: e.target.value,
              });
            }}
          />
        </FormControl>
        <FormControl id="pic">
          <FormLabel>Upload Your Picture</FormLabel>
          <Input
            type="file"
            accept="image/*"
            p={2}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.SET_IMAGE,
                payload: e.target.files ? e.target.files[0] : initialState.pic,
              });
            }}
          />
        </FormControl>
        <Button
          width={'100%'}
          bg={bgS}
          colorScheme={'blue'}
          style={{ marginTop: '15px' }}
          isLoading={loading}
          type="submit"
        >
          Sign Up
        </Button>
      </form>
    </VStack>
  );
}

export default SignUp;
