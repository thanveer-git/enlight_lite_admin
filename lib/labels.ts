/**
 * Centralized user-facing terminology.
 *
 * Change these constants to rebrand the term across the admin app
 * (assignment form, rubric form, access rules, simulations, etc.).
 *
 * Examples of where these are used:
 *   - AccessRuleCard: "Assign to" audience labels
 *   - ResolvedPreview: "Learners" header in the Simulate access dialog
 *   - Search placeholders ("Search learners…", "No learners found.")
 */
export const LEARNER_LABEL = {
  singular: "Learner",
  plural: "Learners",
} as const;