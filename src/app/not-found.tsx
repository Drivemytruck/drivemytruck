import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page max-w-md py-20 text-center">
      <p className="text-5xl">🚛💨</p>
      <h1 className="h1 mt-4">Page not found</h1>
      <p className="muted mt-2">This page has left the depot.</p>
      <Link href="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  );
}
