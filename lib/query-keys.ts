export const queryKeys = {
  session: {
    all: ["session"] as const,
    me: () => [...queryKeys.session.all, "me"] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params?: Record<string, unknown>) =>
      params ? ([...queryKeys.users.all, "list", params] as const) : ([...queryKeys.users.all, "list"] as const),
    detail: (id: string) => [...queryKeys.users.all, "detail", id] as const,
  },
  courses: {
    all: ["courses"] as const,
    list: (params?: Record<string, unknown>) =>
      params ? ([...queryKeys.courses.all, "list", params] as const) : ([...queryKeys.courses.all, "list"] as const),
  },
  rubrics: {
    all: ["rubrics"] as const,
    list: (params?: Record<string, unknown>) =>
      params ? ([...queryKeys.rubrics.all, "list", params] as const) : ([...queryKeys.rubrics.all, "list"] as const),
  },
} as const;
