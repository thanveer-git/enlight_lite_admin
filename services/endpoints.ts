export const ENDPOINTS = {
  session: {
    me: "/session/me",
  },
  users: {
    list: "/users",
    detail: (id: string) => `/users/${id}`,
  },
  courses: {
    list: "/courses",
  },
  rubrics: {
    list: "/rubrics",
  },
} as const;
