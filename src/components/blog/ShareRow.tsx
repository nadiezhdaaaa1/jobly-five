import { IconCopy as Copy, IconCheck as Check } from "@tabler/icons-react";
import { useState } from "react";

import fbIcon from "@/assets/social/fb.svg";
import inIcon from "@/assets/social/in.svg";
import xIcon from "@/assets/social/twitter-x.svg";

export function ShareRow({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* noop */
    }
  };

  const enc = encodeURIComponent;
  const links = [
    { label: "Share on X", href: `https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`, icon: xIcon },
    { label: "Share on LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, icon: inIcon },
    { label: "Share on Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, icon: fbIcon },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={share}
        aria-label="Copy link"
        className="secondary_button secondary_button--on-light secondary_button--sm gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        <span>{copied ? "Copied" : "Copy link"}</span>
      </button>
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={l.label}
          className="secondary_button secondary_button--on-light secondary_button--icon focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-ring)]"
        >
          <span
            aria-hidden="true"
            className="block size-5 bg-current"
            style={{
              maskImage: `url(${l.icon})`,
              WebkitMaskImage: `url(${l.icon})`,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        </a>
      ))}
    </div>
  );
}
