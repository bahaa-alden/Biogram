import { Box, Spinner } from '@chakra-ui/react';
import { chatState } from '../Context/ChatProvider';

function LoadingUser({ children }: any) {
  const { lo } = chatState();
  return (
    <Box width={'100vw'} height={'100vh'} position={'relative'}>
      {lo && (
        <Box
          position={'absolute'}
          width={'100%'}
          height={'100%'}
          bg="white"
          zIndex={'9999'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Spinner
            size={'lg'}
            width={{ base: '100px', md: '200px' }}
            height={{ base: '100px', md: '200px' }}
            borderWidth={'8px'}
          />
        </Box>
      )}
      {children}
    </Box>
  );
}

export default LoadingUser;
