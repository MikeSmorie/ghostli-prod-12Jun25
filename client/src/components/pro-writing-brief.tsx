import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Crown, 
  FileText, 
  Settings2, 
  BookOpen,
  Target, 
  Sparkles, 
  RefreshCw
} from "lucide-react";

// Define interface for props
interface ProWritingBriefProps {
  onSubmit: (data: ProWritingBriefValues) => void;
  isSubmitting: boolean;
}

// Define type for form values
export type ProWritingBriefValues = {
  title: string;
  description: string;
  contentType: string;
  audience: string;
  tone: string;
  style: string;
  wordCount: number;
  useCloneMe: boolean;
  humanizationLevel: number;
  keywords: string;
  keywordDensity: string;
  forceSourceLinks: boolean;
  dialectJargon: string;
  customDialect?: string;
  dialectSample?: string;
};

// Form validation schema
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  contentType: z.string(),
  audience: z.string(),
  tone: z.string(),
  style: z.string(),
  wordCount: z.coerce.number().min(100).max(5000),
  useCloneMe: z.boolean(),
  humanizationLevel: z.number().min(0).max(15),
  keywords: z.string().optional(),
  keywordDensity: z.string(),
  forceSourceLinks: z.boolean(),
  dialectJargon: z.string(),
  customDialect: z.string().optional(),
  dialectSample: z.string().optional()
});

export function ProWritingBrief({ onSubmit, isSubmitting }: ProWritingBriefProps) {
  const form = useForm<ProWritingBriefValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      contentType: "article",
      audience: "general",
      tone: "professional",
      style: "informative",
      wordCount: 1500,
      useCloneMe: false,
      humanizationLevel: 5,
      keywords: "",
      keywordDensity: "medium",
      forceSourceLinks: false,
      dialectJargon: "general",
      customDialect: "",
      dialectSample: ""
    },
  });

  const handleSubmit = (values: ProWritingBriefValues) => {
    onSubmit(values);
  };

  return (
    <Card className="w-full">
      <CardHeader className="bg-blue-100 dark:bg-blue-950/50 border-b">
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Professional Writing Brief
          </CardTitle>
          <Badge variant="outline" className="px-2 py-1 bg-blue-200 dark:bg-blue-900 font-medium">
            <Crown className="h-3 w-3 mr-1" />
            Pro Feature
          </Badge>
        </div>
        <CardDescription className="text-blue-800 dark:text-blue-300">
          Define your content requirements in detail for precise, professional results
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
            {/* Basic Content Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Content Information
              </h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title/Topic</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the title or main topic" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you want the content to cover"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select content type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="article">Article</SelectItem>
                          <SelectItem value="blog">Blog Post</SelectItem>
                          <SelectItem value="essay">Essay</SelectItem>
                          <SelectItem value="report">Report</SelectItem>
                          <SelectItem value="press_release">Press Release</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="audience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Audience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select target audience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="expert">Expert/Technical</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                          <SelectItem value="students">Students</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Style & Tone */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center">
                <Target className="mr-2 h-5 w-5" />
                Style &amp; Tone
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select tone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="conversational">Conversational</SelectItem>
                          <SelectItem value="formal">Formal</SelectItem>
                          <SelectItem value="persuasive">Persuasive</SelectItem>
                          <SelectItem value="academic">Academic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="style"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Writing Style</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select writing style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="informative">Informative</SelectItem>
                          <SelectItem value="descriptive">Descriptive</SelectItem>
                          <SelectItem value="analytical">Analytical</SelectItem>
                          <SelectItem value="narrative">Narrative</SelectItem>
                          <SelectItem value="concise">Concise</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Dialect & Jargon Selector - Premium Feature */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center">
                <BookOpen className="mr-2 h-5 w-5" />
                Dialect &amp; Jargon
                <Badge variant="secondary" className="ml-2 text-xs">Premium</Badge>
              </h3>
              
              <FormField
                control={form.control}
                name="dialectJargon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dialect / Jargon Style</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select dialect or jargon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="general">US — General</SelectItem>
                        <SelectItem value="uk-general">UK — General</SelectItem>
                        <SelectItem value="australia">Australia</SelectItem>
                        <SelectItem value="jamaican">Jamaican English / Patois</SelectItem>
                        <SelectItem value="southern-us">Southern US</SelectItem>
                        <SelectItem value="aave">AAVE (African American Vernacular English)</SelectItem>
                        <SelectItem value="socal-surfer">SoCal Surfer</SelectItem>
                        <SelectItem value="elizabethan">Elizabethan / Archaic English</SelectItem>
                        <SelectItem value="legal">Legal</SelectItem>
                        <SelectItem value="academic">Academic</SelectItem>
                        <SelectItem value="medical">Medical</SelectItem>
                        <SelectItem value="journalism">Journalism</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="marketing-sales">Marketing / Sales</SelectItem>
                        <SelectItem value="technical-manual">Technical Manual</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {field.value === "aave" && (
                        <span className="text-amber-600 dark:text-amber-400 font-medium">
                          Note: Please ensure respectful and culturally appropriate usage
                        </span>
                      )}
                      {field.value !== "aave" && field.value !== "other" && field.value && (
                        "Select the dialect or professional jargon for your content"
                      )}
                      {field.value === "other" && (
                        "Describe your custom dialect or style below"
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Custom Dialect Fields - Show when "Other" is selected */}
              {form.watch("dialectJargon") === "other" && (
                <div className="space-y-4 pl-4 border-l-2 border-blue-200 dark:border-blue-800">
                  <FormField
                    control={form.control}
                    name="customDialect"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Describe your desired dialect / jargon / style</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., 1950s detective noir, Victorian literature, Silicon Valley tech..."
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide a clear description of the writing style you want
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="dialectSample"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Style Sample (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste a paragraph or two that exemplifies the style you want..."
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Provide sample text that demonstrates the desired style, tone, and vocabulary
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </div>
            
            {/* Advanced Options */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-semibold flex items-center">
                <Settings2 className="mr-2 h-5 w-5" />
                Advanced Options
              </h3>
              
              <FormField
                control={form.control}
                name="wordCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Word Count (100-5000)</FormLabel>
                    <FormControl>
                      <div className="flex items-center space-x-4">
                        <Slider
                          defaultValue={[field.value]}
                          max={5000}
                          min={100}
                          step={100}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{field.value}</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="useCloneMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Clone Me</FormLabel>
                        <FormDescription>
                          Use your writing style profile
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="humanizationLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center justify-between">
                        Humanization Level
                        <span className="text-sm text-muted-foreground">
                          {field.value}%
                        </span>
                      </FormLabel>
                      <FormControl>
                        <Slider
                          defaultValue={[field.value]}
                          max={15}
                          min={0}
                          step={1}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Keywords (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="SEO keywords to include" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="keywordDensity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keyword Density</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select density" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Low (3-5 times)</SelectItem>
                          <SelectItem value="medium">Medium (6-10 times)</SelectItem>
                          <SelectItem value="high">High (11-15 times)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="forceSourceLinks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Include Source Links</FormLabel>
                        <FormDescription>
                          Add authoritative citations
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Premium Content
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}