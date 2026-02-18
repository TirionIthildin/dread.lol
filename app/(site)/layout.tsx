import PlaceholderLayout from "@/app/components/PlaceholderLayout";
import PageTransitionWrapper from "@/app/components/PageTransitionWrapper";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PlaceholderLayout>
      <PageTransitionWrapper>{children}</PageTransitionWrapper>
    </PlaceholderLayout>
  );
}
