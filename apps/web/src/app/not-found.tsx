import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 text-center space-y-4">
      <div className="size-12 rounded-xl bg-ink-100 flex items-center justify-center text-ink-900 font-bold text-lg font-mono">
        404
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-ink-900">
        Halaman tidak ditemukan
      </h1>
      <p className="text-sm text-ink-500 max-w-sm">
        Halaman yang Anda tuju tidak tersedia atau telah dipindahkan.
      </p>
      <div className="pt-2">
        <Link href="/">
          <Button variant="primary">Kembali ke Beranda</Button>
        </Link>
      </div>
    </div>
  );
}
