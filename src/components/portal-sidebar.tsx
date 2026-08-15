/**
 * Role-aware sidebar navigation for every signed-in portal.
 * Only links that point to routes that EXIST today are listed.
 */
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Wallet,
  BookOpen,
  Newspaper,
  Settings,
  QrCode,
  FileText,
  Building2,
  Receipt,
  ScrollText,
  Award,
  CalendarCheck,
  CalendarDays,
  MessageSquare,
  Bell,
  KeyRound,
  ToggleRight,
  Layers,
  MapPin,
  ScanFace,
  Sliders,
  Megaphone,
  BarChart3,
  ClipboardList,
  TrendingUp,
  Bus,
  LifeBuoy,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Brain,
  HeartPulse,
  Globe,
  Calculator,
  Home,
  Library as LibraryIcon,
  Gavel,
  Trophy,
  UserCog,
  UserCheck,
  Package,
  ClipboardCheck,
  Activity,
  Search as SearchIcon,
  Bot,
} from "lucide-react";


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { AppRole } from "@/lib/roles";
import { openCommandCenter } from "@/components/command-center";
import { ThemeToggle } from "@/components/theme-toggle";
import { useModKeyLabel } from "@/lib/kbd";
import { useUnreadNewsCount } from "@/lib/news-reads";
import { useUnreadMessagesCount } from "@/lib/messages-unread";
import { ROUTE_PROGRESS_EVENT } from "@/components/route-progress-bar";
import { cn } from "@/lib/utils";

type Item = {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  activeUrls?: string[];
  activePrefixes?: string[];
};

type Section = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: Item[];
};

function normalizePath(path: string) {
  return path.length > 1 ? path.replace(/\/+$/u, "") : path;
}

function getActiveScore(item: Item, pathname: string) {
  const current = normalizePath(pathname);
  const paths = [item.url, ...(item.activeUrls ?? [])].map(normalizePath);
  let score = 0;

  for (const path of paths) {
    if (current === path) score = Math.max(score, 10_000 + path.length);
    else if (current.startsWith(`${path}/`)) score = Math.max(score, path.length);
  }

  for (const prefix of item.activePrefixes ?? []) {
    const p = normalizePath(prefix);
    if (current.startsWith(p)) score = Math.max(score, p.length);
  }

  return score;
}

