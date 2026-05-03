const axios = require('axios');

(async () => {
  console.log("=== TENTATIVE ULTIME : CALENDRIER MOBILE DIRECT ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  // Cette URL force l'affichage du calendrier en mode texte pur pour mobile
  const targetUrl = 'https://bookeo.com/gameslevelup/?mode=3&category=41545XN79X918E5E726673';
  
  const proxyUrl = `https://api.webscraping.ai/text?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&proxy=residential`;

  try {
    console.log("Étape 1: Extraction du texte du calendrier mobile...");
    const response = await axios.get(proxyUrl);
    const texte = response.data;

    // On cherche les heures
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const heures = [...new Set(texte.match(regexHeure) || [])];

    if (heures.length > 0) {
      console.log(`✅ SUCCÈS ! Créneaux trouvés : ${heures.length}`);
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', {
        lignes: heures.map(h => ["2026-05-04", h, "Level Up", "Salle", 34.77, "DISPO", new Date().toISOString()])
      });
    } else {
      console.log("❌ Toujours rien. Contenu reçu :");
      console.log(texte.substring(0, 300));
    }
  } catch (error) {
    console.error("ERREUR finale :", error.message);
  }
})();
