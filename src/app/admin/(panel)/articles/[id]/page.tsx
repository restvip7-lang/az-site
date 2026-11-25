import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/admin/auth";
import { getArticle } from "@/lib/admin/articles";
import { geoOptions } from "@/lib/admin/options";
import { blogPath } from "@/lib/blog";
import { deleteArticleAction, saveArticleAction } from "../../../actions";
import { ConfirmButton } from "@/components/admin/AdminUI";
import ArticleForm from "@/components/admin/ArticleForm";
import PageHead from "@/components/admin/PageHead";

export const metadata = { title: "Статья" };

const day = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function EditArticle({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  await requireStaff();
  const id = Number((await params).id);
  const a = Number.isInteger(id) ? await getArticle(id) : null;
  if (!a) notFound();
  const url = blogPath(a.category, a.slug);
  return (
    <>
      <PageHead title={a.title} sub={a.source_url ? `Перенесена с ${a.source_url}` : undefined} back={{ href: "/admin/articles/", label: "Все статьи" }} />
      {(await searchParams).saved && <p className="mb-6 rounded-[18px_6px_18px_6px] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-800">Сохранено.</p>}
      <ArticleForm
        key={a.updated_at.toISOString()}
        action={saveArticleAction}
        places={geoOptions()}
        values={{
          id: a.id, category: a.category, slug: a.slug, title: a.title, excerpt: a.excerpt ?? "", body: a.body, cover: a.cover ?? "", author: a.author ?? "",
          seo_title: a.seo_title ?? "", seo_description: a.seo_description ?? "", published: a.published, published_at: day(a.published_at),
          geo: a.geo ?? "", url: a.published ? url : undefined,
        }}
      />
      <form action={deleteArticleAction} className="mt-10 border-t border-brand-500/10 pt-6">
        <input type="hidden" name="id" value={a.id} />
        <ConfirmButton message={`Удалить статью «${a.title}»? Это нельзя отменить.`}>Удалить статью</ConfirmButton>
      </form>
    </>
  );
}
