import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCI2a-zAVjL4hZExyHAUH_GBjYSBLMNskM",
    authDomain: "household-tracker-e3c57.firebaseapp.com",
    projectId: "household-tracker-e3c57",
    storageBucket: "household-tracker-e3c57.firebasestorage.app",
    messagingSenderId: "1080198640218",
    appId: "1:1080198640218:web:befec98417a6e72a725e63"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
