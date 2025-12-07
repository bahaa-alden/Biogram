import {
  Box,
  Container,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  useColorModeValue,
  Heading,
  VStack,
  Fade,
  ScaleFade,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import Login from '../components/Authentication/Login';
import SignUp from '../components/Authentication/SignUp';

const MotionBox = motion(Box);

function HomePage() {
  const bg = useColorModeValue('white', 'gray.800');
  const bgS = useColorModeValue('brand.500', 'brand.400');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const headingColor = useColorModeValue('brand.600', 'brand.300');
  const subHeadingColor = useColorModeValue('gray.600', 'gray.400');

  return (
    <Container maxW="md" py={{ base: 4, md: 8 }}>
      <Fade in={true} transition={{ enter: { duration: 0.5 } }}>
        <VStack spacing={6} align="stretch">
          {/* Hero Section */}
          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            textAlign="center"
            py={8}
          >
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, brand.400, brand.600)"
              bgClip="text"
              mb={2}
              fontFamily="heading"
              fontWeight="700"
            >
              Bio-Gram
            </Heading>
            <Text
              color={subHeadingColor}
              fontSize="lg"
              fontWeight="400"
              mt={2}
            >
              Connect and chat in real-time
            </Text>
          </MotionBox>

          {/* Auth Tabs */}
          <ScaleFade in={true} initialScale={0.95} transition={{ enter: { duration: 0.4, delay: 0.2 } }}>
            <Box
              bg={bg}
              p={{ base: 4, md: 6 }}
              borderRadius="xl"
              borderWidth="1px"
              borderColor={borderColor}
              boxShadow="lg"
            >
              <Tabs
                variant="enclosed"
                colorScheme="brand"
                isFitted
                defaultIndex={0}
              >
                <TabList mb={4}>
                  <Tab
                    width="50%"
                    _selected={{
                      color: 'brand.600',
                      borderColor: 'brand.500',
                      borderBottom: '2px solid',
                    }}
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    minH="44px"
                  >
                    Login
                  </Tab>
                  <Tab
                    width="50%"
                    _selected={{
                      color: 'brand.600',
                      borderColor: 'brand.500',
                      borderBottom: '2px solid',
                    }}
                    fontWeight="600"
                    fontSize={{ base: 'sm', md: 'md' }}
                    minH="44px"
                  >
                    Sign Up
                  </Tab>
                </TabList>
                <TabPanels>
                  <TabPanel px={0}>
                    <Login bg={bg} bgS={bgS} />
                  </TabPanel>
                  <TabPanel px={0}>
                    <SignUp bgS={bgS} bg={bg} />
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </Box>
          </ScaleFade>
        </VStack>
      </Fade>
    </Container>
  );
}

export default HomePage;
