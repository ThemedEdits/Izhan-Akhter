// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDLcK4khaa49DScm5_etaW_KOThA5Hl5Ak",
    authDomain: "izhan-video-portfolio.firebaseapp.com",
    projectId: "izhan-video-portfolio",
    storageBucket: "izhan-video-portfolio.firebasestorage.app",
    messagingSenderId: "206269749970",
    appId: "1:206269749970:web:3b42769a38cfc88ec0ab0b"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const db = getFirestore(app);