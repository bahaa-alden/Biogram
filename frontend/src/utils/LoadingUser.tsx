import { Box, Spinner } from '@chakra-ui/react';
import { chatState } from '../Context/ChatProvider';

function LoadingUser({ children }: any) {
  const { lo } = chatState();
  return (
    <Box>
      {lo && (
        <Box bg="white" width={'100vw'} height={'100vh'} position={'relative'}>
          <Spinner
            size={'lg'}
            position={'absolute'}
            top="37%"
            left="45%"
            translateX="-50%"
            translateY="-50%"
            width={'200px'}
            height={'200px'}
          />
        </Box>
      )}
      {children}
    </Box>
  );
}

export default LoadingUser;
