/* Fábrica de Vídeos com IA · área do aluno */
(() => {
  'use strict';

  // Lido antes de tudo: o Supabase limpa o endereço assim que o cliente é criado.
  const hashInicial = location.hash;
  const tipoLink = (hashInicial.match(/type=([a-z_]+)/) || [])[1] || '';
  const erroLink = decodeURIComponent((hashInicial.match(/error_description=([^&]+)/) || [])[1] || '').replace(/\+/g, ' ');

  const CFG = window.CURSO_CONFIG || {};
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  const DEMO = local && (new URLSearchParams(location.search).has('demo') || !CFG.supabaseUrl);
  const raiz = document.getElementById('raiz');
  const ASSETS = '../';

  // ---------- utilidades ----------
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const lerLS = (k, padrao) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : padrao; } catch { return padrao; } };
  const gravarLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
  const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  const ICONES = {
    casa: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"/>',
    livro: '<path d="M4 5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M4 21V5"/><path d="M8 7h6"/>',
    ferramenta: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>',
    baixar: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
    busca: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    lateral: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
    chev: '<path d="m9 6 6 6-6 6"/>',
    voltar: '<path d="m15 6-6 6 6 6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    relogio: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>',
    pessoa: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    copiar: '<rect x="9" y="9" width="11" height="11" rx="2.5"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    lua: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
    sol: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    auto: '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor"/>',
    sair: '<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"/><path d="m10 17-5-5 5-5"/><path d="M5 12h11"/>',
    alerta: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17.5v.5"/>',
    cadeado: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    envelope: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
    foto: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/>',
  };
  const ic = (n, extra = '') => `<svg class="i ${extra}" viewBox="0 0 24 24" aria-hidden="true">${ICONES[n]}</svg>`;

  function toast(msg, icone = 'check') {
    $$('.toast').forEach((t) => t.remove());
    const t = h(`<div class="toast" role="status">${ic(icone)}<span>${esc(msg)}</span></div>`);
    document.body.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  async function copiar(texto, botao) {
    try { await navigator.clipboard.writeText(texto); } catch {
      const ta = h('<textarea style="position:fixed;opacity:0"></textarea>'); ta.value = texto; document.body.append(ta); ta.select(); document.execCommand('copy'); ta.remove();
    }
    if (botao) {
      const antes = botao.innerHTML;
      botao.classList.add('ok'); botao.innerHTML = `${ic('check')}Copiado`;
      setTimeout(() => { botao.classList.remove('ok'); botao.innerHTML = antes; }, 1600);
    } else toast('Copiado');
  }

  // ---------- tema ----------
  const aplicarTema = (t) => { if (t === 'claro' || t === 'escuro') document.documentElement.dataset.tema = t; else delete document.documentElement.dataset.tema; };
  aplicarTema(lerLS('fvia:tema', 'auto'));

  // ---------- Supabase ----------
  const sb = !DEMO && window.supabase ? window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseKey, {auth: {flowType: 'implicit', detectSessionInUrl: true, persistSession: true}}) : null;
  let usuario = null;
  let curso = null;
  let prog = {feitas: {}, checks: {}, ultima: null, passos: {}};
  let salvarTimer = null;

  // ---------- telas de entrada ----------
  function telaEntrada(conteudo) {
    raiz.innerHTML = '';
    const el = h(`<main class="entrada"><div class="cartao-entrada"><div class="app-icone" aria-hidden="true">🎬</div>${conteudo}</div></main>`);
    raiz.append(el);
    return el;
  }

  function telaLogin(msg = '', tipo = 'erro') {
    const el = telaEntrada(`
      <h1>Fábrica de Vídeos</h1>
      <p>Entre com o e-mail da compra e a senha que você criou.</p>
      ${msg ? `<div class="aviso ${tipo}" role="alert">${ic(tipo === 'erro' ? 'alerta' : 'check')}<span>${esc(msg)}</span></div>` : ''}
      <form novalidate>
        <div class="campo"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" inputmode="email" required></div>
        <div class="campo"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="current-password" required></div>
        <button class="btn primario grande" type="submit">Entrar</button>
      </form>
      <button class="link-pequeno" type="button" id="esqueci">Esqueci minha senha</button>
      <p style="margin:14px 0 0;font-size:.8125rem">Primeiro acesso? Use o link que enviamos para o seu e-mail depois da compra. Ajuda: <a href="mailto:pedro.videos.shorts@gmail.com">pedro.videos.shorts@gmail.com</a></p>`);
    const form = $('form', el);
    $('#email', el).focus();
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#email', el).value.trim();
      const senha = $('#senha', el).value;
      if (!email || !senha) return telaLogin('Preencha o e-mail e a senha.');
      const b = $('button[type=submit]', el); b.disabled = true; b.innerHTML = '<span class="spinner" style="width:20px;height:20px;border-width:2px;border-top-color:#fff"></span>';
      const {data, error} = await sb.auth.signInWithPassword({email, password: senha});
      if (error) return telaLogin(/invalid/i.test(error.message) ? 'E-mail ou senha incorretos.' : 'Não foi possível entrar agora. Tente de novo em instantes.');
      usuario = data.user;
      if (!usuario.user_metadata?.senha_definida) sb.auth.updateUser({data: {senha_definida: true}});
      entrar();
    });
    $('#esqueci', el).addEventListener('click', () => telaEsqueci($('#email', el).value.trim()));
  }

  function telaEsqueci(emailPre = '', msg = '', tipo = 'erro') {
    const el = telaEntrada(`
      <h1>Redefinir senha</h1>
      <p>Digite o e-mail da compra. Vamos enviar um link para você criar uma nova senha.</p>
      ${msg ? `<div class="aviso ${tipo}" role="status">${ic(tipo === 'erro' ? 'alerta' : 'envelope')}<span>${esc(msg)}</span></div>` : ''}
      <form novalidate>
        <div class="campo"><label for="email">E-mail</label><input id="email" type="email" autocomplete="email" value="${esc(emailPre)}" required></div>
        <button class="btn primario grande" type="submit">Enviar link</button>
      </form>
      <button class="link-pequeno" type="button" id="voltar">Voltar para entrar</button>`);
    $('#email', el).focus();
    $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('#email', el).value.trim();
      if (!/.+@.+\..+/.test(email)) return telaEsqueci(email, 'Digite um e-mail válido.');
      $('button[type=submit]', el).disabled = true;
      const {error} = await sb.auth.resetPasswordForEmail(email, {redirectTo: location.origin + location.pathname});
      if (error && /rate|seconds/i.test(error.message)) return telaEsqueci(email, 'Aguarde um minuto antes de pedir outro link.');
      telaEsqueci(email, 'Se este e-mail tiver uma compra, o link chega em instantes. Confira também o spam e as promoções.', 'ok');
    });
    $('#voltar', el).addEventListener('click', () => telaLogin());
  }

  function forcaSenha(s) {
    let p = 0;
    if (s.length >= 8) p++;
    if (s.length >= 12) p++;
    if (/[A-Z]/.test(s) && /[a-z]/.test(s)) p++;
    if (/\d/.test(s)) p++;
    if (/[^A-Za-z0-9]/.test(s)) p++;
    return p;
  }

  function telaDefinirSenha(primeiro) {
    telaSenhaAberta = true;
    const el = telaEntrada(`
      <h1>${primeiro ? 'Bem-vindo(a)!' : 'Nova senha'}</h1>
      <p>${primeiro ? 'Sua compra foi confirmada. Crie uma senha para entrar no curso sempre que quiser.' : 'Crie uma nova senha para a sua conta.'}</p>
      <div id="msg"></div>
      <form novalidate>
        <input type="email" autocomplete="username" value="${esc(usuario?.email || '')}" hidden>
        <div class="campo"><label for="s1">Senha (mínimo 8 caracteres)</label><input id="s1" type="password" autocomplete="new-password" minlength="8" required></div>
        <div class="forca" aria-hidden="true"><span></span></div>
        <div class="campo"><label for="s2">Repita a senha</label><input id="s2" type="password" autocomplete="new-password" required></div>
        <button class="btn primario grande" type="submit">Salvar e entrar</button>
      </form>`);
    const s1 = $('#s1', el); s1.focus();
    s1.addEventListener('input', () => {
      const p = forcaSenha(s1.value);
      const barra = $('.forca span', el);
      barra.style.width = `${(p / 5) * 100}%`;
      barra.style.background = p <= 1 ? 'var(--red)' : p <= 3 ? 'var(--orange)' : 'var(--green)';
    });
    $('form', el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const a = s1.value, b = $('#s2', el).value;
      const msg = (t) => { $('#msg', el).innerHTML = `<div class="aviso erro" role="alert">${ic('alerta')}<span>${esc(t)}</span></div>`; };
      if (a.length < 8) return msg('A senha precisa ter pelo menos 8 caracteres.');
      if (a !== b) return msg('As duas senhas não são iguais.');
      $('button[type=submit]', el).disabled = true;
      const {error} = await sb.auth.updateUser({password: a, data: {senha_definida: true}});
      if (error) { $('button[type=submit]', el).disabled = false; return msg(/same|different/i.test(error.message) ? 'Use uma senha diferente da anterior.' : 'Não foi possível salvar. O link pode ter expirado: peça um novo em "Esqueci minha senha".'); }
      toast('Senha criada');
      entrar();
    });
  }

  function telaSemAcesso() {
    const el = telaEntrada(`
      <h1>Acesso não encontrado</h1>
      <p>Entramos na conta <strong>${esc(usuario?.email)}</strong>, mas não achamos uma compra ativa para ela. Se você comprou com outro e-mail, entre com ele. Se acabou de comprar, aguarde alguns minutos.</p>
      <button class="btn primario grande" id="tentar">Tentar de novo</button>
      <button class="link-pequeno" id="sair">Sair e entrar com outro e-mail</button>
      <p style="margin:10px 0 0;font-size:.8125rem">Ajuda: <a href="mailto:pedro.videos.shorts@gmail.com">pedro.videos.shorts@gmail.com</a></p>`);
    $('#tentar', el).addEventListener('click', () => entrar());
    $('#sair', el).addEventListener('click', async () => { await sb.auth.signOut(); telaLogin(); });
  }

  // ---------- dados ----------
  async function carregarCurso() {
    if (DEMO) return (await fetch('../../dist/aulas.json')).json();
    const {data, error} = await sb.storage.from('curso').download('aulas.json');
    if (error || !data) throw new Error('sem-acesso');
    return JSON.parse(await data.text());
  }

  const chaveProg = () => `fvia:prog:${usuario?.id || 'demo'}`;
  async function carregarProgresso() {
    prog = Object.assign({feitas: {}, checks: {}, ultima: null, passos: {}}, lerLS(chaveProg(), {}));
    if (!sb) return;
    const {data} = await sb.from('progresso').select('dados').eq('user_id', usuario.id).maybeSingle();
    if (data?.dados) {
      const r = data.dados;
      prog.feitas = {...r.feitas, ...prog.feitas};
      prog.checks = {...r.checks, ...prog.checks};
      prog.passos = {...r.passos, ...prog.passos};
      prog.ultima = prog.ultima || r.ultima;
    }
  }
  function salvar() {
    gravarLS(chaveProg(), prog);
    if (!sb) return;
    clearTimeout(salvarTimer);
    salvarTimer = setTimeout(() => sb.from('progresso').upsert({user_id: usuario.id, dados: prog, atualizado: new Date().toISOString()}), 1200);
  }

  const todasAulas = () => curso.modulos.flatMap((m) => m.aulas.map((a) => ({...a, modulo: m})));
  const pct = (feitas, total) => (total ? Math.round((feitas / total) * 100) : 0);
  const totalFeitas = () => todasAulas().filter((a) => prog.feitas[a.id]).length;

  // ---------- entrada no app ----------
  async function entrar() {
    raiz.innerHTML = '<div class="carregando"><div class="spinner" role="status" aria-label="Carregando o curso"></div></div>';
    try {
      curso = await carregarCurso();
    } catch {
      return telaSemAcesso();
    }
    await carregarProgresso();
    montarApp();
    if (!location.hash.startsWith('#/')) location.hash = '#/';
    rotear();
  }

  // ---------- layout ----------
  let lateralAberta = false;
  function montarApp() {
    raiz.innerHTML = '';
    const app = h(`
      <div class="app">
        <nav class="lateral" aria-label="Navegação do curso"></nav>
        <div class="principal">
          <header class="topo">
            <button class="btn-icone so-compacto" id="abrirLateral" aria-label="Abrir menu de aulas">${ic('lateral')}</button>
            <span class="titulo-pequeno" id="tituloPequeno"></span>
            <span class="espaco"></span>
            <button class="btn-icone" id="buscar" aria-label="Buscar (Ctrl+K)">${ic('busca')}</button>
            <button class="btn-icone" id="conta" aria-label="Conta e aparência" aria-haspopup="menu">${ic('pessoa')}</button>
          </header>
          <main class="pagina" id="pagina" tabindex="-1"></main>
        </div>
        <nav class="abas" aria-label="Seções">
          <a href="#/" data-aba="inicio">${ic('casa')}Início</a>
          <a href="#/aulas" data-aba="aulas">${ic('livro')}Aulas</a>
          <a href="#/ferramentas" data-aba="ferramentas">${ic('ferramenta')}Ferramentas</a>
          <a href="#/downloads" data-aba="downloads">${ic('baixar')}Downloads</a>
        </nav>
      </div>`);
    raiz.append(app);
    $('#abrirLateral').addEventListener('click', () => alternarLateral(true));
    $('#buscar').addEventListener('click', abrirBusca);
    $('#conta').addEventListener('click', abrirMenuConta);
    window.addEventListener('scroll', () => $('.topo')?.classList.toggle('rolou', scrollY > 40), {passive: true});
    document.addEventListener('click', (e) => {
      if (lateralAberta && !e.target.closest('.lateral') && !e.target.closest('#abrirLateral')) alternarLateral(false);
    });
  }

  function alternarLateral(abrir) {
    lateralAberta = abrir;
    $('.lateral').classList.toggle('aberta', abrir);
  }

  function desenharLateral(rota) {
    const nav = $('.lateral');
    const total = todasAulas().length, feitas = totalFeitas();
    const abertos = lerLS('fvia:abertos', {});
    const aulaAtual = rota.tipo === 'aula' ? rota.id : null;
    const modAtual = aulaAtual ? aulaAtual.slice(0, 2) : null;
    nav.innerHTML = `
      <div class="marca"><span class="mini" aria-hidden="true">🎬</span>Fábrica de Vídeos</div>
      <button class="busca-btn" id="buscaLateral">${ic('busca')}Buscar<kbd>Ctrl K</kbd></button>
      <a class="nav-item ${rota.tipo === 'inicio' ? 'ativo' : ''}" href="#/"><span class="emoji">${ic('casa')}</span>Início</a>
      <a class="nav-item ${rota.tipo === 'ferramentas' ? 'ativo' : ''}" href="#/ferramentas"><span class="emoji">${ic('ferramenta')}</span>Ferramentas</a>
      <a class="nav-item ${rota.tipo === 'downloads' ? 'ativo' : ''}" href="#/downloads"><span class="emoji">${ic('baixar')}</span>Downloads</a>
      <div class="progresso-lateral">${feitas} de ${total} aulas concluídas<div class="barra"><span style="width:${pct(feitas, total)}%"></span></div></div>
      <div class="secao-titulo">Aulas</div>
      ${curso.modulos.map((m) => {
        const f = m.aulas.filter((a) => prog.feitas[a.id]).length;
        const aberto = abertos[m.id] ?? m.id === modAtual;
        return `<div>
          <button class="nav-item nav-mod" aria-expanded="${aberto || m.id === modAtual}" data-mod="${m.id}">
            <span class="emoji" aria-hidden="true">${m.icone}</span><span>${esc(m.titulo)}</span>
            <span class="sub">${f}/${m.aulas.length}</span>${ic('chev', 'chev')}
          </button>
          <div class="nav-aulas" ${aberto || m.id === modAtual ? '' : 'hidden'}>
            ${m.aulas.map((a) => `<a class="nav-item nav-aula ${prog.feitas[a.id] ? 'feita' : ''} ${a.id === aulaAtual ? 'ativo' : ''}" href="#/aula/${a.id}" ${a.id === aulaAtual ? 'aria-current="page"' : ''}>
              <span class="bolinha">${prog.feitas[a.id] ? ic('check') : ''}</span><span>${esc(a.titulo)}</span><span class="sr">${prog.feitas[a.id] ? '(concluída)' : ''}</span></a>`).join('')}
          </div></div>`;
      }).join('')}`;
    $('#buscaLateral', nav).addEventListener('click', abrirBusca);
    $$('.nav-mod', nav).forEach((b) => b.addEventListener('click', () => {
      const aberto = b.getAttribute('aria-expanded') !== 'true';
      b.setAttribute('aria-expanded', aberto);
      b.nextElementSibling.hidden = !aberto;
      const ab = lerLS('fvia:abertos', {}); ab[b.dataset.mod] = aberto; gravarLS('fvia:abertos', ab);
    }));
    $$('a', nav).forEach((a) => a.addEventListener('click', () => alternarLateral(false)));
    $$('.abas a').forEach((a) => a.classList.toggle('ativo', a.dataset.aba === (rota.tipo === 'aula' ? 'aulas' : rota.tipo)));
  }

  // ---------- rotas ----------
  function lerRota() {
    const p = location.hash.replace(/^#\/?/, '').split('/');
    if (p[0] === 'aula' && p[1]) return {tipo: 'aula', id: p[1]};
    if (['aulas', 'ferramentas', 'downloads'].includes(p[0])) return {tipo: p[0]};
    return {tipo: 'inicio'};
  }
  function rotear() {
    if (!curso) return;
    const rota = lerRota();
    desenharLateral(rota);
    const pag = $('#pagina');
    pag.className = 'pagina' + (rota.tipo === 'inicio' || rota.tipo === 'aulas' ? ' larga' : '');
    ({inicio: paginaInicio, aulas: paginaAulas, aula: paginaAula, ferramentas: paginaFerramentas, downloads: paginaDownloads}[rota.tipo])(pag, rota);
    scrollTo(0, 0);
    $('.topo')?.classList.remove('rolou');
  }
  window.addEventListener('hashchange', rotear);

  // ---------- páginas ----------
  function anel(p) {
    const r = 26, c = 2 * Math.PI * r;
    return `<svg class="anel" viewBox="0 0 64 64" role="img" aria-label="${p}% concluído"><circle class="fundo" cx="32" cy="32" r="${r}"/><circle class="frente" cx="32" cy="32" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - p / 100)}"/><text x="32" y="32">${p}%</text></svg>`;
  }
  function saudacao() {
    const hr = new Date().getHours();
    return hr < 12 ? 'Bom dia' : hr < 18 ? 'Boa tarde' : 'Boa noite';
  }
  function proximaAula() {
    const todas = todasAulas();
    if (prog.ultima) {
      const i = todas.findIndex((a) => a.id === prog.ultima);
      if (i >= 0 && !prog.feitas[todas[i].id]) return todas[i];
    }
    return todas.find((a) => !prog.feitas[a.id]) || todas[todas.length - 1];
  }

  function cartoesModulos() {
    return `<div class="grade">${curso.modulos.map((m, i) => {
      const f = m.aulas.filter((a) => prog.feitas[a.id]).length;
      const min = m.aulas.reduce((s, a) => s + a.minutos, 0);
      const primeira = m.aulas.find((a) => !prog.feitas[a.id]) || m.aulas[0];
      return `<a class="cartao-mod ${f === m.aulas.length ? 'feito' : ''}" href="#/aula/${primeira.id}">
        <span class="ic" aria-hidden="true">${m.icone}</span>
        <span class="n">Módulo ${i + 1} · ${m.aulas.length} aulas · ${min} min</span>
        <strong>${esc(m.titulo)}</strong><p>${esc(m.resumo)}</p>
        <div class="barra" aria-label="${f} de ${m.aulas.length} aulas"><span style="width:${pct(f, m.aulas.length)}%"></span></div></a>`;
    }).join('')}</div>`;
  }

  function paginaInicio(pag) {
    $('#tituloPequeno').textContent = 'Início';
    const total = todasAulas().length, feitas = totalFeitas(), p = pct(feitas, total);
    const prox = proximaAula();
    const nome = (usuario?.user_metadata?.nome || '').split(' ')[0];
    const data = new Date().toLocaleDateString('pt-BR', {weekday: 'long', day: 'numeric', month: 'long'});
    pag.innerHTML = `
      <div class="saudacao">${esc(data)}</div>
      <h1 class="titulo-grande">${saudacao()}${nome ? `, ${esc(nome)}` : ''}</h1>
      <a class="continuar" href="#/aula/${prox.id}">
        ${anel(p)}
        <div><small>${feitas === 0 ? 'Comece por aqui' : feitas === total ? 'Curso concluído · reveja' : 'Continue de onde parou'}</small><strong>${esc(prox.titulo)}</strong><span style="opacity:.85;font-size:.875rem">${esc(prox.modulo.titulo)} · ${prox.minutos} min</span></div>
        <span class="play" aria-hidden="true">${ic('play')}</span>
      </a>
      <h2 class="secao">Módulos</h2><p class="subtitulo">${curso.modulos.length} módulos · ${total} aulas · do computador vazio ao vídeo pronto.</p>
      ${cartoesModulos()}
      <h2 class="secao">Atalhos</h2>
      <div class="lista-agrupada">
        <a class="linha" href="#/ferramentas"><span class="ic" style="background:var(--indigo)">✍️</span><div><strong>Contador de roteiro</strong><small>Confira palavras, duração e as regras do esqueleto</small></div>${ic('chev', 'chev')}</a>
        <a class="linha" href="#/ferramentas"><span class="ic" style="background:var(--pink)">📱</span><div><strong>Simulador de zona segura</strong><small>Veja o que Instagram, TikTok e YouTube cobrem</small></div>${ic('chev', 'chev')}</a>
        <a class="linha" href="#/downloads"><span class="ic" style="background:var(--green)">📦</span><div><strong>Baixar o Kit</strong><small>Roteiro → voz → vídeo, com a skill do curso</small></div>${ic('chev', 'chev')}</a>
      </div>`;
  }

  function paginaAulas(pag) {
    $('#tituloPequeno').textContent = 'Aulas';
    pag.innerHTML = `<h1 class="titulo-grande">Aulas</h1><p class="subtitulo">Siga na ordem. Cada módulo termina com algo pronto.</p>${cartoesModulos()}`;
  }

  function paginaAula(pag, rota) {
    const todas = todasAulas();
    const i = todas.findIndex((a) => a.id === rota.id);
    if (i < 0) { location.hash = '#/'; return; }
    const a = todas[i], ant = todas[i - 1], prox = todas[i + 1];
    const nMod = curso.modulos.indexOf(a.modulo) + 1;
    const nAula = a.modulo.aulas.indexOf(curso.modulos[nMod - 1].aulas.find((x) => x.id === a.id)) + 1;
    prog.ultima = a.id; salvar();
    $('#tituloPequeno').textContent = a.titulo;
    pag.innerHTML = `
      <div class="olho"><span>${a.modulo.icone} Módulo ${nMod} · Aula ${nAula}</span><span class="tempo">${ic('relogio')}${a.minutos} min</span></div>
      <h1 class="titulo-grande">${esc(a.titulo)}</h1>
      <article class="conteudo">${a.html}</article>
      <div class="fim-aula">
        <button class="btn grande concluir ${prog.feitas[a.id] ? 'feita' : 'primario'}" id="concluir">${prog.feitas[a.id] ? `${ic('check')}Aula concluída` : 'Concluir aula'}</button>
        <div class="navegacao">
          ${ant ? `<a href="#/aula/${ant.id}"><small>${ic('voltar')} Anterior</small>${esc(ant.titulo)}</a>` : '<span></span>'}
          ${prox ? `<a class="prox" href="#/aula/${prox.id}"><small>Próxima ${ic('chev')}</small>${esc(prox.titulo)}</a>` : ''}
        </div>
      </div>`;
    prepararConteudo($('.conteudo', pag), a.id);
    $('#concluir').addEventListener('click', () => {
      const ja = prog.feitas[a.id];
      if (ja) delete prog.feitas[a.id]; else prog.feitas[a.id] = Date.now();
      salvar();
      if (!ja) {
        const modFeito = a.modulo.aulas.every((x) => prog.feitas[x.id]);
        if (totalFeitas() === todas.length) { confete(); toast('Curso concluído. Parabéns!'); }
        else if (modFeito) { confete(); toast(`Módulo "${a.modulo.titulo}" concluído`); }
        else toast('Aula concluída');
        if (prox) { location.hash = `#/aula/${prox.id}`; return; }
      }
      rotear();
    });
  }

  function paginaFerramentas(pag) {
    $('#tituloPequeno').textContent = 'Ferramentas';
    pag.innerHTML = `<h1 class="titulo-grande">Ferramentas</h1><p class="subtitulo">Tudo funciona aqui mesmo, sem instalar nada.</p>
      <div data-widget="contador"></div><div data-widget="zona"></div><div data-widget="prompt-imagem"></div><div data-widget="outlier"></div><div data-widget="nota"></div>`;
    prepararConteudo(pag, 'ferramentas');
  }

  function paginaDownloads(pag) {
    $('#tituloPequeno').textContent = 'Downloads';
    pag.innerHTML = `<h1 class="titulo-grande">Downloads</h1><p class="subtitulo">Materiais do curso para usar no seu computador.</p>
      <div class="lista-agrupada downloads">
        <div class="linha"><span class="ic" style="background:var(--green)">📦</span><div><strong>Kit de Vídeo com IA</strong><small>Roteiro → voz → vídeo 1080×1920 · inclui a skill "video-curto" · ZIP</small></div><button class="btn primario" id="baixarKit">${ic('baixar')}Baixar</button></div>
        <div class="linha"><span class="ic" style="background:var(--indigo)">🎬</span><div><strong>Vídeo de exemplo do Kit</strong><small>O que sai do Kit sem mudar nada · MP4</small></div><a class="btn" href="${ASSETS}demo.mp4" download="exemplo-do-kit.mp4">${ic('baixar')}Baixar</a></div>
      </div>
      <h2 class="secao">Links oficiais</h2>
      <div class="lista-agrupada">
        <a class="linha" href="https://nodejs.org" target="_blank" rel="noopener"><span class="ic" style="background:#3c873a">⬢</span><div><strong>Node.js</strong><small>nodejs.org · versão LTS</small></div>${ic('chev', 'chev')}</a>
        <a class="linha" href="https://code.claude.com/docs/en/setup" target="_blank" rel="noopener"><span class="ic" style="background:#d97757">✳</span><div><strong>Claude Code</strong><small>Instalação oficial</small></div>${ic('chev', 'chev')}</a>
        <a class="linha" href="https://www.remotion.dev/docs/ai/skills" target="_blank" rel="noopener"><span class="ic" style="background:#0b84f3">▶</span><div><strong>Skills do Remotion</strong><small>remotion.dev · documentação oficial</small></div>${ic('chev', 'chev')}</a>
        <a class="linha" href="https://github.com/lemomo-ai/lemo-opuscar" target="_blank" rel="noopener"><span class="ic" style="background:#e8553a">🎨</span><div><strong>Lemo-Opuscar</strong><small>GitHub · estilos de filme em código</small></div>${ic('chev', 'chev')}</a>
        <a class="linha" href="https://www.capcut.com" target="_blank" rel="noopener"><span class="ic" style="background:#111">✂</span><div><strong>CapCut</strong><small>capcut.com</small></div>${ic('chev', 'chev')}</a>
      </div>`;
    $('#baixarKit').addEventListener('click', baixarKit);
  }

  async function baixarKit() {
    const b = $('#baixarKit'); b.disabled = true;
    try {
      let blob;
      if (DEMO) blob = await (await fetch('../../dist/Kit-Video-com-IA.zip')).blob();
      else { const {data, error} = await sb.storage.from('curso').download('Kit-Video-com-IA.zip'); if (error) throw error; blob = data; }
      const url = URL.createObjectURL(blob);
      const a = h(`<a href="${url}" download="Kit-Video-com-IA.zip"></a>`); document.body.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('Download iniciado', 'baixar');
    } catch { toast('Não foi possível baixar agora. Tente de novo.', 'alerta'); }
    b.disabled = false;
  }

  // ---------- conteúdo: código, checklists, widgets ----------
  function prepararConteudo(el, aulaId) {
    $$('pre', el).forEach((pre) => {
      const wrap = h('<div class="bloco-codigo"></div>');
      pre.replaceWith(wrap); wrap.append(pre);
      const b = h(`<button class="copiar" type="button">${ic('copiar')}Copiar</button>`);
      b.addEventListener('click', () => copiar(pre.innerText.trim(), b));
      wrap.append(b);
    });
    let n = 0;
    $$('ul', el).forEach((ul) => {
      if (!$('input[type=checkbox]', ul)) return;
      ul.classList.add('checklist');
      $$(':scope > li', ul).forEach((li) => {
        const k = `${aulaId}#${n++}`;
        const texto = li.innerHTML.replace(/<input[^>]*>/, '').trim();
        li.innerHTML = `<label class="check"><input type="checkbox" ${prog.checks[k] ? 'checked' : ''}><span class="caixa">${ic('check')}</span><span class="txt">${texto}</span></label>`;
        $('input', li).addEventListener('change', (e) => { if (e.target.checked) prog.checks[k] = 1; else delete prog.checks[k]; salvar(); });
      });
    });
    $$('[data-widget]', el).forEach((w) => (WIDGETS[w.dataset.widget] || (() => {}))(w));
    $$('[data-quiz]', el).forEach(quiz);
  }

  function quiz(el) {
    let q; try { q = JSON.parse(el.dataset.quiz); } catch { return; }
    el.className = 'widget quiz';
    el.innerHTML = `<h3>${ic('livro')}Teste rápido</h3><p class="desc">${esc(q.q)}</p>
      ${q.opts.map((o, i) => `<button class="opcao" type="button" data-i="${i}"><span class="letra">${'ABCD'[i]}</span><span>${esc(o)}</span></button>`).join('')}
      <div class="explica" aria-live="polite"></div>`;
    $$('.opcao', el).forEach((b) => b.addEventListener('click', () => {
      const i = Number(b.dataset.i), certo = i === q.a;
      $$('.opcao', el).forEach((x) => { x.disabled = true; if (Number(x.dataset.i) === q.a) x.classList.add('certa'); });
      if (!certo) b.classList.add('errada');
      $('.explica', el).innerHTML = `<strong>${certo ? 'Isso!' : 'Quase.'}</strong> ${esc(q.exp)} <button class="btn plano" type="button" style="min-height:36px">Tentar de novo</button>`;
      $('.explica .btn', el).addEventListener('click', () => quiz(el));
    }));
  }

  const W = (el, titulo, desc, corpo) => {
    el.className = 'widget';
    el.innerHTML = `<h3>${titulo}</h3>${desc ? `<p class="desc">${desc}</p>` : ''}${corpo}`;
    return el;
  };
  const cmdHtml = (cmd, rotulo = '') => `<div class="cmd">${rotulo ? `<span class="rotulo">${rotulo}</span>` : ''}<code>${esc(cmd)}</code><button class="copiar" type="button" data-cmd="${esc(cmd)}">${ic('copiar')}<span class="sr">Copiar</span></button></div>`;
  const ligarCopiar = (el) => $$('.cmd .copiar', el).forEach((b) => b.addEventListener('click', () => copiar(b.dataset.cmd, b)));

  const INSTALAR = {
    win: [
      {n: 'Node.js (LTS)', d: 'Roda o Kit e o Remotion.', i: 'winget install OpenJS.NodeJS.LTS', c: 'node -v'},
      {n: 'Git', d: 'Baixa skills e dá o Git Bash ao Claude Code.', i: 'winget install Git.Git', c: 'git --version'},
      {n: 'Python', d: 'Usado por skills de voz e áudio.', i: 'winget install Python.Python.3.12', c: 'python --version'},
      {n: 'ffmpeg', d: 'Corta, junta e converte vídeo e áudio.', i: 'winget install Gyan.FFmpeg', c: 'ffmpeg -version'},
      {n: 'VS Code (opcional)', d: 'Editor para abrir o roteiro.json.', i: 'winget install Microsoft.VisualStudioCode', c: 'code --version'},
      {n: 'Claude Code', d: 'Precisa de assinatura Claude Pro ou superior.', i: 'irm https://claude.ai/install.ps1 | iex', c: 'claude --version'},
    ],
    mac: [
      {n: 'Homebrew', d: 'Instalador de programas do Mac. Siga o que ele pedir no fim.', i: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', c: 'brew --version'},
      {n: 'Node.js', d: 'Roda o Kit e o Remotion.', i: 'brew install node', c: 'node -v'},
      {n: 'Git', d: 'Baixa skills e projetos.', i: 'brew install git', c: 'git --version'},
      {n: 'Python', d: 'Usado por skills de voz e áudio.', i: 'brew install python', c: 'python3 --version'},
      {n: 'ffmpeg', d: 'Corta, junta e converte vídeo e áudio.', i: 'brew install ffmpeg', c: 'ffmpeg -version'},
      {n: 'VS Code (opcional)', d: 'Editor para abrir o roteiro.json.', i: 'brew install --cask visual-studio-code', c: 'code --version'},
      {n: 'Claude Code', d: 'Precisa de assinatura Claude Pro ou superior.', i: 'curl -fsSL https://claude.ai/install.sh | bash', c: 'claude --version'},
    ],
  };

  const WIDGETS = {
    demo(el) {
      el.outerHTML = `<div class="demo-wrap"><div class="tela"><video src="${ASSETS}demo.mp4" poster="${ASSETS}demo.jpg" controls playsinline loop preload="metadata" aria-label="Vídeo de exemplo feito com o Kit"></video></div>
        <ul><li><strong>26 segundos</strong>, 73 palavras, 8 falas</li><li>Narração gerada por IA, em português</li><li>Legenda palavra por palavra, no meio da tela</li><li>Gancho escrito nos primeiros 2,5 s</li><li>Zoom contínuo: nada fica parado</li></ul></div>`;
    },

    instalador(el) {
      const so = lerLS('fvia:so', /Mac/i.test(navigator.platform) ? 'mac' : 'win');
      const desenhar = (s) => {
        gravarLS('fvia:so', s);
        W(el, `${ic('ferramenta')}Lista de instalação`, 'Copie, cole no terminal e aperte Enter. Depois rode o comando de conferir e marque como feito.', `
          <div class="segmento" role="group" aria-label="Sistema"><button type="button" data-so="win" aria-pressed="${s === 'win'}">Windows</button><button type="button" data-so="mac" aria-pressed="${s === 'mac'}">Mac</button></div>
          ${INSTALAR[s].map((it, i) => {
            const k = `${s}:${i}`;
            return `<div class="passo ${prog.passos[k] ? 'ok' : ''}"><span class="num">${prog.passos[k] ? ic('check') : i + 1}</span>
              <div style="display:flex;justify-content:space-between;gap:10px;align-items:center"><strong>${esc(it.n)}</strong>
              <label class="alternar" style="border:0;min-height:0;padding:0;gap:8px;font-size:.8125rem;color:var(--label-2)">Feito<input type="checkbox" data-k="${k}" ${prog.passos[k] ? 'checked' : ''}><span class="chave"></span></label></div>
              <span class="p-desc">${esc(it.d)}</span>
              <div>${cmdHtml(it.i, 'instalar')}${cmdHtml(it.c, 'conferir')}</div></div>`;
          }).join('')}`);
        ligarCopiar(el);
        $$('[data-so]', el).forEach((b) => b.addEventListener('click', () => desenhar(b.dataset.so)));
        $$('input[data-k]', el).forEach((c) => c.addEventListener('change', () => { if (c.checked) prog.passos[c.dataset.k] = 1; else delete prog.passos[c.dataset.k]; salvar(); desenhar(s); }));
      };
      desenhar(so);
    },

    skills(el) {
      el.outerHTML = `<div class="skills-grade">
        <div class="skill"><span class="ic" style="background:#0b84f3">▶</span><strong>Remotion (oficial)</strong><p>Boas práticas de vídeo em código: animação, legenda, áudio e render. Base do Kit.</p></div>
        <div class="skill"><span class="ic" style="background:#e8553a">🎨</span><strong>Lemo-Opuscar</strong><p>Mais de 60 estilos de filme prontos (aquarela, cartoon, papel, infográfico…). O Claude dirige o filme inteiro.</p></div>
        <div class="skill"><span class="ic" style="background:linear-gradient(145deg,#5e5ce6,#0a84ff)">🎬</span><strong>video-curto (do curso)</strong><p>O esqueleto de 25 s, as regras de roteiro e de tela e o uso do Kit. Vem dentro do Kit.</p></div></div>`;
    },

    contador(el) {
      const salvo = lerLS('fvia:roteiro', {t: '', r: ''});
      W(el, '✍️ Contador de roteiro', 'Cole o roteiro com uma frase por linha. A conferência é automática.', `
        <div class="duas"><div class="campo"><label for="rival">Quem é o rival?</label><input id="rival" placeholder="ex.: cunhado" value="${esc(salvo.r)}"></div><div></div></div>
        <div class="campo"><label for="rot">Roteiro</label><textarea id="rot" rows="8" placeholder="Você sai de casa arrumado, e cai um temporal...">${esc(salvo.t)}</textarea></div>
        <div class="estat"><div><b id="cPal">0</b><small>palavras</small></div><div><b id="cSeg">0 s</b><small>duração estimada</small></div><div><b id="cFr">0</b><small>frases</small></div></div>
        <ul class="verif" id="cVer" aria-live="polite"></ul>`);
      const t = $('#rot', el), r = $('#rival', el);
      const PROIB = ['segue', 'siga', 'curte', 'curtir', 'comenta', 'comente', 'compartilha', 'manda pro', 'manda pra', 'proximo video', 'inscreva', 'link na bio'];
      const atualizar = () => {
        gravarLS('fvia:roteiro', {t: t.value, r: r.value});
        const linhas = t.value.split('\n').map((l) => l.trim()).filter(Boolean);
        const pal = linhas.join(' ').split(/\s+/).filter(Boolean).length;
        const seg = pal / 2.8 + linhas.length * 0.08;
        $('#cPal', el).textContent = pal; $('#cSeg', el).textContent = `${seg.toFixed(0)} s`; $('#cFr', el).textContent = linhas.length;
        if (!linhas.length) { $('#cVer', el).innerHTML = '<li class="neutro"><span class="st">·</span>Cole o roteiro para conferir.</li>'; return; }
        const rv = semAcento(r.value.trim());
        const sa = linhas.map(semAcento);
        const achadas = PROIB.filter((p) => sa.join(' ').includes(p));
        const maior = Math.max(...linhas.map((l) => l.split(/\s+/).length));
        const itens = [
          [pal <= 85, `Até 85 palavras${pal > 85 ? ` (sobram ${pal - 85}: corte uma frase inteira)` : ''}`],
          [seg >= 18 && seg <= 31, `Entre 20 e 31 segundos${seg > 31 ? ' (longo demais)' : seg < 18 ? ' (curto demais)' : ''}`],
          [linhas.length >= 6 && linhas.length <= 11, 'Entre 6 e 11 frases (uma imagem por frase)'],
          [/\bvoce\b|\bvc\b/.test(sa[0]), 'A primeira frase fala com "você"'],
          rv ? [sa[0].includes(rv) && sa[sa.length - 1].includes(rv) || sa[sa.length - 1].includes('ele') || sa[sa.length - 1].includes('ela'), `O rival aparece na primeira e na última frase`] : [null, 'Preencha o rival para conferir se ele abre e fecha o vídeo'],
          [!achadas.length, achadas.length ? `Tire da história: ${achadas.join(', ')}` : 'Sem "segue", "curte", "comenta" dentro da história'],
          [maior <= 18, `Frases curtas (a maior tem ${maior} palavras; ideal até 18)`],
        ];
        $('#cVer', el).innerHTML = itens.map(([ok, txt]) => `<li class="${ok === null ? 'neutro' : ok ? 'sim' : 'nao'}"><span class="st">${ok === null ? '·' : ok ? '✓' : '!'}</span><span>${esc(txt)}</span></li>`).join('');
      };
      t.addEventListener('input', atualizar); r.addEventListener('input', atualizar); atualizar();
    },

    outlier(el) {
      W(el, '📈 Calculadora de outlier', 'Cole as views dos últimos 15 a 20 vídeos de um criador (uma por linha ou separadas por vírgula). Aceita "1,2 mi", "350 mil", "12k".', `
        <div class="campo"><label for="views">Views</label><textarea id="views" rows="4" placeholder="12 mil, 9800, 15k, 1,4 mi, 11 mil..."></textarea></div>
        <div id="oRes" aria-live="polite"></div>`);
      const parse = (s) => {
        const m = semAcento(s).trim().match(/^([\d.,]+)\s*(milhoes|milhao|mil|mi|m|k)?\b/);
        if (!m) return null;
        let n = m[1];
        n = /[.,]\d{3}$/.test(n) && !m[2] ? n.replace(/[.,]/g, '') : n.replace(/\./g, '').replace(',', '.');
        let v = parseFloat(n);
        if (['milhoes', 'milhao', 'mi', 'm'].includes(m[2])) v *= 1e6; else if (m[2] === 'mil' || m[2] === 'k') v *= 1e3;
        return isFinite(v) ? v : null;
      };
      const fmt = (v) => v >= 1e6 ? `${(v / 1e6).toLocaleString('pt-BR', {maximumFractionDigits: 1})} mi` : v >= 1e3 ? `${(v / 1e3).toLocaleString('pt-BR', {maximumFractionDigits: 1})} mil` : String(Math.round(v));
      $('#views', el).addEventListener('input', (e) => {
        const vs = e.target.value.split(/[\n;]|,(?!\d)|\s{2,}/).map(parse).filter((v) => v !== null);
        if (vs.length < 3) { $('#oRes', el).innerHTML = '<p class="desc" style="margin:0">Cole pelo menos 3 números.</p>'; return; }
        const ord = [...vs].sort((a, b) => a - b), mid = Math.floor(ord.length / 2);
        const med = ord.length % 2 ? ord[mid] : (ord[mid - 1] + ord[mid]) / 2;
        const max = Math.max(...vs);
        const outs = vs.filter((v) => v >= 3 * med).length;
        $('#oRes', el).innerHTML = `<div class="estat"><div><b>${fmt(med)}</b><small>mediana</small></div><div><b>${outs}</b><small>outliers (≥ 3×)</small></div><div><b>${(max / med).toFixed(1).replace(".", ",")}×</b><small>maior vídeo</small></div></div>
          <div class="barras">${vs.map((v) => { const x = v / med; return `<div class="barra-v ${x >= 5 ? 'ouro' : x >= 3 ? 'out' : ''}"><span>${fmt(v)}</span><span class="tr"><span style="width:${(v / max) * 100}%"></span></span><span class="x">${x.toFixed(1).replace(".", ",")}× ${x >= 5 ? '★' : x >= 3 ? '●' : ''}</span></div>`; }).join('')}</div>
          <p class="desc" style="margin:12px 0 0">● ≥ 3× a mediana: viral daquele criador. ★ ≥ 5×: ouro. Esses são os vídeos para estudar.</p>`;
      });
    },

    nota(el) {
      const itens = ['Existe um outlier do mesmo tema nos últimos 45 dias, com 1 milhão de views ou mais', 'Esse viral tem muitos envios ou compartilhamentos (≥ 1% das views, se a rede mostrar)', 'Ainda não existe versão em português com mais de 100 mil views', 'O primeiro quadro mostra uma situação vivida, entendida sem som', 'O assunto está no dia a dia de quase todo mundo', 'A história cabe em 3 ciclos e ~85 palavras'];
      W(el, '⭐ Nota do tema', 'Produza só temas com nota 5 ou 6.', `${itens.map((t, i) => `<label class="alternar"><span>${esc(t)}</span><input type="checkbox" data-i="${i}"><span class="chave"></span></label>`).join('')}<div class="veredito ruim" id="nRes" aria-live="polite"></div>`);
      const at = () => {
        const n = $$('input:checked', el).length;
        const v = $('#nRes', el);
        v.className = `veredito ${n >= 5 ? 'bom' : 'ruim'}`;
        v.innerHTML = `<span style="font-size:1.5rem;font-variant-numeric:tabular-nums">${n}/6</span><span>${n >= 5 ? 'Pode produzir.' : 'Ainda não: troque o tema ou ache um viral melhor.'}</span>`;
      };
      $$('input', el).forEach((c) => c.addEventListener('change', at)); at();
    },

    'prompt-imagem'(el) {
      const s = lerLS('fvia:pimg', {e: 'cartoon 3D colorido, iluminação suave, estilo de animação para TV', p: '', r: '', t: ''});
      W(el, '🎨 Gerador de prompts de imagem', 'Um prompt por frase do roteiro, já com o personagem fixo e as regras de tela.', `
        <div class="campo"><label for="pe">Estilo</label><input id="pe" value="${esc(s.e)}"></div>
        <div class="duas"><div class="campo"><label for="pp">Personagem principal (descrição completa)</label><input id="pp" placeholder="homem de 30 anos, camiseta laranja, barba curta" value="${esc(s.p)}"></div>
        <div class="campo"><label for="pr">Rival (opcional)</label><input id="pr" placeholder="cunhado magro, boné azul, sorriso debochado" value="${esc(s.r)}"></div></div>
        <div class="campo"><label for="pt">Roteiro (uma frase por linha)</label><textarea id="pt" rows="5">${esc(s.t)}</textarea></div>
        <button class="btn" type="button" id="pCopiar">${ic('copiar')}Copiar todos</button>
        <div class="saida-prompts" id="pOut"></div>`);
      const gerar = () => {
        const e = $('#pe', el).value.trim(), p = $('#pp', el).value.trim(), r = $('#pr', el).value.trim();
        const linhas = $('#pt', el).value.split('\n').map((l) => l.trim()).filter(Boolean);
        gravarLS('fvia:pimg', {e, p, r, t: $('#pt', el).value});
        const prompts = linhas.map((l, i) => `${String(i + 1).padStart(2, '0')} · Imagem vertical 9:16, ${e}. Personagem principal (igual em todas as imagens): ${p || '[descreva o personagem]'}.${r ? ` Rival (igual em todas): ${r}.` : ''} Cena: ${l} Enquadramento próximo: personagens e objeto principal ocupam a maior parte da imagem. Sem nenhum texto escrito na imagem. Os 20% de baixo podem ser só cenário.`);
        $('#pOut', el).innerHTML = prompts.length ? prompts.map((x) => cmdHtml(x)).join('') : '<p class="desc" style="margin:0">Escreva o roteiro para gerar os prompts.</p>';
        ligarCopiar($('#pOut', el));
        el._prompts = prompts;
      };
      $$('input, textarea', el).forEach((c) => c.addEventListener('input', gerar));
      $('#pCopiar', el).addEventListener('click', (ev) => copiar((el._prompts || []).join('\n\n'), ev.currentTarget));
      gerar();
    },

    zona(el) {
      let rede = 'instagram', zonas = true, midia = `<img src="${ASSETS}demo.jpg" alt="Quadro de exemplo">`;
      const UI = {
        instagram: {topo: 'Reels', base: '@sua.conta · Seguir<br>Descrição do vídeo…', icones: '♡<br><br>💬<br><br>➤<br><br>⋯'},
        tiktok: {topo: 'Seguindo &nbsp;|&nbsp; <b>Para você</b>', base: '@sua.conta<br>Descrição do vídeo #tag', icones: '👤<br><br>♥<br><br>💬<br><br>🔖<br><br>↪'},
        youtube: {topo: 'Shorts', base: '@seucanal · Inscrever-se<br>Título do Short', icones: '👍<br><br>👎<br><br>💬<br><br>↪<br><br>⟳'},
      };
      const desenhar = () => {
        const u = UI[rede];
        W(el, '📱 Simulador de zona segura', 'Suba um quadro do seu vídeo (imagem ou vídeo) e veja o que fica coberto em cada rede.', `
          <div class="segmento" role="group" aria-label="Rede">${['instagram', 'tiktok', 'youtube'].map((r) => `<button type="button" data-r="${r}" aria-pressed="${r === rede}">${{instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube'}[r]}</button>`).join('')}</div>
          <div class="zona-wrap">
            <div><div class="tela">${midia}
              ${zonas ? `<div class="cobre" style="left:0;right:0;top:0;height:13%"></div><div class="cobre" style="left:0;right:0;top:78%;bottom:0"></div><div class="cobre" style="right:0;width:13%;top:50%;height:28%"></div><div class="faixa" style="top:60%;height:13%"></div>` : ''}
              <div class="ui" style="top:5%;left:0;right:0;text-align:center">${u.topo}</div>
              <div class="ui" style="right:4%;top:52%;text-align:center;font-size:15px">${u.icones}</div>
              <div class="ui" style="left:5%;bottom:5%;right:16%">${u.base}</div>
            </div>
            <label class="soltar">${ic('foto')} Escolher imagem ou vídeo<input type="file" accept="image/*,video/*" hidden></label></div>
            <div class="legenda-zona">
              <span><i style="background:rgba(255,59,48,.55)"></i>Coberto pela interface: nada importante aqui</span>
              <span><i style="background:rgba(52,199,89,.35);border:2px dashed #34c759"></i>Faixa ideal da legenda (60% a 73% da altura)</span>
              <span style="color:var(--label-2);font-size:.875rem">Em 1080 × 1920: topo até 250 px, base a partir de 1500 px, coluna direita de 140 px na metade de baixo. As interfaces mudam com o tempo: use como guia.</span>
              <label class="alternar"><span>Mostrar zonas</span><input type="checkbox" id="zMostrar" ${zonas ? 'checked' : ''}><span class="chave"></span></label>
            </div></div>`);
        $$('[data-r]', el).forEach((b) => b.addEventListener('click', () => { rede = b.dataset.r; desenhar(); }));
        $('#zMostrar', el).addEventListener('change', (e) => { zonas = e.target.checked; desenhar(); });
        $('input[type=file]', el).addEventListener('change', (e) => {
          const f = e.target.files[0]; if (!f) return;
          const url = URL.createObjectURL(f);
          midia = f.type.startsWith('video') ? `<video src="${url}" muted playsinline loop autoplay></video>` : `<img src="${url}" alt="Seu quadro">`;
          desenhar();
        });
      };
      desenhar();
    },

    fim(el) {
      const total = todasAulas().length, feitas = totalFeitas();
      const faltam = total - feitas;
      el.className = 'widget parabens';
      el.innerHTML = faltam <= 1
        ? `<div class="grande" aria-hidden="true">🏆</div><h3 style="justify-content:center;font-size:1.375rem">Você chegou ao fim</h3><p class="desc">Conclua esta aula para fechar o curso. Agora é repetir o processo: um vídeo por vez, sempre comparando com um viral.</p>`
        : `<div class="grande" aria-hidden="true">🎯</div><h3 style="justify-content:center;font-size:1.375rem">Faltam ${faltam} aulas</h3><p class="desc">Volte nas aulas que ficaram para trás quando quiser. O seu progresso fica salvo.</p><a class="btn" href="#/aulas">Ver aulas</a>`;
    },
  };

  // ---------- busca ----------
  function abrirBusca() {
    if ($('.veu')) return;
    const veu = h(`<div class="veu" role="dialog" aria-modal="true" aria-label="Buscar"><div class="folha">
      <div class="campo-busca">${ic('busca')}<input type="search" placeholder="Buscar aulas, comandos, assuntos…" aria-label="Buscar"><button class="btn plano" type="button" id="fechaBusca">Cancelar</button></div>
      <div class="resultados" role="listbox"></div></div></div>`);
    document.body.append(veu);
    const inp = $('input', veu), res = $('.resultados', veu);
    let sel = 0, achados = [];
    const fechar = () => veu.remove();
    const marcar = (txt, q) => { const i = semAcento(txt).indexOf(q); return i < 0 ? esc(txt) : `${esc(txt.slice(0, i))}<mark>${esc(txt.slice(i, i + q.length))}</mark>${esc(txt.slice(i + q.length))}`; };
    const buscar = () => {
      const q = semAcento(inp.value.trim());
      achados = !q ? todasAulas().slice(0, 8).map((a) => ({a, trecho: a.modulo.titulo})) : todasAulas().map((a) => {
        const t = semAcento(a.titulo), c = semAcento(a.texto);
        const it = c.indexOf(q);
        if (!t.includes(q) && it < 0) return null;
        const trecho = it >= 0 ? (it > 40 ? '…' : '') + a.texto.slice(Math.max(0, it - 40), it + 80) + '…' : a.modulo.titulo;
        return {a, trecho, peso: t.includes(q) ? 0 : 1};
      }).filter(Boolean).sort((x, y) => x.peso - y.peso).slice(0, 12);
      sel = 0;
      res.innerHTML = achados.length ? achados.map((r, i) => `<a class="res ${i === 0 ? 'sel' : ''}" role="option" href="#/aula/${r.a.id}">${q ? marcar(r.a.titulo, q) : esc(r.a.titulo)}<small>${q ? marcar(r.trecho, q) : esc(r.trecho)}</small></a>`).join('') : `<div class="vazio">Nada encontrado para "${esc(inp.value)}".</div>`;
      $$('.res', res).forEach((a) => a.addEventListener('click', fechar));
    };
    inp.addEventListener('input', buscar);
    inp.addEventListener('keydown', (e) => {
      const itens = $$('.res', res);
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + itens.length) % itens.length; itens.forEach((x, i) => x.classList.toggle('sel', i === sel)); itens[sel]?.scrollIntoView({block: 'nearest'}); }
      if (e.key === 'Enter' && itens[sel]) { location.hash = itens[sel].getAttribute('href'); fechar(); }
    });
    veu.addEventListener('click', (e) => { if (e.target === veu) fechar(); });
    veu.addEventListener('keydown', (e) => { if (e.key === 'Escape') fechar(); });
    $('#fechaBusca', veu).addEventListener('click', fechar);
    buscar(); inp.focus();
  }
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k' && curso) { e.preventDefault(); abrirBusca(); }
  });

  // ---------- menu da conta ----------
  function abrirMenuConta(e) {
    e.stopPropagation();
    if ($('.menu-flutuante')) return $('.menu-flutuante').remove();
    const tema = lerLS('fvia:tema', 'auto');
    const m = h(`<div class="menu-flutuante" role="menu">
      <div class="email">${esc(usuario?.email || 'Modo demonstração')}</div>
      ${[['auto', 'auto', 'Aparência automática'], ['claro', 'sol', 'Claro'], ['escuro', 'lua', 'Escuro']].map(([v, i, t]) => `<button role="menuitemradio" aria-checked="${tema === v}" data-tema="${v}">${ic(i)}${t}${tema === v ? `<span style="margin-left:auto;color:var(--accent)">${ic('check')}</span>` : ''}</button>`).join('')}
      ${sb ? `<button role="menuitem" class="perigo" id="sair">${ic('sair')}Sair</button>` : ''}</div>`);
    $('.topo').append(m);
    $$('[data-tema]', m).forEach((b) => b.addEventListener('click', () => { gravarLS('fvia:tema', b.dataset.tema); aplicarTema(b.dataset.tema); m.remove(); }));
    $('#sair', m)?.addEventListener('click', async () => { await sb.auth.signOut(); curso = null; location.hash = ''; telaLogin('Você saiu da sua conta.', 'ok'); });
    setTimeout(() => document.addEventListener('click', function fora(ev) { if (!ev.target.closest('.menu-flutuante')) { m.remove(); document.removeEventListener('click', fora); } }));
  }

  // ---------- confete ----------
  function confete() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = h('<canvas class="confete"></canvas>'); document.body.append(c);
    const x = c.getContext('2d'); c.width = innerWidth; c.height = innerHeight;
    const cores = ['#0a84ff', '#30d158', '#ff9f0a', '#ff375f', '#5e5ce6', '#ffd60a'];
    const ps = Array.from({length: 140}, () => ({x: innerWidth / 2, y: innerHeight * 0.35, vx: (Math.random() - 0.5) * 16, vy: Math.random() * -14 - 4, r: Math.random() * 6 + 4, c: cores[(Math.random() * cores.length) | 0], a: Math.random() * 6}));
    let t = 0;
    (function loop() {
      x.clearRect(0, 0, c.width, c.height);
      ps.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += 0.45; p.vx *= 0.99; p.a += 0.2; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); x.restore(); });
      if (++t < 140) requestAnimationFrame(loop); else c.remove();
    })();
  }

  // ---------- início ----------
  async function iniciar() {
    if (DEMO) { usuario = {id: 'demo', email: 'demonstração (local)'}; return entrar(); }
    if (!sb) { telaEntrada('<h1>Configuração pendente</h1><p>O servidor do curso ainda não foi configurado.</p>'); return; }
    if (erroLink) { history.replaceState(null, '', location.pathname); return telaLogin(/expired|invalid/i.test(erroLink) ? 'Este link expirou ou já foi usado. Peça um novo em "Esqueci minha senha".' : erroLink); }
    const {data: {session}} = await sb.auth.getSession();
    if (tipoLink) history.replaceState(null, '', location.pathname + '#/');
    if (session) {
      usuario = session.user;
      // Quem chegou por link (convite ou recuperação) ou ainda não criou senha vai para a tela de senha.
      const semSenha = !usuario.user_metadata?.senha_definida;
      if (['invite', 'recovery', 'signup', 'magiclink'].includes(tipoLink) || semSenha) return telaDefinirSenha(tipoLink !== 'recovery');
      return entrar();
    }
    telaLogin();
  }
  var telaSenhaAberta = false;
  sb?.auth.onAuthStateChange((ev, session) => {
    if (ev === 'PASSWORD_RECOVERY' && session && !telaSenhaAberta) { usuario = session.user; telaDefinirSenha(false); }
  });
  iniciar();
})();
