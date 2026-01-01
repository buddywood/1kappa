"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  ShoppingCart,
  DollarSign,
  CreditCard,
  Settings,
  HelpCircle,
  Shield,
  Megaphone,
} from "lucide-react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const sidebarItems = [
  { href: "/seller-dashboard", label: "Dashboard Home", icon: LayoutDashboard },
  { href: "/seller-dashboard/listings", label: "My Listings", icon: Package },
  {
    href: "/seller-dashboard/listings/create",
    label: "Add New Listing",
    icon: PlusCircle,
  },
  { href: "/seller-dashboard/orders", label: "Orders", icon: ShoppingCart },
  { href: "/seller-dashboard/payouts", label: "Payouts", icon: DollarSign },
  {
    href: "/seller-dashboard/stripe-setup",
    label: "Stripe Setup",
    icon: CreditCard,
  },
  { href: "/profile", label: "Profile Settings", icon: Settings },
  { href: "/seller-dashboard/help", label: "Help Center", icon: HelpCircle },
];

export default function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  /* ------------------------------------------------------------
   * Active route helper (fixes double-active bug)
   * ---------------------------------------------------------- */
  const isActiveHref = (href: string) => {
    if (!pathname) return false;

    if (href === "/seller-dashboard") {
      return pathname === href;
    }

    return pathname === href || pathname.startsWith(href + "/");
  };

  /* ------------------------------------------------------------
   * Role-based links
   * ---------------------------------------------------------- */
  const isSteward =
    (session?.user as any)?.is_steward || (session?.user as any)?.stewardId;
  const isPromoter =
    (session?.user as any)?.is_promoter || (session?.user as any)?.promoterId;

  const conditionalItems: Array<{ href: string; label: string; icon: any }> =
    [];

  if (isSteward) {
    conditionalItems.push({
      href: "/steward-dashboard",
      label: "Steward Items",
      icon: Shield,
    });
  }

  if (isPromoter) {
    conditionalItems.push({
      href: "/promoter-dashboard",
      label: "Promoter Tools",
      icon: Megaphone,
    });
  }

  /* ------------------------------------------------------------
   * Sidebar Link
   * ---------------------------------------------------------- */
  const SidebarLink = ({
    href,
    label,
    Icon,
    closeOnClick = false,
  }: {
    href: string;
    label: string;
    Icon: any;
    closeOnClick?: boolean;
  }) => {
    const isActive = isActiveHref(href);

    const link = (
      <Link
        href={href}
        title={!sidebarOpen ? label : undefined}
        className={`flex items-center ${
          sidebarOpen ? "gap-3 px-4" : "justify-center px-2"
        } py-2.5 rounded-lg mb-1 transition group
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson/40 focus-visible:ring-offset-2 ${
          isActive
            ? sidebarOpen
              ? "bg-crimson text-white shadow-sm"
              : "bg-crimson/10 dark:bg-crimson/20"
            : "text-midnight-navy dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        }`}
      >
        {/* Icon */}
        <div
          className={`flex items-center justify-center transition ${
            sidebarOpen ? "h-9 w-9 rounded-md" : "w-10 h-10 rounded-full"
          } ${
            isActive
              ? sidebarOpen
                ? "bg-white/15"
                : "bg-crimson/20 dark:bg-crimson/30 shadow-md"
              : "bg-gray-100 dark:bg-gray-800 group-hover:bg-gray-200 dark:group-hover:bg-gray-700"
          }`}
        >
          <Icon
            className={`h-5 w-5 ${
              isActive && !sidebarOpen ? "text-crimson dark:text-crimson" : ""
            }`}
          />
        </div>

        {/* Label (animated) */}
        {/* @ts-ignore - framer-motion type issue */}
        <motion.span
          initial={{ opacity: 0, x: -6 }}
          animate={{
            opacity: sidebarOpen ? 1 : 0,
            x: sidebarOpen ? 0 : -6,
          }}
          transition={{ duration: 0.15 }}
          className={`font-medium whitespace-nowrap ${
            sidebarOpen ? "block" : "hidden"
          }`}
        >
          {label}
        </motion.span>
      </Link>
    );

    return closeOnClick ? <SheetClose asChild>{link}</SheetClose> : link;
  };

  /* ------------------------------------------------------------
   * Sidebar Content
   * ---------------------------------------------------------- */
  const SidebarContent = ({
    closeOnClick = false,
  }: {
    closeOnClick?: boolean;
  }) => (
    <nav className="px-2 pb-4">
      {sidebarItems.map((item) => (
        <SidebarLink
          key={item.href}
          href={item.href}
          label={item.label}
          Icon={item.icon}
          closeOnClick={closeOnClick}
        />
      ))}

      {conditionalItems.length > 0 && (
        <>
          <div className="my-2 border-t border-frost-gray dark:border-gray-800" />
          {conditionalItems.map((item) => (
            <SidebarLink
              key={item.href}
              href={item.href}
              label={item.label}
              Icon={item.icon}
              closeOnClick={closeOnClick}
            />
          ))}
        </>
      )}
    </nav>
  );

  return (
    <div className="min-h-screen bg-cream dark:bg-black">
      <Header />

      <div className="flex">
        {/* Desktop Sidebar */}
        {/* @ts-expect-error - framer-motion v12 type compatibility */}
        <motion.aside
          initial={{ width: 64 }}
          animate={{ width: sidebarOpen ? 256 : 64 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 26,
          }}
          className="hidden lg:block bg-white dark:bg-gray-900 border-r border-frost-gray dark:border-gray-800 fixed h-[calc(100vh-64px)] top-16 left-0 z-40 overflow-y-auto"
        >
          <div className="p-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg
                className="w-5 h-5 text-midnight-navy dark:text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    sidebarOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>

          <SidebarContent />
        </motion.aside>

        {/* Mobile Sidebar */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="lg" className="rounded-full w-14 h-14 shadow-lg">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-64">
              <div className="mt-8">
                <SidebarContent closeOnClick />
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Content */}
        {/* @ts-expect-error - framer-motion v12 type compatibility */}
        <motion.main
          initial={{ marginLeft: 64 }}
          animate={{ marginLeft: sidebarOpen ? 256 : 64 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 26,
          }}
          className="flex-1"
        >
          {children}
        </motion.main>
      </div>

      <Footer />
    </div>
  );
}
