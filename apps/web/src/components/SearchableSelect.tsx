import { useEffect, useMemo, useRef, useState } from "react";

type Option<T extends string | number> = {
   label: string;
   value: T;
};

type SearchableSelectProps<T extends string | number> = {
   options: Option<T>[];
   value: T | null;
   onChange: (value: T) => void;
   placeholder?: string;
   disabled?: boolean;
};

export function SearchableSelect<T extends string | number>({
   options,
   value,
   onChange,
   placeholder = "Select...",
   disabled = false,
}: SearchableSelectProps<T>) {
   const [isOpen, setIsOpen] = useState(false);
   const [searchTerm, setSearchTerm] = useState("");
   const containerRef = useRef<HTMLDivElement>(null);
   const searchRef = useRef<HTMLInputElement>(null);

   useEffect(() => {
      const handleClick = (e: MouseEvent) =>
         !containerRef.current?.contains(e.target as Node) && setIsOpen(false);
      if (isOpen) document.addEventListener("mousedown", handleClick);
      return () => document.removeEventListener("mousedown", handleClick);
   }, [isOpen]);

   // Focus search input when dropdown opens
   useEffect(() => {
      if (isOpen) setTimeout(() => searchRef.current?.focus(), 0);
      else setSearchTerm("");
   }, [isOpen]);

   const filteredOptions = useMemo(
      () =>
         options.filter((opt) =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase()),
         ),
      [options, searchTerm],
   );

   const selectedLabel = options.find((o) => o.value === value)?.label;

   return (
      <div ref={containerRef} className="relative w-full">
         {/* Trigger */}
         <div
            onClick={() => !disabled && setIsOpen((prev) => !prev)}
            onKeyDown={(e) => {
               if (disabled) return;
               if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setIsOpen((prev) => !prev);
               }
            }}
            role="combobox"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            className={`
               h-10 w-full rounded-md border px-3 text-sm flex items-center justify-between cursor-pointer transition-all
               ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-gray-400"}
               ${isOpen ? "ring-2 ring-blue-500 border-blue-500" : "border-gray-300 dark:border-gray-700"}
               bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100
            `}
         >
            <span className={selectedLabel ? "" : "text-gray-400"}>
               {selectedLabel ?? placeholder}
            </span>
            <svg
               className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
               fill="none"
               stroke="currentColor"
               viewBox="0 0 24 24"
            >
               <title>Toggle</title>
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
         </div>

         {/* Dropdown */}
         {isOpen && !disabled && (
            <div
               role="listbox"
               className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-lg overflow-hidden"
            >
               {/* Search */}
               <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                  <input
                     ref={searchRef}
                     className="w-full px-2 py-1 text-sm bg-gray-50 dark:bg-gray-700 border-none rounded focus:ring-0 outline-none text-gray-900 dark:text-gray-100"
                     placeholder="Search..."
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                  />
               </div>

               {/* Options */}
               <div className="max-h-60 overflow-y-auto p-1">
                  {filteredOptions.length > 0 ? (
                     filteredOptions.map((opt) => {
                        const isSelected = opt.value === value;
                        return (
                           <button
                              type="button"
                              key={opt.value}
                              onClick={() => {
                                 onChange(opt.value);
                                 setIsOpen(false);
                              }}
                              className={`
                                 flex w-full items-center justify-between px-3 py-2 text-sm rounded cursor-pointer transition-colors
                                 ${isSelected
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                                 }
                              `}
                           >
                              {opt.label}
                              {isSelected && (
                                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <title>Selected</title>
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                 </svg>
                              )}
                           </button>
                        );
                     })
                  ) : (
                     <div className="px-3 py-2 text-sm text-gray-500 text-center">No results found.</div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
}
