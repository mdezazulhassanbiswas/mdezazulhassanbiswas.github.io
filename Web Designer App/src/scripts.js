// This file contains the JavaScript code for the webview application.

document.addEventListener("DOMContentLoaded", function() {
    const webview = document.getElementById('webview');
    
    // Load the specified URL in the webview
    webview.src = 'https://mdezazulhassanbiswas.github.io';

    // Function to apply the appropriate color scheme
    function applyColorScheme() {
        const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const body = document.body;

        if (prefersDarkScheme) {
            body.classList.add('dark-theme');
            body.classList.remove('light-theme');
        } else {
            body.classList.add('light-theme');
            body.classList.remove('dark-theme');
        }
    }

    // Initial color scheme application
    applyColorScheme();

    // Listen for changes in the color scheme
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener('change', applyColorScheme);
});