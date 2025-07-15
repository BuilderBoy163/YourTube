const CLIENT_ID = '426990396468-telnsi4g610but23b1bisjr5fhhl9a9a.apps.googleusercontent.com';
const API_KEY = 'AIzaSyDuQAqLPnaVwimXENno4wWVKAAoGckdvTk';
const DISCOVERY_DOCS = ["https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest"];
const SCOPES = 'https://www.googleapis.com/auth/youtube.readonly';

const authorizeButton = document.getElementById('authorize_button');
const signoutButton = document.getElementById('signout_button');
const videoGrid = document.getElementById('videoGrid');
const enterButton = document.getElementById('enterButton');
const welcomeScreen = document.getElementById('welcomeScreen');
const mainContent = document.getElementById('mainContent');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');

// 🎬 Handle welcome screen
enterButton.onclick = () => {
  welcomeScreen.style.opacity = 0;
  setTimeout(() => {
    welcomeScreen.style.display = 'none';
    mainContent.style.display = 'block';
    handleClientLoad();
  }, 1000);
};


// 🚀 Load Google API client
function handleClientLoad() {
  gapi.load('client:auth2', initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    discoveryDocs: DISCOVERY_DOCS,
    scope: SCOPES
  }).then(() => {
    const authInstance = gapi.auth2.getAuthInstance();

    authInstance.isSignedIn.listen(updateSigninStatus);
    updateSigninStatus(authInstance.isSignedIn.get());

    authorizeButton.onclick = () => authInstance.signIn();
    signoutButton.onclick = () => authInstance.signOut();
  });
}

function updateSigninStatus(isSignedIn) {
  if (isSignedIn) {
    authorizeButton.style.display = 'none';
    signoutButton.style.display = 'inline-block';
    loadSubscriptions();
  } else {
    authorizeButton.style.display = 'inline-block';
    signoutButton.style.display = 'none';
  }
}

// 📺 Load subscriptions (same as before)
async function loadSubscriptions() {
  const response = await gapi.client.youtube.subscriptions.list({
    part: 'snippet',
    mine: true,
    maxResults: 10
  });

  const channels = response.result.items;
  videoGrid.innerHTML = '';

  for (const channel of channels) {
    const channelId = channel.snippet.resourceId.channelId;
    const uploads = await gapi.client.youtube.search.list({
      part: 'snippet',
      channelId: channelId,
      order: 'date',
      maxResults: 1
    });

    uploads.result.items.forEach(video => {
      addVideoToGrid(video);
    });
  }
}

// 🔍 Search functionality
searchButton.onclick = () => {
  const query = searchInput.value.trim();
  if (!query) return;

  videoGrid.innerHTML = '<p>Searching...</p>';

  gapi.client.youtube.search.list({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: 8
  }).then(response => {
    videoGrid.innerHTML = '';
    response.result.items.forEach(video => {
      addVideoToGrid(video);
    });
  });
};

function openPlayer(videoId) {
  const modal = document.getElementById('videoPlayerModal');
  const iframe = document.getElementById('videoPlayer');
  iframe.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
  modal.style.display = 'flex';
}

function closePlayer() {
  const modal = document.getElementById('videoPlayerModal');
  const iframe = document.getElementById('videoPlayer');
  iframe.src = '';
  modal.style.display = 'none';
}

// 🧱 Reusable render function
function addVideoToGrid(video) {
  const vid = document.createElement('div');
  vid.className = 'video';
  vid.innerHTML = `
    <div onclick="openPlayer('${video.id.videoId}')" style="cursor:pointer;">
      <img src="${video.snippet.thumbnails.medium.url}" alt="">
      <h3>${video.snippet.title}</h3>
      <p>${video.snippet.channelTitle}</p>
    </div>
  `;
  videoGrid.appendChild(vid);
}