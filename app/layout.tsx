
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "UOS CONNECT | University Student Helpdesk",
  description:
    "UOS CONNECT is an independent student demonstration project featuring a rule-based University of Sargodha helpdesk chatbot.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
