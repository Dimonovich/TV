const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Раздаём статические файлы (ваш HTML и картинки)
app.use(express.static(__dirname));

// Создаём прокси для всех потоков, которые начинаются на http://
// Это сердце решения — оно устраняет проблему смешанного контента
app.use('/proxy', (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl || !targetUrl.startsWith('http://')) {
        return res.status(400).send('Bad Request: Need ?url=http://...');
    }
    // Создаём прокси на лету
    const proxy = createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        secure: false, // Нужно для небезопасных http потоков
        logLevel: 'warn',
        onError: (err, req, res) => {
            console.error(`Proxy error for ${targetUrl}:`, err.message);
            res.status(503).send(`Radio stream unavailable: ${err.message}`);
        }
    });
    proxy(req, res, next);
});

// Запускаем сервер
app.listen(PORT, () => {
    console.log(`Radio proxy server running on port ${PORT}`);
    console.log(`Serving static files from ${__dirname}`);
});
