
// Remove protocol and www from the URL in the address bar
const currentUrl = window.location.href;
const plainDomain = currentUrl.replace(/^https?:\/\/(www\.)?/, 'mdezazulhassanbiswas.gihub.io');
history.replaceState(null, null, plainDomain);