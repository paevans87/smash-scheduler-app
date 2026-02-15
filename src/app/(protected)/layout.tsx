import { checkAssociationGate, checkSubscriptionGate } from "@/lib/auth/gates";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clubIds = await checkAssociationGate();
  await checkSubscriptionGate(clubIds);

  return <>{children}</>;
}
