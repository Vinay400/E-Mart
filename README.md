# E-Mart - Modern E-Commerce Platform

E-Mart is a full-stack e-commerce platform built with React, TypeScript, and Firebase. It provides a seamless shopping experience for customers while offering robust management tools for vendors and administrators.

![E-Mart Screenshot](screenshot.png)

## 🌟 Features

### Customer Features
- 🛍️ Browse products with category filtering and price sorting
- 🔍 Advanced search functionality
- 🛒 Shopping cart management
- ❤️ Wishlist functionality
- 📦 Order tracking and history
- 📝 Multiple shipping addresses
- 💳 Secure payment processing
- 🔔 Real-time notifications

### Vendor Features
- 📊 Dashboard with sales analytics
- 📦 Product management
- 💰 Revenue tracking
- 📈 Performance metrics
- 🔔 Order notifications

### Admin Features
- 👥 User management
- 🏪 Vendor approval system
- 📊 Platform analytics
- 🔍 Content moderation
- 💰 Revenue monitoring

## 🚀 Tech Stack

- **Frontend:**
  - React
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - React Router
  - React Icons

- **Backend:**
  - Firebase
    - Authentication
    - Firestore Database
    - Cloud Storage
    - Cloud Functions

- **Development Tools:**
  - Vite
  - ESLint
  - Prettier
  - Git

## 📋 Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Firebase account
- Git

## 🛠️ Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/e-mart.git
cd e-mart
```

2. Install dependencies
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Set up environment variables
```bash
# In client directory
cp .env.example .env

# In server directory
cp .env.example .env
```

4. Configure Firebase
- Create a new Firebase project
- Enable Authentication, Firestore, and Storage
- Copy your Firebase configuration to the client's `.env` file

5. Start the development servers
```bash
# Start client (in client directory)
npm run dev

# Start server (in server directory)
npm run dev
```

## 📁 Project Structure

```
e-mart/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── pages/        # Page components
│   │   ├── types/        # TypeScript type definitions
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
├── server/                # Backend server
│   ├── src/
│   │   ├── controllers/  # Route controllers
│   │   ├── models/       # Data models
│   │   ├── routes/       # API routes
│   │   └── utils/        # Utility functions
│   └── config/           # Configuration files
└── README.md             # Project documentation
```

## 🔐 Environment Variables

### Client (.env)
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Server (.env)
```
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Framer Motion](https://www.framer.com/motion/)

## 📧 Contact
