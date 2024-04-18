# Biogram

Biogram is a real-time messaging application built with Node.js, TypeScript, Socket.IO, Express.js, React.js, Chakra UI, and MongoDB. It enables users to engage in instant messaging with others in real-time, fostering seamless communication and collaboration.

## Features

- **Real-time Messaging:** Enjoy instant messaging with friends and colleagues, with messages delivered instantly.
- **User Authentication:** Securely authenticate users with JWT tokens for enhanced privacy and security.
- **Responsive Design:** Responsive and intuitive UI design built with React.js and Chakra UI ensures a seamless user experience across devices.
- **User Presence:** See real-time indicators of user online/offline status and typing indicators.
- **Search Functionality:** Easily search through your chat history to find important messages and conversations.
- **Notifications:** Stay updated with push notifications for new messages and mentions.
- **Dark Mode:** Reduce eye strain and enjoy a sleek interface with Dark Mode support.

## Technologies Used

### Frontend

- React.js: A popular JavaScript library for building user interfaces.
- Chakra UI: A simple, modular, and accessible component library for React.
- Socket.IO Client: Client-side library for Socket.IO, enabling real-time, bidirectional, and event-based communication.

### Backend

- Node.js: A JavaScript runtime built on Chrome's V8 JavaScript engine.
- TypeScript: A superset of JavaScript that adds static typing and other features to the language.
- Express.js: A minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
- Socket.IO: A library that enables real-time, bidirectional, and event-based communication between web clients and servers.
- MongoDB: A NoSQL database that provides high performance, high availability, and easy scalability.
- Mongoose: An Object Data Modeling (ODM) library for MongoDB and Node.js, providing a straightforward, schema-based solution to model application data.

## Getting Started

1. **Clone the Repository:**
   git clone <https://github.com/bahaa-alden/chatapp.git>

2. **Install Backend Dependencies:**

```bash
cd chatapp/backend
yarn install
```

3. **Install Frontend Dependencies:**

```bash
cd chatapp/backend
yarn install
```

4. **Set Up Environment Variables:**
   Create a `.env` file in the root directory and define the following variables:

```dotenv
 NODE_ENV=
 PORT=5000
 PASSWORD=
 DATABASE_LOCAL=mongodb://localhost:27017/chatapp
 DATABASE=
 JWT_SECRET_KEY=
 JWT_EXPIRES_IN=90d
 IMGUR_CLIENT_ID=
 IMGUR_CLIENT_SECRET=
```

5.**Start the Server:**

```bash
yarn start:dev
```

6.**Start the Client:**

```bash
yarn dev
```

7.**Access the Application:**
Open your browser and navigate to `http://localhost:3000` to access the ChatApp.

## Contributing

Contributions are welcome! Feel free to open issues and pull requests to suggest features, report bugs, or contribute improvements to the codebase.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Thanks to the developers of Node.js, Socket.IO, Express.js, React.js, Chakra UI, and MongoDB for creating such powerful and versatile technologies.
- Special thanks to the open-source community for their invaluable contributions and support.

## Contact

For inquiries or support, please contact [your_email@example.com](mailto:your_email@example.com).
