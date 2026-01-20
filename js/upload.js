import { db } from "./firebase.js";
import { CLOUD_NAME, UPLOAD_PRESET } from "./portfolio.js";
import {
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    orderBy,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// DOM Elements
let uploadBtn, videosList, totalVideos, videosCount;
let selectedVideoFile = null; // Store the selected file globally

// Initialize upload functionality
function initUpload() {
    // Get DOM elements
    uploadBtn = document.getElementById('uploadBtn');
    videosList = document.getElementById('videosList');
    totalVideos = document.getElementById('totalVideos');
    videosCount = document.getElementById('videosCount');
    
    if (uploadBtn) {
        setupUpload();
        setupFileInputHandlers();
        loadVideosForDashboard();
    }
}

// Setup file input handlers
function setupFileInputHandlers() {
    const uploadArea = document.getElementById('uploadArea');
    
    // Create file input if it doesn't exist
    let videoInput = document.getElementById('videoFile');
    if (!videoInput) {
        videoInput = document.createElement('input');
        videoInput.type = 'file';
        videoInput.id = 'videoFile';
        videoInput.name = 'videoFile';
        videoInput.accept = 'video/*';
        videoInput.style.display = 'none';
        document.body.appendChild(videoInput);
    }
    
    if (uploadArea && videoInput) {
        // Remove any existing event listeners
        const newUploadArea = uploadArea.cloneNode(true);
        uploadArea.parentNode.replaceChild(newUploadArea, uploadArea);
        
        // Get the new reference
        const newArea = document.getElementById('uploadArea');
        
        // Click on upload area triggers file input
        newArea.addEventListener('click', (e) => {
            e.preventDefault();
            videoInput.click();
        });
        
        // Handle file selection
        videoInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                selectedVideoFile = this.files[0]; // Store the file globally
                const file = selectedVideoFile;
                
                // Update upload area display
                newArea.innerHTML = `
                    <i class="fas fa-file-video"></i>
                    <p><strong>${file.name}</strong></p>
                    <p class="file-size">${(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                    <button class="btn btn-outline" id="changeVideoBtn">Change Video</button>
                `;
                
                // Add event listener to change button
                setTimeout(() => {
                    const changeBtn = document.getElementById('changeVideoBtn');
                    if (changeBtn) {
                        changeBtn.addEventListener('click', (e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            videoInput.click();
                        });
                    }
                }, 100);
            }
        });
        
        // Drag and drop support
        newArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            newArea.classList.add('dragover');
        });
        
        newArea.addEventListener('dragleave', () => {
            newArea.classList.remove('dragover');
        });
        
        newArea.addEventListener('drop', (e) => {
            e.preventDefault();
            newArea.classList.remove('dragover');
            
            if (e.dataTransfer.files.length > 0) {
                videoInput.files = e.dataTransfer.files;
                const event = new Event('change');
                videoInput.dispatchEvent(event);
            }
        });
    }
}

// Setup video upload
function setupUpload() {
    uploadBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        
        // Get form values
        const thumbnailInput = document.getElementById('thumbnailFile');
        const thumbnailFile = thumbnailInput?.files[0];
        const title = document.getElementById('videoTitle')?.value || '';
        const category = document.getElementById('videoCategory')?.value || 'wedding';
        const description = document.getElementById('videoDescription')?.value || '';
        
        console.log('Selected video file:', selectedVideoFile);
        console.log('Thumbnail file:', thumbnailFile);
        
        // Validation - check the global variable instead of DOM
        if (!selectedVideoFile) {
            showUploadStatus('Please select a video file', 'error');
            return;
        }
        
        if (!thumbnailFile) {
            showUploadStatus('Please select a thumbnail image', 'error');
            return;
        }
        
        // Show upload progress
        const progressBar = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const uploadProgress = document.getElementById('uploadProgress');
        
        if (uploadProgress) {
            uploadProgress.style.display = 'block';
            if (progressBar) progressBar.style.width = '0%';
            if (progressText) progressText.textContent = 'Starting upload...';
        }
        
        uploadBtn.disabled = true;
        const originalText = uploadBtn.innerHTML;
        uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
        
        try {
            // Upload video to Cloudinary
            if (progressText) progressText.textContent = 'Uploading video...';
            const videoUrl = await uploadToCloudinary(selectedVideoFile, 'video');
            
            // Upload thumbnail to Cloudinary
            if (progressText) progressText.textContent = 'Uploading thumbnail...';
            const thumbnailUrl = await uploadToCloudinary(thumbnailFile, 'image');
            
            // Save to Firestore
            if (progressText) progressText.textContent = 'Saving to database...';
            await addDoc(collection(db, "videos"), {
                videoUrl,
                thumbnailUrl,
                title: title.trim() || 'Untitled Video',
                category,
                description,
                createdAt: serverTimestamp()
            });
            
            // Complete
            if (progressBar) progressBar.style.width = '100%';
            if (progressText) progressText.textContent = 'Upload complete!';
            
            // Show success message
            showUploadStatus('Video uploaded successfully!', 'success');
            
            // Reset form
            resetUploadForm();
            
            // Reload videos
            setTimeout(() => {
                if (uploadProgress) uploadProgress.style.display = 'none';
                uploadBtn.disabled = false;
                uploadBtn.innerHTML = originalText;
                loadVideosForDashboard();
            }, 2000);
            
        } catch (error) {
            console.error('Upload error:', error);
            showUploadStatus('Upload failed: ' + error.message, 'error');
            if (uploadProgress) uploadProgress.style.display = 'none';
            uploadBtn.disabled = false;
            uploadBtn.innerHTML = originalText;
        }
    });
}

