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

// ==================== ABOUT MODAL ====================
if (navAbout && aboutOverlay && closeAbout) {
    navAbout.addEventListener('click', (e) => {
        e.preventDefault();
        aboutOverlay.classList.add('active');
    });

    closeAbout.addEventListener('click', () => {
        aboutOverlay.classList.remove('active');
    });

    aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay) {
            aboutOverlay.classList.remove('active');
        }
    });
}

// ==================== API KEY ====================
const RAPID_API_KEY = "YOUR_RAPID_API_KEY";

// ==================== MASTER FETCH ====================
fetchBtn.addEventListener('click', async () => {
    const link = urlInput.value.trim();

    if (!link) {
        showError("Pehle valid link daalo.");
        return;
    }

    // Loading UI
    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    statusMsg.style.display = 'none';
    resultCard.style.display = 'none';

    try {
        if (link.includes('youtube.com') || link.includes('youtu.be')) {
            await handleYouTube(link);
        } 
        else if (link.includes('instagram.com')) {
            await handleInstagram(link);
        } 
        else {
            throw new Error("Abhi sirf YouTube aur Instagram supported hain.");
        }

    } catch (error) {
        showError(error.message || "Kuch error aa gaya.");
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== YOUTUBE HANDLER ====================
async function handleYouTube(url) {

    const encodedUrl = encodeURIComponent(url);
    const apiUrl = `https://youtube-video-audio-downloader-api2.p.rapidapi.com/?url=${encodedUrl}`;

    const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
            'x-rapidapi-host': 'youtube-video-audio-downloader-api2.p.rapidapi.com',
            'x-rapidapi-key': RAPID_API_KEY
        }
    });

    if (!response.ok) throw new Error("YouTube API fail ho gayi ya limit khatam.");

    const data = await response.json();

    const videoId = getYouTubeID(url);
    const hdThumbnail = videoId
        ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
        : "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";

    const title = data.title || "YouTube Video";
    let buttons = [];

    const mediaList = data.formats || data.links || data.medias;

    if (mediaList && Array.isArray(mediaList)) {
        mediaList.forEach(media => {
            if (media.url || media.link) {
                const quality = media.quality || media.format || 'MP4';
                const isAudio = quality.toLowerCase().includes('mp3');

                buttons.push({
                    url: media.url || media.link,
                    quality: quality,
                    isAudio: isAudio
                });
            }
        });
    }

    if (buttons.length === 0)
        throw new Error("Download link nahi mila.");

    renderUI(title, hdThumbnail, buttons, "YouTube");
}

// ==================== INSTAGRAM HANDLER ====================
async function handleInstagram(url) {

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
    const data = rawData.data || rawData;

    const title = data.title || "Instagram Video";
    const thumbnail = data.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";

    let buttons = [];

    if (data.video_url) {
        buttons.push({
            url: data.video_url,
            quality: "HD Video",
            isAudio: false
        });
    }

    if (buttons.length === 0)
        throw new Error("Instagram video link nahi mila.");

    renderUI(title, thumbnail, buttons, "Instagram");
}

// ==================== UI RENDER ====================
function renderUI(title, imgUrl, buttonsArray, platform) {

    vidTitle.innerText = title;
    thumbImg.src = imgUrl;
    platformBadge.innerText = platform;

    downloadOptions.innerHTML = '';

    buttonsArray.forEach(btnData => {
        const btn = document.createElement('a');
        btn.href = btnData.url;
        btn.target = "_blank";
        btn.className = "btn-quality";

        btn.innerHTML = `
            <span>${btnData.isAudio ? 'MP3 Audio' : 'MP4 Video'}</span>
            <span>${btnData.quality}</span>
        `;

        downloadOptions.appendChild(btn);
    });

    resultCard.style.display = 'block';
}

// ==================== HELPERS ====================
function showError(msg) {
    statusMsg.className = "msg error";
    statusMsg.innerText = "⚠️ " + msg;
    statusMsg.style.display = 'block';
}

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|embed\/|watch\?v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
