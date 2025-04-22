import express from "express";
import axios from "axios";
import { db } from "@db";
import { activityLogs } from "@db/schema";
import { aiAssistant } from "../ai_assistant/service";
import { AIQuerySchema } from "../ai_assistant/types";

const router = express.Router();

// Handle AI query requests from the AI Assistant component
router.post("/query", async (req, res) => {
  try {
    const queryResult = AIQuerySchema.safeParse(req.body);
    
    if (!queryResult.success) {
      return res.status(400).json({ error: "Invalid AI query format", details: queryResult.error });
    }
    
    const aiResponse = await aiAssistant.processQuery(queryResult.data);
    res.json(aiResponse);
  } catch (error) {
    console.error("[ERROR] AI assistant query failed:", error);
    res.status(500).json({ 
      error: "AI assistant query failed", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Handle AI feedback
router.post("/feedback", async (req, res) => {
  try {
    const { responseId, userId, rating, helpful } = req.body;
    
    await aiAssistant.recordFeedback({
      responseId,
      userId,
      rating,
      helpful
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("[ERROR] AI feedback failed:", error);
    res.status(500).json({ error: "Failed to record AI feedback" });
  }
});

// Legacy route - Handle module suggestions
router.post("/suggest-modules", async (req, res) => {
  try {
    const { description } = req.body;

    if (!description) {
      return res.status(400).json({ error: "Description is required" });
    }

    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.error("[ERROR] Missing OpenAI API key");
      return res.status(500).json({ 
        error: "AI service unavailable", 
        message: "OpenAI API key not configured" 
      });
    }

    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
      model: "gpt-3.5-turbo",
      messages: [{ 
        role: "user", 
        content: `Suggest a module workflow for app: ${description}. Return as JSON with names and purposes. Format it with valid JSON syntax.` 
      }],
      max_tokens: 500,
      response_format: { type: "json_object" }
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const suggestions = response.data.choices[0].message.content;
    console.log("[DEBUG] AI Suggestions:", suggestions);

    // Log activity
    await db.insert(activityLogs).values({
      action: "ai_module_suggestion",
      userId: req.user?.id || 0,
      details: description,
      timestamp: new Date()
    });

    try {
      // Try to parse JSON
      const parsedSuggestions = JSON.parse(suggestions);
      res.json(parsedSuggestions);
    } catch (parseError) {
      console.error("[ERROR] Failed to parse AI suggestions as JSON:", parseError);
      // Return the raw content if parsing fails
      res.json({ 
        rawContent: suggestions,
        error: "Failed to parse response as JSON"
      });
    }
  } catch (error) {
    console.error("[ERROR] AI suggestion failed:", error);
    res.status(500).json({ 
      error: "AI suggestion failed", 
      message: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

export default router;