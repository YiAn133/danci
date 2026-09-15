import { redirect } from "next/navigation";
import { countAdmins } from "@/lib/admins";
import { getCurrentAdmin } from "@/lib/session";
import { SignInForm } from "./signin-form";

export const dynamic = "force-dynamic";

export default async function SignInPage() {
  if ((await countAdmins()) === 0) {
    redirect("/signup");
  }

  if (await getCurrentAdmin()) {
    redirect("/books");
  }

  return <SignInForm />;
}
