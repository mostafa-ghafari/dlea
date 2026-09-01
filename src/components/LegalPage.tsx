import { Link } from "@tanstack/react-router";
import { ArrowLeft, LineChart } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/lib/theme";

/** Shared shell for the public legal / contact pages. */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 md:px-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 text-primary-foreground">
              <LineChart className="h-5 w-5" />
            </div>
            <span className="font-bold">
              Dlea <span className="text-primary">AI</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/">
              <Button variant="outline" size="sm">
                بازگشت <ArrowLeft className="mr-1 h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-14 md:px-8">
        <h1 className="text-3xl font-bold md:text-4xl">{title}</h1>
        <p className="mt-4 max-w-2xl leading-relaxed text-muted-foreground">{intro}</p>
        <div className="mt-10 space-y-4">{children}</div>
      </main>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        © ۱۴۰۳ Dlea AI
      </footer>
    </div>
  );
}

export function LegalSection({ title, body }: { title: string; body: string }) {
  return (
    <section className="card-surface p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </section>
  );
}
