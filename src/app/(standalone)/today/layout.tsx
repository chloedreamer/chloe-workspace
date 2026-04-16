import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Today — Chloe Workspace",
  description: "Today's tasks, notes and schedule at a glance",
};

export default function TodayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
