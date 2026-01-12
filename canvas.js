export async function generateStory(data) {
  const CANVAS_WIDTH = 1080;
  const CANVAS_HEIGHT = 1920;

  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function roundRect(x, y, w, h, r) {
    let radius = { tl: 0, tr: 0, br: 0, bl: 0 };
    if (typeof r === "number") {
      radius = { tl: r, tr: r, br: r, bl: r };
    } else {
      radius = { ...radius, ...r };
    }

    ctx.beginPath();
    ctx.moveTo(x + radius.tl, y);
    ctx.lineTo(x + w - radius.tr, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius.tr);
    ctx.lineTo(x + w, y + h - radius.br);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius.br, y + h);
    ctx.lineTo(x + radius.bl, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius.bl);
    ctx.lineTo(x, y + radius.tl);
    ctx.quadraticCurveTo(x, y, x + radius.tl, y);
    ctx.closePath();
  }

  function removeEmojis(text) {
    return text.replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\uD800-\uDFFF]|[\uFE00-\uFE0F]|\u24C2|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|\uD83E[\uDD00-\uDDFF])/g,
      ""
    );
  }

  const thumbnail = await loadImage(data.thumbnail);
  const ytLogo = await loadImage("./yt_logo.png");

  const MAX_CARD_WIDTH = 900;
  const CARD_TOP_MARGIN = 450;
  const CARD_RADIUS = 36;
  const TEXT_PADDING_BOTTOM = 60;

  const scale = Math.min(1, MAX_CARD_WIDTH / thumbnail.width);
  const thumbWidth = thumbnail.width * scale;
  const thumbHeight = thumbnail.height * scale;

  const cardWidth = thumbWidth;

  const cleanTitle = removeEmojis(data.title);

  ctx.font = "700 44px Roboto";
  const maxWidth = cardWidth - 80;
  const lineHeight = 56;

  function countLines(ctx, text, maxWidth) {
    const words = text.split(" ");
    let line = "";
    let lines = 1;

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        line = words[i] + " ";
        lines++;
      } else {
        line = testLine;
      }
    }
    return lines;
  }

  const linesCount = countLines(ctx, cleanTitle, maxWidth);

  const channelName = data.channel || "Canale sconosciuto";

  const channelIconHeight = 40; // Altezza fissa logo
  // Calcoliamo larghezza logo mantenendo proporzioni originali
  const ytLogoAspectRatio = ytLogo.width / ytLogo.height;
  const channelIconWidth = channelIconHeight * ytLogoAspectRatio;

  // Altezza totale della card (aggiunto spazio per canale + logo)
  const cardHeight =
    thumbHeight + linesCount * lineHeight + TEXT_PADDING_BOTTOM + channelIconHeight + 20;
  const cardX = (CANVAS_WIDTH - cardWidth) / 2;
  const cardY = CARD_TOP_MARGIN;

  // Sfondo blur
  ctx.filter = "blur(40px)";
  ctx.drawImage(
    thumbnail,
    (CANVAS_WIDTH - thumbWidth) / 2 - 200,
    0,
    thumbWidth + 400,
    CANVAS_HEIGHT
  );
  ctx.filter = "none";

  ctx.fillStyle = "rgba(0,0,0,0.45)";
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

  // Card con angoli arrotondati
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 20;

  ctx.fillStyle = "#121212";
  roundRect(cardX, cardY, cardWidth, cardHeight, CARD_RADIUS);
  ctx.fill();

  ctx.shadowColor = "transparent";

  // Thumbnail con arrotondamento solo angoli superiori
  ctx.save();
  roundRect(cardX, cardY, cardWidth, thumbHeight, {
    tl: CARD_RADIUS,
    tr: CARD_RADIUS,
    br: 0,
    bl: 0,
  });
  ctx.clip();
  ctx.drawImage(thumbnail, cardX, cardY, thumbWidth, thumbHeight);
  ctx.restore();

  // Titolo
  ctx.fillStyle = "#fff";
  ctx.font = "700 44px Roboto";
  ctx.textAlign = "left";

  const textX = cardX + 40;
  let textY = cardY + thumbHeight + 70;

  function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        ctx.fillText(line, x, y);
        line = words[i] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }

    ctx.fillText(line, x, y);
    return y;
  }

  textY = wrapText(ctx, cleanTitle, textX, textY, maxWidth, lineHeight) + 25;

  // Disegna logo YouTube mantenendo proporzioni
  ctx.drawImage(ytLogo, textX, textY, channelIconWidth, channelIconHeight);

  // Nome canale a destra del logo
  ctx.fillStyle = "#ddd";
  ctx.font = "500 32px Roboto";
  ctx.textAlign = "left";
  ctx.fillText(channelName, textX + channelIconWidth + 16, textY + channelIconHeight - 8);

  return canvas;
}
