"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A mailto: link that also copies the address.
 *
 * On a desktop with no mail client registered, clicking a mailto: does nothing at all and the visitor
 * assumes the button is broken. This keeps the mail link for anyone who has a client, and copies the
 * address either way, so the click always produces something. The label never changes, so the button
 * doesn't resize — the confirmation appears beside it.
 */
export function EmailLink({
  email,
  href,
  className,
  children,
}: {
  email: string;
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setCopied(false), 3000);
    } catch {
      // Clipboard can be blocked; the mailto still fires and the address is printed on the page.
    }
  }

  return (
    <>
      <a href={href} onClick={handleClick} className={className}>
        {children}
      </a>
      <span
        aria-hidden={!copied}
        style={{
          display: "inline-block",
          marginLeft: 10,
          fontSize: 13,
          fontWeight: 700,
          color: "#e8735c",
          opacity: copied ? 1 : 0,
          transition: "opacity .2s ease",
          pointerEvents: "none",
        }}
      >
        Address copied
      </span>
      <span role="status" aria-live="polite" className="sr-only">
        {copied ? `${email} copied to clipboard` : ""}
      </span>
    </>
  );
}
