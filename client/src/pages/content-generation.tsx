import ContentGenerator from '../components/content-generator';

export default function ContentGenerationPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Content Generation</h1>
        <p className="text-muted-foreground mt-2">
          Create high-quality content with AI assistance. Customize tone, style, and more.
        </p>
      </div>
      
      <ContentGenerator />
    </div>
  );
}