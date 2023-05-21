import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ghostAdminAPI } from "~/ghost";

async function getBlogPost(slug: string) {
  const response = await ghostAdminAPI.posts.read({ slug }).formats({ html: true }).fetch();
  if (!response.success) {
    console.log(response.errors.join(", "));
    return null;
  }
  return response.data;
}

interface PostProps {
  params: { slug: string };
}

export default async function PostPage({ params }: PostProps) {
  console.log(params);
  const post = await getBlogPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <div>
      <small>
        <Link href="/">⬅️ Go back</Link>
      </small>
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.html }}></div>
    </div>
  );
}
