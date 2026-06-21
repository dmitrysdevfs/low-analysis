"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function ClarityScript() {
  const pathname = usePathname();

  // Do not load Clarity in admin area — session recording of admin actions is a data leak
  if (pathname.startsWith("/admin")) return null;

  return (
    <Script
      id="ms-clarity"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","x42vvdj1l2");`,
      }}
    />
  );
}
