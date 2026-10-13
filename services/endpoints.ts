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
    list: "/admin/rubrics_api",
    detail: (id: string | number) => `/admin/rubrics_api/${id}`,
    duplicate: (id: string | number) => `/admin/rubrics_api/duplicate/${id}`,
    changeStatus: (id: string | number) => `/admin/rubrics_api/status/${id}`,
    bulkStatus: "/admin/rubrics_api/status",
    delete: (id: string | number) => `/admin/rubrics_api/delete/${id}`,
    bulkDelete: "/admin/rubrics_api/delete",
  },
  configuration: {
    access: "/admin/configuration/access",
  },
  reactConfigs: {
    initialData: "/admin/react_configs/initialdata",
  },
  gradeGroups: {
    list: "/admin/grades_api",
    detail: (slug: string) => `/admin/grades_api/groups/${slug}`,
    changeStatus: "/admin/grades_api/status",
    delete: "/admin/grades_api/delete",
    bands: (slug: string) => `/admin/grades_api/groups/${slug}/bands`,
    bandDetail: (id: number) => `/admin/grades_api/bands/${id}`,
    reorder: "/admin/grades_api/bands/reorder",
  },
} as const;
