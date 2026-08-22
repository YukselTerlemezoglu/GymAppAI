// HTTP smoke test: dev server cevabi + kritik asset kontrolu
fetch('http://localhost:8080/')
    .then(r => {
        console.log('HTTP status:', r.status);
        return r.text();
    })
    .then(t => {
        console.log('HTML uzunluk:', t.length);
        const title = t.match(/<title>[^<]*<\/title>/);
        console.log('title:', title ? title[0] : '?');
        const root = t.includes('<div id="root">');
        console.log('root div:', root ? 'VAR' : 'YOK');
        // Ana modulu cekip donusumu dogrula (vite dev transform)
        const src = t.match(/src="([^"]*)"/);
        if (src) {
            return fetch('http://localhost:8080' + (src[1].startsWith('/') ? '' : '/') + src[1]);
        }
    })
    .then(r => r ? r.text().then(tt => {
        console.log('Ana modul donusumu:', r.status, '- uzunluk:', tt.length);
        console.log(tt.includes('import') || tt.includes('export') ? 'JS modul formati OK' : 'BEKLENMEDIK FORMAT');
    }) : null)
    .catch(e => console.log('HATA:', e.message));
