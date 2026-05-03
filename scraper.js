const axios = require('axios');

(async () => {
  console.log("=== STRATÉGIE : WIX SANS SURCHARGE ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  const targetUrl = 'https://www.gameslevelup.com/reservation-salle-jeux';
  
  // Paramètres optimisés :
  // - js=true : indispensable pour voir Bookeo
  // - wait_for=.bookeo_item : on attend précisément l'élément des créneaux
  // - proxy=datacenter : plus stable
  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&js=true&proxy=datacenter&wait_for=10000`;

  try {
    console.log("Étape 1: Chargement de la page Wix (Attente 10s)...");
    
    const response = await axios.get(proxyUrl, { timeout: 90000 });
    const html = response.data;

    console.log("Étape 2: Analyse du contenu rendu...");
    
    // Nettoyage pour ne garder que le texte
    const texteBrut = html.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ');
    
    // On cherche les heures
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const heures = [...new Set(texteBrut.match(regexHeure) || [])];
    
    const creneaux = heures.filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour >= 9 && hour <= 23;
    });

    if (creneaux.length > 0) {
      console.log(`✅ TROUVÉ : ${creneaux.length} créneaux !`);
      const maintenant = new Date().toISOString();
      const lignes = creneaux.map(h => ["2026-05-04", h, "Level Up", "Salle", 34.77, "DISPO", maintenant]);

      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes });
      console.log("✅ Sheet mis à jour.");
    } else {
      console.log("❌ Aucun créneau dans le texte.");
      console.log("Aperçu (100-500 char) :", texteBrut.substring(100, 500));
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
    if (error.response && error.response.status === 500) {
        console.log("⚠️ Le serveur de scraping sature encore sur Wix.");
    }
  }
  console.log("=== FIN DU SCRIPT ===");
})();
