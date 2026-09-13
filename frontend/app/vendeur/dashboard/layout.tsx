import SellerShell from './_components/SellerShell';

export default function VendeurDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SellerShell>{children}</SellerShell>;
}
