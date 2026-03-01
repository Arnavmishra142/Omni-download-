// ==================== DOM ELEMENTS ====================
const urlInput = document.getElementById('videoUrl');
const fetchBtn = document.getElementById('fetchBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const statusMsg = document.getElementById('statusMsg');
const resultCard = document.getElementById('resultCard');

// Result Card Elements
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

    // Bahar click karne pe modal band ho jaye
    aboutOverlay.addEventListener('click', (e) => {
        if (e.target === aboutOverlay) {
            aboutOverlay.classList.remove('active');
        }
    });
}

// ==================== EXACT API CONFIGURATION ====================
const RAPID_API_KEY = "f273bac7c8msh2aa7a560484e824p115ce5jsn1087c9cd67e0";
const RAPID_API_HOST = "social-download-all-in-one.p.rapidapi.com"; 

// ==================== FETCH LOGIC (ALL-IN-ONE POST API) ====================
fetchBtn.addEventListener('click', async () => {
    const link = urlInput.value.trim();
    
    if (!link) {
        showError("Bhai, pehle koi valid link toh daal!");
        return;
    }

    // 1. Loading Animation Shuru
    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    statusMsg.style.display = 'none';
    resultCard.style.display = 'none';

    try {
        const apiUrl = `https://${RAPID_API_HOST}/v1/social/autolink`;
        
        // 2. API Call (POST Method)
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-rapidapi-host': RAPID_API_HOST,
                'x-rapidapi-key': RAPID_API_KEY
            },
            body: JSON.stringify({ url: link })
        });

        if (!response.ok) throw new Error("API Limit Reached ya Link Invalid hai.");

        const rawData = await response.json();
        console.log("API Response:", rawData); // Browser console check karne ke liye

        // 3. API ka Data Extract Karna (Smart Unwrapper)
        const data = rawData.data || rawData.result || rawData;

        // 4. Result UI mein bhejna
        showResult(data, link);

    } catch (error) {
        showError(error.message || "Kuch garbad ho gayi. Try again.");
    } finally {
        // 5. Loading Animation Band
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== SUPER SMART UI RENDERER ====================
function showResult(data, originalLink) {
    // 1. Title Set Karo
    vidTitle.innerText = data.title || data.desc || data.text || "Media Ready to Download";
    
    // 2. Thumbnail Set Karo (YOUTUBE HD JUGAAD INCLUDED)
    let imgUrl = data.thumbnail || data.cover || data.image || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";
    
    // Agar YouTube ka link hai, toh HD photo direct server se nikal lo
    if (originalLink.toLowerCase().includes('youtu')) {
        const videoId = getYouTubeID(originalLink);
        if (videoId) imgUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    thumbImg.src = imgUrl;
    thumbBtn.href = imgUrl; // Thumbnail download button set karna

    // 3. Download Buttons Clear Karo
    downloadOptions.innerHTML = ''; 

    // 4. API se Quality aur MP3 Buttons Banao
    let mediaList = data.medias || data.links || data.urls;

    if (mediaList && Array.isArray(mediaList) && mediaList.length > 0) {
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
        // Fallback: Agar API ne direct ek single link diya ho
        const singleVidUrl = data.video || data.url || data.nowatermark || data.watermark;
        if (singleVidUrl) {
            const btn = document.createElement('a');
            btn.href = singleVidUrl;
            btn.target = "_blank";
            btn.className = 'btn-quality';
            btn.innerHTML = `<span>🎥 MP4 Video</span><span>Download</span>`;
            downloadOptions.appendChild(btn);
        }
    }

    // Check agar koi button nahi mila
    if (downloadOptions.innerHTML === '') {
        showError("Is video ka koi direct download link nahi mila.");
        return;
    }
    
    // 5. Platform Badge Set Karo
    const linkForBadge = originalLink.toLowerCase();
    if(linkForBadge.includes('instagram.com')) platformBadge.innerText = "Instagram";
    else if(linkForBadge.includes('tiktok.com')) platformBadge.innerText = "TikTok";
    else if(linkForBadge.includes('youtube.com') || linkForBadge.includes('youtu.be')) platformBadge.innerText = "YouTube";
    else if(linkForBadge.includes('twitter.com') || linkForBadge.includes('x.com')) platformBadge.innerText = "X (Twitter)";
    else platformBadge.innerText = "Social Video";

    // 6. Result Card Show Karo
    resultCard.style.display = 'block';
}

// ==================== UTILS (HELPER FUNCTIONS) ====================
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
