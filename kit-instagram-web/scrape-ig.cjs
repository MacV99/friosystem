const { chromium } = require('playwright');
const https = require('https');
const fs = require('fs');
const path = require('path');

async function downloadImage(url, dest) {
  return new Promise((resolve) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

(async () => {
  const assetsDir = path.join(__dirname, 'assets', 'instagram');
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navegando a Instagram...');
  await page.goto('https://www.instagram.com/ac_friosystem_sas/', { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(3000);

  // Meta tags (más fiables)
  const meta = await page.evaluate(() => {
    const getMeta = (name) => {
      const el = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
      return el ? el.getAttribute('content') : null;
    };
    return {
      title: getMeta('og:title'),
      description: getMeta('og:description'),
      image: getMeta('og:image'),
    };
  });

  // Stats del DOM
  const stats = await page.evaluate(() => {
    const spans = Array.from(document.querySelectorAll('span'));
    const header = document.querySelector('header');
    const headerText = header ? header.innerText : '';

    // Bio
    const bioEl = document.querySelector('span[class*="_ap3a"]') ||
                  document.querySelector('h1 + div span') ||
                  document.querySelector('div[class*="x7a106z"] span');

    // Buscar números de seguidores en el texto
    const followerMatch = headerText.match(/(\d[\d,.]+)\s*(seguidores|followers)/i);
    const followingMatch = headerText.match(/(\d[\d,.]+)\s*(seguidos|following)/i);
    const postsMatch = headerText.match(/(\d[\d,.]+)\s*(publicaciones|posts)/i);

    return {
      headerText: headerText.substring(0, 500),
      followerText: followerMatch ? followerMatch[1] : null,
      followingText: followingMatch ? followingMatch[1] : null,
      postsText: postsMatch ? postsMatch[1] : null,
      bioText: bioEl ? bioEl.innerText : null,
      allSpansText: spans.slice(0, 30).map(s => s.innerText).filter(t => t.length > 0 && t.length < 100)
    };
  });

  // Imágenes de posts
  const images = await page.evaluate(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs
      .map(img => ({ src: img.src, alt: img.alt, width: img.naturalWidth }))
      .filter(img => img.src && img.src.includes('cdninstagram') && img.width > 100)
      .slice(0, 12);
  });

  // Screenshot del perfil
  await page.screenshot({ path: path.join(assetsDir, 'screenshot-ig.png'), fullPage: false });

  // Descargar foto de perfil
  if (meta.image) {
    await downloadImage(meta.image, path.join(assetsDir, 'profile.jpg'));
    console.log('Foto de perfil descargada');
  }

  // Descargar posts
  let downloaded = 0;
  for (let i = 0; i < images.length; i++) {
    const ok = await downloadImage(images[i].src, path.join(assetsDir, `post-${i+1}.jpg`));
    if (ok) downloaded++;
  }

  const result = {
    meta,
    stats,
    images: images.map(i => ({ alt: i.alt, width: i.width })),
    downloaded
  };

  fs.writeFileSync(path.join(__dirname, 'ig-data.json'), JSON.stringify(result, null, 2));
  console.log('DONE');
  console.log(JSON.stringify(result, null, 2));

  await browser.close();
})();
