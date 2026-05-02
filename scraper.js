const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (VERSION ROBUSTE WIX/BOOKEO) ===");
  let browser;
  try {
    // 1. Lancement de Chrome avec les arguments nécessaires pour GitHub Actions
    browser = await puppeteer.launch({ 
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ] 
    });
    
    const page = await browser.newPage();
    
    // Définir un user-agent pour éviter d'être bloqué comme un simple robot
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');

    console.log("Étape 1: Navigation vers Level Up Games...");
    await page.goto('https://www.gameslevelup.com/en/reservation-salle-jeux', { 
      waitUntil: 'networkidle2', 
      timeout: 60000 
    });

    console.log("Étape 2: Attente du chargement complet de Wix (25 secondes)...");
    // Wix est lent à injecter les iframes de widgets externes
    await new Promise(r => setTimeout(r, 25000));

    // 2. Identification de la bonne Iframe (cadre)
    const allFrames = page.frames();
    console.log(`Nombre d'iframes détectées : ${allFrames.length}`);

    // On cherche la frame qui appartient à Bookeo
    const bookeoFrame = allFrames.find(f => f.url().includes('bookeo.com'));

    if (!bookeoFrame) {
      console.log("⚠️ Iframe Bookeo non trouvée par URL. Tentative sur la frame principale...");
    }

    const targetFrame = bookeoFrame || page.mainFrame();
    
    console.log("Étape 3: Extraction des données à l'intérieur du widget...");
    const results = await targetFrame.evaluate(() => {
      const texte = document.body.innerText;
      const lignes = [];
      const maintenant = new Date().toISOString();
      
      // Date fixe pour le moment (à automatiser plus tard si besoin)
      const dateCible = "2026-05-04"; 

      // La Regex cherche : l'heure, le mot SALLE, le numéro, et le nombre de places dispos
      // Format attendu : "14:00 Level Up Games SALLE 1 4 $34.77"
      const regex = /(\d{1,2}:\d{2}).*?SALLE\s+(\d+).*?(\d+).*?\$34\.77/gi;
      
      let match;
      while ((match = regex.exec(texte)) !== null) {
        const heure = match[1];
        const numSalle = match[2];
        const nbPlaces = parseInt(match[3]);
        
        lignes.push([
            dateCible, 
            heure, 
            "Level Up Games", 
            "SALLE " + numSalle, 
            34.77, 
            (nbPlaces === 0 ? "COMPLET" : "RÉSERVER"), 
            maintenant
        ]);
      }
      
      return { 
        nb: lignes.length, 
        apercu: texte.substring(0, 600).replace(/\n/g, ' '), 
        data: lignes 
      };
    });

    console.log("Aperçu du texte lu par le robot :");
    console.log("-----------------------------------");
    console.log(results.apercu);
    console.log("-----------------------------------");
    console.log("Nombre de créneaux détectés : " + results.nb);

    // 3. Envoi vers Google Sheets si on a trouvé quelque chose
    if (results.nb > 0) {
      console.log("Étape 4: Envoi vers Google Sheets...");
      const googleUrl = 'https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec';
      
      await axios.post(googleUrl, { lignes: results.data });
      console.log("✅ Données transmises avec succès à Google Sheets !");
    } else {
      console.log("❌ Aucun créneau trouvé. La Regex n'a pas matché ou le widget est vide.");
    }

  } catch (error) {
    console.error("ERREUR FATALE :", error.message);
    process.exit(1); // Force GitHub Actions à afficher une erreur
  } finally {
    if (browser) await browser.close();
    console.log("=== FIN DU SCRIPT ===");
  }
})();
