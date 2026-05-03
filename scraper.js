const axios = require('axios');

(async () => {
  console.log("=== TENTATIVE DE CONTOURNEMENT PAR RÉFÉRENCE ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  // L'URL exacte du widget tel qu'il apparaît dans ton code Wix
  const targetUrl = 'https://bookeo.com/gameslevelup/?type=41545XN79X918E5E726673';
  
  // On configure les headers pour imiter Wix
  const customHeaders = {
    "Referer": "https://www.gameslevelup.com/",
    "Origin": "https://www.gameslevelup.com",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  };

  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&js=true&proxy=residential&custom_headers=${encodeURIComponent(JSON.stringify(customHeaders))}`;

  try {
    console.log("Étape 1: Envoi de la requête avec simulation d'origine Wix...");
    
    const response = await axios.get(proxyUrl, { timeout: 60000 });
    const html = response.data;

    if (html.includes("Not found")) {
      console.log("❌ Le pare-feu Bookeo refuse toujours l'accès direct.");
      console.log("Dernier recours : On essaie de scraper la page Wix elle-même avec JS.");
      
      const wixUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent('https://www.gameslevelup.com/r%C3%A9servation')}&js=true&proxy=residential&wait_for_selector=.bookeo_item`;
      const wixResponse = await axios.get(wixUrl);
      
      if (wixResponse.data.includes("Not found")) {
          console.log("Blocage total au niveau du domaine.");
          return;
      }
      console.log("Réponse de la page Wix reçue !");
    }

    // Extraction des données si succès
    const texteBrut = html.replace(/<[^>]*>?/gm, ' ');
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const heures = [...new Set(texteBrut.match(regexHeure))];

    if (heures.length > 0) {
      console.log(`✅ SUCCÈS : ${heures.length} créneaux trouvés.`);
      // Envoi vers Google Sheets
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', {
        lignes: heures.map(h => ["2026-05-04", h, "Level Up", "Salle", 34.77, "Dispo", new Date().toISOString()])
      });
    } else {
      console.log("❓ Pas d'erreur 404, mais aucun créneau trouvé dans le texte.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  }
  console.log("=== FIN DU SCRIPT ===");
})();
