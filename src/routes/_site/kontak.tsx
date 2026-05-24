import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Instagram, Mail } from "lucide-react";

export const Route = createFileRoute("/_site/kontak")({
  head: () => ({ meta: [{ title: "Kontak — Lucky Store" }] }),
  component: () => (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-bold text-center">Hubungi Kami</h1>
      <p className="text-muted-foreground text-center mt-2 mb-10">Tim kami siap membantu 24/7.</p>
      <div className="grid sm:grid-cols-3 gap-4">
        <Card className="p-6 text-center hover:shadow-glow transition-shadow">
          <div className="h-12 w-12 mx-auto grid place-items-center rounded-xl bg-[oklch(0.70_0.18_150)] text-white"><MessageCircle className="h-5 w-5" /></div>
          <p className="font-semibold mt-3">WhatsApp</p>
          <p className="text-sm text-muted-foreground">087840395627</p>
          <Button asChild className="mt-4 w-full bg-gradient-primary"><a href="https://wa.me/6287840395627">Chat</a></Button>
        </Card>
        <Card className="p-6 text-center hover:shadow-glow transition-shadow">
          <div className="h-12 w-12 mx-auto grid place-items-center rounded-xl bg-gradient-to-tr from-pink-500 to-amber-400 text-white"><Instagram className="h-5 w-5" /></div>
          <p className="font-semibold mt-3">Instagram</p>
          <p className="text-sm text-muted-foreground">@luckystore</p>
          <Button asChild variant="outline" className="mt-4 w-full"><a href="#">Follow</a></Button>
        </Card>
        <Card className="p-6 text-center hover:shadow-glow transition-shadow">
          <div className="h-12 w-12 mx-auto grid place-items-center rounded-xl bg-gradient-primary text-primary-foreground"><Mail className="h-5 w-5" /></div>
          <p className="font-semibold mt-3">Email</p>
          <p className="text-sm text-muted-foreground">support@luckystore.id</p>
          <Button asChild variant="outline" className="mt-4 w-full"><a href="mailto:support@luckystore.id">Kirim</a></Button>
        </Card>
      </div>
    </div>
  ),
});
