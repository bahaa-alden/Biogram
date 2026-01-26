import { EditIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  HStack,
  Input,
  InputGroup,
  InputLeftElement,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { Chat } from '../../types/interfaces';

interface RenameGroupSectionProps {
  groupName: string;
  setGroupName: (value: string) => void;
  selectedChat: Chat | null;
  onRename: () => void;
  renameLoading: boolean;
}

export function RenameGroupSection({
  groupName,
  setGroupName,
  selectedChat,
  onRename,
  renameLoading,
}: RenameGroupSectionProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const cardBg = useColorModeValue('gray.50', 'gray.700');
  const hoverBg = useColorModeValue('gray.100', 'gray.600');
  const inputFocusBorder = useColorModeValue('brand.500', 'brand.400');
  const bgColor = useColorModeValue('white', 'gray.800');

  return (
    <Box>
      <HStack justify="space-between" mb={3} align="center">
        <HStack spacing={2}>
          <Box
            bg={useColorModeValue('brand.50', 'brand.900')}
            p={1.5}
            borderRadius="md"
          >
            <Text fontSize="sm">✏️</Text>
          </Box>
          <Text
            fontSize="sm"
            fontWeight="700"
            color={textColor}
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Rename Group
          </Text>
        </HStack>
        <Text
          fontSize="xs"
          color={groupName.length > 45 ? 'red.500' : secondaryTextColor}
          fontWeight="600"
          bg={groupName.length > 45 ? useColorModeValue('red.50', 'red.900') : 'transparent'}
          px={2}
          py={0.5}
          borderRadius="md"
        >
          {groupName.length}/50
        </Text>
      </HStack>
      <FormControl>
        <HStack spacing={3}>
          <InputGroup flex={1}>
            <InputLeftElement pointerEvents="none">
              <EditIcon 
                color={secondaryTextColor} 
                boxSize={4}
              />
            </InputLeftElement>
            <Input
              value={groupName}
              placeholder={selectedChat?.name || 'Enter group name...'}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 50) {
                  setGroupName(value);
                }
              }}
              bg={cardBg}
              border="1px solid"
              borderColor={
                groupName.length > 45 
                  ? useColorModeValue('red.300', 'red.600')
                  : borderColor
              }
              _hover={{ 
                borderColor: groupName.length > 45
                  ? useColorModeValue('red.400', 'red.500')
                  : useColorModeValue('brand.400', 'brand.500'),
                bg: hoverBg,
              }}
              _focus={{ 
                borderColor: groupName.length > 45
                  ? useColorModeValue('red.500', 'red.400')
                  : inputFocusBorder, 
                boxShadow: `0 0 0 1px ${groupName.length > 45 ? 'red.500' : 'var(--chakra-colors-brand-500)'}`,
                bg: bgColor,
              }}
              maxLength={50}
              isDisabled={renameLoading}
              size="md"
              borderRadius="lg"
            />
          </InputGroup>
          <Button
            colorScheme="brand"
            isLoading={renameLoading}
            loadingText="Updating..."
            onClick={onRename}
            px={6}
            fontWeight="600"
            size="md"
            borderRadius="lg"
            isDisabled={
              !groupName.trim() || 
              groupName.trim() === selectedChat?.name ||
              groupName.length > 50
            }
            _hover={{
              transform: !renameLoading ? 'translateY(-1px)' : 'none',
              shadow: 'md',
            }}
            transition="all 0.2s"
          >
            Save
          </Button>
        </HStack>
        {groupName.trim() && groupName.trim() !== selectedChat?.name && groupName.length <= 50 && (
          <FormHelperText mt={2} fontSize="xs" color="green.500">
            ✓ Ready to update group name
          </FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}

