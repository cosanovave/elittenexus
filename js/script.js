(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Reveal on scroll ---------- */
  const revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );
    revealEls.forEach((el) => observer.observe(el));
  }

  /* ---------- Contadores del hero ---------- */
  const animateCount = (el) => {
    const target = Number(el.getAttribute('data-count') || 0);
    if (!target) return;
    const duration = 1400;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  document.querySelectorAll('[data-count]').forEach((el) => {
    if (reduceMotion) {
      el.textContent = el.getAttribute('data-count');
    } else {
      animateCount(el);
    }
  });

  /* ---------- Navbar: modo oscuro sobre hero/cta ---------- */
  const nav = document.getElementById('siteNav');
  const darkSections = document.querySelectorAll('.hero, .section-dark, .cta-final');
  const updateNav = () => {
    const navBottom = nav.getBoundingClientRect().bottom;
    let onDark = false;
    darkSections.forEach((sec) => {
      const r = sec.getBoundingClientRect();
      if (r.top < navBottom && r.bottom > 0) onDark = true;
    });
    nav.classList.toggle('on-dark', onDark);
  };
  updateNav();
  window.addEventListener('scroll', updateNav, { passive: true });

  /* ---------- Parallax de fondos hero / cta ---------- */
  if (!reduceMotion) {
    const parallaxImgs = document.querySelectorAll('.hero-bg img, .cta-bg img');
    window.addEventListener(
      'scroll',
      () => {
        parallaxImgs.forEach((img) => {
          const rect = img.closest('section, header').getBoundingClientRect();
          const progress = rect.top / window.innerHeight;
          img.style.transform = `scale(1.06) translateY(${progress * -26}px)`;
        });
      },
      { passive: true }
    );
  }

  /* ---------- Tilt 3D suave siguiendo el cursor ---------- */
  if (!reduceMotion && window.matchMedia('(pointer: fine)').matches) {
    document.querySelectorAll('.tilt-target').forEach((el) => {
      const wrap = el.parentElement;
      wrap.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5;
        const y = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = `perspective(900px) rotateX(${-y * 6}deg) rotateY(${x * 8}deg)`;
      });
      wrap.addEventListener('mouseleave', () => {
        el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg)';
      });
    });
  }

  /* ---------- Malla interactiva: scroll + cursor ---------- */
  const canvas = document.getElementById('meshCanvas');
  const ctx = canvas.getContext('2d');
  let width, height, dpr;
  let nodes = [];

  const COLORS = ['#c4893a', '#1a7f78', '#10141c'];
  const mouse = { x: -9999, y: -9999, active: false };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(80, Math.floor((width * height) / 20000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    }));
  };

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  window.addEventListener('mouseleave', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });
  window.addEventListener(
    'touchmove',
    (e) => {
      if (e.touches.length) {
        mouse.x = e.touches[0].clientX;
        mouse.y = e.touches[0].clientY;
        mouse.active = true;
      }
    },
    { passive: true }
  );
  window.addEventListener('touchend', () => {
    mouse.active = false;
    mouse.x = -9999;
    mouse.y = -9999;
  });

  const MOUSE_RADIUS = 160;

  const step = () => {
    ctx.clearRect(0, 0, width, height);

    nodes.forEach((n) => {
      // Atracción sutil hacia el cursor dentro del radio
      if (mouse.active) {
        const dx = mouse.x - n.x;
        const dy = mouse.y - n.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_RADIUS && dist > 0.001) {
          const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 0.045;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }
      }

      // Fricción para que no se aceleren indefinidamente
      n.vx *= 0.985;
      n.vy *= 0.985;

      // Velocidad mínima de deriva
      if (Math.abs(n.vx) < 0.05) n.vx += (Math.random() - 0.5) * 0.02;
      if (Math.abs(n.vy) < 0.05) n.vy += (Math.random() - 0.5) * 0.02;

      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > width) n.vx *= -1;
      if (n.y < 0 || n.y > height) n.vy *= -1;
      n.x = Math.max(0, Math.min(width, n.x));
      n.y = Math.max(0, Math.min(height, n.y));
    });

    // Conexiones entre nodos
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 130) {
          ctx.strokeStyle = `rgba(16, 20, 28, ${0.1 * (1 - dist / 130)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Conexiones de los nodos cercanos al cursor
    if (mouse.active) {
      nodes.forEach((n) => {
        const dist = Math.hypot(mouse.x - n.x, mouse.y - n.y);
        if (dist < MOUSE_RADIUS) {
          ctx.strokeStyle = `rgba(196, 137, 58, ${0.35 * (1 - dist / MOUSE_RADIUS)})`;
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(mouse.x, mouse.y);
          ctx.lineTo(n.x, n.y);
          ctx.stroke();
        }
      });
    }

    // Nodos
    nodes.forEach((n) => {
      ctx.beginPath();
      ctx.fillStyle = n.color;
      ctx.globalAlpha = 0.55;
      ctx.arc(n.x, n.y, 1.9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    if (!reduceMotion) requestAnimationFrame(step);
  };

  resize();
  window.addEventListener('resize', resize);
  step();
})();

(() => {
  let activeModal = null;

  const openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    activeModal = modal;
  };

  const closeModal = (modal) => {
    if (!modal) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (activeModal === modal) activeModal = null;
  };

  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-modal-open');
      openModal(id);
      if (id === 'modal-notify') {
        const title = btn.getAttribute('data-article') || 'nuestro próximo artículo';
        const titleEl = document.getElementById('notifyArticleTitle');
        if (titleEl) {
          titleEl.textContent = `Artículo: "${title}"`;
          titleEl.dataset.article = title;
        }
      }
    });
  });

  document.querySelectorAll('[data-modal-close]').forEach((el) => {
    el.addEventListener('click', () => closeModal(el.closest('.legal-modal')));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && activeModal) closeModal(activeModal);
  });
})();

(() => {
  const STORAGE_KEY = 'elittenexus_cookie_consent';
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;

  const hasConsent = localStorage.getItem(STORAGE_KEY);
  if (!hasConsent) {
    banner.hidden = false;
  }

  const dismiss = (value) => {
    localStorage.setItem(STORAGE_KEY, value);
    banner.hidden = true;
  };

  document.getElementById('cookieAccept').addEventListener('click', () => dismiss('accepted'));
  document.getElementById('cookieDecline').addEventListener('click', () => dismiss('declined'));
})();

(() => {
  document.querySelectorAll('.faq-item').forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          openItem.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        }
      });
      item.classList.toggle('open', !isOpen);
      question.setAttribute('aria-expanded', String(!isOpen));
    });
  });
})();

(() => {
  const form = document.getElementById('notifyForm');
  if (!form) return;
  const note = document.getElementById('notifyFormNote');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = String(new FormData(form).get('email') || '').trim();
    if (!email) {
      note.textContent = 'Ingresa un email válido.';
      return;
    }
    const article = document.getElementById('notifyArticleTitle')?.dataset.article || 'el próximo artículo';
    const message = `Hola, quiero que me avisen cuando publiquen el artículo "${article}". Mi email es: ${email}`;
    window.open(`https://wa.me/573008587571?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    note.textContent = 'Te llevamos a WhatsApp para confirmar el aviso.';
    form.reset();
  });
})();

