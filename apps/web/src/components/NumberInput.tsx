import { useEffect, useState } from "react";

type NumberInputProps = {
   id?: string;
   value: number;
   onChange: (value: number) => void;
   min?: number;
   step?: number;
};

export function NumberInput({
   id,
   value,
   onChange,
   min = 0,
   step = 1,
}: NumberInputProps) {
   const [raw, setRaw] = useState(String(value));

   // Sync when the external value changes (e.g. staff auto-fills rate)
   useEffect(() => {
      setRaw(String(value));
   }, [value]);

   const decrement = () => {
      const next = Math.max(min, Number((value - step).toFixed(10)));
      onChange(next);
      setRaw(String(next));
   };
   const increment = () => {
      const next = Number((value + step).toFixed(10));
      onChange(next);
      setRaw(String(next));
   };

   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const str = e.target.value;
      setRaw(str);
      const parsed = Number.parseFloat(str);
      if (!Number.isNaN(parsed) && parsed >= min) {
         onChange(parsed);
      }
   };

   const handleBlur = () => {
      const parsed = Number.parseFloat(raw);
      if (Number.isNaN(parsed) || parsed < min) {
         setRaw(String(min));
         onChange(min);
      } else {
         setRaw(String(parsed));
      }
   };

   return (
      <div className="flex items-center rounded-md border border-gray-300 dark:border-gray-700 overflow-hidden h-10">
         <button
            type="button"
            onClick={decrement}
            disabled={value <= min}
            className="px-2 h-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium select-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
         >
            −
         </button>
         <input
            id={id}
            type="number"
            value={raw}
            min={min}
            step={step}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full text-center text-sm bg-transparent outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-gray-900 dark:text-gray-100"
         />
         <button
            type="button"
            onClick={increment}
            className="px-2 h-full text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm font-medium select-none cursor-pointer"
         >
            +
         </button>
      </div>
   );
}
