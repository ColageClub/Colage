import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BillingClient } from "./BillingClient";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/ads");

  return <BillingClient session={session} />;
}
