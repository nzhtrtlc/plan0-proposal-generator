type FieldProps = {
   label: string;
   id: string;
   error?: string;
   required?: boolean;
   children: React.ReactNode;
};

export function FormField({ label, id, error, required, children }: FieldProps) {
   return (
      <div className="flex flex-col gap-1">
         <label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 dark:text-gray-300"
         >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
         </label>
         {children}
         {error && <span className="text-xs text-red-500 mt-0.5">{error}</span>}
      </div>
   );
}
