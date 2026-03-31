const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
        const page = await browser.newPage();
        
        // Listen to console errors
        page.on('console', msg => {
            if (msg.type() === 'error') {
                console.log('PAGE ERROR:', msg.text());
            }
        });
        
        page.on('pageerror', err => {
            console.log('PAGE UNCAUGHT ERROR:', err.toString());
        });

        await page.goto('http://localhost:5173/login', { waitUntil: 'networkidle2', timeout: 10000 });
        
        const html = await page.content();
        if (html.length < 500) {
            console.log('Very little HTML returned:', html);
        } else {
            console.log('HTML loaded, length:', html.length);
        }
        
        await browser.close();
    } catch (e) {
        console.error('Puppeteer script failed:', e);
    }
})();
