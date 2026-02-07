"use client";

import Script from "next/script";

/**
 * Injects Google Tag Manager script and noscript when containerId is set.
 * Configure in Admin → Settings → Tracking. Data layer (dataLayer) is provided
 * by DataLayerProvider so GTM can read events for tags.
 */
interface GTMScriptProps {
  containerId: string;
}

export function GTMScript({ containerId }: GTMScriptProps) {
  if (!containerId || !containerId.startsWith("GTM-")) return null;

  const scriptContent = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${containerId}');`;

  return (
    <>
      <Script id="gtm" strategy="afterInteractive">
        {scriptContent}
      </Script>
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${containerId}`}
          height={0}
          width={0}
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}
