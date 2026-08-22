// Commit mesajini UTF-8 yaz
const fs = require('fs');
const msg = [
  'feat: Dukkan kesfedilebilirlik - alt nav + envanter + profil ozellestirme',
  '',
  '- BottomNav: 5. sekme olarak Dukkan eklendi (ucretsiz cark hazirsa rozet)',
  '- InventoryCard (profil): boost stoklari + kullanim aciklamalari',
  '  - Atistirmalik buradan Besle ile kullanilir; dondurucu/iksir otomatik',
  '- CosmeticCard (profil): kozmetikleri kusan/cikar, nerede gorundugu yazili',
  '- i18n: inv_ cakismasi myinv_ onekiyle cozuldu, eksik anahtarlar eklendi',
  ''
].join('\n');
fs.writeFileSync('.git-commit-msg.txt', msg, 'utf8');
console.log('written utf8');
