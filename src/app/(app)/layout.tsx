import Sidebar from "@/components/Sidebar";
import ProjectsProvider from "@/components/ProjectsProvider";
import FocusTimer from "@/components/FocusTimer";
import SakuraEffect from "@/components/SakuraEffect";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProjectsProvider>
      <Sidebar />
      <main className="flex-1 ml-64 overflow-auto relative z-10">
        <div className="px-10 py-10 max-w-6xl mx-auto">{children}</div>
      </main>
      <FocusTimer />
      <SakuraEffect />
    </ProjectsProvider>
  );
}