(() => {
  const toggle = document.getElementById('botToggle');
  const panel = document.getElementById('botPanel');
  const closeBtn = document.getElementById('botClose');
  const messagesEl = document.getElementById('botMessages');
  const repliesEl = document.getElementById('botQuickReplies');
  if (!toggle || !panel) return;

  const CATEGORIES = [
    {
      name: 'Producto y funcionamiento',
      questions: [
        { q: '¿Qué es Elitte Nexus?', a: 'El sistema operativo para estudios webcam: monitoreo con IA, nómina, analítica y control multi-estudio en una sola plataforma.' },
        { q: '¿Qué es Sentinel?', a: 'El módulo de monitoreo integral de Elitte Nexus. Va mucho más allá de la inactividad: audita en tiempo real la calidad técnica de la transmisión, el cumplimiento de las reglas de cada plataforma y el comportamiento de pago de las modelos.' },
        { q: '¿Sentinel solo detecta salas inactivas?', a: 'No. La inactividad es solo una de sus funciones. También detecta fallas técnicas, contenido prohibido en las conversaciones e intentos de cobro por fuera de la plataforma.' },
        { q: '¿Detecta problemas técnicos de transmisión?', a: 'Sí: fallas de velocidad de internet, problemas de audio, caídas o errores en la página de la plataforma, y pérdida de calidad en la transmisión — todo en tiempo real.' },
        { q: '¿Revisa lo que hablan las modelos con los usuarios?', a: 'Sí. Detecta palabras clave y temas de conversación prohibidos —por políticas del estudio o de cada plataforma— para evitar sanciones o baneos.' },
        { q: '¿Detecta cobros por fuera de la plataforma?', a: 'Sí, y es uno de sus controles más importantes: alerta cuando detecta que una modelo solicita dinero fuera de la plataforma, protegiendo los ingresos del estudio.' },
        { q: '¿Qué hace el módulo de Nómina y ciclos?', a: 'Automatiza la nómina: cálculo de pagos, TRM en vivo, reportes PDF con tu branding y trazabilidad completa.' },
        { q: '¿Qué incluye la Analítica en vivo?', a: 'Rankings, métricas y tendencias de toda tu red, actualizados al instante.' },
        { q: '¿Qué son las Operaciones centralizadas?', a: 'Roles y permisos para tu equipo, y control de múltiples estudios desde un solo panel.' },
        { q: '¿Cómo funciona la automatización por WhatsApp?', a: 'Elitte Nexus contacta mánagers y modelos por WhatsApp, y envía alertas automáticas cuando Sentinel detecta cualquier situación que requiera atención.' },
      ],
    },
    {
      name: 'Precios y planes',
      questions: [
        { q: '¿Cuánto cuesta Elitte Nexus?', a: 'Básico desde $60/mes (hasta 15 salas), Pro desde $80/mes (hasta 60 salas), Enterprise Plus desde $150/mes para redes multi-estudio.' },
        { q: '¿Diferencia entre el plan Básico y el Pro?', a: 'El Pro incluye monitoreo visual con Sentinel, WhatsApp IA, reportes con tu branding y soporte prioritario; el Básico cubre lo esencial de gestión y nómina.' },
        { q: '¿Tienen permanencia mínima o costo de instalación?', a: 'No. Sin cláusulas de permanencia y sin costos de instalación en ningún plan.' },
        { q: '¿Puedo cambiar de plan o cancelar después?', a: 'Sí, los planes se ajustan al tamaño real de tu operación sin letra pequeña.' },
        { q: '¿Cómo se comparan sus precios con el mercado?', a: 'Nuestro plan Básico compite directo con las alternativas más económicas, pero incluye monitoreo con IA y detección de fuga de ingresos que la mayoría no ofrece.' },
      ],
    },
    {
      name: 'Seguridad y datos',
      questions: [
        { q: '¿Qué tan seguros están los datos de mi estudio?', a: 'La seguridad opera en dos frentes: el de tu estudio y el del aplicativo. A nivel de estudio, la arquitectura es multi-tenant: nadie puede acceder sin sus propias credenciales, y ningún estudio puede ver documentos ni información de otro estudio dentro de la plataforma. A nivel de plataformas de streaming, Elitte Nexus nunca pide ni almacena tus contraseñas de StripChat, Chaturbate, BongaCams y demás sitios; no las necesita para operar. A nivel de infraestructura, detectamos IPs que intentan ingresar de forma no autorizada, con bloqueo automático, bloqueo por VPN, y protección respaldada por Firebase y Cloudflare — los mismos estándares que usan las plataformas más grandes del mundo, con seguridad basada en IA contra ataques DDoS, bots maliciosos y filtración de datos.' },
        { q: '¿Cómo protegen la privacidad de las modelos?', a: 'Sentinel opera con mapas de contornos seguros, sin necesidad de exponer contenido sensible.' },
        { q: '¿Cumplen con la protección de datos personales?', a: 'Sí, el tratamiento de datos sigue la Ley 1581 de 2012 (Habeas Data, Colombia).' },
      ],
    },
    {
      name: 'Implementación',
      questions: [
        { q: '¿Cuánto tarda la puesta en marcha?', a: 'El onboarding esencial (perfiles, documentos, conexión de salas) se completa en pocos días; Pro y Enterprise Plus incluyen acompañamiento dedicado.' },
        { q: '¿Se integra con las plataformas donde ya transmito?', a: 'Sí: StripChat, Chaturbate, BongaCams, CamSoda, Flirt4Free, MyFreeCams, Streamate, ePlay, Cams.com, CherryTV y ManyVids.' },
        { q: '¿Necesito instalar algo?', a: 'No, es una plataforma web, accesible desde el portal sin instalación local.' },
      ],
    },
    {
      name: 'Ventas y contacto',
      questions: [
        { q: '¿Cómo pido una demo?', a: 'Por WhatsApp al +57 300 858 7571 o por el formulario de la sección de contacto del sitio.' },
        { q: '¿Ya tengo cuenta, cómo entro?', a: 'Directo desde el botón "Entrar al portal" en la parte superior del sitio.' },
        { q: '¿Dónde están ubicados?', a: 'En Bogotá, Colombia, con expansión en curso a Latinoamérica.' },
      ],
    },
  ];

  const scrollToBottom = () => {
    const body = messagesEl.closest('.bot-body');
    if (body) body.scrollTop = body.scrollHeight;
  };

  const addMessage = (role, text) => {
    const bubble = document.createElement('div');
    bubble.className = `bot-msg bot-msg--${role}`;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    scrollToBottom();
    return bubble;
  };

  const scrollToMessage = (bubble) => {
    if (bubble) bubble.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  const setReplies = (options) => {
    repliesEl.innerHTML = '';
    options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = opt.ghost ? 'bot-quick-reply bot-quick-reply--ghost' : 'bot-quick-reply';
      btn.textContent = opt.label;
      btn.addEventListener('click', opt.onClick);
      repliesEl.appendChild(btn);
    });
    scrollToBottom();
  };

  const showCategories = (greet) => {
    if (greet) addMessage('bot', '¿Sobre qué más te gustaría saber?');
    setReplies(
      CATEGORIES.map((cat) => ({ label: cat.name, onClick: () => openCategory(cat) }))
    );
  };

  const openCategory = (cat) => {
    const questionBubble = addMessage('user', cat.name);
    addMessage('bot', `Estas son las preguntas frecuentes sobre ${cat.name.toLowerCase()}:`);
    setReplies([
      ...cat.questions.map((item) => ({ label: item.q, onClick: () => openQuestion(cat, item) })),
      { label: '← Volver a categorías', ghost: true, onClick: () => showCategories(false) },
    ]);
    scrollToMessage(questionBubble);
  };

  const openQuestion = (cat, item) => {
    const questionBubble = addMessage('user', item.q);
    addMessage('bot', item.a);
    setReplies([
      ...cat.questions.filter((q) => q !== item).map((q) => ({ label: q.q, onClick: () => openQuestion(cat, q) })),
      { label: '← Volver a categorías', ghost: true, onClick: () => showCategories(false) },
    ]);
    scrollToMessage(questionBubble);
  };

  let started = false;
  const startConversation = () => {
    if (started) return;
    started = true;
    addMessage('bot', 'Hola 👋 Soy Nexus IA, el asistente de Elitte Nexus. Elige un tema para ver las preguntas frecuentes:');
    showCategories(false);
  };

  const openPanel = () => {
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
    toggle.classList.add('is-active');
    toggle.setAttribute('aria-expanded', 'true');
    startConversation();
  };

  const closePanel = () => {
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    toggle.classList.remove('is-active');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    if (panel.classList.contains('is-open')) closePanel();
    else openPanel();
  });
  closeBtn.addEventListener('click', closePanel);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('is-open')) closePanel();
  });
})();
