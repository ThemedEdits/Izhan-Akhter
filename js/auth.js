import { auth } from "./firebase.js";
import {
    signInWithEmailAndPassword,
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const dashboardScreen = document.getElementById('dashboardScreen');
const loginForm = document.getElementById('adminLoginForm');
const logoutBtn = document.getElementById('logoutBtn');
const loginError = document.getElementById('loginError');

// Login Function
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('adminEmail').value;
        const password = document.getElementById('adminPassword').value;
        const loginBtn = document.getElementById('loginBtn');
        const originalText = loginBtn.innerHTML;
        
        // Show loading state
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Signing in...';
        loginBtn.disabled = true;
        loginError.textContent = '';
        
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // Success - dashboard will be shown via onAuthStateChanged
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = getErrorMessage(error.code);
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }
    });
}

// Logout Function
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
        }
    });
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in
        if (loginScreen && dashboardScreen) {
            loginScreen.style.display = 'none';
            dashboardScreen.style.display = 'block';
            
            // Update user name
            const userNameElement = document.getElementById('adminUserName');
            if (userNameElement) {
                userNameElement.textContent = user.email.split('@')[0];
            }
        }
        
        // If on login page but logged in, redirect to dashboard
        if (window.location.pathname.includes('admin.html')) {
            // Already on admin page, UI will handle it
        }
    } else {
        // User is logged out
        if (loginScreen && dashboardScreen) {
            loginScreen.style.display = 'flex';
            dashboardScreen.style.display = 'none';
        }
        
        // If on admin page but not logged in, ensure login screen is shown
        if (window.location.pathname.includes('admin.html')) {
            // Already on admin page, UI will handle it
        }
    }
});

// Helper function for error messages
function getErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'Invalid email address format.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/too-many-requests':
            return 'Too many failed attempts. Please try again later.';
        default:
            return 'Login failed. Please check your credentials.';
    }
}