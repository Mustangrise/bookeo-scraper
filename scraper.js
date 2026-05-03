const axios = require('axios');

(async () => {
  console.log("=== EXTRACTION DES CRÉNEAUX (MODE INCEPTION) ===");
  
  const apiKey = '2cc7c64a-82de-420e-80f1-b12538494d12';
  
  // On cible l'URL de l'Iframe Bookeo que j'ai extraite de ton HTML plus tôt
  const targetUrl = 'https://www-gameslevelup-com.filesusr.com/html/0247e3_6c3d142b1a807a8c0ccecbb078462aba.html';
  
  // On simule une navigation venant de Wix
  const headers = {
    "Referer": "https://www.gameslevelup.com/",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  };

  // Configuration de la requête
  // js=true : Obligatoire pour Bookeo
  // proxy=datacenter : Plus stable que residential pour éviter l'erreur 500
  const proxyUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&js=true&proxy=datacenter&wait_for=5000&headers=${encodeURIComponent(JSON.stringify(headers))}`;

  try {
    console.log("Étape 1: Chargement direct du widget (via Proxy + JS)...");
    
    const response = await axios.get(proxyUrl, { timeout: 60000 });
    const html = response.data;

    // Debug rapide du contenu reçu
    if (html.includes("Not found")) {
        console.log("❌ Bookeo bloque encore (404). On tente sans le Referer...");
        const simpleUrl = `https://api.webscraping.ai/html?api_key=${apiKey}&url=${encodeURIComponent(targetUrl)}&js=true&wait_for=5000`;
        const simpleRes = await axios.get(simpleUrl);
        analyze(simpleRes.data);
    } else {
        analyze(html);
    }

  } catch (error) {
    console.error("ERREUR :", error.message);
    if (error.response) console.log("Code d'erreur API :", error.response.status);
  }

  async function analyze(content) {
    console.log("Étape 2: Analyse du texte...");
    // Nettoyage pour extraire les heures
    const texteBrut = content.replace(/<[^>]*>?/gm, ' ').replace(/\s\s+/g, ' ');
    const regexHeure = /(\d{1,2}:\d{2})/g;
    const heures = [...new Set(texteBrut.match(regexHeure) || [])];

    // Filtrage pour ne garder que les heures de journée (9h-23h)
    const créneaux = heures.filter(h => {
        const hour = parseInt(h.split(':')[0]);
        return hour >= 9 && hour <= 23;
    });

    if (créneaux.length > 0) {
      console.log(`✅ ${créneaux.length} créneaux trouvés !`);
      const maintenant = new Date().toISOString();
      const lignes = créneaux.map(h => ["2026-05-04", h, "Level Up", "Salle", 34.77, "DISPO", maintenant]);

      await axios.post('https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec', { lignes });
      console.log("✅ Envoi réussi.");
    } else {
      console.log("❌ Aucun créneau dans le texte.");
      console.log("Aperçu du contenu :", texteBrut.substring(0, 300));
    }
  }

  console.log("=== FIN DU SCRIPT ===");
})();
