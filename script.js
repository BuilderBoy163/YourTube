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
// Auth modal management
function openAuthModal() {
  document.getElementById('authModal').style.display = 'flex';
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
  clearAuthStatus();
}

function switchTab(tab) {
  // Update tab buttons
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.auth-tab[onclick="switchTab('${tab}')"]`).classList.add('active');
  
  // Update form visibility
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(tab + 'Form').classList.add('active');
  
  clearAuthStatus();
}

function showAuthStatus(message, type = 'info') {
  const statusDiv = document.getElementById('authStatus');
  statusDiv.className = `auth-status ${type}`;
  statusDiv.textContent = message;
}

function clearAuthStatus() {
  const statusDiv = document.getElementById('authStatus');
  statusDiv.className = 'auth-status';
  statusDiv.style.display = 'none';
}

function updateAuthButton(user) {
  const authButton = document.getElementById('authorize_button');
  const signoutButton = document.getElementById('signout_button');
  
  if (user) {
    authButton.style.display = 'none';
    signoutButton.style.display = 'inline-block';
    signoutButton.textContent = `Sign Out (${user.email.split('@')[0]})`;
  } else {
    authButton.style.display = 'inline-block';
    signoutButton.style.display = 'none';
  }
}

// Update auth button click handler
document.getElementById('authorize_button').onclick = openAuthModal;

// Signup handler
document.getElementById('signupBtn').onclick = async () => {
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;
  
  if (!email || !password) {
    showAuthStatus('Please fill in all fields', 'error');
    return;
  }
  
  if (password.length < 6) {
    showAuthStatus('Password must be at least 6 characters', 'error');
    return;
  }
  
  showAuthStatus('Creating account...', 'info');
  
  try {
    const { error } = await window.supabase.auth.signUp({ email, password });
    
    if (error) {
      showAuthStatus(error.message, 'error');
    } else {
      showAuthStatus('Account created! Please check your email to verify your account.', 'success');
      // Clear form
      document.getElementById('signupEmail').value = '';
      document.getElementById('signupPassword').value = '';
    }
  } catch (err) {
    showAuthStatus('An unexpected error occurred', 'error');
  }
};

// Signin handler
document.getElementById('signinBtn').onclick = async () => {
  const email = document.getElementById('signinEmail').value.trim();
  const password = document.getElementById('signinPassword').value;
  
  if (!email || !password) {
    showAuthStatus('Please fill in all fields', 'error');
    return;
  }
  
  showAuthStatus('Signing in...', 'info');
  
  try {
    const { error, data } = await window.supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      showAuthStatus(error.message, 'error');
    } else {
      showAuthStatus(`Welcome back, ${data.user.email}!`, 'success');
      updateAuthButton(data.user);
      setTimeout(() => {
        closeAuthModal();
        showRandomVideos();
      }, 1500);
    }
  } catch (err) {
    showAuthStatus('An unexpected error occurred', 'error');
  }
};

// Signout handler
document.getElementById('signout_button').onclick = async () => {
  try {
    await window.supabase.auth.signOut();
    updateAuthButton(null);
    showRandomVideos(); // Show default content
  } catch (err) {
    console.error('Sign out error:', err);
  }
};

// Auto-detect session on load
window.addEventListener('DOMContentLoaded', async () => {
  try {
    const { data: { session } } = await window.supabase.auth.getSession();
    if (session?.user) {
      updateAuthButton(session.user);
    }
  } catch (err) {
    console.error('Session check error:', err);
  }
});

// Listen for auth state changes
window.supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    updateAuthButton(session.user);
  } else if (event === 'SIGNED_OUT') {
    updateAuthButton(null);
  }
});

// Close modal when clicking outside
document.getElementById('authModal').onclick = (e) => {
  if (e.target.id === 'authModal') {
    closeAuthModal();
  }
};

// Add Enter key support for forms
document.getElementById('signinPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('signinBtn').click();
  }
});

document.getElementById('signupPassword').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    document.getElementById('signupBtn').click();
  }
});
