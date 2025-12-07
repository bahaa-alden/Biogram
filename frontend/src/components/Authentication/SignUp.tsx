import {
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { FormEvent, useReducer } from 'react';
import {
  InputAction,
  InputActionKind,
  authState,
  initialState,
} from '../../types/auth';
import { useSignup } from '../../hooks/mutations/useAuthMutations';
import { useUpdateMe } from '../../hooks/mutations/useUserMutations';
import { storage } from '../../utils/storage';

function reducer(state: authState, action: InputAction): authState {
  switch (action.type) {
    case InputActionKind.CHANGE_NAME:
      return { ...state, name: action.payload as string };
    case InputActionKind.CHANGE_EMAIL:
      return { ...state, email: action.payload as string };
    case InputActionKind.CHANGE_PASSWORD:
      return { ...state, password: action.payload as string };
    case InputActionKind.CHANGE_PASSWORD_CONFIRM:
      return { ...state, passwordConfirm: action.payload as string };
    case InputActionKind.SET_IMAGE:
      return { ...state, pic: action.payload };
    default:
      return state;
  }
}

interface SignUpProps {
  bg: string;
  bgS: string;
}

function SignUp({ bg, bgS }: SignUpProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const toast = useToast();
  const signupMutation = useSignup();
  const updateMeMutation = useUpdateMe();

  const submitHandler = async (e: FormEvent) => {
    e.preventDefault();
    
    if (state.password.trim() !== (state.passwordConfirm || '').trim()) {
      toast({
        title: 'Passwords are not the same',
        status: 'error',
        isClosable: true,
        duration: 1000,
      });
      return;
    }

    signupMutation.mutate(
      {
      email: state.email.trim(),
      name: (state.name || '').trim(),
      password: state.password.trim(),
      passwordConfirm: (state.passwordConfirm || '').trim(),
      },
      {
        onSuccess: async (response) => {
          if (response?.status === 'success' && state.pic && state.pic !== '' && typeof state.pic !== 'string') {
            // Upload photo after signup
            const picData = new FormData();
            picData.append('photo', state.pic);
            updateMeMutation.mutate(picData as any);
          }
        },
      }
    );
  };

  return (
    <VStack bg={bg} spacing="5px">
      <form onSubmit={submitHandler} style={{ width: '100%' }} aria-label="Sign up form">
        <FormControl pb="1" key={'name'} id="name" isRequired>
          <FormLabel htmlFor="name">Name</FormLabel>
          <Input
            id="name"
            placeholder="Enter Your Name"
            value={state.name}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_NAME,
                payload: e.target.value,
              });
            }}
            aria-required="true"
            aria-label="Name input"
          />
        </FormControl>
        <FormControl pb="1" id="email-sign" isRequired>
          <FormLabel htmlFor="email-sign">Email</FormLabel>
          <Input
            id="email-sign"
            type={'email'}
            placeholder="Enter Your Email"
            value={state.email}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_EMAIL,
                payload: e.target.value,
              });
            }}
            aria-required="true"
            aria-label="Email input"
          />
        </FormControl>
        <FormControl pb="1" id="password-sign" isRequired>
          <FormLabel htmlFor="password-sign">Password</FormLabel>
          <Input
            id="password-sign"
            placeholder="Enter Your Password"
            value={state.password}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_PASSWORD,
                payload: e.target.value,
              });
            }}
            type="password"
            aria-required="true"
            aria-label="Password input"
          />
        </FormControl>
        <FormControl pb="2" id="passwordConfirm" isRequired>
          <FormLabel htmlFor="passwordConfirm">Password Confirm</FormLabel>
          <Input
            id="passwordConfirm"
            placeholder="Password Confirm"
            type="password"
            value={state.passwordConfirm}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.CHANGE_PASSWORD_CONFIRM,
                payload: e.target.value,
              });
            }}
            aria-required="true"
            aria-label="Password confirmation input"
          />
        </FormControl>
        <FormControl pb="1" id="pic">
          <FormLabel
            px="1"
            borderRadius={'2'}
            cursor={'pointer'}
            textDecoration={'underline'}
            color="rgb(27 145 166)"
            width={'fit-content'}
            _hover={{ bg: '#2b6cb0', color: 'white' }}
            htmlFor="pic-input"
          >
            Upload Your Picture
          </FormLabel>
          <Input
            id="pic-input"
            display={'none'}
            type="file"
            accept="image/*"
            p={2}
            onChange={(e) => {
              dispatch({
                type: InputActionKind.SET_IMAGE,
                payload: e.target.files && e.target.files[0] ? e.target.files[0] : (initialState.pic || ''),
              });
            }}
            aria-label="Profile picture upload"
          />
        </FormControl>
        <Button
          width={'100%'}
          bg={bgS}
          colorScheme={'blue'}
          style={{ marginTop: '15px' }}
          isLoading={signupMutation.isPending || updateMeMutation.isPending}
          loadingText="Creating account..."
          type="submit"
          aria-label="Submit sign up form"
        >
          Sign Up
        </Button>
      </form>
    </VStack>
  );
}

export default SignUp;
