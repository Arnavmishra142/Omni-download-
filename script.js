// ==================== DOM ELEMENTS ====================
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

// 🔐 Replace with new regenerated key
const RAPID_API_KEY = "YOUR_NEW_RAPID_API_KEY";

fetchBtn.addEventListener('click', async () => {

    fetchBtn.disabled = true;
    btnText.style.display = 'none';
    loader.style.display = 'block';
    statusMsg.style.display = 'none';
    resultCard.style.display = 'none';

    try {
        const response = await fetch(
            "https://yt-api.p.rapidapi.com/hype?geo=US",
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    "x-rapidapi-host": "yt-api.p.rapidapi.com",
                    "x-rapidapi-key": RAPID_API_KEY
                }
            }
        );

        if (!response.ok) {
            throw new Error("API call fail ho gayi.");
        }

        const data = await response.json();
        console.log("Hype Data:", data);

        if (!data.data || data.data.length === 0) {
            throw new Error("Trending videos nahi mile.");
        }

        // First trending video show kar dete hain
        const video = data.data[0];

        const title = video.title || "Trending Video";
        const thumbnail = video.thumbnail?.[0]?.url || video.thumbnail || "";
        const videoUrl = `https://www.youtube.com/watch?v=${video.videoId}`;

        renderUI(title, thumbnail, videoUrl);

    } catch (error) {
        showError(error.message);
    } finally {
        fetchBtn.disabled = false;
        btnText.style.display = 'block';
        loader.style.display = 'none';
    }
});

// ==================== UI RENDER ====================
function renderUI(title, imgUrl, videoUrl) {

    vidTitle.innerText = title;
    thumbImg.src = imgUrl;
    platformBadge.innerText = "YouTube Trending";

    downloadOptions.innerHTML = "";

    const watchBtn = document.createElement("a");
    watchBtn.href = videoUrl;
    watchBtn.target = "_blank";
    watchBtn.className = "btn-quality";
    watchBtn.innerText = "▶ Watch on YouTube";

    downloadOptions.appendChild(watchBtn);

    thumbBtn.href = imgUrl;

    resultCard.style.display = "block";
}

// ==================== ERROR ====================
function showError(msg) {
    statusMsg.className = "msg error";
    statusMsg.innerText = "⚠️ " + msg;
    statusMsg.style.display = "block";
}
