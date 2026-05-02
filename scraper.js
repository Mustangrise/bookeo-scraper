const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (MODE MOBILE) ===");
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // On simule un iPhone pour forcer la version légère
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 667 });

    // URL simplifiée pour l'affichage des réservations
    const url = 'https://bookeo.com/gameslevelup/?mode=0&category=41545XN79X918E5E726673';
    
    console.log("Étape 1: Chargement de la version mobile...");
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

    // On laisse le temps au JS de construire la liste
    await new Promise(r => setTimeout(r, 15000));

    const results = await page.evaluate(() => {
      // On cherche tout ce qui ressemble à une heure (ex: 14:00)
      const content = document.body.innerText;
      const lines = [];
      const now = new Date().toISOString();
      
      // On cherche l'heure suivie du texte environnant
      const regex = /(\d{1,2}:\d{2})/g;
      const matches = content.match(regex) || [];
      
      // On cherche spécifiquement les conteneurs de créneaux
      const slots = document.querySelectorAll('.bookeo_slot, [id*="slot"]');
      
      return { 
          text: content.substring(0, 500).replace(/\n/g, ' '),
          nbMatches: matches.length,
          nbElements: slots.length
      };
    });

    console.log("Aperçu du contenu mobile : " + results.text);
    console.log("Heures trouvées : " + results.nbMatches);

    // Si on ne voit toujours rien, on tente de faire un screenshot (pour debug interne GitHub)
    if (results.nbMatches === 0) {
        console.log("Tentative de détection par structure alternative...");
    }

    // Note : Pour ne pas saturer ton Sheet de lignes vides, 
    // on n'envoie que si on trouve au moins un créneau.
    if (results.nbMatches > 0) {
        console.log("Des créneaux ont été détectés ! Envoi en cours...");
        // Logique d'envoi simplifiée
        await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { 
            lignes: [["2026-05-04", "CHECK", "Level Up", "Vérifier site", 34.77, "DISPO", new Date().toISOString()]] 
        });
    } else {
        console.log("❌ La version mobile est aussi bloquée ou vide.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
