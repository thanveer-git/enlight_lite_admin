export const ROUTES = {
  admin: {
    root: "/admin_modern",
    listings: "/admin_modern/listings",
    forms: "/admin_modern/forms",
    wizards: "/admin_modern/wizards",
    settings: "/admin_modern/settings",
    rubrics: {
      root: "/admin_modern/rubrics",
      all: "/admin_modern/rubrics",
      // `form` takes the rubric id in the path. `0` (or any non-existing
      // id) means create a new rubric; existing ids open the editor.
      form: (id: string | number = 0) => `/admin_modern/rubrics/form/${id}`,
    },
    submissions: {
      root: "/admin_modern/submissions",
      list: "/admin_modern/submissions",
      // `detail` takes a submission id and opens the evaluation console.
      detail: (id: string) => `/admin_modern/submissions/${id}`,
    },
  },
  dev: {
    primitives: "/dev/primitives",
    composites: "/dev/composites",
    templates: "/dev/templates",
    providers: "/dev/providers",
  },
} as const;

export type RouteKey = keyof typeof ROUTES;
