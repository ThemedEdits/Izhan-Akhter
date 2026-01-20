import { db } from "./firebase.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const cloudName = "divg9adax";
const uploadPreset = "izhan_portfolio_upload";

const uploadBtn = document.getElementById("uploadBtn");

uploadBtn.addEventListener("click", async () => {
  const video = document.getElementById("videoFile").files[0];
  const thumbnail = document.getElementById("thumbnailFile").files[0];
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;

  if (!video || !thumbnail) {
    alert("Video and thumbnail are required");
    return;
  }

  try {
    uploadBtn.innerText = "Uploading...";

    // Upload video
    const videoUrl = await uploadToCloudinary(video, "video");

    // Upload thumbnail
    const thumbnailUrl = await uploadToCloudinary(thumbnail, "image");

    // Save to Firestore
    await addDoc(collection(db, "videos"), {
      videoUrl,
      thumbnailUrl,
      category,
      description,
      createdAt: serverTimestamp()
    });

    alert("Upload successful!");
    uploadBtn.innerText = "Upload";
  } catch (err) {
    console.error(err);
    alert("Upload failed");
    uploadBtn.innerText = "Upload";
  }
});

async function uploadToCloudinary(file, type) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();
  return data.secure_url;
}
