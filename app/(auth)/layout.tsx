export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="h-full flex items-center justify-center"
      style={{ background: "#f1f5f9" }}
    >
      {children}
    </div>
  );
}
