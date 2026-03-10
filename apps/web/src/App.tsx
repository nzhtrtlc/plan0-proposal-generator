import { Header } from "./components/Header";
import { FormFields } from "./containers/ProposalGenerator";

function App() {
   return (
      <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-950">
         <Header />

         <main className="flex flex-1 items-center justify-center px-4">
            <div className="w-full max-w-4xl rounded-lg bg-white p-6 shadow dark:bg-gray-900 flex flex-col gap-4 my-4">
               <FormFields />
            </div>
         </main>
      </div>
   );
}

export default App;
