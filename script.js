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

// ==================== EXACT API CONFIGURATION ====================
const RAPID_API_KEY = "f273bac7c8msh2aa7a560484e824p115ce5jsn1087c9cd67e0";
const RAPID_API_HOST = "social-download-all-in-one.p.rapidapi.com"; 

// ==================== FETCH LOGIC ====================
fetchBtn.addEventListener('click', async () => {
    const link = urlInput.value.trim();
    if (!link) { showError("Bhai, pehle koi valid link toh daal!"); return; }

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

        if (!response.ok) throw new Error("API Limit Reached ya Link Invalid hai.");

        const rawData = await response.json();
        console.log("API Data:", rawData); 
        const data = rawData.data || rawData.result || rawData;

        showResult(data, link);

    } catch (error) {
        showError(error.message || "Kuch garbad ho gayi. Try again.");
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== DIRECT DOWNLOAD HACK (CORS BYPASS) ====================
async function forceDownload(url, filename, btnElement, fallbackIcon) {
    const originalText = btnElement.innerHTML;
    btnElement.innerHTML = `<span>⏳ Downloading...</span>`;
    
    try {
        const res = await fetch(url);
        const blob = await res.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(blobUrl);
        btnElement.innerHTML = `<span>✅ Downloaded!</span>`;
    } catch (e) {
        console.log("CORS blocked Force Download, using fallback.", e);
        // Fallback: Opens in new tab if browser blocks direct download
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        btnElement.innerHTML = originalText;
    }
    
    // Reset button text after 3 seconds
    setTimeout(() => { btnElement.innerHTML = originalText; }, 3000);
}

// ==================== SMART UI RENDERER ====================
function showResult(data, originalLink) {
    vidTitle.innerText = data.title || data.desc || data.text || "Media Ready to Download";
    
    // Thumbnail setup (with YT Hack)
    let imgUrl = data.thumbnail || data.cover || data.image || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800";
    if (originalLink.toLowerCase().includes('youtu')) {
        const videoId = getYouTubeID(originalLink);
        if (videoId) imgUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }
    thumbImg.src = imgUrl;

    // Thumbnail Download Action
    thumbBtn.onclick = (e) => {
        e.preventDefault();
        forceDownload(imgUrl, 'OmniSave_Thumbnail.jpg', thumbBtn, '🖼️');
    };

    downloadOptions.innerHTML = ''; 

    // Extract Media Array
    let mediaList = data.medias || data.links || data.urls || [];
    if (mediaList.length === 0 && data.video) mediaList.push({ url: data.video, type: 'mp4', quality: 'HD Video' });

    let validLinksCount = 0;

    if (mediaList && Array.isArray(mediaList)) {
        mediaList.forEach((media, index) => {
            const url = media.url || media.link || media.src;
            if (!url) return;

            const ext = (media.extension || media.type || 'mp4').toLowerCase();
            const quality = (media.quality || media.render || 'Standard').toLowerCase();
            
            const isImage = ext.includes('jpg') || ext.includes('png') || ext.includes('image') || quality.includes('image');
            const isAudio = ext.includes('mp3') || quality.includes('audio');

            // 🛑 FILTER BAD LINKS (avc1, vp9, raw formats that don't play audio)
            if (!isImage && !isAudio) {
                if (quality.includes('avc1') || quality.includes('vp9') || quality.includes('av01')) {
                    return; // Skip this bad link
                }
            }

            validLinksCount++;
            const btn = document.createElement('a');
            btn.href = url;
            btn.target = "_blank";
            btn.className = isAudio ? 'btn-quality btn-audio' : 'btn-quality';
            
            // Text & Actions Logic
            if (isImage) {
                btn.innerHTML = `<span>🖼️ Image ${index + 1}</span><span>Download</span>`;
                btn.onclick = (e) => {
                    e.preventDefault();
                    forceDownload(url, `OmniSave_Img_${index+1}.jpg`, btn, '🖼️');
                };
            } else if (isAudio) {
                btn.innerHTML = `<span>🎵 MP3 Audio</span><span>${media.quality || 'Audio'}</span>`;
                // Try force download for audio
                btn.onclick = (e) => {
                    e.preventDefault();
                    forceDownload(url, `OmniSave_Audio.mp3`, btn, '🎵');
                };
            } else {
                btn.innerHTML = `<span>🎥 MP4 Video</span><span>${media.quality || 'Standard'}</span>`;
                // Video relies on normal download attribute (too heavy for blob fallback usually)
                btn.download = "OmniSave_Video.mp4"; 
            }
            
            downloadOptions.appendChild(btn);
        });
    }

    if (validLinksCount === 0) {
        showError("Koi working video/audio link nahi mila. (Ya toh private post hai ya unsupported format).");
        return;
    }
    
    // Platform Badge Set
    const linkForBadge = originalLink.toLowerCase();
    if(linkForBadge.includes('instagram.com')) platformBadge.innerText = "Instagram";
    else if(linkForBadge.includes('tiktok.com')) platformBadge.innerText = "TikTok";
    else if(linkForBadge.includes('youtube.com') || linkForBadge.includes('youtu.be')) platformBadge.innerText = "YouTube";
    else if(linkForBadge.includes('twitter.com') || linkForBadge.includes('x.com')) platformBadge.innerText = "X (Twitter)";
    else platformBadge.innerText = "Social Video";

    resultCard.style.display = 'block';
}

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
