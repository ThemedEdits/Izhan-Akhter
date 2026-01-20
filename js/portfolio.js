import { db } from "./firebase.js";
import {
  collection,
  query,
  orderBy,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const grid = document.getElementById("videoGrid");
const modal = document.getElementById("videoModal");
const modalVideo = document.getElementById("modalVideo");
const modalDesc = document.getElementById("modalDesc");
const closeModal = document.getElementById("closeModal");
const filterBtns = document.querySelectorAll("#filters button");

let allVideos = [];
let currentCategory = "All";

// Real-time listener
const q = query(
  collection(db, "videos"),
  orderBy("createdAt", "desc")
);

onSnapshot(q, snapshot => {
  allVideos = snapshot.docs.map(doc => doc.data());
  renderVideos();
});

function renderVideos() {
  grid.innerHTML = "";

  const filtered =
    currentCategory === "All"
      ? allVideos
      : allVideos.filter(v => v.category === currentCategory);

  filtered.forEach(video => {
    const card = document.createElement("div");
    card.className = "video-card";

    card.innerHTML = `
      <img src="${video.thumbnailUrl}" />
      <div class="overlay">▶</div>
    `;

    card.onclick = () => openModal(video);
    grid.appendChild(card);
  });
}

// Filters
filterBtns.forEach(btn => {
  btn.onclick = () => {
    currentCategory = btn.dataset.cat;
    renderVideos();
  };
});

// Modal
function openModal(video) {
  modal.style.display = "flex";
  modalVideo.src = video.videoUrl;
  modalDesc.innerText = video.description || "";
}

closeModal.onclick = () => {
  modal.style.display = "none";
  modalVideo.pause();
  modalVideo.src = "";
};
