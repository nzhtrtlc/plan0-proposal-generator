import { useState } from "react";

export function DarkModeToggle() {
   const [isDark, setDark] = useState(
      document.documentElement.classList.contains("dark"),
   );

   function toggleDarkMode() {
      const root = document.documentElement;
      const next = root.classList.toggle("dark");
      localStorage.setItem("theme", next ? "dark" : "light");
      setDark(next);
   }

   return (
      <button
         type="button"
         onClick={toggleDarkMode}
         aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
         className="flex items-center justify-center w-9 h-9 rounded-md text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
      >
         {isDark ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <title>Light mode</title>
               <circle cx="12" cy="12" r="4" />
               <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
         ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
               <title>Dark mode</title>
               <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
         )}
      </button>
   );
}
