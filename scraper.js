const axios = require('axios');

(async () => {
  console.log("=== EXTRACTION DES CRÉNEAUX (MODE STABILITÉ) ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  const wixUrl = 'https://www.gameslevelup.com/reservation-salle-jeux';
  
  // Changements : 
  // 1. On enlève "proxy=residential" pour éviter l'erreur 500
  // 2. On utilise "proxy=datacenter" (plus rapide)
  // 3. On réduit wait_for à 7000 (7 secondes) pour éviter le timeout
  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(wixUrl)}&js=true&proxy=datacenter&wait_for=7000`;

  try {
    console.log("Étape 1: Chargement de la page (Mode Rapide)...");
    
    const response = await axios.get(proxyUrl, { timeout: 60000 });
    const html = response.data;

    if (!html || html.length < 1000) {
        console.log("⚠️ Réponse trop courte, le widget n'a peut-être pas chargé.");
    }

    console.log("Étape 2: Analyse du texte...");
    const texteBrut = html.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ');
    
    // Recherche des heures
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const toutesLesHeures = texteBrut.match(regexHeure) || [];
    
    const heuresFiltrees = [...new Set(toutesLesHeures.filter(h => {
        const hInt = parseInt(h.split(':')[0]);
        return hInt >= 9 && hInt <= 23;
    }))];

    if (heuresFiltrees.length > 0) {
      console.log(`✅ ${heuresFiltrees.length} créneaux trouvés :`, heuresFiltrees.join(' | '));
      
      const maintenant = new Date().toISOString();
      const lignes = heuresFiltrees.map(h => [
        "2026-05-04", 
        h, 
        "Level Up Games", 
        "Salle de jeux", 
        34.77, 
        "DISPONIBLE", 
        maintenant
      ]);

      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: lignes });
      console.log("✅ Données envoyées au Sheet.");
    } else {
      console.log("❌ Aucun créneau détecté.");
      console.log("Aperçu pour debug :", texteBrut.substring(0, 300));
    }

  } catch (error) {
    if (error.response && error.response.status === 500) {
        console.error("ERREUR 500 : Le service de scraping est surchargé ou la page Wix est trop lourde.");
    } else {
        console.error("ERREUR :", error.message);
    }
  }
  console.log("=== FIN DU SCRIPT ===");
})();
