import Sidebar from "@/components/Sidebar";
import GlobalSearch from "@/components/GlobalSearch";
import ProjectsProvider from "@/components/ProjectsProvider";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectsProvider>
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto">
        <div className="px-8 py-4 border-b border-rose-border bg-white/80 backdrop-blur-sm sticky top-0 z-20 flex items-center justify-end">
          <GlobalSearch />
        </div>
        <div className="p-8">{children}</div>
      </main>
    </ProjectsProvider>
  );
}
