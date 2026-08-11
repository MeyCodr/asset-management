import Sidebar from "@/components/Sidebar";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-hidden flex flex-col">
        <div className="p-6 w-full flex-1 overflow-y-auto scroll-light">{children}</div>
      </main>
    </div>
  );
}
