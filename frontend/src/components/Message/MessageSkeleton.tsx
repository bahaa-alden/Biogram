import { Box, Skeleton, SkeletonCircle, Stack, useColorModeValue } from '@chakra-ui/react';

interface MessageSkeletonProps {
  count?: number;
}

export function MessageSkeleton({ count = 8 }: MessageSkeletonProps) {
  const bgChat = useColorModeValue('brand.50', 'gray.800');
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      width="100%"
      height="100%"
      px={{ base: 2, md: 3, lg: 4 }}
      py={{ base: 2, md: 3 }}
      gap={{ base: 3, md: 4 }}
      overflowY="hidden"
    >
      {Array.from({ length: count }).map((_, i) => {
        const isOwnMessage = i % 3 === 0; // Alternate between own and other messages
        
        return (
          <Box
            key={i}
            display="flex"
            alignItems="flex-end"
            justifyContent={isOwnMessage ? 'flex-end' : 'flex-start'}
            gap={2}
            animation={`fadeIn 0.3s ease-in ${i * 0.1}s both`}
          >
            {!isOwnMessage && (
              <SkeletonCircle 
                size={{ base: '8', md: '10' }} 
                startColor={useColorModeValue('gray.200', 'gray.700')}
                endColor={useColorModeValue('gray.300', 'gray.600')}
              />
            )}
            
            <Skeleton
              height={{ base: '45px', md: '50px', lg: '55px' }}
              width={`${Math.random() * 30 + 30}%`}
              borderRadius="20px"
              startColor={useColorModeValue('gray.200', 'gray.700')}
              endColor={useColorModeValue('gray.300', 'gray.600')}
              minW={{ base: '120px', md: '150px' }}
              maxW={{ base: '250px', md: '350px', lg: '400px' }}
            />
            
            {isOwnMessage && (
              <SkeletonCircle 
                size={{ base: '8', md: '10' }} 
                startColor={useColorModeValue('gray.200', 'gray.700')}
                endColor={useColorModeValue('gray.300', 'gray.600')}
              />
            )}
          </Box>
        );
      })}
      
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Box>
  );
}

