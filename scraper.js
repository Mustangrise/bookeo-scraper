const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (URL SOURCE BOOKEO) ===");
  let browser;
  try {
    browser = await puppeteer.launch({ 
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'] 
    });
    
    const page = await browser.newPage();
    
    // L'URL directe du moteur Bookeo pour ton compte
    const bookeoDirectUrl = 'https://bookeo.com/gameslevelup/?type=41545XN79X918E5E726673';
    
    console.log("Étape 1: Connexion à la source Bookeo...");
    await page.goto(bookeoDirectUrl, { waitUntil: 'networkidle2', timeout: 60000 });

    console.log("Étape 2: Attente du rendu des disponibilités (20s)...");
    await new Promise(r => setTimeout(r, 20000));

    // Debug: voir si l'URL a changé (redirection)
    console.log("URL actuelle : " + page.url());

    const results = await page.evaluate(() => {
      // On récupère TOUT le texte de la page
      const texte = document.body ? document.body.innerText : "CORPS VIDE";
      const lignes = [];
      const maintenant = new Date().toISOString();
      const dateCible = "2026-05-04"; 

      // Regex simplifiée : Heure (ex: 14:00) + n'importe quoi + SALLE + numéro
      const regex = /(\d{1,2}:\d{2}).*?SALLE\s+(\d+)/gi;
      
      let match;
      while ((match = regex.exec(texte)) !== null) {
        lignes.push([
            dateCible, 
            match[1], 
            "Level Up Games", 
            "SALLE " + match[2], 
            34.77, 
            "VÉRIFIER", // On simplifie pour le moment
            maintenant
        ]);
      }
      return { 
        nb: lignes.length, 
        apercu: texte.substring(0, 1000).replace(/\n/g, ' '), 
        full: texte 
      };
    });

    console.log("Aperçu du texte brut :");
    console.log(results.apercu);
    console.log("-----------------------");
    console.log("Nombre de créneaux détectés : " + results.nb);

    if (results.nb > 0) {
      console.log("Étape 3: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: results.data });
      console.log("✅ Succès !");
    } else {
      console.log("❌ Aucun créneau. Si l'aperçu est 'CORPS VIDE', Bookeo bloque Puppeteer.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
