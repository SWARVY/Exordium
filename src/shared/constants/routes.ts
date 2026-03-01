export const routes = {
  home: "/",
  posts: {
    list: "/posts",
    detail: (slug: string) => `/posts/${slug}`,
    new: "/posts/new",
    edit: (slug: string) => `/posts/${slug}/edit`,
  },
  projects: "/projects",
  auth: {
    callback: "/auth/callback",
  },
} as const
