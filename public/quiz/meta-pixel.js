(() => {
  'use strict';

  // Same public Pixel ID as www.juncotattoo.com. Local and preview builds stay quiet.
  const pixelId = '1075539164267174';
  if (window.location.hostname !== 'quizjuncotattoo.vercel.app' || window.juncoQuizMetaInitialized) return;
  window.juncoQuizMetaInitialized = true;

  if (!window.fbq) {
    const fbq = window.fbq = function () {
      if (fbq.callMethod) fbq.callMethod.apply(fbq, arguments);
      else fbq.queue.push(arguments);
    };
    if (!window._fbq) window._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = '2.0';
    fbq.queue = [];
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://connect.facebook.net/en_US/fbevents.js';
    document.head.append(script);
  }

  // Collect only the explicit events below, never form fields or the WhatsApp text.
  window.fbq('set', 'autoConfig', false, pixelId);
  window.fbq('init', pixelId);
  window.fbq('trackSingle', pixelId, 'PageView');

  let contactTracked = false;
  document.addEventListener('click', event => {
    const link = event.target.closest?.('#whatsapp-link');
    if (!link || !link.getAttribute('href') || event.defaultPrevented || contactTracked) return;
    try {
      const destination = new URL(link.href);
      if (destination.hostname !== 'wa.me' || destination.pathname !== '/5547996615555') return;
      window.fbq('trackSingle', pixelId, 'Contact', {
        content_name: 'Clique no WhatsApp',
        content_category: 'tatuagem',
        cta_origem: 'quiz_resultado',
      });
      contactTracked = true;
    } catch {
      // Tracking must never stop the customer from opening WhatsApp.
    }
  });
})();
