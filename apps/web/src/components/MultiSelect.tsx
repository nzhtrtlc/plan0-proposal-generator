import { useEffect, useMemo, useRef, useState } from "react";

type Option<T extends string | number> = {
   label: string;
   value: T;
};

type MultiSelectProps<T extends string | number> = {
   options: Option<T>[];
   value: T[];
   onChange: (value: T[]) => void;
   placeholder?: string;
   disabled?: boolean;
   maxItems?: number;
};

export function MultiSelect<T extends string | number>({
   options,
   value = [], // Default to empty array to prevent .includes() errors
   onChange,
   placeholder = "Select options...",
   disabled = false,
   maxItems,
}: MultiSelectProps<T>) {
   const [isOpen, setIsOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const containerRef = useRef<HTMLDivElement>(null);

   // Close when clicking outside
   useEffect(() => {
      const handleClick = (e: MouseEvent) =>
         !containerRef.current?.contains(e.target as Node) && setIsOpen(false);
      if (isOpen) document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
   }, [isOpen]);

   const filteredOptions = useMemo(
      () =>
         options.filter((opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
         ),
      [options, searchTerm],
   );
   const toggleOption = (val: T) => {
      if (value.includes(val)) {
         onChange(value.filter((v) => v !== val));
      } else if (maxItems === undefined || value.length < maxItems) {
         onChange([...value, val]);
      }
   };

   const removeValue = (e: React.MouseEvent, val: T) => {
      e.stopPropagation();
      onChange(value.filter((v) => v !== val));
   };

   // Get labels for selected values
   const selectedOptions = options.filter((opt) => value.includes(opt.value));

   return (
      <div ref={containerRef} className="relative w-full">
         {/* Input Area / Trigger */}
         <div
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={(event) => {
               if (disabled) return;
               if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setIsOpen((prev) => !prev);
               }
            }}
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className={`
          min-h-[40px] w-full rounded-md border p-1 text-sm flex flex-wrap gap-1 cursor-pointer transition-all
          ${
             disabled
                ? "opacity-50 cursor-not-allowed"
                : "hover:border-gray-400"
          }
          ${
             isOpen
                ? "ring-2 ring-blue-500 border-blue-500"
                : "border-gray-300 dark:border-gray-700"
          }
          bg-white dark:bg-gray-900
        `}
         >
            {selectedOptions.length > 0 ? (
               selectedOptions.map((opt) => (
                  <span
                     key={opt.value}
                     className="flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
                  >
                     {opt.label}
                     <button
                        type="button"
                        onClick={(e) => removeValue(e, opt.value)}
                        className="hover:text-blue-600 dark:hover:text-blue-100 outline-none"
                     >
                        ×
                     </button>
                  </span>
               ))
            ) : (
               <span className="text-gray-400 px-2 py-1">{placeholder}</span>
            )}
         </div>

         {/* Dropdown Menu */}
         {isOpen && !disabled && (
            <div
               role="listbox"
               className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
            >
               {/* Search Bar */}
               <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <input
                     className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border-none rounded focus:ring-0 outline-none text-gray-900 dark:text-gray-100"
                     placeholder="Search..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               {/* Options List */}
               <div className="max-h-60 overflow-y-auto p-1">
                  {filteredOptions.length > 0 ? (
                     filteredOptions.map((opt) => {
                        const isSelected = value.includes(opt.value);
                        return (
                           <button
                              type="button"
                              key={opt.value}
                              onClick={() => toggleOption(opt.value)}
                              onKeyDown={(event) => {
                                 if (
                                    event.key === "Enter" ||
                                    event.key === " "
                                 ) {
                                    event.preventDefault();
                                    toggleOption(opt.value);
                                 }
                              }}
                              className={`
                      flex w-full items-center justify-between px-3 py-2 text-sm rounded cursor-pointer transition-colors
                      ${
                         isSelected
                            ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                      }
                    `}
                           >
                              {opt.label}
                              {isSelected && (
                                 <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                 >
                                    <title>Selected</title>
                                    <path
                                       strokeLinecap="round"
                                       strokeLinejoin="round"
                                       strokeWidth={2}
                                       d="M5 13l4 4L19 7"
                                    />
                                 </svg>
                              )}
                           </button>
                        );
                     })
                  ) : (
                     <div className="px-3 py-2 text-sm text-gray-500 text-center">
                        No options found.
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
