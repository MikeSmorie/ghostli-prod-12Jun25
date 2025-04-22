import { useState } from "react";
import { useParams } from "wouter";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ModuleViewProps {
  moduleId?: string;
}

export default function ModuleView({ moduleId }: ModuleViewProps) {
  const params = useParams();
  const id = moduleId || params.id;
  const [moduleName, setModuleName] = useState(`Module ${id}`);
  const [inputValue, setInputValue] = useState("");
  const [outputResult, setOutputResult] = useState("");

  const processInput = () => {
    if (inputValue.trim()) {
      setOutputResult(`Processed input: ${inputValue}`);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="section">
        <h2>Module {id} Configuration</h2>
        
        <div className="instruction">
          This is the configuration page for {moduleName}. You can customize the module name and test its functionality below.
        </div>
        
        <div className="flex items-center gap-4 my-6">
          <label className="font-medium">Module Name:</label>
          <Input
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            className="input-field max-w-xs"
            placeholder="Enter module name"
          />
        </div>

        <h3>Module Testing</h3>
        
        <div className="my-4">
          <label className="block mb-2 font-medium">Input Data:</label>
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="input-field w-full"
            placeholder="Enter test data for this module"
          />
          <div className="mt-4">
            <Button onClick={processInput} className="btn-primary">
              Process Input
            </Button>
          </div>
        </div>

        {outputResult && (
          <div className="mt-6">
            <h4>Output Results:</h4>
            <div className="output-result">
              <p>{outputResult}</p>
            </div>
          </div>
        )}

        <Card className="mt-8 border border-blue-200">
          <CardContent className="pt-6">
            <h4 className="text-lg mb-2">Module Information</h4>
            <p>
              <strong>Module ID:</strong> {id}
            </p>
            <p>
              <strong>Module Name:</strong> {moduleName}
            </p>
            <p>
              <strong>Status:</strong> Active
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}