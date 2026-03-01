// ==================== DOM ELEMENTS ====================
const urlInput = document.getElementById('videoUrl');
const fetchBtn = document.getElementById('fetchBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const statusMsg = document.getElementById('statusMsg');
const resultCard = document.getElementById('resultCard');

const thumbImg = document.getElementById('thumbImg');
const vidTitle = document.getElementById('vidTitle');
const platformBadge = document.getElementById('platformBadge');
const downloadOptions = document.getElementById('downloadOptions');
const thumbBtn = document.getElementById('thumbBtn');

// Modal Elements
const navAbout = document.getElementById('navAbout');
const aboutOverlay = document.getElementById('aboutOverlay');
const closeAbout = document.getElementById('closeAbout');

// ==================== ABOUT MODAL LOGIC ====================
if (navAbout && aboutOverlay && closeAbout) {
    navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        aboutOverlay.classList.add('active');
    });
    closeAbout.addEventListener('click', () => {
        aboutOverlay.classList.remove('active');
    });
    aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay) aboutOverlay.classList.remove('active');
    });
}

// ==================== API KEYS ====================
const RAPID_API_KEY = "f273bac7c8msh2aa7a560484e824p115ce5jsn1087c9cd67e0";

// ==================== MASTER ROUTER (FETCH LOGIC) ====================
fetchBtn.addEventListener('click', async () => {
    const link = urlInput.value.trim().toLowerCase();
    
    if (!link) {
        showError("Bhai, pehle koi link toh daal!");
        return;
    }

    // Start Loading UI
    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    statusMsg.style.display = 'none';
    resultCard.style.display = 'none';

    try {
        // 🚀 ROUTE 1: YOUTUBE
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
            await handleYouTube(link);
        } 
        // 🚀 ROUTE 2: INSTAGRAM
        else if (link.includes('instagram.com')) {
            await handleInstagram(urlInput.value.trim()); // Original case pass karenge
        } 
        // ❌ INVALID LINK
        else {
            throw new Error("Abhi sirf YouTube aur Instagram supported hain!");
        }
    } catch (error) {
        showError(error.message || "Kuch garbad ho gayi. Link check kar!");
    } finally {
        // Stop Loading UI
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== YOUTUBE HANDLER ====================
async function handleYouTube(url) {
    // 1. YouTube Video ID nikalna (Jugaad ke liye zaruri hai)
    const videoId = getYouTubeID(url);
    if (!videoId) throw new Error("YouTube link sahi nahi hai.");

    // 2. Fetch Data from YTGrabber API (GET Method)
    const apiUrl = `https://ytgrabber.p.rapidapi.com/app/get/${videoId}`;
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'ytgrabber.p.rapidapi.com',
            'x-rapidapi-key': RAPID_API_KEY
        }
    });

    if (!response.ok) throw new Error("YouTube API fail ho gayi ya limit khatam.");
    const data = await response.json();
    console.log("YouTube Data:", data);

    // 3. HD Thumbnail Jugaad (Bina API ke direct YouTube server se)
    const hdThumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

    // 4. Extract Title & Buttons
    const title = data.title || data.video_title || "YouTube Video";
    let buttons = [];

    // YTGrabber ka data nikalna
    if (data.formats || data.links) {
        const mediaList = data.formats || data.links;
        mediaList.forEach(media => {
            if(media.url || media.link) {
                const isAudio = media.has_video === false || media.mimeType?.includes('audio');
                buttons.push({
                    url: media.url || media.link,
                    quality: media.qualityLabel || media.quality || (isAudio ? 'MP3' : 'MP4'),
                    isAudio: isAudio
                });
            }
        });
    } else if (data.url) { // Fallback
        buttons.push({ url: data.url, quality: 'MP4 Video', isAudio: false });
    }

    if (buttons.length === 0) throw new Error("Is video ke download links nahi mile.");

    // UI Render karo
    renderUI(title, hdThumbnail, buttons, "YouTube");
}

// ==================== INSTAGRAM HANDLER ====================
async function handleInstagram(url) {
    // 1. Fetch Data from Instagram API (GET Method)
    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://instagram-reels-downloader-api.p.rapidapi.com/download?url=${encodedUrl}`;
    
    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'instagram-reels-downloader-api.p.rapidapi.com',
            'x-rapidapi-key': RAPID_API_KEY
        }
    });

    if (!response.ok) throw new Error("Instagram API fail ho gayi.");
    const rawData = await response.json();
    console.log("Instagram Data:", rawData);

    const data = rawData.data || rawData.result || rawData;

    // 2. Extract Details
    const title = data.title || data.caption || "Instagram Reel/Video";
    const thumbnail = data.thumbnail || data.cover || data.image || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";
    
    let buttons = [];
    const videoUrl = data.video_url || data.video || data.url || (data.medias && data.medias[0]?.url);
    
    if (videoUrl) {
        buttons.push({ url: videoUrl, quality: 'HD Video', isAudio: false });
    } else {
        throw new Error("Instagram video ka link nahi mila.");
    }

    // UI Render karo
    renderUI(title, thumbnail, buttons, "Instagram");
}

// ==================== UI RENDERER (Naya Function) ====================
function renderUI(title, imgUrl, buttonsArray, platform) {
    vidTitle.innerText = title;
    thumbImg.src = imgUrl;
    thumbBtn.href = imgUrl; // Download Thumbnail link
    platformBadge.innerText = platform;

    downloadOptions.innerHTML = ''; // Purane buttons saaf karo

    // Naye buttons lagao
    buttonsArray.forEach(btnData => {
        const btn = document.createElement('a');
        btn.href = btnData.url;
        btn.target = "_blank";
        btn.className = btnData.isAudio ? 'btn-quality btn-audio' : 'btn-quality';
        
        btn.innerHTML = `
            <span>${btnData.isAudio ? '🎵 MP3 Audio' : '🎥 MP4 Video'}</span>
            <span>${btnData.quality}</span>
        `;
        downloadOptions.appendChild(btn);
    });

    resultCard.style.display = 'block';
}

// ==================== UTILS ====================
function showError(msg) {
    statusMsg.className = "msg error";
    statusMsg.innerText = "⚠️ " + msg;
    statusMsg.style.display = 'block';
}

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
