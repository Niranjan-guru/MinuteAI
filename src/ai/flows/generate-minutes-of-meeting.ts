'use server';

/**
 * @fileOverview Generates Minutes of Meeting (MoM) from a meeting transcription, considering historical MoMs for continuity.
 *
 * - generateMinutesOfMeeting - A function that generates MoM from the provided transcription.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// STEP 1: Define the INPUT Schema (the data we send to the AI)
// We use Zod to create a schema that defines the shape of our input.
// This ensures that the data sent to the flow is always structured correctly.
const GenerateMinutesOfMeetingInputSchema = z.object({
  transcription: z
    .string()
    .describe('The transcription of the online meeting.'),
  previousMom: z
    .string()
    .optional()
    .describe('The content of the previous Minutes of Meeting, if any.'),
});
export type GenerateMinutesOfMeetingInput = z.infer<typeof GenerateMinutesOfMeetingInputSchema>;


// STEP 2: Define the OUTPUT Schema (the structured data we want back from the AI)
// This is the most critical part for ensuring reliable output.
// We are instructing the AI to return a JSON object that conforms to this exact structure.
// The descriptions for each field act as instructions for the AI on what to populate.
const GenerateMinutesOfMeetingOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the meeting\'s key discussion points and decisions.'),
  minutesOfMeeting: z.string().describe('The generated Minutes of Meeting document, formatted as a detailed list or narrative.'),
  actionItems: z.string().describe('A list of identified action items with assigned owners and deadlines, formatted clearly.'),
});
export type GenerateMinutesOfMeetingOutput = z.infer<typeof GenerateMinutesOfMeetingOutputSchema>;


/**
 * This is the main function that the application calls. It serves as an entry point
 * and wrapper for the Genkit flow.
 * @param input The meeting transcription and optional previous MoM.
 * @returns A promise that resolves to the generated MoM, summary, and action items.
 */
export async function generateMinutesOfMeeting(
  input: GenerateMinutesOfMeetingInput
): Promise<GenerateMinutesOfMeetingOutput> {
  // Define the Genkit Prompt. This is where we engineer the instructions for the AI.
  const prompt = ai.definePrompt({
    name: 'generateMinutesOfMeetingPrompt',
    model: 'googleai/gemini-2.5-flash',
    
    // We connect our input and output schemas to the prompt.
    // Genkit uses these to validate data and instruct the model on what format to return.
    input: {schema: GenerateMinutesOfMeetingInputSchema},
    output: {schema: GenerateMinutesOfMeetingOutputSchema},

    // STEP 3: Craft the Instructions for the AI Model (The "Prompt")
    // This is a Handlebars template. The `{{{...}}}` syntax allows us to inject our input data.
    prompt: `You are an AI assistant specialized in generating Minutes of Meeting (MoM) documents from meeting transcriptions.

    Your task is to create a comprehensive MoM by analyzing the provided transcript. Identify key discussion points, decisions made, and specific action items.
    
    If a previous MoM is available, consider it as context and create the new MoM as a continuation, updating existing items where necessary.

    Transcription: {{{transcription}}}

    {{#if previousMom}}
    Previous Minutes of Meeting: {{{previousMom}}}
    {{else}}
    This is the first meeting, so generate the MoM accordingly.
    {{/if}}

    Your output MUST be a JSON object that strictly follows the requested schema.
    Generate the following three sections:
    - A concise summary of the meeting's key discussion points and decisions.
    - Detailed minutes of the meeting.
    - A clear, well-organized list of Action Items, including the assigned owner and deadline for each item.
  `,
  });

  // Define the Genkit Flow. This orchestrates the execution of the prompt.
  const generateMinutesOfMeetingFlow = ai.defineFlow(
    {
      name: 'generateMinutesOfMeetingFlow',
      inputSchema: GenerateMinutesOfMeetingInputSchema,
      outputSchema: GenerateMinutesOfMeetingOutputSchema,
    },
    async input => {
      // STEP 4: Execute the Prompt and Get the Structured Output
      // Genkit sends the compiled prompt (instructions + data) to the Google Gemini model.
      // The model processes the request and returns a structured JSON object conforming to our output schema.
      const {output} = await prompt(input);
      
      // The `output` is a fully-formed JavaScript object, not a raw string.
      return output!;
    }
  );

  // Run the flow with the provided input and return the result.
  return generateMinutesOfMeetingFlow(input);
}
