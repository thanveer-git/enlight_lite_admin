export const ROUTES = {
  admin: {
    root: "/admin",
    listings: "/admin/listings",
    forms: "/admin/forms",
    wizards: "/admin/wizards",
    settings: "/admin/settings",
    rubrics: {
      root: "/admin/rubrics",
      all: "/admin/rubrics",
      // `form` takes the rubric id in the path. `0` (or any non-existing
      // id) means create a new rubric; existing ids open the editor.
      form: (id: string | number = 0) => `/admin/rubrics/form/${id}`,
    },
    grading: {
      root: "/admin/grading",
      all: "/admin/grading",
      // `form` takes the grade-scale id. `0` means create a new scale;
      // existing ids open the editor (letter-grading only).
      form: (id: string | number = 0) => `/admin/grading/form/${id}`,
    },
    submissions: {
      root: "/admin/submissions",
      list: "/admin/submissions",
      // `detail` takes a submission id and opens the evaluation console.
      detail: (id: string) => `/admin/submissions/${id}`,
    },
    assignments: {
      root: "/admin/assignments",
      all: "/admin/assignments",
      // `form` takes the assignment id. `0` (or any non-existing id) means
      // create a new assignment; existing ids open the editor.
      form: (id: string | number = 0) => `/admin/assignments/form/${id}`,
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
