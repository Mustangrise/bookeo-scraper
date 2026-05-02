const puppeteer = require('puppeteer');
const axios = require('axios');

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // 1. Aller sur la page
  await page.goto('https://www.gameslevelup.com/en/reservation-salle-jeux', { waitUntil: 'networkidle2' });

  // 2. Attendre que le widget Bookeo charge (on attend le texte "SALLE")
  await page.waitForSelector('body');
  await new Promise(r => setTimeout(r, 5000)); // Pause de 5s pour laisser le JS charger

  // 3. Extraire les données
  const data = await page.evaluate(() => {
    const texte = document.body.innerText;
    const lignes = [];
    const maintenant = new Date().toISOString();
    
    // Détection de la date dans le texte
    let currentDate = "2026-05-04";
    const dateMatch = texte.match(/(?:[A-Za-z]+,?\s+)?(\d{1,2})\s+([A-Za-zéèû]+)/i);
    if (dateMatch) {
       const moisMap = {mai:"05",juin:"06",juillet:"07",août:"08",aout:"08"};
       currentDate = `2026-${moisMap[dateMatch[2].toLowerCase()] || '05'}-${dateMatch[1].padStart(2,'0')}`;
    }

    // Regex pour Heure, Salle, Places
    const regex = /(\d{1,2}:\d{2})\s+Level Up Games\s+SALLE\s+(\d+)\s+(\d+)\s+\$34\.77/gi;
    let match;
    while ((match = regex.exec(texte)) !== null) {
      const statut = (parseInt(match[3]) === 0) ? "COMPLET" : "RÉSERVER";
      lignes.push([currentDate, match[1], "Level Up Games", "SALLE " + match[2], 34.77, statut, maintenant]);
    }
    return lignes;
  });

  // 4. Envoyer à Google Sheets
  if (data.length > 0) {
    await axios.post(https://script.google.com/macros/s/AKfycbz9wfzo6s7t6AtG7p9BHqwKUCzSq1IVA7ZJ7n5E4eJixAYd1Y4qyToWtRfBEC_Tk8MI/exec { lignes: data });
    console.log(`${data.length} créneaux envoyés !`);
  }

  await browser.close();
})();
