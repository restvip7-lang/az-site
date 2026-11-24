import { requireStaff } from "@/lib/admin/auth";
import { saveArticleAction } from "../../../actions";
import ArticleForm from "@/components/admin/ArticleForm";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Новая статья" };

export default async function NewArticle() {
  const me = await requireStaff();
  return (
    <>
      <PageHead title="Новая статья" back={{ href: "/admin/articles/", label: "Все статьи" }} />
      <ArticleForm action={saveArticleAction} values={{ category: "news", slug: "", title: "", excerpt: "", body: "", cover: "", author: me.name, seo_title: "", seo_description: "", published: false, published_at: "" }} />
    </>
  );
}
