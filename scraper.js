const axios = require('axios');

(async () => {
  console.log("=== EXTRACTION DES CRÉNEAUX (MODE ATTENTE ACTIVE) ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  // On cible la page de réservation Wix qui a fonctionné au tour précédent
  const wixUrl = 'https://www.gameslevelup.com/reservation-salle-jeux';
  
  // Paramètres : 
  // - js=true : active le moteur Chrome
  // - proxy=residential : utilise une IP de particulier
  // - wait_for=10000 : attend 10 secondes le chargement du widget
  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(wixUrl)}&js=true&proxy=residential&wait_for=10000`;

  try {
    console.log("Étape 1: Chargement de la page Wix et attente du widget (10s)...");
    
    const response = await axios.get(proxyUrl, { timeout: 90000 });
    const html = response.data;

    console.log("Étape 2: Analyse du contenu...");
    
    // Nettoyage radical du HTML pour ne garder que le texte visible
    const texteBrut = html.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ');
    
    // Recherche des heures au format HH:MM
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const toutesLesHeures = texteBrut.match(regexHeure) || [];
    
    // On filtre pour ne garder que les heures de réservation probables (ex: entre 09:00 et 23:00)
    const heuresFiltrees = [...new Set(toutesLesHeures.filter(h => {
        const hInt = parseInt(h.split(':')[0]);
        return hInt >= 9 && hInt <= 23;
    }))];

    console.log("Heures détectées sur la page :", heuresFiltrees.join(' | '));

    if (heuresFiltrees.length > 0) {
      console.log(`✅ ${heuresFiltrees.length} créneaux identifiés.`);
      
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

      console.log("Étape 3: Envoi vers Google Sheets...");
      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes: lignes });
      console.log("✅ Terminé ! Vérifie ton fichier.");
    } else {
      console.log("❌ Aucun créneau trouvé. Est-ce que le calendrier est bien affiché pour cette date ?");
      // Debug : affiche un morceau du texte pour voir ce que le robot lit
      console.log("Aperçu du texte lu :", texteBrut.substring(0, 500));
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
  }
  console.log("=== FIN DU SCRIPT ===");
})();
