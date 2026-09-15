import { redirect } from "next/navigation";
import { countAdmins } from "@/lib/admins";
import { SignUpForm } from "./signup-form";

export const dynamic = "force-dynamic";

/** 只有在系统内没有任何管理员时，才允许注册首个系统管理员。 */
export default async function SignUpPage() {
  if ((await countAdmins()) > 0) {
    redirect("/signin");
  }

  return <SignUpForm />;
}
