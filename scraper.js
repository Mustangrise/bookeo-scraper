const axios = require('axios');

(async () => {
  console.log("=== DÉBUT DU SCRIPT (VIA WEBSCRAPING.AI) ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  const targetUrl = 'https://bookeo.com/gameslevelup/?mode=0';
  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&proxy=residential`;

  try {
    console.log("Étape 1: Requête à l'API (via Proxy Résidentiel)...");
    
    // On appelle l'API de scraping
    const response = await axios.get(proxyUrl);
    const html = response.data;

    // On vérifie si on a reçu du contenu ou encore une erreur
    if (html.includes("Not found") || html.length < 500) {
      console.log("⚠️ L'API a répondu, mais Bookeo semble encore résister.");
      console.log("Aperçu du retour :", html.substring(0, 200));
      return;
    }

    console.log("Étape 2: Analyse des données reçues...");
    
    // Analyse simplifiée du texte (on enlève les balises HTML pour lire le texte)
    const texteBrut = html.replace(/<[^>]*>?/gm, ' ');
    const lignes = [];
    const maintenant = new Date().toISOString();
    
    // On cherche les heures (ex: 14:00)
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const heuresTrouvees = texteBrut.match(regexHeure) || [];

    console.log(`Nombre d'heures détectées : ${heuresTrouvees.length}`);

    heuresTrouvees.forEach(heure => {
      lignes.push([
        "2026-05-04",
        heure,
        "Level Up Games",
        "SALLE DÉTECTÉE",
        34.77,
        "DISPONIBLE",
        maintenant
      ]);
    });

    if (lignes.length > 0) {
      console.log("Étape 3: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: lignes });
      console.log("✅ Mission accomplie ! Vérifie ton Google Sheet.");
    } else {
      console.log("❌ Aucun créneau trouvé dans le texte reçu.");
    }

  } catch (error) {
    console.error("ERREUR CRITIQUE :", error.message);
  }

  console.log("=== FIN DU SCRIPT ===");
})();
