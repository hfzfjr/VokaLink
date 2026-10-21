import { notFound } from "next/navigation";
import { GalleryContent } from "./_gallery";

// Halaman ini hanya tersedia di development. Di production, Next.js memunculkan 404.
export default function UIGalleryPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <GalleryContent />;
}
