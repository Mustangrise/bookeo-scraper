const axios = require('axios');

(async () => {
    console.log("=== DÉBUT DU SCRIPT (MODE API DIRECTE) ===");
    
    try {
        // 1. Paramètres de la requête
        // On cible la date 2026-05-04
        const dateCible = "20260504"; 
        const url = `https://bookeo.com/gameslevelup/info/getSlots?start=${dateCible}&end=${dateCible}&type=41545XN79X918E5E726673`;

        console.log(`Étape 1: Interrogation de l'API Bookeo pour le ${dateCible}...`);
        
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://bookeo.com/gameslevelup/',
                'Accept': 'application/json'
            }
        });

        const data = response.data;
        console.log("Réponse reçue de Bookeo.");

        // 2. Analyse des données JSON
        const lignes = [];
        const maintenant = new Date().toISOString();

        if (data && data.slots) {
            data.slots.forEach(slot => {
                // On extrait l'heure (format souvent : "2026-05-04T14:00:00")
                const heure = slot.startTime.split('T')[1].substring(0, 5);
                const nomSujet = slot.subjectName || "Salle Inconnue";
                const placesRestantes = slot.numSeatsAvailable;

                lignes.push([
                    "2026-05-04",
                    heure,
                    "Level Up Games",
                    nomSujet.toUpperCase(),
                    34.77,
                    (placesRestantes === 0 ? "COMPLET" : "RÉSERVER"),
                    maintenant
                ]);
            });
        }

        console.log(`Nombre de créneaux trouvés : ${lignes.length}`);

        // 3. Envoi vers Google Sheets
        if (lignes.length > 0) {
            console.log("Étape 2: Envoi vers Google Sheets...");
            const googleUrl = 'https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec';
            await axios.post(googleUrl, { lignes: lignes });
            console.log("✅ Données synchronisées avec succès !");
        } else {
            console.log("❌ Aucun créneau disponible dans la réponse API.");
            console.log("Détail de la réponse pour debug :", JSON.stringify(data).substring(0, 200));
        }

    } catch (error) {
        console.error("ERREUR API :", error.message);
        if (error.response) {
            console.error("Statut erreur :", error.response.status);
        }
    }

    console.log("=== FIN DU SCRIPT ===");
})();
