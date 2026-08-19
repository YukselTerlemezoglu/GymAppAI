// api/groq.js token dogrulama mantigini yerelde test eder.
// Kullanim: node scripts/test-jwt.cjs

const b64u = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

function makeUnsignedToken(payload, header = { alg: 'RS256', typ: 'JWT', kid: 'fake-kid' }) {
  return `${b64u(header)}.${b64u(payload)}.AAAAFAKE_SIGNATURE`;
}

const now = Math.floor(Date.now() / 1000);

const cases = [
  {
    name: 'gecerli gorunumlu ama sahte imzali token (reddedilmeli)',
    token: makeUnsignedToken({
      iss: 'https://securetoken.google.com/gymappai',
      aud: 'gymappai',
      sub: 'attacker-uid',
      user_id: 'attacker-uid',
      email: 'attacker@evil.com',
      iat: now - 10,
      exp: now + 3600,
    }),
    expectValid: false,
  },
  {
    name: 'yanlis issuer (kendi sunucumuza imzali) token (reddedilmeli)',
    token: makeUnsignedToken({
      iss: 'https://evil.example.com',
      aud: 'gymappai',
      sub: 'x',
      user_id: 'x',
      iat: now - 10,
      exp: now + 3600,
    }),
    expectValid: false,
  },
  {
    name: 'suresi gecmis token (reddedilmeli)',
    token: makeUnsignedToken({
      iss: 'https://securetoken.google.com/gymappai',
      aud: 'gymappai',
      sub: 'x',
      user_id: 'x',
      iat: now - 7200,
      exp: now - 3600,
    }),
    expectValid: false,
  },
  {
    name: 'HS256 alg-confusion denemesi (reddedilmeli)',
    token: makeUnsignedToken({
      iss: 'https://securetoken.google.com/gymappai',
      aud: 'gymappai',
      sub: 'x',
      user_id: 'x',
      iat: now - 10,
      exp: now + 3600,
    }, { alg: 'HS256', typ: 'JWT', kid: 'fake-kid' }),
    expectValid: false,
  },
  {
    name: 'cop veri (reddedilmeli)',
    token: 'not-a-token',
    expectValid: false,
  },
  {
    name: 'eksik token (reddedilmeli)',
    token: null,
    expectValid: false,
  },
];

// api/groq.js icerisindeki verifyFirebaseToken'i izole etmek icin
// ayni modul formatinda test edecegiz: fonksiyonu dosyadan okuyup
// dinamik import ile calistiriyoruz (node 20+ ESM destekli).
const mod = await import('../api/groq.js');
// handler export default; verifyFirebaseToken modul icinde gizli.
// Bu yuzden testi handler uzerinden yapiyoruz: gecersiz tokenla
// POST atarsak 401 donmeli. Handler req/res mock'lari:

let pass = 0, fail = 0;

async function callHandler(token) {
  const res = {
    statusCode: null,
    body: null,
    setHeader() {},
    status(code) { this.statusCode = code; return this; },
    json(obj) { this.body = obj; return this; },
    end() { return this; },
  };
  const req = {
    method: 'POST',
    body: { idToken: token, kind: 'program', systemPrompt: 'x', userPrompt: 'y' },
  };
  // GROQ_API_KEY yoksa handler 500 doner; token asamasina gelemez.
  // Bu yuzden once token testi icin GROQ_API_KEY'i gecici set ediyoruz.
  process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || 'x'.repeat(40);
  await mod.default(req, res);
  return res;
}

for (const c of cases) {
  const res = await callHandler(c.token);
  const rejected = res.statusCode === 401;
  const ok = rejected === c.expectValid ? !rejected : rejected;
  // expectValid=false icin: rejected===true bekleriz
  const passed = c.expectValid ? res.statusCode === 200 : res.statusCode === 401;
  if (passed) { pass++; console.log(`PASS: ${c.name} -> ${res.statusCode}`); }
  else { fail++; console.log(`FAIL: ${c.name} -> ${res.statusCode} ${JSON.stringify(res.body)}`); }
}

console.log(`\nSonuc: ${pass} gecti, ${fail} kaldi`);
process.exit(fail > 0 ? 1 : 0);
