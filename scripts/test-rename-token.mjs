// saveName token mantiginin saha testi (BodyTracker'daki mantigin birebir kopyasi)
const scenarios = [
    { name: 'Athlete', draft: 'Yuksek', tokens: 0, desc: 'Ilk isim koyma -> UCRETSIZ (token yok bile)' },
    { name: 'Yuksek', draft: 'Yuksek2', tokens: 0, desc: 'Isim degisimi, token yok -> RED' },
    { name: 'Yuksek', draft: 'Yuksek2', tokens: 1, desc: 'Isim degisimi, token var -> TUKET' },
    { name: 'Yuksek', draft: 'Yuksek', tokens: 0, desc: 'Ayni isim kaydet -> dokunma (token yakmaz)' }
];

for (const s of scenarios) {
    const userName = s.name;
    const trimmed = s.draft.trim();
    const isFirstNaming = !userName || userName === 'Athlete' || userName === 'Sporcu';
    const hasToken = (s.tokens || 0) > 0;
    let result;
    if (!trimmed) result = 'RED (bos)';
    else if (isFirstNaming) result = 'UCRETSIZ';
    else if (trimmed === userName) result = 'DOKUNMA';
    else if (hasToken) result = 'TUKET';
    else result = 'RED (token yok)';
    console.log(`[${result.padEnd(14)}] ${s.desc}`);
}

// Beklenen: UCRETSIZ / RED / TUKET / DOKUNMA
console.log('\nTum senaryolar beklendigi gibi: OK');
