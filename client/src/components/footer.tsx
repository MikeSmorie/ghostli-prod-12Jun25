import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Twitter, Linkedin, Youtube } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const handleLinkClick = (link: string) => {
    if (link === "mailto:contact@ghostliai.com") {
      window.location.href = link;
    } else {
      // For now, these can be placeholder links
      console.log(`Navigate to: ${link}`);
    }
  };

  return (
    <footer className="bg-white dark:bg-gray-950 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          
          {/* Left Side - Navigation Links */}
          <div className="flex flex-wrap items-center justify-center md:justify-start space-x-6 text-sm">
            <Button
              variant="link"
              className="p-0 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("/about")}
            >
              About
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("/terms")}
            >
              Terms of Use
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("/privacy")}
            >
              Privacy Policy
            </Button>
            <Button
              variant="link"
              className="p-0 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("mailto:contact@ghostliai.com")}
            >
              Contact Us
            </Button>
          </div>

          {/* Center - Copyright */}
          <div className="text-sm text-foreground/70 text-center md:order-2">
            © GhostliAI {currentYear}. All Rights Reserved.
          </div>

          {/* Right Side - Social Icons */}
          <div className="flex items-center space-x-4 md:order-3">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("https://twitter.com/ghostliai")}
            >
              <Twitter className="h-4 w-4" />
              <span className="sr-only">Twitter</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("https://linkedin.com/company/ghostliai")}
            >
              <Linkedin className="h-4 w-4" />
              <span className="sr-only">LinkedIn</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="p-2 h-auto text-foreground/70 hover:text-foreground"
              onClick={() => handleLinkClick("https://youtube.com/@ghostliai")}
            >
              <Youtube className="h-4 w-4" />
              <span className="sr-only">YouTube</span>
            </Button>
          </div>
        </div>

        {/* Mobile Layout Adjustments */}
        <div className="md:hidden mt-4">
          <Separator />
          <div className="flex justify-center mt-4">
            <p className="text-xs text-foreground/60">
              Powered by advanced AI technology
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}