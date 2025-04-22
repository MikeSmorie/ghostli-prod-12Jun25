import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";

export default function AppCentral() {
  const [, setLocation] = useLocation();
  const [moduleNames] = useState<string[]>(
    Array.from({ length: 6 }, (_, i) => `Module ${i + 1}`)
  );

  const modules = Array.from({ length: 6 }, (_, i) => ({
    id: i + 1,
    name: moduleNames[i],
    path: `/module/${i + 1}`
  }));

  return (
    <div className="container mx-auto py-6">
      <div className="section">
        <h1>Application Modules</h1>
        
        <div className="instruction">
          Select a module below to view its details and functionality.
        </div>

        <div className="flex justify-end my-4">
          <Button 
            className="btn-primary"
            onClick={() => setLocation("/subscription")}
          >
            Manage Subscription
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {modules.map((module) => (
            <Card 
              key={module.id}
              className="hover:shadow-lg transition-shadow cursor-pointer bg-white border border-gray-200"
              onClick={() => setLocation(`/module/${module.id}`)}
            >
              <div className="p-5">
                <h3 className="text-lg w-full text-center">{module.name}</h3>
                <p className="mt-2 text-sm text-gray-600">Click to access module functionality</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}