// src/utils/sw-registration.ts
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content detected');
    if (confirm('New content available, reload?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('Ready to work offline');
  },
  onRegistered(r) {
    console.log('SW Registered successfully:', r);
  },
  onRegisterError(error) {
    console.error('SW registration failed:', error);
  },
});

export { updateSW };
