import { useState, createContext, useContext, useEffect } from "react";

const MultiSelectContext = createContext(null);

export function MultiSelect({ values = [], onValuesChange, children }) {
  const [selected, setSelected] = useState(values);

  useEffect(() => {
    setSelected(values);
  }, [values]);

  const toggleValue = (val) => {
    const newValues = selected.includes(val)
      ? selected.filter((v) => v !== val)
      : [...selected, val];
    setSelected(newValues);
    onValuesChange?.(newValues);
  };

  return (
    <MultiSelectContext.Provider value={{ selected, toggleValue }}>
      <div className="relative w-full">{children}</div>
    </MultiSelectContext.Provider>
  );
}

export function MultiSelectTrigger({ children, className, ...props }) {
  return (
    <button
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function MultiSelectContent({ children }) {
  return (
    <div className="absolute z-50 mt-1 max-h-60 w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95">
      <div className="overflow-y-auto p-1">{children}</div>
    </div>
  );
}

export function MultiSelectGroup({ children }) {
  return <div className="space-y-1">{children}</div>;
}

export function MultiSelectItem({ value, children }) {
  const context = useContext(MultiSelectContext);
  if (!context) return null;
  const { selected, toggleValue } = context;
  const isSelected = selected.includes(value);

  return (
    <div
      onClick={() => toggleValue(value)}
      className={`relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${
        isSelected ? "bg-accent/50" : ""
      }`}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        {isSelected && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </span>
      {children}
    </div>
  );
}

export function MultiSelectValue({ placeholder }) {
  const context = useContext(MultiSelectContext);
  if (!context) return null;
  const { selected } = context;

  return (
    <span className="pointer-events-none truncate text-muted-foreground">
      {selected.length > 0
        ? `${selected.length} item(s) selected`
        : placeholder}
    </span>
  );
}
