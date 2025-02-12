# Live Chat Integration

## 🚀 Overview
Live Chat Integration is a real-time messaging system that enables seamless communication between users and support agents. Built with **React (Vite + TypeScript)** and **Firebase**, this project ensures efficient and interactive customer support with real-time chat functionality.

## ✨ Features
- **User-Friendly Chat Interface**: Simple and intuitive UI for real-time communication.
- **Agent Dashboard**: Allows agents to manage and respond to multiple users.
- **Authentication**: Secure agent login via Firebase Authentication.
- **Real-Time Messaging**: Powered by WebSockets for instant updates.
- **Chat History Management**: Messages stored securely in Firestore.
- **Admin Panel**: Admins can monitor conversations and manage chat sessions.
- **Auto User Assignment**: Distributes users to available agents dynamically.
- **GitHub Pages Deployment**: Easily deploy the project with `gh-pages`.

## 🛠 Tech Stack
- **Frontend**: React (Vite + TypeScript), TailwindCSS
- **Backend**: Firebase Firestore (NoSQL Database)
- **Real-Time Communication**: WebSockets
- **Authentication**: Firebase Authentication
- **Hosting**: GitHub Pages

## 📦 Installation & Setup
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/Arya182-ui/live-chat-integration.git
cd live-chat-integration
```
### 2️⃣ Install Dependencies
```sh
npm install
```
### 3️⃣ Configure Firebase
1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication** (Google Sign-In, Email/Password, etc.).
3. Set up **Firestore Database** for chat history.
4. Copy Firebase config and add it to `.env`:
```sh
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4️⃣ Run Locally
```sh
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5️⃣ Build for Production
```sh
npm run build
```

### 6️⃣ Deploy to GitHub Pages
```sh
npm run deploy
```

## 📌 Project Structure
```
📦 live-chat-integration
├── 📂 src
│   ├── 📂 components  # Reusable UI components
│   ├── 📂 pages       # Application pages (User, Agent, Admin)
│   ├── 📂 hooks       # Custom React hooks
│   ├── 📂 context     # Global state management
│   ├── 📂 utils       # Utility functions
│   ├── main.tsx      # App entry point
│   ├── App.tsx       # Main application file
│   └── firebase.ts   # Firebase configuration
├── 📂 public          # Static assets
├── 📄 .env            # Environment variables
├── 📄 package.json    # Dependencies & scripts
├── 📄 tailwind.config.js # TailwindCSS configuration
└── 📄 README.md       # Project documentation
```

## 🔥 Future Enhancements
- ✅ **Multi-Agent Chat Routing**: Automatically distribute chat requests.
- ✅ **Push Notifications**: Real-time alerts for agents.
- ✅ **Chat Analytics Dashboard**: Monitor agent performance.

## 💡 Contributing
Feel free to contribute by opening issues or pull requests. Follow the [Contributor Guidelines](CONTRIBUTING.md).

## 📜 License
This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

## 📞 Contact
For queries, reach out via:
- **GitHub**: [@Arya182-ui](https://github.com/Arya182-ui)
- **Email**: arya119000@gmail.com

---
_Developed with ❤️ by Ayush Gangwar_

