import puppeteer from 'playwright';
import fs from 'fs';
import path from 'path';

async function createCollage() {
  const browser = await puppeteer.chromium.launch();
  
  // 1. Take a mobile screenshot of the live site
  const page = await browser.newPage();
  await page.setViewportSize({ width: 390, height: 844 }); // iPhone 12 Pro size
  await page.goto('https://electro-hankin.vercel.app', { waitUntil: 'networkidle' });
  
  // Wait a bit for images to load
  await page.waitForTimeout(2000);
  
  const siteScreenshotPath = '/tmp/mobile-site.png';
  await page.screenshot({ path: siteScreenshotPath });
  await browser.close();

  // 2. Generate HTML that places the store photo and the mobile screenshot side-by-side
  const storePhotoPath = '/Users/yaniv/.copilot/attachments/86ff2e7d-22c5-426b-bf07-2f4a8da7c229-797e4a40-7c85-4018-9a8f-4adab76303f4-clipboard.png';
  
  // Convert images to base64 so we can easily render them in a local HTML file
  const storePhotoBase64 = fs.readFileSync(storePhotoPath, { encoding: 'base64' });
  const siteScreenshotBase64 = fs.readFileSync(siteScreenshotPath, { encoding: 'base64' });
  
  const html = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <style>
    body {
      margin: 0;
      padding: 40px;
      background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      box-sizing: border-box;
    }
    .container {
      display: flex;
      gap: 40px;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }
    .card {
      background: white;
      border-radius: 24px;
      padding: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
    }
    .label {
      background: #862421;
      color: white;
      padding: 8px 24px;
      border-radius: 20px;
      font-size: 24px;
      font-weight: bold;
      position: absolute;
      top: -20px;
      box-shadow: 0 4px 12px rgba(134,36,33,0.4);
    }
    .label-new {
      background: #2b6cb0;
      box-shadow: 0 4px 12px rgba(43,108,176,0.4);
    }
    .img-container {
      border-radius: 12px;
      overflow: hidden;
      border: 4px solid #f7fafc;
    }
    .store-img {
      width: 400px;
      height: 600px;
      object-fit: cover;
      display: block;
    }
    .phone-img {
      width: 300px; /* Scaled down slightly to fit the aspect ratio */
      height: 600px;
      object-fit: cover;
      display: block;
      border-radius: 24px; /* Simulating phone screen */
    }
    .arrow {
      font-size: 64px;
      color: white;
      font-weight: bold;
      filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
    }
    .header-text {
      position: absolute;
      top: 40px;
      width: 100%;
      text-align: center;
      color: white;
      font-size: 42px;
      font-weight: 900;
      text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .sub-text {
      position: absolute;
      bottom: 40px;
      width: 100%;
      text-align: center;
      color: #e2e8f0;
      font-size: 28px;
      font-weight: 600;
      text-shadow: 0 2px 8px rgba(0,0,0,0.5);
    }
  </style>
</head>
<body>
  <div class="header-text">אל תישארו מאחור. הלקוחות שלכם כבר בנייד!</div>
  
  <div class="container">
    <div class="card">
      <div class="label">החנות הפיזית</div>
      <div class="img-container">
        <img src="data:image/png;base64,${storePhotoBase64}" class="store-img" />
      </div>
    </div>
    
    <div class="arrow">⬅️</div>
    
    <div class="card" style="padding: 12px; background: #cbd5e0; border-radius: 36px;">
      <div class="label label-new">החנות הדיגיטלית</div>
      <div class="img-container" style="border: 8px solid #1a202c; border-radius: 28px;">
        <img src="data:image/png;base64,${siteScreenshotBase64}" class="phone-img" />
      </div>
    </div>
  </div>
  
  <div class="sub-text">אתר קטלוג מהיר + הזמנות לוואטסאפ מ-0 ש"ח בחודש אחסון</div>
</body>
</html>
  `;
  
  const htmlPath = '/tmp/collage.html';
  fs.writeFileSync(htmlPath, html);
  
  // 3. Render the HTML to a final image
  const browser2 = await puppeteer.chromium.launch();
  const page2 = await browser2.newPage();
  await page2.setViewportSize({ width: 1200, height: 800 });
  await page2.goto(`file://${htmlPath}`, { waitUntil: 'networkidle' });
  
  const finalPath = '/Users/yaniv/.copilot/session-state/048f15a8-1d82-4f68-b8a8-59046e08c5d2/files/facebook-ad-collage.png';
  await page2.screenshot({ path: finalPath });
  await browser2.close();
  
  console.log(`Collage generated at: ${finalPath}`);
}

createCollage().catch(console.error);
