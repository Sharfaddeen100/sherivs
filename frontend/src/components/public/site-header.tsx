import { useEffect, useId, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, Menu } from "lucide-react";
import { PLATFORM_NAME, PLATFORM_TAGLINE } from "@/lib/platform";
import { SherivsLogo } from "@/components/brand/sherivs-logo";
import { HEADER_GROUPS, type NavGroup } from "@/lib/public-site/navigation";
import { PUBLIC_ANNOUNCEMENT } from "@/lib/public-site/announcement";
import { PublicButton } from "@/components/public/ui";
import { PublicLink } from "@/components/public/public-link";
import { MobileNavigation } from "@/components/public/mobile-navigation";

/**
 * Sherivs public marketing header.
 *
 * One authoritative chrome for every public marketing page. Navigation
 * links only to public routes or homepage anchors. Internal /platform
 * surfaces and console hosts are never linked from this header.
 */
export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [desktopGroup, setDesktopGroup] = useState<string | null>(null);
  const menuId = useId();
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!desktopGroup) return;
    const onPointer = (event: MouseEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setDesktopGroup(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDesktopGroup(null);
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [desktopGroup]);

  return (
    <header className="sticky top-0 z-[var(--sherivs-z-nav)] border-b border-[var(--sherivs-border)] bg-[color-mix(in_oklab,var(--sherivs-obsidian)_82%,transparent)] backdrop-blur-xl">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[calc(var(--sherivs-z-nav)+1)] focus:rounded-md focus:bg-sherivs-blue focus:px-3 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      {PUBLIC_ANNOUNCEMENT.published && PUBLIC_ANNOUNCEMENT.text ? (
        <div className="border-b border-[var(--sherivs-border)] bg-[var(--sherivs-midnight)] px-4 py-2 text-center text-xs text-sherivs-muted">
          {PUBLIC_ANNOUNCEMENT.href ? (
            <a
              href={PUBLIC_ANNOUNCEMENT.href}
              className="text-sherivs-cyan underline-offset-4 hover:underline"
            >
              {PUBLIC_ANNOUNCEMENT.text}
            </a>
          ) : (
            PUBLIC_ANNOUNCEMENT.text
          )}
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[var(--sherivs-container-wide)] items-center justify-between gap-3 px-[var(--sherivs-gutter)] py-3">
        <Link to="/" aria-label={`${PLATFORM_NAME} home`} className="rounded-md">
          <SherivsLogo size={28} wordmarkClassName="text-[1.05rem]" />
        </Link>

        <nav ref={navRef} aria-label="Site" className="hidden items-center gap-0.5 lg:flex">
          {HEADER_GROUPS.map((group) => (
            <DesktopNavGroup
              key={group.id}
              group={group}
              open={desktopGroup === group.id}
              onClose={() => setDesktopGroup(null)}
              onToggle={() =>
                setDesktopGroup((current) => (current === group.id ? null : group.id))
              }
            />
          ))}
        </nav>

        <nav aria-label="Account" className="hidden items-center gap-2 text-sm lg:flex">
          <Link
            to="/auth"
            className="rounded-md px-3 py-1.5 font-semibold text-sherivs-muted transition-colors hover:text-sherivs-white"
          >
            Sign in
          </Link>
          <PublicButton href="/onboarding">Get started</PublicButton>
        </nav>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--sherivs-radius-sm)] border border-[var(--sherivs-border)] text-sherivs-white transition-colors hover:bg-white/5 lg:hidden"
          aria-expanded={open}
          aria-controls={menuId}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <span className="sr-only">Open menu</span>
          <Menu size={18} aria-hidden="true" />
        </button>
      </div>

      <MobileNavigation open={open} onOpenChange={setOpen} menuId={menuId} />
      <p className="sr-only">{PLATFORM_TAGLINE}</p>
    </header>
  );
}

function DesktopNavGroup({
  group,
  open,
  onClose,
  onToggle,
}: {
  group: NavGroup;
  open: boolean;
  onClose: () => void;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1 rounded-md px-3 py-2 text-sm transition-colors hover:bg-white/5 hover:text-sherivs-white ${open ? "bg-white/5 text-sherivs-white" : "text-sherivs-muted"}`}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={onToggle}
      >
        {group.label}
        <ChevronDown
          size={14}
          aria-hidden="true"
          className={`transition-transform duration-[var(--sherivs-motion-fast)] ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div className="sherivs-nav-panel absolute left-0 top-full z-[var(--sherivs-z-overlay)] mt-2 w-80 rounded-[var(--sherivs-radius)] border border-[var(--sherivs-glass-border)] bg-[var(--sherivs-midnight)] p-2 shadow-[var(--sherivs-shadow)]">
          <ul>
            {group.items.map((item) => (
              <li key={`${group.id}-${item.href}-${item.label}`}>
                <PublicLink
                  href={item.href}
                  className="block rounded-[var(--sherivs-radius-sm)] px-3 py-2.5 hover:bg-white/5"
                  onNavigate={onClose}
                >
                  <span className="block text-sm font-medium text-sherivs-white">{item.label}</span>
                  {item.description ? (
                    <span className="mt-0.5 block text-xs leading-snug text-sherivs-muted">
                      {item.description}
                    </span>
                  ) : null}
                </PublicLink>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
