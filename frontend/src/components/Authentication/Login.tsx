import {
  FormControl,
  FormLabel,
  Input,
  VStack,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { useReducer } from 'react';
import {
  InputAction,
  authState,
  InputActionKind,
  initialState,
} from '../../types/auth';
import { useLogin } from '../../hooks/mutations/useAuthMutations';

function reducer(state: authState, action: InputAction): authState {
  switch (action.type) {
    case InputActionKind.CHANGE_EMAIL:
      return { ...state, email: action.payload as string };
    case InputActionKind.CHANGE_PASSWORD:
      return { ...state, password: action.payload as string };
    default:
      return state;
  }
}

interface LoginProps {
  bg: string;
  bgS: string;
}

function Login({ bg, bgS }: LoginProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const loginMutation = useLogin();

  const submitHandler = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({
      email: state.email.trim(),
      password: state.password.trim(),
    });
  };

  return (
    <form onSubmit={submitHandler} aria-label="Login form">
      <VStack bg={bg} spacing="5px">
        <FormControl id="email" isRequired>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input
            id="email"
            placeholder="Enter Your Email"
            type={'email'}
            value={state.email}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_EMAIL,
                payload: e.target.value,
              });
            }}
            aria-label="Email input"
            aria-required="true"
          />
        </FormControl>
        <FormControl id="password" isRequired>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            placeholder="Enter Your Password"
            type={'password'}
            value={state.password}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_PASSWORD,
                payload: e.target.value,
              });
            }}
            aria-label="Password input"
            aria-required="true"
          />
        </FormControl>
        <Button
          bg={bgS}
          color="white"
          width="100%"
          style={{ marginTop: 15 }}
          type="submit"
          isLoading={loginMutation.isPending}
          loadingText="Logging in..."
          aria-label="Submit login form"
        >
          Login
        </Button>
      </VStack>
    </form>
  );
}

export default Login;
