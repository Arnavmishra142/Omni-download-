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
const downloadOptions = document.getElementById('downloadOptions'); // Naya div
const thumbBtn = document.getElementById('thumbBtn'); // Thumbnail button

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
        if (e.target === aboutOverlay) {
            aboutOverlay.classList.remove('active');
        }
    });
}

// ==================== EXACT API CONFIGURATION ====================
const RAPID_API_KEY = "f273bac7c8msh2aa7a560484e824p115ce5jsn1087c9cd67e0";
const RAPID_API_HOST = "social-download-all-in-one.p.rapidapi.com"; 

// ==================== FETCH LOGIC (POST METHOD) ====================
fetchBtn.addEventListener('click', async () => {
    const link = urlInput.value.trim();
    
    if (!link) {
        showError("Please paste a valid link first.");
        return;
    }

    // Start Loading Animation
    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    statusMsg.style.display = 'none';
    resultCard.style.display = 'none';

    try {
        const apiUrl = `https://${RAPID_API_HOST}/v1/social/autolink`;
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': RAPID_API_HOST,
                'x-rapidapi-key': RAPID_API_KEY
            },
            body: JSON.stringify({ url: link })
        });

        if (!response.ok) throw new Error("API Limit Reached or Invalid Link");

        const rawData = await response.json();
        console.log("Full API Data:", rawData); // Isko browser console me check karna agar error aaye

        // SMART UNWRAPPER: API kabhi kabhi data ko 'data' ya 'result' object me bhejti hai
        const data = rawData.data || rawData.result || rawData;

        // Seedha Smart Parser (showResult) ko data bhej do
        showResult(data);

    } catch (error) {
        showError(error.message || "Something went wrong. Try again.");
    } finally {
        // Stop Loading Animation
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== SUPER SMART PARSER ====================
function showResult(data) {
    // 1. Extract Title (3 jagah check karega)
    vidTitle.innerText = data.title || data.desc || data.text || "Media Ready to Download";
    
    // 2. Extract Thumbnail (Har possible naam check karega)
    const imgUrl = data.thumbnail || data.cover || data.image || data.picture || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";
    thumbImg.src = imgUrl;
    thumbBtn.href = imgUrl; // Thumbnail download button me set karna

    // 3. Clear old buttons
    downloadOptions.innerHTML = ''; 

    // 4. Find all possible media links (Arrays)
    let mediaList = [];
    if (data.medias && Array.isArray(data.medias)) mediaList = data.medias;
    else if (data.links && Array.isArray(data.links)) mediaList = data.links;
    else if (data.urls && Array.isArray(data.urls)) mediaList = data.urls;

    if (mediaList.length > 0) {
        // Agar API ne multiple options diye (1080p, 720p, MP3)
        mediaList.forEach(media => {
            const url = media.url || media.link || media.src;
            if (!url) return;

            const ext = (media.extension || media.type || 'mp4').toLowerCase();
            const quality = media.quality || media.render || 'Standard';
            const isAudio = ext === 'mp3' || quality.toLowerCase().includes('audio');

            const btn = document.createElement('a');
            btn.href = url;
            btn.target = "_blank";
            btn.className = isAudio ? 'btn-quality btn-audio' : 'btn-quality';
            
            btn.innerHTML = `
                <span>${isAudio ? '🎵 MP3 Audio' : '🎥 MP4 Video'}</span>
                <span>${quality}</span>
            `;
            downloadOptions.appendChild(btn);
        });
    } else {
        // Fallback: Agar API ne list nahi di, sirf single direct link diya
        const singleVidUrl = data.video || data.url || data.nowatermark || data.watermark;
        if (singleVidUrl) {
            const btn = document.createElement('a');
            btn.href = singleVidUrl;
            btn.target = "_blank";
            btn.className = 'btn-quality';
            btn.innerHTML = `<span>🎥 MP4 Video</span><span>Download</span>`;
            downloadOptions.appendChild(btn);
        }

        // Agar MP3 audio alag se diya ho
        if (data.audio) {
            const btn = document.createElement('a');
            btn.href = data.audio;
            btn.target = "_blank";
            btn.className = 'btn-quality btn-audio';
            btn.innerHTML = `<span>🎵 MP3 Audio</span><span>Download</span>`;
            downloadOptions.appendChild(btn);
        }
    }

    // Agar koi link nahi mila
    if (downloadOptions.innerHTML === '') {
        showError("Could not extract video links from this post.");
        return;
    }
    
    // 5. Auto Detect Platform Badge
    const link = urlInput.value.toLowerCase();
    if(link.includes('instagram.com')) platformBadge.innerText = "Instagram";
    else if(link.includes('tiktok.com')) platformBadge.innerText = "TikTok";
    else if(link.includes('youtube.com') || link.includes('youtu.be')) platformBadge.innerText = "YouTube";
    else if(link.includes('twitter.com') || link.includes('x.com')) platformBadge.innerText = "X (Twitter)";
    else platformBadge.innerText = "Social Video";

    // Show result card
    resultCard.style.display = 'block';
}

function showError(msg) {
    statusMsg.className = "msg error";
    statusMsg.innerText = "⚠️ " + msg;
    statusMsg.style.display = 'block';
}
