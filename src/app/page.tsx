import { redirect } from "next/navigation"

export default function RootPage() {
  // Redirect the root path to the AI chat interface
  redirect("/chat")
}
