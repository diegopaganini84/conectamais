/* Conecta + MKT — lê os arquivos em /content e monta as páginas */
(() => {
  'use strict';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* Cria elementos sem usar innerHTML (conteúdo do painel nunca vira HTML) */
  const el = (tag, props = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat()) {
      if (kid == null || kid === false) continue;
      n.append(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    }
    return n;
  };

  const svgIcon = (inner, extra = {}) => {
    const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    for (const [k, v] of Object.entries(extra)) s.setAttribute(k, v);
    s.innerHTML = inner; // texto fixo definido aqui no código
    return s;
  };
  const ICON_PLAY = '<path d="M7 4.5v15l13-7.5z"/>';
  const ICON_WA = '<path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z"/><path d="M9 9c0 3 3 6 6 6l1.2-1.6-2-1-1 .6c-.8-.4-1.6-1.2-2-2l.6-1-1-2z"/>';
  const ICON_IG = '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/>';

  const getJSON = async (path) => {
    try {
      const r = await fetch(path, { cache: 'no-cache' });
      if (!r.ok) throw new Error(r.status);
      return await r.json();
    } catch (e) {
      console.warn('Não foi possível ler', path, e);
      return null;
    }
  };

  /* ---------- Dados de contato ---------- */
  const waNumber = (cfg) => String(cfg.whatsapp || '').replace(/\D/g, '');
  const waLink = (cfg, msg) => {
    const n = waNumber(cfg);
    return `https://wa.me/${n}${msg ? `?text=${encodeURIComponent(msg)}` : ''}`;
  };
  const igHandle = (v = '') =>
    String(v).trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, '').replace(/^@/, '').replace(/[/?#].*$/, '');
  const fmtPhone = (raw) => {
    const d = String(raw || '').replace(/\D/g, '').replace(/^55(?=\d{10,11}$)/, '');
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return '';
  };

  const cssUrl = (p) => `url("${String(p).replace(/"/g, '%22')}")`;

  /* ---------- Configurações gerais ---------- */
  function applyConfig(cfg) {
    $$('[data-logo]').forEach((img) => {
      if (cfg.logo) img.src = cfg.logo;
      img.alt = cfg.nome || 'Logo';
    });
    if (cfg.favicon) {
      let l = $('link[rel~="icon"]');
      if (!l) { l = el('link', { rel: 'icon' }); document.head.append(l); }
      l.href = cfg.favicon;
    }
    $$('[data-bind]').forEach((n) => {
      const v = cfg[n.dataset.bind];
      if (v) n.textContent = v;
    });

    if (waNumber(cfg)) {
      $$('[data-wa]').forEach((a) => { a.href = waLink(cfg, a.dataset.wa); });
    }
    const phone = fmtPhone(cfg.whatsapp);
    if (phone) $$('[data-wa-display]').forEach((n) => { n.textContent = phone; });

    const ig = igHandle(cfg.instagram);
    if (ig) {
      $$('[data-ig]').forEach((a) => { a.href = `https://instagram.com/${ig}`; });
      $$('[data-ig-display]').forEach((n) => { n.textContent = '@' + ig; });
    }
    if (cfg.email) {
      $$('[data-email]').forEach((a) => { a.href = 'mailto:' + cfg.email; a.textContent = cfg.email; a.hidden = false; });
    }

    const hero = $('.hero');
    if (hero) {
      if (cfg.hero_imagem) hero.style.setProperty('--bg-img', cssUrl(cfg.hero_imagem));
      if (cfg.hero_escurecer != null) hero.style.setProperty('--overlay', Number(cfg.hero_escurecer) / 100);
    }
    const y = $('#year');
    if (y) y.textContent = new Date().getFullYear();
  }

  /* ---------- Menu no celular ---------- */
  function setupNav() {
    const btn = $('.nav-toggle');
    const nav = $('#nav');
    if (btn && nav) {
      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(open));
      });
      nav.addEventListener('click', (e) => {
        if (e.target.closest('a')) { nav.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); }
      });
    }
    const page = document.body.dataset.page;
    if (page) {
      const a = $(`.nav a[href="${page}.html"]`);
      if (a) a.setAttribute('aria-current', 'page');
    }
  }

  /* ---------- Janela de detalhes ---------- */
  const dlg = el('dialog', { class: 'modal', 'aria-label': 'Detalhes' });
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });

  function openModal({ kicker, title, text, images = [], list = [], actions = [] }) {
    const imgs = images.filter(Boolean);
    const parts = [];

    if (imgs.length) {
      const main = el('div', { class: 'main' }, el('img', { src: imgs[0], alt: title || '' }));
      const gallery = el('div', { class: 'modal-gallery' }, main);
      if (imgs.length > 1) {
        const thumbs = el('div', { class: 'thumbs' });
        imgs.forEach((src, i) => {
          const b = el('button', {
            type: 'button', 'aria-label': `Imagem ${i + 1}`, 'aria-current': String(i === 0),
            onclick: () => {
              main.firstChild.src = src;
              $$('button', thumbs).forEach((x) => x.setAttribute('aria-current', 'false'));
              b.setAttribute('aria-current', 'true');
            },
          }, el('img', { src, alt: '' }));
          thumbs.append(b);
        });
        gallery.append(thumbs);
      }
      parts.push(gallery);
    }

    const body = el('div', { class: 'modal-body' },
      kicker && el('p', { class: 'eyebrow', text: kicker }),
      el('h2', { text: title || '' }),
      text && el('p', { text }),
      list.length ? el('ul', {}, list.map((t) => el('li', { text: t }))) : null,
      actions.length ? el('div', { class: 'modal-actions' }, actions) : null,
    );
    parts.push(body);

    dlg.replaceChildren(
      el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Fechar', onclick: () => dlg.close(), text: '×' }),
      el('div', { class: 'modal-grid' }, parts),
    );
    if (!imgs.length) $('.modal-grid', dlg).style.gridTemplateColumns = '1fr';
    if (!dlg.isConnected) document.body.append(dlg);
    dlg.showModal();
  }

  const makeClickable = (node, fn) => {
    node.classList.add('clickable');
    node.setAttribute('tabindex', '0');
    node.setAttribute('role', 'button');
    node.addEventListener('click', fn);
    node.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fn(); }
    });
    return node;
  };

  const waButton = (cfg, label, msg, cls = 'btn btn-primary btn-sm') =>
    el('a', { class: cls, href: waLink(cfg, msg), target: '_blank', rel: 'noopener' }, svgIcon(ICON_WA, { fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }), label);

  const img = (src, alt) => el('img', { src, alt: alt || '', loading: 'lazy' });

  /* ---------- Vídeo ---------- */
  function videoSource(url) {
    if (!url) return null;
    let m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (m) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}?autoplay=1&rel=0` };
    m = url.match(/drive\.google\.com\/file\/d\/([\w-]+)/);
    if (m) return { kind: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };
    m = url.match(/vimeo\.com\/(\d+)/);
    if (m) return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}?autoplay=1` };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(url)) return { kind: 'video', src: url };
    return { kind: 'link', src: url };
  }

  function mountVideo(box, source) {
    if (source.kind === 'link') { window.open(source.src, '_blank', 'noopener'); return; }
    const player = source.kind === 'iframe'
      ? el('iframe', { src: source.src, allow: 'autoplay; encrypted-media; picture-in-picture; fullscreen', allowfullscreen: true, title: 'Vídeo' })
      : el('video', { src: source.src, controls: true, autoplay: true, playsinline: true });
    box.replaceChildren(player);
  }

  /* ---------- Renderizadores de cada portfólio ---------- */
  const renderers = {
    clientes(items, grid, cfg) {
      items.forEach((c) => {
        const handle = igHandle(c.instagram);
        const open = () => openModal({
          kicker: c.segmento,
          title: c.nome,
          text: c.descricao || c.resumo,
          images: [c.imagem, ...(c.galeria || [])],
          list: c.destaques || [],
          actions: [
            handle && el('a', { class: 'btn btn-ghost btn-sm', href: `https://instagram.com/${handle}`, target: '_blank', rel: 'noopener' }, svgIcon(ICON_IG, { fill: 'none', stroke: 'currentColor', 'stroke-width': 2 }), '@' + handle),
          ],
        });
        grid.append(makeClickable(el('article', { class: 'card', 'aria-label': c.nome },
          el('div', { class: 'card-media' }, c.imagem && img(c.imagem, c.nome)),
          el('div', { class: 'card-body' },
            el('h3', { class: 'card-title', text: c.nome }),
            c.segmento && el('p', { class: 'card-sub', text: c.segmento }),
            c.resumo && el('p', { class: 'card-text', text: c.resumo }),
            handle && el('p', { class: 'card-text', text: '@' + handle }),
          ),
        ), open));
      });
    },

    videos(items, grid) {
      grid.classList.add('grid-video');
      items.forEach((v) => {
        const vertical = v.formato === '9:16';
        const source = videoSource(v.video_arquivo || v.video_url);
        const box = el('div', { class: 'video-media' + (vertical ? ' is-vertical' : '') });
        if (v.capa) box.append(img(v.capa, v.titulo));
        if (source) {
          box.append(el('button', {
            class: 'play', type: 'button', 'aria-label': `Assistir ${v.titulo || 'vídeo'}`,
            onclick: () => mountVideo(box, source),
          }, svgIcon(ICON_PLAY)));
        } else {
          box.append(el('span', { class: 'soon', text: 'Vídeo em breve' }));
        }
        grid.append(el('article', { class: 'card' }, box,
          el('div', { class: 'card-body' },
            el('h3', { class: 'card-title', text: v.titulo || 'Vídeo' }),
            v.descricao && el('p', { class: 'card-text', text: v.descricao }),
          )));
      });
    },

    produtos(items, grid, cfg) {
      items.forEach((p) => {
        const msg = `Olá! Tenho interesse em: ${p.nome}. Pode me passar mais informações?`;
        const open = () => openModal({
          kicker: p.preco || 'Comunicação visual',
          title: p.nome,
          text: [p.descricao, p.detalhes].filter(Boolean).join('\n\n'),
          images: [p.imagem, ...(p.galeria || [])],
          actions: [waButton(cfg, 'Pedir orçamento', msg)],
        });
        grid.append(makeClickable(el('article', { class: 'card', 'aria-label': p.nome },
          el('div', { class: 'card-media' }, p.imagem && img(p.imagem, p.nome)),
          el('div', { class: 'card-body' },
            el('h3', { class: 'card-title', text: p.nome }),
            p.descricao && el('p', { class: 'card-text', text: p.descricao }),
            p.preco && el('p', { class: 'card-price', text: p.preco }),
            el('div', { class: 'card-actions' }, el('span', { class: 'card-sub', text: 'Ver detalhes →' })),
          ),
        ), open));
      });
    },

    trabalhos(items, grid, cfg) {
      const cats = [...new Set(items.map((t) => t.categoria).filter(Boolean))];
      const filters = $('#filters');
      let current = 'Todos';

      const draw = () => {
        grid.replaceChildren();
        items.filter((t) => current === 'Todos' || t.categoria === current).forEach((t) => {
          const open = () => openModal({
            kicker: t.categoria,
            title: t.titulo,
            text: t.descricao,
            images: [t.imagem, ...(t.galeria || [])],
            actions: [waButton(cfg, 'Quero um trabalho assim', `Olá! Vi o trabalho "${t.titulo}" no site e quero algo parecido.`)],
          });
          grid.append(makeClickable(el('article', { class: 'card card-work', 'aria-label': t.titulo },
            el('div', { class: 'card-media' },
              t.imagem && img(t.imagem, t.titulo),
              el('div', { class: 'overlay' }, el('strong', { text: t.titulo }), t.categoria && el('span', { text: t.categoria })),
            ),
          ), open));
        });
        if (!grid.children.length) grid.append(el('p', { class: 'empty', text: 'Nenhum trabalho nesta categoria ainda.' }));
        animate(grid);
      };

      if (filters && cats.length > 1) {
        ['Todos', ...cats].forEach((c) => {
          const b = el('button', {
            class: 'chip', type: 'button', 'aria-pressed': String(c === current), text: c,
            onclick: () => {
              current = c;
              $$('.chip', filters).forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
              draw();
            },
          });
          filters.append(b);
        });
      }
      draw();
    },
  };

  const PAGES = {
    clientes: { file: 'content/clientes.json', url: 'clientes.html' },
    videos: { file: 'content/videos.json', url: 'videos.html' },
    produtos: { file: 'content/produtos.json', url: 'produtos.html' },
    trabalhos: { file: 'content/trabalhos.json', url: 'trabalhos.html' },
  };

  async function renderPortfolioPage(key, cfg) {
    const data = (await getJSON(PAGES[key].file)) || {};
    const hero = $('.page-hero');
    if (hero) {
      if (data.banner) hero.style.setProperty('--bg-img', cssUrl(data.banner));
      if (data.banner_escurecer != null) hero.style.setProperty('--overlay', Number(data.banner_escurecer) / 100);
    }
    if (data.titulo) { const h = $('#pf-title'); if (h) h.textContent = data.titulo; }
    if (data.descricao) { const p = $('#pf-desc'); if (p) p.textContent = data.descricao; }

    const grid = $('#pf-grid');
    const items = Array.isArray(data.itens) ? data.itens : [];
    if (!items.length) {
      grid.append(el('p', { class: 'empty', text: 'Em breve novidades por aqui.' }));
      return;
    }
    renderers[key](items, grid, cfg);
    animate(grid);
  }

  /* ---------- Página inicial ---------- */
  async function renderHome(cfg) {
    const services = $('#servicos-grid');
    if (services && Array.isArray(cfg.servicos)) {
      services.replaceChildren(...cfg.servicos.map((s) => el('article', { class: 'service' },
        el('div', { class: 'icon', 'aria-hidden': 'true', text: s.icone || '✦' }),
        el('h3', { text: s.titulo }),
        s.descricao && el('p', { text: s.descricao }),
      )));
    }

    const wrap = $('#portfolio-cards');
    if (!wrap) return;
    const entries = await Promise.all(Object.entries(PAGES).map(async ([key, p]) => [key, p, await getJSON(p.file)]));
    wrap.replaceChildren(...entries.filter(([, , d]) => d).map(([key, p, d]) => {
      const n = (d.itens || []).length;
      const a = el('a', { class: 'pf-card', href: p.url },
        el('div', { class: 'pf-card-body' },
          el('span', { class: 'count', text: n === 1 ? '1 item' : `${n} itens` }),
          el('h3', { text: d.titulo || key }),
          d.descricao && el('p', { text: d.descricao }),
          el('span', { class: 'go', text: 'Ver portfólio →' }),
        ));
      if (d.banner) a.style.setProperty('--bg-img', cssUrl(d.banner));
      return a;
    }));
    animate(wrap);
  }

  /* ---------- Animação de entrada ---------- */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.08 })
    : null;

  function animate(root) {
    if (!io) return;
    [...root.children].forEach((c, i) => {
      c.classList.add('reveal');
      c.style.transitionDelay = `${Math.min(i, 8) * 60}ms`;
      io.observe(c);
    });
  }

  /* ---------- Início ---------- */
  (async () => {
    setupNav();
    const cfg = (await getJSON('content/config.json')) || {};
    applyConfig(cfg);
    const key = document.body.dataset.portfolio;
    if (key && PAGES[key]) await renderPortfolioPage(key, cfg);
    if (document.body.dataset.page === 'index') await renderHome(cfg);
    const sv = $('#servicos-grid');
    if (sv) animate(sv);
  })();
})();
