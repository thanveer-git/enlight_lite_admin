import type { RubricMatrix, RubricType } from "@/types/rubric";

export interface RubricDraft {
  name: string;
  outcome: string;
  type: RubricType | null;
  matrix: RubricMatrix;
}
