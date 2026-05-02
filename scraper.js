const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (BOOKEO CUSTOMER AREA) ===");
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // On simule un vrai navigateur pour éviter le 404
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    // URL de base du widget Bookeo pour Level Up Games
    const url = 'https://bookeo.com/gameslevelup/?mode=0';
    
    console.log("Étape 1: Connexion au portail de réservation...");
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log("Étape 2: Attente du chargement dynamique (20s)...");
    await new Promise(r => setTimeout(r, 20000));

    const results = await page.evaluate(() => {
      const texte = document.body ? document.body.innerText : "VIDE";
      const lignes = [];
      const maintenant = new Date().toISOString();
      
      // On cherche n'importe quelle heure suivie de "Salle" ou "Room"
      const regex = /(\d{1,2}:\d{2}).*?(?:SALLE|ROOM)\s+(\d+)/gi;
      
      let match;
      while ((match = regex.exec(texte)) !== null) {
        lignes.push([
            "2026-05-04", 
            match[1], 
            "Level Up Games", 
            "SALLE " + match[2], 
            34.77, 
            "DISPONIBLE",
            maintenant
        ]);
      }
      return { 
        nb: lignes.length, 
        apercu: texte.substring(0, 800).replace(/\n/g, ' '),
        html: document.body.innerHTML.substring(0, 500)
      };
    });

    console.log("Aperçu du texte capturé : " + results.apercu);
    
    if (results.nb === 0 && results.apercu.includes("Not found")) {
        console.log("DEBUG HTML : " + results.html);
    }

    console.log("Nombre de créneaux détectés : " + results.nb);

    if (results.nb > 0) {
      console.log("Étape 3: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: results.data });
      console.log("✅ Données transmises !");
    } else {
      console.log("❌ Échec : Le texte ne contient pas de créneaux.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
