interface CategoryHeaderProps {
  title: string;
  description?: string | null;
  productCount: number;
}

export function CategoryHeader({ title, description }: CategoryHeaderProps) {
  return (
    <div className="mb-8">
      <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
      {description && (
        <p className="text-muted-foreground max-w-2xl">{description}</p>
      )}
    </div>
  );
}
