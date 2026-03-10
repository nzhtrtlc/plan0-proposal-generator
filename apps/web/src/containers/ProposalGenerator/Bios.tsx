import type { Bio } from "@packages/types";
import { useEffect, useState } from "react";
import { MultiSelect } from "../../components/MultiSelect";
import { getBios } from "../../utils/actions";

export default function Bios({
   onChange,
   value,
}: {
   onChange: (value: Bio[]) => void;
   value: Bio[];
}) {
   const [availableBios, setAvailableBios] = useState<Bio[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      getBios().then(setAvailableBios).finally(() => setIsLoading(false));
   }, []);

   const handleChange = (selectedIds: string[]) => {
      const selectedBios = selectedIds
         .map((id) => availableBios.find((b) => b.id === id))
         .filter(Boolean) as Bio[];
      onChange(selectedBios);
   };

   return (
      <MultiSelect
         options={availableBios.map((bio) => ({
            label: bio.name,
            value: bio.id,
         }))}
         value={value.map((v) => v.id)}
         onChange={handleChange}
         disabled={isLoading}
         placeholder={isLoading ? "Loading..." : "Select options..."}
      />
   );
}
