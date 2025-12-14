import { CATEGORIES } from '@/constants/categories';

export const CategoryLegend = () => {
  return (
    <div className="mt-4">
      <h4 className="text-center font-semibold mb-3 text-foreground">Total</h4>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {CATEGORIES.map((cat) => (
          <div key={cat.key} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: cat.color }}
            />
            <span className="text-foreground truncate">{cat.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
