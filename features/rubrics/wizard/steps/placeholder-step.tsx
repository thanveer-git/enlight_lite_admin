export interface PlaceholderStepProps {
  stepNumber: number;
  title: string;
  description: string;
  preview?: string[];
}

export function PlaceholderStep({ stepNumber, title, description, preview }: PlaceholderStepProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="font-semibold text-base">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-md border border-dashed bg-muted/40 px-4 py-6 text-sm text-muted-foreground">
        <p>
          <span className="font-medium text-foreground">Step {stepNumber} is coming next.</span>{" "}
          This screen will be built in a follow-up PR.
        </p>
        {preview && preview.length > 0 && (
          <ul className="mt-3 list-inside list-disc space-y-1">
            {preview.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
