import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Apakah kartu sudah aktif?", a: "Ya, semua kartu kami siap pakai. Tinggal pasang dan langsung bisa digunakan." },
  { q: "Apakah perlu registrasi ulang?", a: "Tidak. Kartu sudah teregistrasi dan siap dipakai langsung." },
  { q: "Berapa lama pengiriman?", a: "1–2 hari kerja via JNE/J&T. Same-day untuk area Jabodetabek." },
  { q: "Apakah bisa digunakan untuk OTP?", a: "Bisa. Kartu kami menerima SMS OTP dari aplikasi-aplikasi seperti WhatsApp, Telegram, dll." },
  { q: "Metode pembayaran apa saja yang tersedia?", a: "Transfer Bank BCA dan e-wallet DANA." },
  { q: "Bagaimana jika kartu tidak aktif?", a: "Kami memberikan garansi tukar jika kartu tidak dapat diaktifkan dalam 1×24 jam." },
];

export const Route = createFileRoute("/_site/faq")({
  head: () => ({ meta: [{ title: "FAQ — Lucky Store" }] }),
  component: () => (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-bold text-center">Pertanyaan Umum</h1>
      <p className="text-muted-foreground text-center mt-2 mb-10">Jawaban dari pertanyaan yang sering ditanyakan.</p>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((f, i) => (
          <AccordionItem key={i} value={`${i}`} className="border rounded-xl px-5 bg-card">
            <AccordionTrigger className="text-left font-semibold">{f.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  ),
});
