import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const server = http.createServer((req, res) => {
    let filePath = '.' + req.url;
    
    if (filePath === './') {
        filePath = './index.html';
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.webp': 'image/webp',
        '.wav': 'audio/wav',
        '.mp3': 'audio/mpeg',
        '.mp4': 'video/mp4',
        '.webm': 'video/webm',
        '.woff': 'application/font-woff',
        '.woff2': 'application/font-woff2',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm',
        '.xml': 'application/xml',
        '.pdf': 'application/pdf'
    };
    
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Security headers
    const securityHeaders = {
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline' cdnjs.cloudflare.com fonts.googleapis.com; font-src 'self' fonts.gstatic.com cdnjs.cloudflare.com; img-src 'self' data: blob:; connect-src 'self'; media-src 'self' blob:;"
    };
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // Handle SPA routing - serve index.html for non-file requests
                if (!extname && !filePath.includes('.')) {
                    fs.readFile('./index.html', (err, indexContent) => {
                        if (err) {
                            res.writeHead(404, { 'Content-Type': 'text/html', ...securityHeaders });
                            res.end(`
                                <!DOCTYPE html>
                                <html>
                                <head>
                                    <title>404 - Page Not Found</title>
                                    <style>
                                        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                                        h1 { color: #e74c3c; }
                                        p { color: #666; }
                                        a { color: #3498db; text-decoration: none; }
                                    </style>
                                </head>
                                <body>
                                    <h1>404 - Page Not Found</h1>
                                    <p>The requested page could not be found.</p>
                                    <a href="/">Return to Home</a>
                                </body>
                                </html>
                            `, 'utf-8');
                        } else {
                            res.writeHead(200, { 'Content-Type': 'text/html', ...securityHeaders });
                            res.end(indexContent, 'utf-8');
                        }
                    });
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html', ...securityHeaders });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>404 - File Not Found</title>
                            <style>
                                body { font-family: 'Inter', Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; }
                                .container { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); }
                                h1 { font-size: 3rem; margin-bottom: 20px; font-weight: 800; }
                                p { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }
                                a { color: white; text-decoration: none; background: rgba(255, 255, 255, 0.2); padding: 12px 24px; border-radius: 25px; border: 1px solid rgba(255, 255, 255, 0.3); transition: all 0.3s ease; display: inline-block; }
                                a:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-2px); }
                                .error-code { font-family: 'Monaco', monospace; font-size: 0.9rem; opacity: 0.7; margin-top: 20px; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>404</h1>
                                <p>The requested file could not be found.</p>
                                <a href="/">← Return to VoiceSchedule Pro</a>
                                <div class="error-code">File: ${filePath}</div>
                            </div>
                        </body>
                        </html>
                    `, 'utf-8');
                }
            } else {
                res.writeHead(500, { 'Content-Type': 'text/html', ...securityHeaders });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>500 - Server Error</title>
                        <style>
                            body { font-family: 'Inter', Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%); color: white; min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; }
                            .container { background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(10px); padding: 40px; border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.2); }
                            h1 { font-size: 3rem; margin-bottom: 20px; font-weight: 800; }
                            p { font-size: 1.2rem; margin-bottom: 30px; opacity: 0.9; }
                            a { color: white; text-decoration: none; background: rgba(255, 255, 255, 0.2); padding: 12px 24px; border-radius: 25px; border: 1px solid rgba(255, 255, 255, 0.3); transition: all 0.3s ease; display: inline-block; }
                            a:hover { background: rgba(255, 255, 255, 0.3); transform: translateY(-2px); }
                            .error-code { font-family: 'Monaco', monospace; font-size: 0.9rem; opacity: 0.7; margin-top: 20px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>500</h1>
                            <p>Internal Server Error</p>
                            <a href="/">← Return to VoiceSchedule Pro</a>
                            <div class="error-code">Error: ${error.code}</div>
                        </div>
                    </body>
                    </html>
                `, 'utf-8');
            }
        } else {
            // Set appropriate headers
            const headers = {
                'Content-Type': contentType,
                ...securityHeaders
            };
            
            // Add caching headers for static assets
            if (extname === '.css' || extname === '.js' || extname === '.png' || extname === '.jpg' || extname === '.jpeg' || extname === '.gif' || extname === '.svg' || extname === '.woff' || extname === '.woff2' || extname === '.ttf') {
                headers['Cache-Control'] = 'public, max-age=31536000'; // 1 year
                headers['ETag'] = `"${content.length}-${Date.now()}"`;
            } else {
                headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
                headers['Pragma'] = 'no-cache';
                headers['Expires'] = '0';
            }
            
            res.writeHead(200, headers);
            res.end(content, 'utf-8');
        }
    });
});

const PORT = process.env.PORT || 8080;
const HOST = process.env.HOST || '0.0.0.0';

server.listen(PORT, HOST, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║                    VoiceSchedule Pro Server                  ║
╠══════════════════════════════════════════════════════════════╣
║  🚀 Server running at: http://${HOST}:${PORT.toString().padEnd(28)} ║
║  🎙️  AI Voice Recognition: Ready                            ║
║  📊 Analytics Dashboard: Active                             ║
║  🔒 Security Headers: Enabled                               ║
║  ⚡ Performance: Optimized                                  ║
║                                                              ║
║  Features Available:                                         ║
║  • Advanced AI Voice Scheduling                             ║
║  • Real-time Analytics & Insights                           ║
║  • Team Management & Collaboration                          ║
║  • Smart Calendar Integration                               ║
║  • Export & Reporting Tools                                 ║
║  • Dark/Light Theme Support                                 ║
║  • Mobile-Responsive Design                                 ║
║                                                              ║
║  Press Ctrl+C to stop the server                           ║
╚══════════════════════════════════════════════════════════════╝
    `);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down VoiceSchedule Pro server...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
    });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

export default server;