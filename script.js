// ==================== DOM ELEMENTS ====================
const urlInput = document.getElementById('videoUrl');
const fetchBtn = document.getElementById('fetchBtn');
const btnText = document.getElementById('btnText');
const loader = document.getElementById('loader');
const statusMsg = document.getElementById('statusMsg');
const resultCard = document.getElementById('resultCard');

const thumbImg = document.getElementById('thumbImg');
const vidTitle = document.getElementById('vidTitle');
const dlLink = document.getElementById('dlLink');
const platformBadge = document.getElementById('platformBadge');

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

    // Close when clicking outside the modal box
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
        
        // Calling API via POST method
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

        const data = await response.json();
        console.log("Full API Data:", data);

        // 🔍 Extracting Data from different API structures
        let downloadUrl = null;
        
        if (data.medias && data.medias.length > 0) downloadUrl = data.medias[0].url; 
        else if (data.video) downloadUrl = data.video;
        else if (data.url) downloadUrl = data.url;

        if (downloadUrl) {
            showResult(
                data.title || "Video Ready to Download", 
                data.thumbnail || "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800", // Fallback Image
                downloadUrl
            );
        } else {
            throw new Error("Could not extract video link from this post.");
        }

    } catch (error) {
        showError(error.message || "Something went wrong. Try again.");
    } finally {
        // Stop Loading Animation
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== HELPER FUNCTIONS ====================
function showResult(title, imgUrl, videoUrl) {
    vidTitle.innerText = title;
    thumbImg.src = imgUrl;
    dlLink.href = videoUrl;
    
    // Auto Detect Platform
    const link = urlInput.value.toLowerCase();
    if(link.includes('instagram.com')) platformBadge.innerText = "Instagram";
    else if(link.includes('tiktok.com')) platformBadge.innerText = "TikTok";
    else if(link.includes('youtube.com') || link.includes('youtu.be')) platformBadge.innerText = "YouTube";
    else if(link.includes('twitter.com') || link.includes('x.com')) platformBadge.innerText = "X (Twitter)";
    else platformBadge.innerText = "Social Video";

    resultCard.style.display = 'block';
}

function showError(msg) {
    statusMsg.className = "msg error";
    statusMsg.innerText = "⚠️ " + msg;
    statusMsg.style.display = 'block';
}
