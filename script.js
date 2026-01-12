import { generateStory } from "./canvas.js";

const button = document.getElementById("generateBtn");
const input = document.getElementById("youtubeUrl");
const previewContainer = document.getElementById("previewContainer");
const preview = document.getElementById("preview");
const downloadBtn = document.getElementById("downloadBtn");

let generatedCanvas = null;

/* 1. Parsing URL YouTube */

function extractVideoId(url) {
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.hostname === "youtu.be") {
        return parsedUrl.pathname.slice(1);
      }
  
      // Supporta /watch?v=ID, /shorts/ID e /live/ID
      if (parsedUrl.pathname.startsWith("/live/")) {
        return parsedUrl.pathname.split("/live/")[1];
      }
  
      if (parsedUrl.pathname.startsWith("/shorts/")) {
        return parsedUrl.pathname.split("/shorts/")[1];
      }
  
      const vParam = parsedUrl.searchParams.get("v");
      if (vParam) {
        return vParam;
      }
  
      return null;
    } catch {
      return null;
    }
  }
  

/* 2. Fetch dati video (oEmbed) */
async function fetchVideoData(videoUrl) {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(
    videoUrl
  )}&format=json`;

  const response = await fetch(oEmbedUrl);

  if (!response.ok) {
    throw new Error("Impossibile recuperare i dati del video");
  }

  const data = await response.json();
  console.log(data);

  return {
    title: data.title,
    channel: data.author_name,
    channelUrl: data.author_url,
    thumbnail: data.thumbnail_url.replace("hqdefault", "maxresdefault"),
  };
}

/* 3. Fetch avatar canale */
async function fetchChannelAvatar(channelUrl) {
  try {
    const response = await fetch(channelUrl);
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const metaImage =
      doc.querySelector('meta[property="og:image"]') ||
      doc.querySelector('link[rel="image_src"]');

    return metaImage ? metaImage.content || metaImage.href : null;
  } catch {
    return null;
  }
}

/* 4. Click handler */
button.addEventListener("click", async () => {
  const url = input.value.trim();

  if (!url) {
    alert("Incolla un link YouTube 👀");
    return;
  }

  const videoId = extractVideoId(url);

  if (!videoId) {
    alert("Link YouTube non valido");
    return;
  }

  button.disabled = true;
  button.textContent = "Genero...";

  try {
    const videoData = await fetchVideoData(url);
    const avatar = await fetchChannelAvatar(videoData.channelUrl);

    generatedCanvas = await generateStory({
      title: videoData.title,
      channel: videoData.channel,
      thumbnail: videoData.thumbnail,
      avatar,
    });

    // Mostra anteprima
    preview.innerHTML = "";
    preview.appendChild(generatedCanvas);
    previewContainer.classList.add("visible"); // mostra preview
  } catch (error) {
    console.error(error);
    alert("Errore nel recupero dei dati");
  } finally {
    button.disabled = false;
    button.textContent = "Genera";
  }
});

/* 5. Download bottone */
downloadBtn.addEventListener("click", () => {
  if (!generatedCanvas) return;

  const link = document.createElement("a");
  link.download = "yt-story.png";
  link.href = generatedCanvas.toDataURL("image/png");
  link.click();
});
