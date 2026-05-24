import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase, type Testimonial } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

export const Route = createFileRoute("/_site/testimoni")({
  head: () => ({ meta: [{ title: "Testimoni — Lucky Store" }] }),
  component: TestimoniPage,
});

function TestimoniPage() {
  const { data } = useQuery({
    queryKey: ["testimonials", "all"],
    queryFn: async () => {
      const { data } = await supabase.from("testimonials").select("*");
      return (data ?? []) as Testimonial[];
    },
  });

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl font-bold">Testimoni Pelanggan</h1>
        <p className="text-muted-foreground mt-2">Dipercaya ribuan pelanggan setia.</p>
      </div>
      {!data?.length ? (
        <Card className="p-12 text-center text-muted-foreground">Belum ada testimoni.</Card>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {data.map((t) => (
            <Card key={t.id} className="p-6 hover:shadow-glow transition-shadow">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-4 w-4 fill-gold text-gold" />)}
              </div>
              <p className="text-sm italic text-muted-foreground">"{t.message}"</p>
              <div className="flex items-center gap-3 mt-4">
                <Avatar>{t.avatar ? <img src={t.avatar} alt={t.name} /> : <AvatarFallback className="bg-gradient-primary text-primary-foreground">{t.name[0]}</AvatarFallback>}</Avatar>
                <p className="font-medium text-sm">{t.name}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
