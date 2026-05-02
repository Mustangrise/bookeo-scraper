const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (VERSION IFRAME) ===");
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    console.log("Étape 1: Navigation vers Level Up Games...");
    await page.goto('https://www.gameslevelup.com/en/reservation-salle-jeux', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    console.log("Étape 2: Recherche de l'Iframe Bookeo...");
    await new Promise(r => setTimeout(r, 10000)); // Attente du chargement

    // On cherche l'élément iframe
    const iframeElement = await page.$('iframe[src*="bookeo"]');
    if (!iframeElement) {
      throw new Error("Impossible de trouver l'Iframe Bookeo sur la page.");
    }

    const frame = await iframeElement.contentFrame();
    console.log("Étape 3: Analyse du contenu INSIDE l'Iframe...");
    
    const results = await frame.evaluate(() => {
      const texte = document.body.innerText;
      const lignes = [];
      const maintenant = new Date().toISOString();
      
      // La regex cherche : Heure, le texte "SALLE X", et le nombre de places
      const regex = /(\d{1,2}:\d{2}).*?SALLE\s+(\d+).*?(\d+).*?\$34\.77/gi;
      
      let match;
      while ((match = regex.exec(texte)) !== null) {
        lignes.push([
            "2026-05-04", // Date par défaut (on pourra l'améliorer plus tard)
            match[1], 
            "Level Up Games", 
            "SALLE " + match[2], 
            34.77, 
            (parseInt(match[3]) === 0 ? "COMPLET" : "RÉSERVER"), 
            maintenant
        ]);
      }
      return { nb: lignes.length, apercu: texte.substring(0, 300), data: lignes };
    });

    console.log("Aperçu intérieur Iframe : " + results.apercu);
    console.log("Créneaux détectés : " + results.nb);

    if (results.nb > 0) {
      console.log("Étape 4: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: results.data });
      console.log("Terminé avec succès !");
    } else {
      console.log("Le widget est chargé mais aucun créneau n'a été trouvé via la Regex.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