// Upload file to Cloudinary
async function uploadToCloudinary(file, resourceType) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);
    
    try {
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Upload failed: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        return data.secure_url;
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        throw error;
    }
}

// Load videos for admin dashboard
function loadVideosForDashboard() {
    if (!videosList) return;
    
    videosList.innerHTML = `
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading videos...</p>
        </div>
    `;
    
    const videosQuery = query(
        collection(db, "videos"),
        orderBy("createdAt", "desc")
    );
    
    onSnapshot(videosQuery, (snapshot) => {
        const videos = [];
        snapshot.forEach((doc) => {
            const videoData = doc.data();
            videoData.id = doc.id;
            videos.push(videoData);
        });
        
        renderVideosList(videos);
    }, (error) => {
        console.error("Error loading videos:", error);
        videosList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Failed to load videos</h3>
                <p>${error.message}</p>
            </div>
        `;
    });
}

// Render videos list
function renderVideosList(videos) {
    if (!videosList) return;
    
    if (videos.length === 0) {
        videosList.innerHTML = `
            <div class="no-videos">
                <i class="fas fa-video-slash"></i>
                <h3>No videos uploaded yet</h3>
                <p>Upload your first video to get started!</p>
            </div>
        `;
        return;
    }
    
    videosList.innerHTML = videos.map(video => `
        <div class="video-item ${video.category}">
            <div class="video-thumbnail">
                <img src="${video.thumbnailUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'}" 
                     alt="${video.title || 'Video thumbnail'}" 
                     onerror="this.src='https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'">
            </div>
            <div class="video-details">
                <h4>${video.title || 'Untitled Video'}</h4>
                <span class="video-category">${formatCategory(video.category)}</span>
                <p class="video-date">
                    ${video.createdAt ? 
                        `Uploaded: ${video.createdAt.toDate().toLocaleDateString()}` : 
                        'Date not available'}
                </p>
            </div>
            <div class="video-actions">
                <button class="btn-icon" onclick="editVideo('${video.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon btn-danger" onclick="deleteVideo('${video.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    if (totalVideos) totalVideos.textContent = videos.length;
    if (videosCount) videosCount.textContent = `${videos.length} video${videos.length !== 1 ? 's' : ''}`;
}

// Show upload status
function showUploadStatus(message, type) {
    const statusElement = document.getElementById('uploadStatus');
    if (!statusElement) return;
    
    statusElement.textContent = message;
    statusElement.className = `upload-status ${type}`;
    
    setTimeout(() => {
        statusElement.textContent = '';
        statusElement.className = 'upload-status';
    }, 5000);
}

// Reset upload form
function resetUploadForm() {
    // Reset global variable
    selectedVideoFile = null;
    
    // Reset form inputs
    const thumbnailInput = document.getElementById('thumbnailFile');
    const titleInput = document.getElementById('videoTitle');
    const descInput = document.getElementById('videoDescription');
    const videoInput = document.getElementById('videoFile');
    
    if (thumbnailInput) thumbnailInput.value = '';
    if (titleInput) titleInput.value = '';
    if (descInput) descInput.value = '';
    if (videoInput) videoInput.value = '';
    
    // Reset upload area
    const uploadArea = document.getElementById('uploadArea');
    if (uploadArea) {
        uploadArea.innerHTML = `
            <i class="fas fa-cloud-upload-alt"></i>
            <p>Drag & drop video file here or click to browse</p>
            <button class="btn btn-outline" id="browseVideoBtn">Browse Video</button>
        `;
        
        // Re-initialize handlers
        setTimeout(() => setupFileInputHandlers(), 100);
    }
}

// Format category name
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

// Delete video function
window.deleteVideo = async function(videoId) {
    if (!confirm('Are you sure you want to delete this video?')) return;
    
    try {
        await deleteDoc(doc(db, "videos", videoId));
        showUploadStatus('Video deleted successfully!', 'success');
    } catch (error) {
        console.error('Delete error:', error);
        showUploadStatus('Failed to delete video: ' + error.message, 'error');
    }
};

// Edit video function
window.editVideo = function(videoId) {
    // [Keep your existing edit function code]
};

// Initialize when dashboard is shown
document.addEventListener('DOMContentLoaded', function() {
    const dashboardScreen = document.getElementById('dashboardScreen');
    
    if (dashboardScreen && dashboardScreen.style.display !== 'none') {
        initUpload();
    } else {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    if (dashboardScreen.style.display !== 'none') {
                        initUpload();
                        observer.disconnect();
                    }
                }
            });
        });
        
        if (dashboardScreen) {
            observer.observe(dashboardScreen, { attributes: true });
        }
    }
});