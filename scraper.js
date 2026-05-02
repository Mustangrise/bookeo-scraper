const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (ACCÈS DIRECT WIDGET) ===");
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // On va directement sur l'URL interne que j'ai trouvée dans ton code HTML
    const directUrl = 'https://www-gameslevelup-com.filesusr.com/html/0247e3_6c3d142b1a807a8c0ccecbb078462aba.html';
    
    console.log("Étape 1: Connexion directe au widget Bookeo...");
    await page.goto(directUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log("Étape 2: Attente du chargement des créneaux (15s)...");
    await new Promise(r => setTimeout(r, 15000));

    const results = await page.evaluate(() => {
      const texte = document.body.innerText;
      const lignes = [];
      const maintenant = new Date().toISOString();
      const dateCible = "2026-05-04"; 

      // Regex ultra-souple pour attraper l'heure et le numéro de salle
      // On cherche un format type 10:00 ... SALLE 1 ... 4 (places)
      const regex = /(\d{1,2}:\d{2}).*?SALLE\s+(\d+).*?(\d+)/gi;
      
      let match;
      while ((match = regex.exec(texte)) !== null) {
        lignes.push([
            dateCible, 
            match[1], 
            "Level Up Games", 
            "SALLE " + match[2], 
            34.77, 
            (parseInt(match[3]) === 0 ? "COMPLET" : "RÉSERVER"), 
            maintenant
        ]);
      }
      return { nb: lignes.length, apercu: texte.substring(0, 500).replace(/\n/g, ' '), data: lignes };
    });

    console.log("Texte extrait : " + results.apercu);
    console.log("Nombre de créneaux détectés : " + results.nb);

    if (results.nb > 0) {
      console.log("Étape 3: Envoi vers Google Sheets...");
      // Ton URL Google Script
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: results.data });
      console.log("✅ Données envoyées !");
    } else {
      console.log("❌ La page est chargée mais aucun créneau trouvé. Vérifie la date sur Bookeo.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
