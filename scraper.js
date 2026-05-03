const axios = require('axios');

(async () => {
  console.log("=== STRATÉGIE DIRECTE : EXTRACTION DE TEXTE ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  // URL simplifiée de Bookeo
  const targetUrl = 'https://bookeo.com/gameslevelup/?mode=0';
  
  // Changement vers l'endpoint /text pour éviter l'erreur 500
  // On ajoute proxy=residential pour maximiser les chances de passer le 404
  const proxyUrl = `https://api.webscraping.ai/text?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&proxy=residential`;

  try {
    console.log("Étape 1: Récupération du texte brut via l'API...");
    
    const response = await axios.get(proxyUrl, { timeout: 30000 });
    const texteBrut = response.data;

    console.log("Étape 2: Analyse des données...");

    // On cherche les patterns d'heures (ex: 14:00)
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const toutesLesHeures = texteBrut.match(regexHeure) || [];
    
    // On retire les doublons et on filtre les heures probables (9h à 23h)
    const heuresUniques = [...new Set(toutesLesHeures)].filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour >= 9 && hour <= 23;
    });

    if (heuresUniques.length > 0) {
      console.log(`✅ SUCCÈS : ${heuresUniques.length} créneaux trouvés.`);
      console.log("Heures :", heuresUniques.join(' | '));
      
      const maintenant = new Date().toISOString();
      const lignes = heuresUniques.map(h => [
        "2026-05-04", 
        h, 
        "Level Up Games", 
        "Salle détectée", 
        34.77, 
        "DISPONIBLE", 
        maintenant
      ]);

      console.log("Étape 3: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes });
      console.log("✅ Données synchronisées !");
    } else {
      console.log("❌ Aucun créneau trouvé dans le texte.");
      // On affiche un aperçu pour comprendre ce que l'API voit
      console.log("Aperçu du texte reçu :", texteBrut.substring(0, 400).replace(/\n/g, ' '));
      
      if (texteBrut.includes("Not found")) {
          console.log("⚠️ Bookeo bloque encore (404). Même avec le proxy résidentiel.");
      }
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
    if (error.response) console.log("Statut :", error.response.status);
  }

  console.log("=== FIN DU SCRIPT ===");
})();
