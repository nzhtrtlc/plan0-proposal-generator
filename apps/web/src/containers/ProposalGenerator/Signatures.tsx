import type { Staff } from "@packages/types";
import { useEffect, useState } from "react";
import { MultiSelect } from "../../components/MultiSelect";
import { getStaff } from "../../utils/actions";

export default function Signatures({
   onChange,
   value,
}: {
   onChange: (value: Staff[]) => void;
   value: Staff[];
}) {
   const [staffList, setStaffList] = useState<Staff[]>([]);
   const [isLoading, setIsLoading] = useState(true);

   useEffect(() => {
      getStaff().then(setStaffList).finally(() => setIsLoading(false));
   }, []);

   const handleChange = (selectedIds: string[]) => {
      const selected = selectedIds
         .map((id) => staffList.find((s) => s.id === id))
         .filter(Boolean) as Staff[];
      onChange(selected);
   };

   return (
      <MultiSelect
         options={staffList.map((s) => ({
            label: `${s.name} ${s.surname}`,
            value: s.id,
         }))}
         value={value.map((s) => s.id)}
         onChange={handleChange}
         disabled={isLoading}
         placeholder={isLoading ? "Loading..." : "Select up to 2 signatories..."}
         maxItems={2}
      />
   );
}
