// Turns a caught error from a Prisma write into a short, user-readable message —
// never leaks Prisma's raw invocation dump/stack trace to the browser.
export function friendlyImportRowError(err: unknown, duplicateDescription?: string): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: string }).code;
    if (code === "P2002" && duplicateDescription) return `${duplicateDescription} already exists.`;
    if (code === "P2000") return "One of the values is too long for its field.";
  }
  return "Could not import this row — please check the data format and try again.";
}
