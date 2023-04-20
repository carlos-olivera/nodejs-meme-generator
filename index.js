const http = require("http");
const url = require("url");
const fs = require("fs");
const sharp = require("sharp");
const axios = require("axios");

// Código adicional aquí

const server = http.createServer(async (req, res) => {
    // Manejo de solicitudes aquí
});

const PORT = process.env.PORT || 3200;
server.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
