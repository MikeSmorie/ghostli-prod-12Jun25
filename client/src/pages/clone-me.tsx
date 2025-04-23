import CloneMe from '@/components/clone-me';

export default function CloneMePage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Clone Me</h1>
        <p className="text-muted-foreground mt-2">
          Advanced content generation that learns and mimics your unique writing style.
          Submit your essay samples to create content that sounds exactly like you wrote it.
        </p>
        <div className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-300 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
            Premium Feature - Submit 3-5 essay samples to analyze and clone your writing style.
          </p>
        </div>
      </div>
      
      <CloneMe />
    </div>
  );
}