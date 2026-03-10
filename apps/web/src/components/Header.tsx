import { DarkModeToggle } from "./DarkModeToggle";

export function Header() {
   return (
      <header
         className="
        sticky top-0 z-50
        w-full
        border-b
        border-gray-200/50
        bg-white/70
        backdrop-blur
        dark:border-gray-800/50
        dark:bg-gray-950/70
      "
      >
         <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <div className="flex flex-col gap-0.5">
               <div className="flex items-baseline gap-2">
                  <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                     Proposal Generator
                  </div>
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 opacity-60">
                     v{APP_VERSION}
                  </span>
               </div>
               <a
                  href="https://plan0.ai/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors leading-none"
               >
                  by plan0.ai
               </a>
            </div>
            <div className="flex items-center gap-2">
               <DarkModeToggle />
            </div>
         </div>
      </header>
   );
}
