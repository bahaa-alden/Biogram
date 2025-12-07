import { Box, Skeleton, SkeletonCircle, Stack, useColorModeValue } from '@chakra-ui/react';

interface ChatListSkeletonProps {
  count?: number;
  compact?: boolean;
}

export function ChatListSkeleton({ count = 5, compact = false }: ChatListSkeletonProps) {
  const startColor = useColorModeValue('gray.100', 'gray.700');
  const endColor = useColorModeValue('gray.200', 'gray.600');
  
  return (
    <Stack spacing={{ base: 2, md: 2, lg: 3 }}>
      {Array.from({ length: count }).map((_, i) => (
        <Box 
          key={i} 
          display="flex" 
          gap={compact ? 1 : { base: 2, md: 3, lg: 4 }} 
          px={compact ? 2 : { base: 3, md: 3, lg: 4 }}
          py={compact ? 2 : { base: 2, md: 3, lg: 3 }}
          borderRadius={{ base: 'md', md: 'md', lg: 'lg' }}
          bg={useColorModeValue('gray.50', 'gray.800')}
          animation={`fadeIn 0.3s ease-in ${i * 0.1}s both`}
        >
          <SkeletonCircle 
            size={compact ? '8' : { base: '10', md: '10', lg: '12' }}
            startColor={startColor}
            endColor={endColor}
          />
          {!compact && (
            <Box flex="1" display="flex" flexDirection="column" gap={2} justifyContent="center">
              <Skeleton 
                height={{ base: '18px', md: '20px', lg: '22px' }} 
                width="70%" 
                startColor={startColor}
                endColor={endColor}
                borderRadius="md"
              />
              <Skeleton 
                height={{ base: '14px', md: '16px' }} 
                width="50%" 
                startColor={startColor}
                endColor={endColor}
                borderRadius="md"
              />
            </Box>
          )}
        </Box>
      ))}
      
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Stack>
  );
}

