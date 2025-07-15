const API_KEY = 'AIzaSyCl2IofI0RWzywrcp-vUNHzCFN0qS0nqvc';

const enterButton = document.getElementById('enterButton');
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const videoGrid = document.getElementById('videoGrid');
const videoPlayerModal = document.getElementById('videoPlayerModal');
const videoPlayer = document.getElementById('videoPlayer');

const alexChannelId = 'UCh1MtJ4rx4n4PQGYNYK_UXA';
const ryanChannelId = 'UCnmGIkw-KdI0W5siakKPKog';

// 🎬 Fade out welcome screen and show main content
enterButton.onclick = () => {
  welcomeScreen.style.opacity = 0;
  setTimeout(() => {
    welcomeScreen.style.display = 'none';
    mainContent.style.display = 'block';
    showRandomVideos();
  }, 1000);
};

// 📦 Fetch recent uploads for a channel using the uploads playlist
async function fetchVideosFromUploads(channelId) {
  const channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${API_KEY}`);
  const channelData = await channelResponse.json();

  if (!channelData.items || channelData.items.length === 0) {
    throw new Error('Channel not found or no uploads playlist available.');
  }

  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  const playlistResponse = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${API_KEY}`);
  const playlistData = await playlistResponse.json();

  return playlistData.items;
}

// 🔀 Pick N random items
function getRandomItems(arr, count) {
  const shuffled = arr.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// 🖼️ Display random videos
async function showRandomVideos() {
  try {
    const alexVideos = await fetchVideosFromUploads(alexChannelId);
    const ryanVideos = await fetchVideosFromUploads(ryanChannelId);
    const combined = [...alexVideos, ...ryanVideos];
    const randomSelection = getRandomItems(combined, 6);

    videoGrid.innerHTML = '';
    randomSelection.forEach(video => {
      const videoId = video.snippet.resourceId.videoId;

      const vidDiv = document.createElement('div');
      vidDiv.className = 'video';
      vidDiv.innerHTML = `
        <div onclick="openPlayer('${videoId}')" style="cursor:pointer;">
          <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
          <h3>${video.snippet.title}</h3>
          <p>${video.snippet.channelTitle}</p>
        </div>
      `;
      videoGrid.appendChild(vidDiv);
    });
  } catch (err) {
    console.error(err);
    videoGrid.innerHTML = `<p style="color:red;">Error loading videos: ${err.message}</p>`;
  }
}

// 🧱 Reusable video tile for search results
function addVideoToGrid(video) {
  const videoId = video.id.videoId || video.snippet.resourceId?.videoId || video.id;
  const vidDiv = document.createElement('div');
  vidDiv.className = 'video';
  vidDiv.innerHTML = `
    <img src="${video.snippet.thumbnails.medium.url}" alt="${video.snippet.title}">
    <h3>${video.snippet.title}</h3>
    <p>${video.snippet.channelTitle}</p>
  `;
  vidDiv.style.cursor = 'pointer';
  vidDiv.onclick = () => openPlayer(videoId);
  videoGrid.appendChild(vidDiv);
}

// ▶️ Open modal with video
function openPlayer(videoId) {
  videoPlayer.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`;
  videoPlayerModal.style.display = 'flex';
}

// ❌ Close modal and stop video
function closePlayer() {
  videoPlayer.src = '';
  videoPlayerModal.style.display = 'none';
}

// 🔍 Search videos
searchButton.onclick = async () => {
  const query = searchInput.value.trim();
  if (!query) return;

  videoGrid.innerHTML = '<p>Searching...</p>';

  try {
    const url = `https://www.googleapis.com/youtube/v3/search?key=${API_KEY}&part=snippet&type=video&maxResults=8&q=${encodeURIComponent(query)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Search API request failed');
    const data = await response.json();

    if (!data.items.length) {
      videoGrid.innerHTML = '<p>No results found.</p>';
      return;
    }

    videoGrid.innerHTML = '';
    data.items.forEach(video => addVideoToGrid(video));
  } catch (err) {
    videoGrid.innerHTML = `<p style="color:red;">Error: ${err.message}</p>`;
  }
};
// Signup handler
document.getElementById('signupBtn').onclick = async () => {
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;
  const { error } = await window.supabase.auth.signUp({ email, password });
  document.getElementById('authStatus').innerText = error ? error.message : 'Sign‑up successful!';
};

// Signin handler
document.getElementById('signinBtn').onclick = async () => {
  const email = document.getElementById('signinEmail').value;
  const password = document.getElementById('signinPassword').value;
  const { error, session } = await window.supabase.auth.signInWithPassword({ email, password });
  document.getElementById('authStatus').innerText = error ? error.message : `Signed in as ${session.user.email}!`;

  if (!error) {
    document.getElementById('authForms').style.display = 'none';
    showRandomVideos(); // now you can show personalized content
  }
};

// Auto-detect session on load
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await window.supabase.auth.getSession();
  if (session) {
    document.getElementById('authStatus').innerText = `Welcome back, ${session.user.email}!`;
    document.getElementById('authForms').style.display = 'none';
    showRandomVideos();
  }
});
