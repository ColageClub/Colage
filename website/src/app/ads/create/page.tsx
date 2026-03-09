import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { CreateAdClient } from "./CreateAdClient";

export default async function CreateAdPage() {
  const session = await getSession();
  if (!session) redirect("/ads");

  return <CreateAdClient session={session} />;
}
