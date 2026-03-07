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

// ==================== COBALT API CONFIG (WITH CORS PROXY) ====================
// Proxy laga di taaki browser ya API isko block na kare!
const COBALT_API_URL = "https://corsproxy.io/?https://api.cobalt.tools/api/json";


// ==================== FETCH LOGIC ====================
fetchBtn.addEventListener('click', async () => {
    const link = urlInput.value.trim();
    if (!link) { showError("Bhai, pehle koi valid link toh daal!"); return; }

    // UI Reset for Loading
    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    statusMsg.style.display = 'none';
    resultCard.style.display = 'none';

    try {
        const response = await fetch(COBALT_API_URL, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                url: link,
                vQuality: "1080", // 🔥 Force HD Quality
                filenamePattern: "classic" 
            })
        });

        const data = await response.json();
        console.log("Cobalt API Data:", data); 

        // Cobalt sends status 'error' if link is invalid
        if (data.status === 'error') {
            throw new Error(data.text || "API Error: Invalid Link ya Private Video.");
        }

        showResult(data, link);

    } catch (error) {
        showError(error.message || "Kuch garbad ho gayi. Try again.");
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});


// ==================== SMART UI RENDERER ====================
function showResult(data, originalLink) {
    
    // 1. Identify Platform for Badge
    const linkForBadge = originalLink.toLowerCase();
    let platformName = "Social Video";
    if(linkForBadge.includes('instagram.com')) platformName = "Instagram";
    else if(linkForBadge.includes('tiktok.com')) platformName = "TikTok";
    else if(linkForBadge.includes('youtube.com') || linkForBadge.includes('youtu.be')) platformName = "YouTube";
    else if(linkForBadge.includes('twitter.com') || linkForBadge.includes('x.com')) platformName = "X (Twitter)";
    else if(linkForBadge.includes('reddit.com')) platformName = "Reddit";
    else if(linkForBadge.includes('pinterest.com')) platformName = "Pinterest";

    platformBadge.innerText = platformName;
    vidTitle.innerText = `${platformName} Media Ready!`;

    // 2. Thumbnail Logic (YT Hack + Fallback)
    let imgUrl = "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";
    if (platformName === "YouTube") {
        const videoId = getYouTubeID(originalLink);
        if (videoId) imgUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    } else if (data.thumbnail) {
        imgUrl = data.thumbnail;
    }
    thumbImg.src = imgUrl;

    thumbBtn.onclick = (e) => {
        e.preventDefault();
        window.open(imgUrl, '_blank');
    };

    downloadOptions.innerHTML = ''; 

    // 3. Extract Links (Cobalt handles single videos and carousels/slides differently)
    let mediaList = [];
    
    // Agar Instagram post mein multiple photos/videos hain (Carousel)
    if (data.status === "picker" && data.picker) {
        mediaList = data.picker.map(item => ({ url: item.url, type: item.type }));
    } 
    // Agar single video hai
    else if (data.url) {
        mediaList = [{ url: data.url, type: 'video' }];
    }

    if (mediaList.length === 0) {
        showError("Koi working media link nahi mila.");
        return;
    }

    // 4. Generate Buttons
    mediaList.forEach((media, index) => {
        const btn = document.createElement('a');
        btn.href = media.url;
        btn.target = "_blank"; // Direct open/download
        
        if (media.type === 'photo' || media.type === 'image') {
            btn.className = 'btn-quality';
            btn.innerHTML = `<span>🖼️ Image ${index + 1}</span><span>HD</span>`;
        } else {
            btn.className = 'btn-quality';
            btn.innerHTML = `<span>🎥 MP4 Video ${mediaList.length > 1 ? index + 1 : ''}</span><span>HD 1080p</span>`;
        }
        
        downloadOptions.appendChild(btn);
    });

    // 5. BONUS FEATURE: Extract MP3 Audio button for single videos!
    if (mediaList.length === 1 && mediaList[0].type === 'video') {
        const audioBtn = document.createElement('button');
        audioBtn.className = 'btn-quality btn-audio';
        audioBtn.style.cursor = 'pointer';
        audioBtn.style.border = 'none';
        audioBtn.style.width = '100%';
        audioBtn.innerHTML = `<span>🎵 Extract MP3 Audio</span><span>Tap to get</span>`;
        
        audioBtn.onclick = () => fetchAudioOnly(originalLink, audioBtn);
        downloadOptions.appendChild(audioBtn);
    }

    resultCard.style.display = 'block';
}

// ==================== AUDIO EXTRACTION LOGIC ====================
async function fetchAudioOnly(link, btnElement) {
    btnElement.innerHTML = `<span>⏳ Processing Audio...</span>`;
    btnElement.disabled = true;
    try {
        const response = await fetch(COBALT_API_URL, {
            method: 'POST',
            headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: link, isAudioOnly: true }) // Cobalt special feature
        });
        const data = await response.json();
        
        if (data.url) {
            btnElement.innerHTML = `<span>✅ Audio Ready! Click Here</span>`;
            btnElement.onclick = () => window.open(data.url, '_blank');
            btnElement.disabled = false;
        } else {
            throw new Error();
        }
    } catch(e) {
        btnElement.innerHTML = `<span>❌ Audio Failed</span>`;
    }
}

// ==================== HELPERS ====================
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
