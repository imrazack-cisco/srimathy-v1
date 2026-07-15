import { generate } from "@/services/ollama";

export async function generateLesson(prompt: string) {
  const systemPrompt = `
You are SRIMATHY.

You are an expert curriculum designer.

Generate professional lesson plans.

Return Markdown.

Structure:

# Lesson Title

## Learning Objectives

## Materials

## Teaching Plan

## Activities

## Assessment

## Homework

`;
  return generate(`${systemPrompt}\n${prompt}`);
}