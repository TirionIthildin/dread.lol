import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { getShortLinkRedirect } from "@/lib/member-profiles";

type Props = { params: Promise<{ slug: string; link: string }> };

export default async function ProfileShortLinkPage({ params }: Props) {
  const { slug, link } = await params;
  const result = await getShortLinkRedirect(slug, link);
  if (!result) notFound();
  redirect(result.url);
}
