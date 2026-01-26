import { Box, Text, useColorModeValue } from '@chakra-ui/react';

interface EmptyStateProps {
  color: string;
}

export function EmptyState({ color }: EmptyStateProps) {
  const emptyStateBg = useColorModeValue(
    'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
    'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)'
  );
  const emptyStateCircle1 = useColorModeValue('brand.100', 'brand.900');
  const emptyStateCircle2 = useColorModeValue('purple.100', 'purple.900');
  const emptyStateTextColor = useColorModeValue('gray.600', 'gray.300');

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      h="100%"
      w="100%"
      flexDirection="column"
      gap={{ base: 6, md: 8, lg: 10 }}
      bg={emptyStateBg}
      p={{ base: 6, md: 8, lg: 10 }}
      position="relative"
      overflow="hidden"
    >
      {/* Decorative circles */}
      <Box
        position="absolute"
        top="-50px"
        right="-50px"
        w="200px"
        h="200px"
        borderRadius="full"
        bg={emptyStateCircle1}
        opacity={0.3}
        filter="blur(40px)"
      />
      <Box
        position="absolute"
        bottom="-30px"
        left="-30px"
        w="150px"
        h="150px"
        borderRadius="full"
        bg={emptyStateCircle2}
        opacity={0.3}
        filter="blur(40px)"
      />
      
      <Box
        fontSize={{ base: '80px', md: '100px', lg: '120px' }}
        filter="drop-shadow(0 4px 8px rgba(0,0,0,0.1))"
        animation="float 3s ease-in-out infinite"
      >
        💬
      </Box>
      <Box textAlign="center" maxW="500px" zIndex={1}>
        <Text
          color={color}
          fontSize={{ base: '24px', md: '28px', lg: '32px' }}
          fontFamily="work sans"
          fontWeight="800"
          mb={3}
        >
          Welcome to Bio-Gram
        </Text>
        <Text
          color={emptyStateTextColor}
          fontSize={{ base: '15px', md: '16px', lg: '17px' }}
          fontWeight="500"
          lineHeight="1.6"
        >
          Select a conversation from the sidebar to start chatting or create a new group to connect with others
        </Text>
      </Box>
      
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
        `}
      </style>
    </Box>
  );
}

