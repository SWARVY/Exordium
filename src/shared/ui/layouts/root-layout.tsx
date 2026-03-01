import { Outlet } from "@tanstack/react-router"
import { Footer } from "@widgets/footer"
import { Header } from "@widgets/header"

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
