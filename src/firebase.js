import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD35L7qlQyf6vCE343H5dMzLnte1aLtcZA",
  authDomain: "jc-tareas.firebaseapp.com",
  projectId: "jc-tareas",
  storageBucket: "jc-tareas.firebasestorage.app",
  messagingSenderId: "598613169106",
  appId: "1:598613169106:web:b9af19288ad606f76b6e0b"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);