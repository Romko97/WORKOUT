'use strict';

function motionAllowed() {
  return !window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
}

function animateView() {
  if (!motionAllowed()) return;
  const view = document.getElementById('view');
  view?.animate?.([
    { opacity: 0, transform: 'translateY(8px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], { duration: 230, easing: 'cubic-bezier(.2,.7,.3,1)' });
}

function animateCompletedSet(setId) {
  if (!motionAllowed()) return;
  const row = document.getElementById('set-' + setId);
  row?.animate?.([
    { backgroundColor: '#d4efac', transform: 'scale(.99)' },
    { backgroundColor: '#edf6e4', transform: 'scale(1)' }
  ], { duration: 300, easing: 'ease-out' });
}
