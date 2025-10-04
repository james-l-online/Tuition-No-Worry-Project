"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";

export default function LogoutPage() {
  const router = useRouter();

  const { signOut } = useClerk();

  useEffect(() => {
    async function doSignOut() {
      try {
        await signOut();
      } finally {
        // After sign out, go to root — optional catch-all sign-in will render
        router.replace("/");
      }
    }

    doSignOut();
  }, [router, signOut]);

  return null;
}
