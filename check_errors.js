const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
        page.on('pageerror', error => console.log('BROWSER_ERROR:', error.message));

        console.log("Navigating to http://localhost:5174 ...");
        await page.goto('http://localhost:5174');

        // Wait 3 seconds to let React catch errors
        await new Promise(resolve => setTimeout(resolve, 3000));

        console.log("Closing browser...");
        await browser.close();
    } catch (e) {
        console.error("Script Error:", e);
    }
})();
