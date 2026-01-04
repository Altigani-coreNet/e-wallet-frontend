import { useEffect } from 'react';

const TawkChat = () => {
  useEffect(() => {
    // Avoid injecting the script multiple times
    const existingScript = document.querySelector(
      'script[src^="https://embed.tawk.to/694a7ad1b87cca197b1f23b0"]'
    );
    if (existingScript) {
      return;
    }

    window.Tawk_API = window.Tawk_API || {};
    window.Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    const s0 = document.getElementsByTagName('script')[0];
    s1.async = true;
    s1.src = 'https://embed.tawk.to/694a7ad1b87cca197b1f23b0/1jd5evgsd';
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    s0.parentNode.insertBefore(s1, s0);

    // We usually keep the widget loaded, so no cleanup here.
  }, []);

  // Tawk.to renders its own widget, nothing to show in JSX.
  return null;
};

export default TawkChat;


