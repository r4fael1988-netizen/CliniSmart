import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona automaticamente para o dashboard
  // O middleware cuidará de mandar para o login se não houver sessão
  redirect("/dashboard");
}
