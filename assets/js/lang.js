(function () {
  const langBlocks = document.querySelectorAll('[data-lang]');
  const btnZh = document.getElementById('btn-zh');
  const btnEn = document.getElementById('btn-en');

  function setLang(lang) {
    langBlocks.forEach(el => {
      el.classList.toggle('show', el.getAttribute('data-lang') === lang);
    });
    if (btnZh) btnZh.classList.toggle('active', lang === 'zh');
    if (btnEn) btnEn.classList.toggle('active', lang === 'en');
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    localStorage.setItem('site-lang', lang);
  }

  if (btnZh) btnZh.addEventListener('click', () => setLang('zh'));
  if (btnEn) btnEn.addEventListener('click', () => setLang('en'));

  const savedLang = localStorage.getItem('site-lang');
  setLang(savedLang === 'en' ? 'en' : 'zh');
})();
