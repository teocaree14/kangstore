import { MessageCircle } from "lucide-react";

export function WhatsAppFloat() {
  return (
    <a
      href="https://wa.me/6287840395627?text=Halo%20Lucky%20Store,%20saya%20ingin%20bertanya"
      target="_blank"
      rel="noreferrer"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[oklch(0.70_0.18_150)] text-white shadow-glow hover:scale-110 transition-transform"
      aria-label="WhatsApp"
    >
      <MessageCircle className="h-6 w-6" />
      <span className="absolute inset-0 rounded-full animate-ping bg-[oklch(0.70_0.18_150)] opacity-30" />
    </a>
  );
}
