const http = require("http");
const url = require("url");
const fs = require("fs");
const sharp = require("sharp");
const axios = require("axios");

function wrapText(text, maxChars) {
    const words = text.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
        const word = words[i];
        if (currentLine.length + word.length + 1 <= maxChars) {
            currentLine += " " + word;
        } else {
            lines.push(currentLine);
            currentLine = word;
        }
    }
    lines.push(currentLine);

    return lines;
}

function sendResponse(res, statusCode, contentType, content) {
    res.writeHead(statusCode, { "Content-Type": contentType });
    res.end(content);
}

function createSvg(width, height, fontSize, textLines) {
    return `
    <svg width="${width}" height="${height}">
      <style>
        .title-bg {
          font-family: Impact, sans-serif;
          font-size: ${fontSize}px;
          font-weight: bold;
          text-anchor: middle;
          stroke: black;
          stroke-width: 5px;
          fill: white;
        }
        .title-fg {
          font-family: Impact, sans-serif;
          font-size: ${fontSize}px;
          font-weight: bold;
          text-anchor: middle;
          fill: white;
        }
      </style>
      ${textLines
            .map(
                (line, index) =>
                    `<text x="${width / 2}" y="${height - (height * 0.3) + 25 + fontSize + (fontSize + 10) * index
                    }" class="title-bg">${line}</text>
             <text x="${width / 2}" y="${height - (height * 0.3) + 25 + fontSize + (fontSize + 10) * index
                    }" class="title-fg">${line}</text>`
            )
            .join("")}
    </svg>
  `;
}

const server = http.createServer(async (req, res) => {
    const requestUrl = url.parse(req.url, true);

    if (requestUrl.pathname === "/getimage" && requestUrl.query.texto && requestUrl.query.imageUrl) {
        try {
            const imageUrl = requestUrl.query.imageUrl;
            const text = requestUrl.query.texto;

            const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
            const inputBuffer = Buffer.from(response.data, "binary");

            const maxWidth = 720;
            const inputMetadata = await sharp(inputBuffer).metadata();
            const scale = maxWidth / inputMetadata.width;
            const width = inputMetadata.width * scale;
            const height = inputMetadata.height * scale;

            const maxChars = text.length > 32 ? 32 : text.length;
            const fontSize = Math.floor((width * 0.9) / (maxChars / 2));
            const textLines = wrapText(text, maxChars);

            const svgBuffer = Buffer.from(createSvg(width, height, fontSize, textLines));

            const outputBuffer = await sharp(inputBuffer)
                .resize(width, Math.round(height), { fit: "contain" })
                .composite([
                    {
                        input: svgBuffer,
                        top: 0,
                        left: 0,
                    },
                ])
                .toBuffer();

            sendResponse(res, 200, "image/jpeg", outputBuffer);
            
        } catch (error) {
            console.error(error);
            sendResponse(res, 500, "text/plain", "Error al procesar la imagen.");
        }
    } else {
        sendResponse(res, 404, "text/plain", "Endpoint no encontrado.");
    }
});

const PORT = process.env.PORT || 3200;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
