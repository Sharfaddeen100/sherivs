/**
 * Mobile bottom tab bars for the parent and student portals.
 * Rendered only below the `lg` breakpoint; the sidebar remains the
 * primary navigation on larger screens.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Users,
  CreditCard,
  MapPin,
  Bot,
  CalendarDays,
  GraduationCap,
} from "lucide-react";

type Tab = {
  label: string;
  icon: React.ElementType;
  href: string;
};

function BottomNav({ tabs, label }: { tabs: Tab[]; label: string }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <nav
      aria-label={label}
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#0a0f1e]/95 backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const active = pathname.startsWith(tab.href);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              to={tab.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[48px] flex-col items-center gap-0.5 rounded-xl px-3 py-2 transition-colors duration-150 ${
                active ? "text-teal-400" : "text-white/40"
              }`}
            >
              <Icon className="size-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function ParentBottomNav() {
  const tabs: Tab[] = [
    { label: "Home", icon: Home, href: "/parent/dashboard" },
    { label: "Children", icon: Users, href: "/parent/children" },
    { label: "Fees", icon: CreditCard, href: "/parent/fees" },
    { label: "Bus", icon: MapPin, href: "/parent/bus-tracking" },
    { label: "AI", icon: Bot, href: "/parent/ai-assistant" },
  ];
  return <BottomNav tabs={tabs} label="Parent quick navigation" />;
}

export function StudentBottomNav() {
  const tabs: Tab[] = [
    { label: "Home", icon: Home, href: "/student/dashboard" },
    { label: "Timetable", icon: CalendarDays, href: "/student/timetable" },
    { label: "Grades", icon: GraduationCap, href: "/student/grades" },
    { label: "AI Tutor", icon: Bot, href: "/student/ai-tutor" },
    { label: "Fees", icon: CreditCard, href: "/student/fees" },
  ];
  return <BottomNav tabs={tabs} label="Student quick navigation" />;
}

