import { Home, Mic, Sparkles, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const TABS = [
  { label: "Start", path: "/", icon: Home },
  { label: "Practice", path: "/practice", icon: Mic },
  { label: "Takeaway", path: "/session-end", icon: Sparkles },
  { label: "My", path: "/my", icon: UserRound },
];

export default function AppTabBar() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 px-3 pb-3">
      <div className="grid grid-cols-4 rounded-[1.4rem] border border-gray-100 bg-white/95 p-1.5 shadow-[0_-8px_28px_rgba(31,41,55,0.08)] backdrop-blur">
        {TABS.map(({ label, path, icon: Icon }) => {
          const active = path === "/"
            ? location.pathname === "/"
            : location.pathname === path;

          return (
            <Link
              key={path}
              to={path}
              className="flex min-w-0 flex-col items-center gap-1 rounded-2xl px-1 py-2 transition-colors"
              style={{
                background: active ? "rgba(88,169,255,0.12)" : "transparent",
                color: active ? "#2563EB" : "#9CA3AF",
              }}
              aria-current={active ? "page" : undefined}
            >
              <Icon size={18} strokeWidth={active ? 2.8 : 2.2} />
              <span className="max-w-full truncate text-[10px] font-black">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
