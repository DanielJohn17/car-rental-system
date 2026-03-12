"use client";

export function FilterCloseButton() {
  return (
    <button
      onClick={(e) => {
        const details = (e.target as HTMLElement).closest("details");
        if (details) details.open = false;
      }}
      className="text-muted-foreground hover:text-foreground"
    >
      Close
    </button>
  );
}
