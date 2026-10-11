(function () {
  'use strict';

  document.documentElement.classList.add('js-enabled');

  var CONFIG = {
    whatsappNumber: '555499967506',
    openHour: 9,
    closeHour: 21,
    slotStepMinutes: 30,
    lastStartHour: 20,
    lastStartMinute: 30
  };

  var DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  var MONTHS = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];

  var state = {
    isFull: false,
    toastTimer: null
  };

  var dom = {};

  function cacheDom() {
    dom.header = document.getElementById('siteHeader');
    dom.navToggle = document.getElementById('navToggle');
    dom.navMenu = document.getElementById('navMenu');
    dom.navOverlay = document.getElementById('navOverlay');
    dom.navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav__link'));
    dom.sections = ['inicio', 'catalogo', 'horarios', 'agendamento'].map(function (id) {
      return document.getElementById(id);
    });
    dom.reveals = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
    dom.cards = Array.prototype.slice.call(document.querySelectorAll('.card'));
    dom.cardsEmpty = document.getElementById('cardsEmpty');
    dom.filters = Array.prototype.slice.call(document.querySelectorAll('.filter'));
    dom.statusBadge = document.getElementById('statusBadge');
    dom.statusMessage = document.getElementById('statusMessage');
    dom.clockTime = document.getElementById('clockTime');
    dom.clockDate = document.getElementById('clockDate');
    dom.barberStatusText = document.getElementById('barberStatusText');
    dom.barberToggle = document.getElementById('barberToggle');
    dom.hoursItems = Array.prototype.slice.call(document.querySelectorAll('.hours-list__item'));
    dom.form = document.getElementById('bookingForm');
    dom.name = document.getElementById('clientName');
    dom.service = document.getElementById('clientService');
    dom.date = document.getElementById('clientDate');
    dom.time = document.getElementById('clientTime');
    dom.notes = document.getElementById('clientNotes');
    dom.toTop = document.getElementById('toTop');
    dom.toast = document.getElementById('toast');
    dom.toastText = document.getElementById('toastText');
    dom.year = document.getElementById('year');
  }

  function pad(value) {
    return value < 10 ? '0' + value : String(value);
  }

  function toIsoDate(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }

  function fromIsoDate(value) {
    var parts = value.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function scrollToTarget(target, extraOffset) {
    var offset = (dom.header ? dom.header.offsetHeight : 70) + (extraOffset || 12);
    var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  }

  function showToast(message, isError) {
    if (!dom.toast) return;
    dom.toastText.textContent = message;
    dom.toast.classList.toggle('is-error', Boolean(isError));
    dom.toast.hidden = false;
    window.requestAnimationFrame(function () {
      dom.toast.classList.add('is-visible');
    });
    window.clearTimeout(state.toastTimer);
    state.toastTimer = window.setTimeout(function () {
      dom.toast.classList.remove('is-visible');
      window.setTimeout(function () {
        dom.toast.hidden = true;
      }, 450);
    }, 3800);
  }

  function setMenu(open) {
    dom.navMenu.classList.toggle('is-open', open);
    dom.navToggle.classList.toggle('is-open', open);
    dom.navToggle.setAttribute('aria-expanded', String(open));
    dom.navToggle.setAttribute('aria-label', open ? 'Fechar menu de navegação' : 'Abrir menu de navegação');
    document.body.classList.toggle('is-locked', open);

    if (dom.navOverlay) {
      if (open) {
        dom.navOverlay.hidden = false;
        window.requestAnimationFrame(function () {
          dom.navOverlay.classList.add('is-visible');
        });
      } else {
        dom.navOverlay.classList.remove('is-visible');
        window.setTimeout(function () {
          dom.navOverlay.hidden = true;
        }, 350);
      }
    }
  }

  function isMenuOpen() {
    return dom.navMenu.classList.contains('is-open');
  }

  function initMobileMenu() {
    dom.navToggle.addEventListener('click', function () {
      setMenu(!isMenuOpen());
    });

    if (dom.navOverlay) {
      dom.navOverlay.addEventListener('click', function () {
        setMenu(false);
      });
    }

    dom.navMenu.addEventListener('click', function (event) {
      if (event.target.closest('a')) {
        setMenu(false);
      }
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && isMenuOpen()) {
        setMenu(false);
        dom.navToggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960 && isMenuOpen()) {
        setMenu(false);
      }
    });
  }

  function initSmoothAnchors() {
    document.addEventListener('click', function (event) {
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;

      var hash = link.getAttribute('href');
      if (!hash || hash === '#') return;

      var target = document.querySelector(hash);
      if (!target) return;

      event.preventDefault();
      setMenu(false);
      scrollToTarget(target, hash === '#agendamento' ? 18 : 12);
      history.replaceState(null, '', hash);
    });
  }

  function initHeaderState() {
    function update() {
      var scrolled = window.pageYOffset > 24;
      dom.header.classList.toggle('is-scrolled', scrolled);
      dom.toTop.classList.toggle('is-visible', window.pageYOffset > 520);
      dom.toTop.hidden = window.pageYOffset <= 520;

      var currentId = 'inicio';
      var probe = window.pageYOffset + (dom.header.offsetHeight || 70) + 90;
      dom.sections.forEach(function (section) {
        if (section && section.offsetTop <= probe) {
          currentId = section.id;
        }
      });

      dom.navLinks.forEach(function (link) {
        link.classList.toggle('is-active', link.getAttribute('href') === '#' + currentId);
      });
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  function initRevealAnimations() {
    var groups = document.querySelectorAll('.hero__stats, .filters, .cards, .schedule, .booking, .booking__side');

    Array.prototype.forEach.call(groups, function (group) {
      var items = Array.prototype.filter.call(group.children, function (child) {
        return child.classList && child.classList.contains('reveal');
      });
      items.forEach(function (item, index) {
        item.style.transitionDelay = Math.min(index * 90, 540) + 'ms';
      });
    });

    if (!('IntersectionObserver' in window)) {
      dom.reveals.forEach(function (element) {
        element.classList.add('is-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -70px 0px' }
    );

    dom.reveals.forEach(function (element) {
      observer.observe(element);
    });
  }

  function initFilters() {
    dom.filters.forEach(function (button) {
      button.addEventListener('click', function () {
        var category = button.getAttribute('data-filter');

        dom.filters.forEach(function (item) {
          item.classList.toggle('is-active', item === button);
        });

        var visible = 0;
        dom.cards.forEach(function (card) {
          var show = category === 'todos' || card.getAttribute('data-category') === category;
          card.classList.toggle('is-hidden', !show);
          if (show) {
            visible += 1;
            card.classList.add('is-visible');
          }
        });

        dom.cardsEmpty.hidden = visible > 0;
      });
    });
  }

  function getScheduleState(now) {
    var day = now.getDay();
    var decimalHour = now.getHours() + now.getMinutes() / 60;
    var withinTime = decimalHour >= CONFIG.openHour && decimalHour < CONFIG.closeHour;

    if (day === 0) {
      return { open: false, reason: 'domingo' };
    }

    if (!withinTime) {
      return { open: false, reason: decimalHour < CONFIG.openHour ? 'antes' : 'depois' };
    }

    return { open: true, reason: 'ok' };
  }

  function closingMessage(reason) {
    if (reason === 'domingo') {
      return 'Fechada - Domingo n&atilde;o abrimos. Abrimos segunda-feira &agrave;s 09:00';
    }

    if (reason === 'antes') {
      return 'Fechada - Abrimos hoje &agrave;s 09:00';
    }

    return 'Fechada - Abrimos amanh&atilde; &agrave;s 09:00';
  }

  function renderSchedule(now) {
    var schedule = getScheduleState(now);
    var openText = 'Aberta - Agende seu hor&aacute;rio';
    var closedText = closingMessage(schedule.reason);
    var badgeText = schedule.open ? openText : closedText;
    var statusKey = schedule.open ? 'open' : 'closed';

    if (dom.statusBadge.getAttribute('data-state') !== statusKey || dom.statusBadge.dataset.label !== badgeText) {
      dom.statusBadge.setAttribute('data-state', statusKey);
      dom.statusBadge.dataset.label = badgeText;
      dom.statusBadge.querySelector('.status-badge__text').innerHTML = badgeText;
    }

    dom.clockTime.textContent = pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds());
    dom.clockDate.textContent = DAYS[now.getDay()] + ', ' + now.getDate() + ' de ' + MONTHS[now.getMonth()] + ' de ' + now.getFullYear();

    dom.hoursItems.forEach(function (item) {
      item.classList.toggle('is-today', Number(item.getAttribute('data-day')) === now.getDay());
    });

    renderStatusMessage(schedule, now);
    refreshTimeOptions();
  }

  function renderStatusMessage(schedule, now) {
    var box = dom.statusMessage;
    var icon = box.querySelector('i');
    var text = box.querySelector('p');
    box.classList.remove('is-warning', 'is-success', 'is-full');

    var message;
    var iconClass = 'fa-solid fa-circle-info';

    if (!schedule.open) {
      var reason = schedule.reason;
      if (reason === 'domingo') {
        message = 'Hoje não abrimos. Você já pode garantir seu horário para a próxima abertura: segunda-feira a partir das 09:00.';
      } else if (reason === 'antes') {
        message = 'Ainda não abrimos hoje. Abrimos às 09:00 — volte um pouco mais tarde ou já reserve seu horário.';
      } else {
        message = 'Fechamos às 21:00. Amanhã você encontra a agenda aberta a partir das 09:00.';
      }
      iconClass = 'fa-solid fa-moon';
      box.classList.add('is-warning');
    } else if (state.isFull) {
      message = 'Agenda de hoje completa. Ainda dá para tentar um encaixe pelo WhatsApp — vale a pena chamar.';
      iconClass = 'fa-solid fa-user-slash';
      box.classList.add('is-full');
    } else {
      var closingIn = Math.round((CONFIG.closeHour - now.getHours() - now.getMinutes() / 60) * 60);
      if (closingIn <= 60 && closingIn > 0) {
        message = 'Estamos abertos e ainda falta pouco para o fechamento às 21:00. Garanta seu horário!';
        iconClass = 'fa-solid fa-stopwatch';
      } else {
        message = 'Estamos abertos e com vagas disponíveis. Escolha o serviço e garanta seu horário.';
        iconClass = 'fa-solid fa-door-open';
      }
      box.classList.add('is-success');
    }

    icon.className = iconClass;
    text.innerHTML = message;
  }

  function renderBarberStatus() {
    var available = !state.isFull;
    dom.barberToggle.setAttribute('aria-checked', String(available));
    dom.barberStatusText.classList.toggle('is-lotado', !available);

    if (available) {
      dom.barberStatusText.innerHTML = 'Status atual: <strong>&#129;</strong> Vagas Dispon&iacute;veis';
      dom.barberToggle.querySelector('.toggle__label').textContent = 'Marcar como lotado';
    } else {
      dom.barberStatusText.innerHTML = 'Status atual: <strong>&#128308;</strong> Lotado por hoje';
      dom.barberToggle.querySelector('.toggle__label').textContent = 'Liberar vagas';
    }

    dom.time.disabled = !available;
    if (!available) {
      dom.time.value = '';
    }
  }

  function initSchedule() {
    dom.barberToggle.addEventListener('click', function () {
      state.isFull = !state.isFull;
      renderBarberStatus();
      renderStatusMessage(getScheduleState(new Date()), new Date());
      showToast(
        state.isFull
          ? 'Agenda marcada como lotada para hoje.'
          : 'Vagas liberadas na agenda de hoje.',
        false
      );
    });

    renderBarberStatus();

    function tick() {
      renderSchedule(new Date());
    }

    tick();
    window.setInterval(tick, 1000);
  }

  function populateServices() {
    dom.cards.forEach(function (card) {
      var service = card.getAttribute('data-service');
      var price = card.getAttribute('data-price');
      var option = document.createElement('option');
      option.value = service;
      option.textContent = service + ' — ' + price;
      dom.service.appendChild(option);
    });
  }

  function buildTimeSlots() {
    var fragment = document.createDocumentFragment();
    var start = CONFIG.openHour * 60;
    var end = CONFIG.lastStartHour * 60 + CONFIG.lastStartMinute;

    for (var minutes = start; minutes <= end; minutes += CONFIG.slotStepMinutes) {
      var hour = Math.floor(minutes / 60);
      var minute = minutes % 60;
      var option = document.createElement('option');
      option.value = pad(hour) + ':' + pad(minute);
      option.textContent = option.value;
      fragment.appendChild(option);
    }

    dom.time.appendChild(fragment);
  }

  function isSunday(date) {
    return date.getDay() === 0;
  }

  function isSlotInPast(dateValue, timeValue) {
    if (!dateValue || !timeValue) return false;
    var parts = timeValue.split(':');
    var slot = fromIsoDate(dateValue);
    slot.setHours(Number(parts[0]), Number(parts[1]), 0, 0);
    return slot.getTime() < Date.now();
  }

  function initDateBounds() {
    var today = new Date();
    dom.date.min = toIsoDate(today);

    var limit = new Date(today.getTime());
    limit.setDate(limit.getDate() + 60);
    dom.date.max = toIsoDate(limit);

    var suggested = new Date(today.getTime());
    while (isSunday(suggested)) {
      suggested.setDate(suggested.getDate() + 1);
    }
    dom.date.value = toIsoDate(suggested);
  }

  function refreshTimeOptions() {
    var selected = dom.time.value;
    var options = Array.prototype.slice.call(dom.time.options);
    var blocking = false;

    options.forEach(function (option) {
      if (option.value === '') return;
      var past = isSlotInPast(dom.date.value, option.value);
      if (past) {
        option.disabled = true;
        option.textContent = option.value + ' (já passou)';
      } else {
        option.disabled = false;
        option.textContent = option.value;
        if (!blocking) {
          blocking = true;
          option.textContent = option.value + ' (primeira vaga)';
        }
      }
    });

    if (selected && !dom.time.options[dom.time.selectedIndex].disabled) {
      dom.time.value = selected;
      var active = dom.time.options[dom.time.selectedIndex];
      if (active && active.textContent.indexOf('primeira vaga') === -1) {
        active.textContent = active.value;
      }
    } else {
      dom.time.value = '';
    }
  }

  function setError(field, message) {
    var wrapper = field.closest('.field');
    var target = wrapper ? wrapper.querySelector('.field__error') : null;
    field.classList.toggle('is-invalid', Boolean(message));
    if (target) {
      target.textContent = message || '';
      target.classList.toggle('is-visible', Boolean(message));
    }
  }

  function clearErrors() {
    [dom.name, dom.service, dom.date, dom.time].forEach(function (field) {
      setError(field, '');
    });
  }

  function validate() {
    var errors = 0;
    var name = dom.name.value.trim();

    if (name.length < 3) {
      setError(dom.name, 'Informe seu nome completo (mínimo 3 letras).');
      errors += 1;
    } else {
      setError(dom.name, '');
    }

    if (!dom.service.value) {
      setError(dom.service, 'Escolha um serviço do catálogo.');
      errors += 1;
    } else {
      setError(dom.service, '');
    }

    if (!dom.date.value) {
      setError(dom.date, 'Escolha o dia do seu horário.');
      errors += 1;
    } else {
      var chosen = fromIsoDate(dom.date.value);
      if (isSunday(chosen)) {
        setError(dom.date, 'Não abrimos aos domingos. Escolha de segunda a sábado.');
        errors += 1;
      } else if (chosen.getTime() < new Date().setHours(0, 0, 0, 0)) {
        setError(dom.date, 'Essa data já passou. Escolha um dia futuro.');
        errors += 1;
      } else {
        setError(dom.date, '');
      }
    }

    if (state.isFull) {
      setError(dom.time, 'Agenda lotada para hoje. Contate o Dairon para tentar um encaixe.');
      errors += 1;
    } else if (!dom.time.value) {
      setError(dom.time, 'Escolha um horário entre 09:00 e 21:00.');
      errors += 1;
    } else if (isSlotInPast(dom.date.value, dom.time.value)) {
      setError(dom.time, 'Esse horário já passou. Escolha outro.');
      errors += 1;
    } else {
      setError(dom.time, '');
    }

    return errors;
  }

  function formatBookingDate(dateValue) {
    var date = fromIsoDate(dateValue);
    return pad(date.getDate()) + '/' + pad(date.getMonth() + 1) + '/' + date.getFullYear();
  }

  function buildMessage() {
    var price = 'consulte';
    dom.cards.forEach(function (card) {
      if (card.getAttribute('data-service') === dom.service.value) {
        price = card.getAttribute('data-price');
      }
    });

    var lines = [
      'Olá, Dairon! Tudo bem? Quero agendar um horário na Barbearía Dairon.',
      '',
      'Nome: ' + dom.name.value.trim(),
      'Serviço: ' + dom.service.value + ' (' + price + ')'
    ];

    if (dom.time.value) {
      lines.push('Dia: ' + formatBookingDate(dom.date.value) + ' (' + DAYS[fromIsoDate(dom.date.value).getDay()] + ')');
      lines.push('Horário: ' + dom.time.value);
    } else {
      lines.push('Dia: ' + formatBookingDate(dom.date.value) + ' (' + DAYS[fromIsoDate(dom.date.value).getDay()] + ')');
      lines.push('Horário: a combinar');
    }

    var notes = dom.notes.value.trim();
    if (notes) {
      lines.push('Observação: ' + notes);
    }

    lines.push('');
    lines.push('Pode me confirmar esse horário? Obrigado!');

    return lines.join('\n');
  }

  function initBooking() {
    dom.service.addEventListener('change', function () {
      if (dom.service.value) setError(dom.service, '');
    });

    dom.date.addEventListener('change', function () {
      if (!dom.date.value) return;
      var chosen = fromIsoDate(dom.date.value);

      if (isSunday(chosen)) {
        setError(dom.date, 'Não abrimos aos domingos. Escolha de segunda a sábado.');
      } else {
        setError(dom.date, '');
      }

      refreshTimeOptions();
    });

    dom.time.addEventListener('change', function () {
      if (dom.time.value) setError(dom.time, '');
    });

    dom.name.addEventListener('blur', function () {
      if (dom.name.value.trim().length && dom.name.value.trim().length >= 3) {
        setError(dom.name, '');
      }
    });

    dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      clearErrors();

      if (validate() > 0) {
        showToast('Confira os campos destacados antes de enviar.', true);
        var firstInvalid = dom.form.querySelector('.is-invalid');
        if (firstInvalid) firstInvalid.focus();
        return;
      }

      var url = 'https://wa.me/' + CONFIG.whatsappNumber + '?text=' + encodeURIComponent(buildMessage());
      showToast('Abrindo o WhatsApp com sua mensagem pronta...', false);
      window.open(url, '_blank', 'noopener');
    });
  }

  function initServiceButtons() {
    dom.cards.forEach(function (card) {
      var button = card.querySelector('[data-service-btn]');
      if (!button) return;

      button.addEventListener('click', function () {
        dom.service.value = card.getAttribute('data-service');
        setError(dom.service, '');

        var booking = document.getElementById('agendamento');
        scrollToTarget(booking, 18);

        dom.form.classList.add('is-flash');
        window.setTimeout(function () {
          dom.form.classList.remove('is-flash');
        }, 1400);

        showToast('Serviço "' + dom.service.value + '" selecionado. Escolha o dia e o horário.', false);
      });
    });
  }

  function initToTop() {
    dom.toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initFloatingWhatsApp() {
    var button = document.getElementById('floatWa');
    if (!button) return;

    button.addEventListener('click', function () {
      showToast('Abrindo o WhatsApp da barbearia...', false);
    });
  }

  function initImageFallback() {
    var images = Array.prototype.slice.call(document.querySelectorAll('img'));

    function escapeXml(value) {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function buildPlaceholder(label) {
      var svg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500">' +
        '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">' +
        '<stop offset="0" stop-color="#262626"/><stop offset="1" stop-color="#121212"/>' +
        '</linearGradient></defs>' +
        '<rect width="800" height="500" fill="url(#bg)"/>' +
        '<g fill="none" stroke="#d4af37" stroke-width="6" opacity="0.9">' +
        '<circle cx="330" cy="230" r="26"/><circle cx="470" cy="230" r="26"/>' +
        '<path d="M330 256 L470 330 M470 256 L330 330"/></g>' +
        '<text x="400" y="400" font-family="Arial, Helvetica, sans-serif" font-size="26" ' +
        'fill="#d4af37" text-anchor="middle">' + escapeXml(label) + '</text>' +
        '</svg>';

      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    images.forEach(function (img) {
      img.addEventListener(
        'error',
        function () {
          if (img.getAttribute('data-fallback') === 'on') return;
          img.setAttribute('data-fallback', 'on');

          var card = img.closest('.card');
          var label = card ? card.getAttribute('data-service') || 'Barbería Dairon' : 'Barbería Dairon';
          img.src = buildPlaceholder(label);
        },
        true
      );
    });
  }

  function initYear() {
    dom.year.textContent = String(new Date().getFullYear());
  }

  function init() {
    cacheDom();

    populateServices();
    buildTimeSlots();
    initDateBounds();

    initMobileMenu();
    initSmoothAnchors();
    initHeaderState();
    initRevealAnimations();
    initFilters();
    initSchedule();
    initBooking();
    initServiceButtons();
    initToTop();
    initFloatingWhatsApp();
    initImageFallback();
    initYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();