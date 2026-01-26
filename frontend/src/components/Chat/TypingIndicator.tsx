import { Box, Text, useColorModeValue } from '@chakra-ui/react';

interface TypingIndicatorProps {
  typingUser: { name: string; id: string };
}

export function TypingIndicator({ typingUser }: TypingIndicatorProps) {
  const popupBg = useColorModeValue('white', 'gray.800');
  const popupBorderColor = useColorModeValue('brand.200', 'brand.700');
  const popupTextColor = useColorModeValue('gray.700', 'gray.200');
  const popupTextSecondary = useColorModeValue('gray.600', 'gray.400');
  const dotColor = useColorModeValue('brand.500', 'brand.400');

  return (
    <Box
      position="absolute"
      top="12px"
      left="50%"
      transform="translateX(-50%)"
      zIndex={9999}
      bg={popupBg}
      data-testid="typing-popup"
      px={{ base: 3, md: 4 }}
      py={{ base: 2, md: 2.5 }}
      borderRadius="full"
      boxShadow="0 4px 12px rgba(0, 0, 0, 0.15)"
      border="1px solid"
      borderColor={popupBorderColor}
      display="flex"
      alignItems="center"
      gap={{ base: 2, md: 2.5 }}
      animation="slideDown 0.3s ease-out"
      backdropFilter="blur(10px)"
      whiteSpace="nowrap"
      sx={{
        visibility: 'visible !important',
        opacity: '1 !important',
        zIndex: '9999 !important',
        position: 'absolute !important',
        pointerEvents: 'none',
        left: '50% !important',
        transform: 'translateX(-50%) !important',
        top: '12px !important',
        width: 'auto',
        minWidth: 'fit-content',
        maxWidth: 'calc(100% - 24px)',
        clipPath: 'none',
        overflow: 'visible',
        isolation: 'isolate',
        '@keyframes slideDown': {
          from: { 
            opacity: 0, 
            transform: 'translate(-50%, -15px)',
          },
          to: { 
            opacity: 1, 
            transform: 'translate(-50%, 0)',
          },
        },
        '@keyframes typingDot': {
          '0%, 60%, 100%': {
            transform: 'translateY(0)',
            opacity: 0.7,
          },
          '30%': {
            transform: 'translateY(-8px)',
            opacity: 1,
          },
        },
      }}
    >
      <Text 
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="600" 
        color={popupTextColor}
        mr={{ base: 0.5, md: 1 }}
        isTruncated
        maxW={{ base: '80px', md: 'none' }}
      >
        {typingUser.name}
      </Text>
      <Text 
        fontSize={{ base: 'xs', md: 'sm' }}
        fontWeight="500" 
        color={popupTextSecondary}
        display={{ base: 'none', sm: 'block' }}
      >
        is typing
      </Text>
      {/* Animated dots */}
      <Box
        display="flex"
        alignItems="center"
        gap={{ base: '3px', md: '4px' }}
        ml={{ base: 0.5, md: 1 }}
      >
        <Box
          as="span"
          w={{ base: '5px', md: '6px' }}
          h={{ base: '5px', md: '6px' }}
          borderRadius="full"
          bg={dotColor}
          display="inline-block"
          sx={{
            animation: 'typingDot 1.4s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
        <Box
          as="span"
          w={{ base: '5px', md: '6px' }}
          h={{ base: '5px', md: '6px' }}
          borderRadius="full"
          bg={dotColor}
          display="inline-block"
          sx={{
            animation: 'typingDot 1.4s ease-in-out infinite',
            animationDelay: '0.2s',
          }}
        />
        <Box
          as="span"
          w={{ base: '5px', md: '6px' }}
          h={{ base: '5px', md: '6px' }}
          borderRadius="full"
          bg={dotColor}
          display="inline-block"
          sx={{
            animation: 'typingDot 1.4s ease-in-out infinite',
            animationDelay: '0.4s',
          }}
        />
      </Box>
    </Box>
  );
}

