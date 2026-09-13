import Link from "next/link"

import { ResourceManager } from "@/components/resource-manager"

export default function AdminPage() {
  return (
    <main className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link
            className="text-lg font-semibold tracking-[0.32em] text-primary"
            href="/"
          >
            MOVIE
          </Link>
          <span className="text-sm text-muted-foreground">资源映射</span>
        </div>
      </header>
      <ResourceManager />
    </main>
  )
}
