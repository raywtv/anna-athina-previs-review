// Local review servers may not support byte-range video requests.
// A small, complete review-export Blob makes native seeking deterministic.
const film = document.querySelector('video');
const status = document.createElement('p');
status.setAttribute('role', 'status');
status.textContent = 'Preparing the review film…';
film.before(status);
fetch('review-sequence.mp4')
  .then(response => {
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.blob();
  })
  .then(blob => {
    film.src = URL.createObjectURL(blob);
    status.textContent = 'Film ready. Use the player controls to play or seek.';
  })
  .catch(() => {
    status.textContent = 'The review film could not be prepared. Reload to retry.';
  });
