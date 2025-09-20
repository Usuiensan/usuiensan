if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(reg => {
      console.log('SW registered:', reg);
      if (reg.waiting) {
        console.log('SW waiting - update available');
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New SW installed and waiting');
            // ここでUIを出して「更新があります」と知らせることができます
          }
        });
      });
    }).catch(err => {
      console.warn('SW registration failed:', err);
    });
  });
}
