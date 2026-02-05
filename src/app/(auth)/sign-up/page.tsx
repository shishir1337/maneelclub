import { Metadata } from "next";
import { SignUpForm } from "./sign-up-form";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new Maneel Club account",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
