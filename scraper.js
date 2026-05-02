const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (MODE JS RENDERING) ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  const targetUrl = 'https://bookeo.com/gameslevelup/?mode=0';
  
  // ON ACTIVE LE RENDU JS (&js=true) ET LE PROXY (&proxy=residential)
  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&proxy=residential&js=true`;

  try {
    console.log("Étape 1: Requête avec rendu JS (cela peut prendre 10-20 secondes)...");
    
    const response = await axios.get(proxyUrl, { timeout: 60000 });
    const html = response.data;

    if (html.includes("Not found") || html.length < 1000) {
      console.log("⚠️ Toujours le 404. Tentative de secours sans le mode résidentiel...");
      // Parfois le mode résidentiel est trop lent pour le rendu JS, on tente le mode standard
      const fallbackUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&js=true`;
      const fbResponse = await axios.get(fallbackUrl);
      if (fbResponse.data.includes("Not found")) {
          console.log("Aperçu du blocage persistant :", fbResponse.data.substring(0, 300));
          return;
      }
    }

    console.log("Étape 2: Analyse du contenu rendu...");
    
    // Nettoyage du HTML pour extraire le texte
    const texteBrut = html.replace(/<[^>]*>?/gm, ' ');
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const heuresTrouvees = [...new Set(texteBrut.match(regexHeure))]; // On retire les doublons

    console.log(`Créneaux uniques détectés : ${heuresTrouvees.length}`);

    if (heuresTrouvees.length > 0) {
      const maintenant = new Date().toISOString();
      const lignes = heuresTrouvees.map(heure => [
        "2026-05-04",
        heure,
        "Level Up Games",
        "SALLE",
        34.77,
        "DISPONIBLE",
        maintenant
      ]);

      console.log("Étape 3: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: lignes });
      console.log("✅ ENFIN ! Les données devraient être dans ton Sheet.");
    } else {
      console.log("❌ Le rendu a réussi mais aucun créneau n'est visible.");
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  }

  console.log("=== FIN DU SCRIPT ===");
})();
