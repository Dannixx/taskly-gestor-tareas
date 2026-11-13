
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDnT0hYWUV6Q2Mk2AeuLIfzCrdKWTteC7I",
  authDomain: "taskly-cec46.firebaseapp.com",
  projectId: "taskly-cec46",
  storageBucket: "taskly-cec46.firebasestorage.app",
  messagingSenderId: "428429355611",
  appId: "1:428429355611:web:f435142f3d8f933d382d7e"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
