import { Metadata } from "next";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your Maneel Club account",
};

export default function SignInPage() {
  return <SignInForm />;
}
