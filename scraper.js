const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT ===");
  let browser;
  try {
    console.log("Étape 1: Lancement de Chrome...");
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    console.log("Étape 2: Navigation vers le site...");
    
    await page.goto('https://www.gameslevelup.com/en/reservation-salle-jeux', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    console.log("Étape 3: Attente du widget (15 secondes)...");
    await new Promise(r => setTimeout(r, 15000));

    console.log("Étape 4: Analyse du contenu de la page...");
    const results = await page.evaluate(() => {
      const texte = document.body.innerText;
      const lignes = [];
      const maintenant = new Date().toISOString();
      
      // On cherche n'importe quel prix avec un signe $ pour voir si le widget est là
      const regex = /(\d{1,2}:\d{2}).*?SALLE\s+(\d+).*?(\d+).*?\$34\.77/gi;
      
      let match;
      while ((match = regex.exec(texte)) !== null) {
        lignes.push(["2026-05-04", match[1], "Level Up", "SALLE " + match[2], 34.77, (parseInt(match[3]) === 0 ? "COMPLET" : "RÉSERVER"), maintenant]);
      }
      return { nb: lignes.length, apercu: texte.substring(0, 500), data: lignes };
    });

    console.log("Aperçu du texte trouvé : " + results.apercu);
    console.log("Nombre de créneaux détectés : " + results.nb);

    if (results.nb > 0) {
      console.log("Étape 5: Envoi vers Google Sheets...");
      const response = await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: results.data });
      console.log("Réponse de Google : " + response.data);
    }

  } catch (error) {
    console.error("ERREUR DURANT L'EXÉCUTION :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
