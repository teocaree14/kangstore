import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Halaman tidak ditemukan</h2>
        <p className="mt-2 text-sm text-muted-foreground">Halaman yang kamu cari tidak ada atau sudah dipindahkan.</p>
        <Link to="/" className="mt-6 inline-flex items-center justify-center rounded-md bg-gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Terjadi kesalahan</h1>
        <p className="mt-2 text-sm text-muted-foreground">Coba muat ulang halaman.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button onClick={() => { router.invalidate(); reset(); }} className="rounded-md bg-gradient-primary px-4 py-2 text-sm text-primary-foreground shadow-glow">
            Coba lagi
          </button>
          <a href="/" className="rounded-md border px-4 py-2 text-sm">Beranda</a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Lucky Store — Kartu Perdana Siap Pakai Tanpa Registrasi" },
      { name: "description", content: "Beli kartu perdana siap pakai Telkomsel, XL, Axis, Indosat, Tri & Smartfren. Tanpa registrasi, langsung aktif." },
      { name: "author", content: "Lucky Store" },
      { property: "og:title", content: "Lucky Store — Kartu Perdana Siap Pakai Tanpa Registrasi" },
      { property: "og:description", content: "Beli kartu perdana siap pakai Telkomsel, XL, Axis, Indosat, Tri & Smartfren. Tanpa registrasi, langsung aktif." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Lucky Store — Kartu Perdana Siap Pakai Tanpa Registrasi" },
      { name: "twitter:description", content: "Beli kartu perdana siap pakai Telkomsel, XL, Axis, Indosat, Tri & Smartfren. Tanpa registrasi, langsung aktif." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/846b1c25-ed24-41d6-8bb7-64e3ae3db1c4/id-preview-37b93709--0fd69041-bce5-4d54-a0d8-1430147e5f58.lovable.app-1779594060712.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/846b1c25-ed24-41d6-8bb7-64e3ae3db1c4/id-preview-37b93709--0fd69041-bce5-4d54-a0d8-1430147e5f58.lovable.app-1779594060712.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );
}
