import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';
import { WALLEX_BRAND } from '@/constants/brand';

export default function Root({ children }: { children: ReactNode }) {
  const tawkScript = `
    var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
    (function(){
      var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
      s1.async=true;
      s1.src='https://embed.tawk.to/6a0c2ccfd76c0f1c34167874/1jovou3c6';
      s1.charset='UTF-8';
      s1.setAttribute('crossorigin','*');
      s0.parentNode.insertBefore(s1,s0);
    })();
  `;

  return (
    <html lang="en">
      <head>
        <ScrollViewStyleReset />
        <title>Wallex.online | Secure Crypto Wallet for Africa, Asia, Europe and the USA</title>
        <meta
          name="description"
          content="Wallex.online is a secure crypto wallet experience for RXP transfers, crypto portfolio tracking, KYC review, rewards, and card purchase workflows across Africa, Asia, Europe, and the USA."
        />
        <meta name="keywords" content="Wallex, wallex.online, crypto wallet, RXP, XRP, Africa crypto, Asia crypto, Europe crypto, USA crypto, KYC crypto wallet" />
        <meta property="og:title" content="Wallex.online Secure Crypto Wallet" />
        <meta property="og:description" content="Send, receive, buy, and manage RXP with a clean Wallex wallet interface." />
        <meta property="og:image" content={WALLEX_BRAND.logoUrl} />
        <meta property="og:url" content={WALLEX_BRAND.domain} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="canonical" href={WALLEX_BRAND.domain} />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FinancialService',
            name: 'Wallex',
            url: WALLEX_BRAND.domain,
            email: WALLEX_BRAND.supportEmail,
            areaServed: ['Africa', 'Asia', 'Europe', 'United States'],
            serviceType: 'Crypto wallet and digital asset services',
          })}
        </script>
      </head>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: tawkScript }} />
      </body>
    </html>
  );
}
