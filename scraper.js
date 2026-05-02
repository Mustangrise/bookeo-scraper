const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (CONTOURNEMENT RÉSEAU) ===");
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ] 
    });
    
    const page = await browser.newPage();
    
    // On change d'identité (Windows au lieu d'iPhone)
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');

    // On génère un nombre aléatoire pour forcer Bookeo à ignorer son blocage 404 habituel
    const cacheBuster = Math.floor(Math.random() * 1000000);
    const url = `https://bookeo.com/gameslevelup/?mode=0&cb=${cacheBuster}`;
    
    console.log("Étape 1: Tentative avec Cache-Buster...");
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    await new Promise(r => setTimeout(r, 15000));

    const results = await page.evaluate(() => {
      const text = document.body.innerText;
      const hours = text.match(/(\d{1,2}:\d{2})/g) || [];
      return { 
        content: text.substring(0, 300),
        found: hours.length,
        allHours: hours
      };
    });

    console.log("Texte capturé : " + results.content);

    if (results.found > 0) {
      console.log(`Succès ! ${results.found} créneaux trouvés.`);
      // Envoi simplifié pour tester si ça arrive dans le Sheet
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { 
          lignes: [[new Date().toLocaleDateString(), results.allHours[0], "Level Up", "DÉTECTÉ", 34.77, "OUI", new Date().toISOString()]] 
      });
    } else {
      console.log("❌ Toujours bloqué par le pare-feu Bookeo (404).");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
