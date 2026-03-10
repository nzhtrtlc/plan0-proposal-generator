import { Input } from "../../components/Input";

interface FileUploadProps {
   file: File | null;
   isLoading: boolean;
   onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
   onClear: () => void;
}

export function FileUpload({
   file,
   isLoading,
   onFileChange,
   onClear,
}: FileUploadProps) {
   if (file) {
      return (
         <div
            className={`flex items-center justify-between p-2 border rounded-md bg-gray-50 dark:bg-gray-800 ${
               isLoading ? "opacity-50" : ""
            }`}
         >
            <span className="text-sm truncate max-w-[200px]">{file.name}</span>
            <button
               type="button"
               onClick={onClear}
               className="text-gray-500 hover:text-red-500 transition-colors px-2 cursor-pointer"
            >
               ✕
            </button>
         </div>
      );
   }

   return (
      <Input type="file" onChange={onFileChange} accept="application/pdf" />
   );
}
