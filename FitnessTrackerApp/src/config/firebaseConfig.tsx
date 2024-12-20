import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth,GoogleAuthProvider} from "firebase/auth"



const firebaseConfig = {
  apiKey: "AIzaSyBTXHL_VbJaDYetNY-q_0T9WoniwPaejC8",
  authDomain: "mobilewebdev-90f11.firebaseapp.com",
  projectId: "mobilewebdev-90f11",
  storageBucket: "mobilewebdev-90f11.firebasestorage.app",
  messagingSenderId: "847566778968",
  appId: "1:847566778968:web:dcaa637270e65c92db902d",
  measurementId: "G-QFSEJPHL8R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth= getAuth(app);
const googleProvider = new GoogleAuthProvider();

export {auth, googleProvider};