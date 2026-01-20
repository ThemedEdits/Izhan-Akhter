import { db } from "./firebase.js";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    serverTimestamp,
    addDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
const portfolioGrid = document.getElementById('portfolioGrid');
const portfolioFilters = document.getElementById('portfolioFilters');
const videoModal = document.getElementById('videoModal');
const modalVideo = document.getElementById('modalVideo');
const modalTitle = document.getElementById('modalTitle');
const modalDescription = document.getElementById('modalDescription');
const modalCategory = document.getElementById('modalCategory');
const modalDate = document.getElementById('modalDate');
const closeModal = document.getElementById('closeModal');

// State
let allVideos = [];
let currentFilter = 'all';

// Cloudinary Configuration
const CLOUD_NAME = 'divg9adax';
const UPLOAD_PRESET = 'izhan_portfolio_upload';

// Initialize
function initPortfolio() {
    if (portfolioGrid) {
        loadVideos();
        setupEventListeners();
    }
}

// Load videos from Firestore
function loadVideos() {
    const videosQuery = query(
        collection(db, "videos"),
        orderBy("createdAt", "desc")
    );

    onSnapshot(videosQuery, (snapshot) => {
        allVideos = [];
        snapshot.forEach((doc) => {
            const videoData = doc.data();
            videoData.id = doc.id;
            allVideos.push(videoData);
        });
        
        renderVideos();
        updateFilters();
    });
}

// Render videos based on current filter
function renderVideos() {
    if (!portfolioGrid) return;
    
    const filteredVideos = currentFilter === 'all' 
        ? allVideos 
        : allVideos.filter(video => video.category === currentFilter);
    
    if (filteredVideos.length === 0) {
        portfolioGrid.innerHTML = `
            <div class="no-videos">
                <i class="fas fa-video-slash"></i>
                <h3>No videos found</h3>
                <p>No videos available for this category.</p>
            </div>
        `;
        return;
    }
    
    portfolioGrid.innerHTML = filteredVideos.map(video => `
        <div class="video-card" data-id="${video.id}">
            <img src="${video.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                 alt="${video.title || 'Video thumbnail'}">
            <div class="play-button">
                <i class="fas fa-play"></i>
            </div>
            <div class="video-overlay">
                <h4>${video.title || 'Untitled Video'}</h4>
                <span class="video-category ${video.category}">${formatCategory(video.category)}</span>
            </div>
        </div>
    `).join('');
    
    // Add click event to video cards
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('click', () => {
            const videoId = card.dataset.id;
            const video = allVideos.find(v => v.id === videoId);
            if (video) {
                openVideoModal(video);
            }
        });
    });
}

// Update filter buttons
function updateFilters() {
    if (!portfolioFilters) return;
    
    const filterButtons = portfolioFilters.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        const filterValue = button.dataset.filter;
        const count = filterValue === 'all' 
            ? allVideos.length 
            : allVideos.filter(v => v.category === filterValue).length;
        
        // Update button text with count
        const originalText = button.textContent.split(' (')[0];
        button.textContent = `${originalText} (${count})`;
    });
}

// Setup event listeners
function setupEventListeners() {
    // Filter buttons
    if (portfolioFilters) {
        portfolioFilters.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                // Update active state
                portfolioFilters.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                e.target.classList.add('active');
                
                // Update filter and re-render
                currentFilter = e.target.dataset.filter;
                renderVideos();
            }
        });
    }
    
    // Modal close button
    if (closeModal) {
        closeModal.addEventListener('click', closeVideoModal);
    }
    
    // Close modal when clicking outside
    if (videoModal) {
        videoModal.addEventListener('click', (e) => {
            if (e.target === videoModal) {
                closeVideoModal();
            }
        });
    }
    
    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && videoModal.classList.contains('active')) {
            closeVideoModal();
        }
    });
}

// Open video modal
function openVideoModal(video) {
    if (!videoModal || !modalVideo) return;
    
    modalVideo.src = video.videoUrl;
    modalTitle.textContent = video.title || 'Untitled Video';
    modalDescription.textContent = video.description || 'No description available.';
    modalCategory.textContent = formatCategory(video.category);
    
    // Format date
    if (video.createdAt) {
        const date = video.createdAt.toDate();
        modalDate.textContent = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } else {
        modalDate.textContent = 'Date not available';
    }
    
    videoModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close video modal
function closeVideoModal() {
    if (!videoModal || !modalVideo) return;
    
    videoModal.classList.remove('active');
    modalVideo.pause();
    modalVideo.src = '';
    document.body.style.overflow = '';
}

// Helper function to format category names
function formatCategory(category) {
    const categories = {
        'wedding': 'Wedding',
        'cinematic': 'Cinematic',
        'commercial': 'Commercial',
        'reels': 'Reels',
        'youtube': 'YouTube',
        'music': 'Music Video'
    };
    return categories[category] || category;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initPortfolio);

// Export functions for use in upload.js
export { loadVideos, renderVideos, CLOUD_NAME, UPLOAD_PRESET };