import { EditorLoader } from "@/components/editor/EditorLoader";
import { BRAND } from "@/config/brand";

export const metadata = { title: `${BRAND.name} · Editor` };

export default function Page() {
  return <EditorLoader />;
}
