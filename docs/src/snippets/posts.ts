interface Post {
  id: number
  title: string
}

// Fetch the titles of recent blog posts.
export async function getTitles(limit = 5): Promise<string[]> {
  const response = await fetch(`https://example.com/posts?limit=${limit}`)
  const posts: Post[] = await response.json()
  return posts.map((post) => post.title)
}
