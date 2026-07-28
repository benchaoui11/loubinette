import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/server";
import { getServerEnv } from "@/lib/validation/env";

export type CurrentAdmin = {
  id: string;
  email: string;
  role: "owner_bootstrap";
};

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const env = getServerEnv();
  const supabase = await createSupabaseAuthServerClient();
  if (!supabase || !env.OWNER_ADMIN_EMAIL) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase();
  if (!user || !email) return null;
  if (email !== env.OWNER_ADMIN_EMAIL.toLowerCase()) return null;

  return { id: user.id, email, role: "owner_bootstrap" };
}

export async function requireCurrentAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/login");
  return admin;
}
