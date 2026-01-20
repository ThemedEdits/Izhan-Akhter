import { auth } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const errorText = document.getElementById("error");

// 🔐 LOGIN
loginBtn?.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(
      auth,
      emailInput.value,
      passwordInput.value
    );
    window.location.href = "admin-dashboard.html";
  } catch (err) {
    errorText.innerText = "Invalid credentials";
  }
});

// 🚀 Auto redirect if already logged in
onAuthStateChanged(auth, user => {
  if (user && window.location.pathname.includes("admin-login")) {
    window.location.href = "admin-dashboard.html";
  }
});

// 🚪 LOGOUT (used later)
window.logout = async () => {
  await signOut(auth);
  window.location.href = "admin-login.html";
};