const NAV: Record<AppRole, Item[]> = {
  admin: [],
  principal: [],
  teacher: [
    { title: "Dashboard", url: "/teacher/dashboard", icon: LayoutDashboard },
    { title: "My Sign-in", url: "/teacher/sign-in", icon: MapPin },
    { title: "Biometric Enrollment", url: "/teacher/biometric-enrollment", icon: ScanFace },
    { title: "Mark Attendance", url: "/teacher/attendance", icon: CalendarCheck },
    { title: "Weekly attendance", url: "/teacher/attendance-week", icon: CalendarCheck },
    { title: "Timetable", url: "/teacher/timetable", icon: CalendarDays },
    { title: "Grades", url: "/teacher/grades", icon: Award },
    { title: "Gradebook", url: "/teacher/gradebook", icon: Award },
    { title: "Lesson plans", url: "/teacher/lesson-plans", icon: FileText },
    { title: "My Classes", url: "/teacher/class-intelligence", icon: Users },
    { title: "AI Assistant", url: "/teacher/ai-assistant", icon: Sparkles },
    { title: "Calendar", url: "/teacher/calendar", icon: CalendarDays },
    { title: "News", url: "/teacher/news", icon: Newspaper },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Broadcast", url: "/admin/broadcast", icon: Megaphone },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  parent: [
    { title: "Dashboard", url: "/parent/dashboard", icon: LayoutDashboard },
    { title: "Children", url: "/parent/children", icon: Users },
    { title: "Grades", url: "/parent/grades", icon: Award },
    { title: "Attendance", url: "/parent/attendance", icon: CalendarCheck },
    { title: "Fees", url: "/parent/fees", icon: Wallet },
    { title: "Report cards", url: "/parent/report-cards", icon: FileText },
    { title: "Calendar", url: "/parent/calendar", icon: CalendarDays },
    { title: "News", url: "/parent/news", icon: Newspaper },
    { title: "Bus tracking", url: "/parent/bus-tracking", icon: Bus },
    { title: "AI Assistant", url: "/parent/ai-assistant", icon: Sparkles },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  student: [
    { title: "Home", url: "/student/dashboard", icon: LayoutDashboard },
    { title: "Today's Timetable", url: "/student/timetable", icon: CalendarDays },
    { title: "My Grades", url: "/student/grades", icon: Award },
    { title: "Attendance", url: "/student/attendance", icon: CalendarCheck },
    { title: "Report Card", url: "/student/report-card", icon: FileText },
    { title: "School Fees", url: "/student/fees", icon: Wallet },
    { title: "AI Tutor", url: "/student/ai-tutor", icon: Bot },
    { title: "Calendar", url: "/student/calendar", icon: CalendarDays },
    { title: "School News", url: "/student/news", icon: Newspaper },

    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  bursar: [
    { title: "Dashboard", url: "/bursar/dashboard", icon: LayoutDashboard },
    { title: "Receipts", url: "/bursar/receipts", icon: Receipt },
    { title: "Reports", url: "/bursar/reports", icon: ScrollText },
    { title: "Reconciliation", url: "/bursar/reconciliation", icon: Receipt },
    { title: "Fee Plans", url: "/bursar/fee-plans", icon: CalendarDays },
    { title: "Financial Intelligence", url: "/bursar/financial-intelligence", icon: Wallet },
    { title: "All Fees", url: "/admin/fees", icon: Wallet },
    { title: "Defaulters", url: "/admin/fees-defaulters", icon: Wallet },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  hq: [
    { title: "Dashboard", url: "/hq/dashboard", icon: LayoutDashboard },
    { title: "Finance", url: "/hq/finance", icon: Wallet },
    { title: "Reports", url: "/hq/reports", icon: ScrollText },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
  super_admin: [
    { title: "Dashboard", url: "/super-admin/dashboard", icon: LayoutDashboard },
    { title: "Schools", url: "/super-admin/schools", icon: Building2 },
    { title: "Billing", url: "/super-admin/billing", icon: Wallet },
    { title: "Support", url: "/super-admin/support", icon: MessageSquare },
    { title: "Audit logs", url: "/super-admin/logs", icon: ScrollText },
    { title: "Tiers", url: "/super-admin/tiers", icon: Layers },
    { title: "Platform config", url: "/super-admin/platform-config", icon: Sliders },
    { title: "Settings", url: "/super-admin/settings", icon: Settings },
  ],
  driver: [
    { title: "Dashboard", url: "/driver/dashboard", icon: LayoutDashboard },
    { title: "Messages", url: "/messages", icon: MessageSquare },
    { title: "Notifications", url: "/notifications", icon: Bell },
    { title: "Settings", url: "/settings", icon: Settings },
  ],
};

const LABEL: Record<AppRole, string> = {
  admin: "Admin",
  principal: "Principal",
  teacher: "Teacher",
  parent: "Parent",
  student: "Student",
  bursar: "Bursar",
  hq: "HQ",
  super_admin: "Super Admin",
  driver: "Bus Driver",
};

/* Sectioned nav — used for admin & principal. */
const ADMIN_SECTIONS: Section[] = [
  {
    label: "Intelligence", icon: Brain,
    items: [
      { title: "Executive Dashboard", url: "/admin/dashboard", icon: LayoutDashboard },
      { title: "Student Intelligence", url: "/admin/student-intelligence", icon: Sparkles, activeUrls: ["/admin/intelligence-students"] },
      { title: "Teacher Intelligence", url: "/admin/teacher-intelligence", icon: Sparkles, activeUrls: ["/admin/intelligence-teachers"] },
      { title: "School Economy Score", url: "/admin/health-certificate", icon: ShieldCheck },
      { title: "Operations Center", url: "/admin/operations", icon: Activity, activePrefixes: ["/admin/intelligence-operations"] },
      { title: "Vibeora Intelligence", url: "/admin/intelligence", icon: Sparkles, activePrefixes: ["/admin/intelligence-"] },
      { title: "AI Assistant", url: "/admin/ai-assistant", icon: Bot },

    ],
  },
  {
    label: "Academic", icon: BookOpen,
    items: [
      { title: "Students", url: "/admin/students", icon: Users },
      { title: "Teachers", url: "/admin/teachers", icon: GraduationCap },
      { title: "Classes", url: "/admin/classes", icon: Layers },
      { title: "Timetable", url: "/admin/timetable", icon: CalendarDays },
      { title: "Attendance", url: "/admin/attendance", icon: CalendarCheck },
      { title: "Geofence Settings", url: "/admin/geofence-settings", icon: MapPin },
      { title: "Lesson Plans", url: "/admin/lesson-plans", icon: FileText },
      { title: "Grades", url: "/admin/grades", icon: Award },
      { title: "Report Cards", url: "/admin/report-cards", icon: FileText },
      { title: "Examinations", url: "/admin/examinations", icon: ClipboardCheck },
    ],
  },
  {
    label: "Finance", icon: Wallet,
    items: [
      { title: "Fee Management", url: "/admin/fees", icon: Wallet },
      { title: "Fee Defaulters", url: "/admin/fees-defaulters", icon: Receipt },
      { title: "Expenses", url: "/admin/expenses", icon: TrendingUp },
      { title: "Payroll", url: "/admin/payroll", icon: Calculator },
      { title: "Financial Reports", url: "/admin/financial-reports", icon: BarChart3 },
    ],
  },
  {
    label: "Student Services", icon: HeartPulse,
    items: [
      { title: "Health / Clinic", url: "/admin/health", icon: HeartPulse },
      { title: "Bus Management", url: "/admin/bus-management", icon: Bus },
      { title: "Buses", url: "/admin/buses", icon: Bus },
      { title: "Hostel", url: "/admin/hostel", icon: Home },
      { title: "Library", url: "/admin/library", icon: LibraryIcon },
      { title: "Discipline", url: "/admin/discipline", icon: Gavel },
      { title: "Extracurricular", url: "/admin/extracurricular", icon: Trophy },
    ],
  },
  {
    label: "Communication", icon: MessageSquare,
    items: [
      { title: "Announcements / News", url: "/admin/news", icon: Newspaper },
      { title: "Calendar", url: "/admin/calendar", icon: CalendarDays },
      { title: "Messages", url: "/messages", icon: MessageSquare },
      { title: "Broadcast", url: "/admin/broadcast", icon: Megaphone },
      { title: "Notifications", url: "/notifications", icon: Bell },
    ],
  },
  {
    label: "Administration", icon: Settings,
    items: [
      { title: "Admissions", url: "/admin/admissions", icon: ClipboardList },
      { title: "HR & Staff", url: "/admin/hr", icon: UserCog, activeUrls: ["/admin/staff-accounts"] },
      { title: "Visitor Management", url: "/admin/visitors", icon: UserCheck },
      { title: "Inventory", url: "/admin/inventory", icon: Package },
      { title: "Audit Logs", url: "/admin/audit", icon: ScrollText, activeUrls: ["/admin/audit-logs"] },
      { title: "Support", url: "/admin/support", icon: LifeBuoy },
      { title: "Locked Accounts", url: "/admin/locked-accounts", icon: KeyRound },
    ],
  },
  {
    label: "Platform", icon: Globe,
    items: [
      { title: "Public Website CMS", url: "/admin/cms", icon: Globe },
      { title: "School Features", url: "/admin/features", icon: ToggleRight },
      { title: "API Keys", url: "/admin/api-keys", icon: KeyRound },
      { title: "Digital Twin", url: "/admin/digital-twin", icon: MessageSquare },
      { title: "Settings", url: "/admin/settings", icon: Settings },
    ],
  },
];

function flattenSections(sections: Section[]): Item[] {
  return sections.flatMap((s) => s.items);
}

function CollapsibleSection({
  section, collapsed, activeUrl, onNavClick, unreadNews, unreadMessages,
}: {
  section: Section;
  collapsed: boolean;
  activeUrl: string;
  onNavClick: () => void;
  unreadNews: number;
  unreadMessages: number;
}) {
  const SectionIcon = section.icon;
  const hasActive = section.items.some((it) => it.url === activeUrl);
  const [open, setOpen] = useState(hasActive || collapsed);
  const showOpen = collapsed ? true : open;

  return (
    <SidebarGroup>
      {!collapsed && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground transition-colors"
        >
          <SectionIcon className="size-3.5" />
          <span className="flex-1 text-left">{section.label}</span>
          <ChevronDown className={cn("size-3.5 transition-transform duration-200", showOpen ? "" : "-rotate-90")} />
        </button>
      )}
      {showOpen && (
        <SidebarGroupContent>
          <SidebarMenu>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = activeUrl === item.url;
              const isNews = item.url.endsWith("/news");
              const isMessages = item.url === "/messages";
              const badge = isNews && unreadNews > 0
                ? unreadNews
                : isMessages && unreadMessages > 0
                  ? unreadMessages
                  : null;
              return (
                <SidebarMenuItem key={item.url + item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={active}
                    tooltip={item.title}
                    className={
                      active
                        ? "!bg-primary/15 !text-primary font-semibold border-l-[3px] border-primary rounded-l-none hover:!bg-primary/20 hover:!text-primary"
                        : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                    }
                  >
                    <Link
                      to={item.url}
                      onClick={onNavClick}
                      aria-label={item.title}
                      className="flex items-center gap-2"
                    >
                      <Icon className="size-4" />
                      {!collapsed && <span className="flex-1 text-sm">{item.title}</span>}
                      {badge !== null && !collapsed && (
                        <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {badge}
                        </span>
                      )}
                      {badge !== null && collapsed && (
                        <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroupContent>
      )}
    </SidebarGroup>
  );
}

export function PortalSidebar({ role }: { role: AppRole }) {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const modKey = useModKeyLabel();
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const sections: Section[] | null =
    role === "admin" || role === "principal" ? ADMIN_SECTIONS : null;
  const items = sections ? flattenSections(sections) : (NAV[role] ?? []);
  const unreadNews = useUnreadNewsCount();
  const unreadMessages = useUnreadMessagesCount();

  // On mobile, close the sheet as soon as the user taps a nav item so the
  // page they navigated to is visible immediately. Without this the sidebar
  // sheet stays open over the new route and the user has to dismiss it
  // manually before they can see anything.
  const handleNavClick = () => {
    window.dispatchEvent(new CustomEvent(ROUTE_PROGRESS_EVENT, { detail: { source: "sidebar" } }));
    if (isMobile) setOpenMobile(false);
  };

  const activeUrl = items.reduce(
    (best, item) => {
      const score = getActiveScore(item, pathname);
      return score > best.score ? { url: item.url, score } : best;
    },
    { url: "", score: 0 },
  ).url;

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {sections ? (
          sections.map((section) => (
            <CollapsibleSection
              key={section.label}
              section={section}
              collapsed={collapsed}
              activeUrl={activeUrl}
              onNavClick={handleNavClick}
              unreadNews={unreadNews}
              unreadMessages={unreadMessages}
            />
          ))
        ) : (
        <SidebarGroup>
          <SidebarGroupLabel>{LABEL[role]} portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const Icon = item.icon;
                const active = activeUrl === item.url;
                const isNews = item.url.endsWith("/news");
                const isMessages = item.url === "/messages";
                const badge = isNews && unreadNews > 0
                  ? unreadNews
                  : isMessages && unreadMessages > 0
                    ? unreadMessages
                    : null;
                return (
                  <SidebarMenuItem key={item.url + item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                      className={
                        active
                          ? "!bg-primary/15 !text-primary font-semibold border-l-[3px] border-primary rounded-l-none hover:!bg-primary/20 hover:!text-primary"
                          : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
                      }
                    >
                      <Link
                        to={item.url}
                        onClick={handleNavClick}
                        aria-label={item.title}
                        className="flex items-center gap-2"
                      >
                        <Icon className="size-4" />
                        {!collapsed && <span className="flex-1">{item.title}</span>}
                        {badge !== null && !collapsed && (
                          <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                            {badge}
                          </span>
                        )}
                        {badge !== null && collapsed && (
                          <span className="absolute right-1 top-1 size-2 rounded-full bg-primary" />
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        )}


        {role !== "super_admin" && role !== "hq" && (
          <SidebarGroup>
            <SidebarGroupLabel>Resources</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Learning materials">
                    <Link to="/settings" className="flex items-center gap-2">
                      <BookOpen className="size-4" />
                      {!collapsed && <span>Help & docs</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter>
        <button
          onClick={openCommandCenter}
          className="flex w-full items-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs text-muted-foreground hover:bg-accent"
          title={`Open command palette (${modKey}K)`}
        >
          <SearchIcon className="size-3.5 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">Search</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-mono">{modKey}K</kbd>
            </>
          )}
        </button>
        {!collapsed && (
          <div className="mt-auto border-t border-border/60 px-3 pt-3 pb-1">
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="text-[10px] text-muted-foreground/40">Press {modKey}+K to search</span>
              <ThemeToggle />
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
