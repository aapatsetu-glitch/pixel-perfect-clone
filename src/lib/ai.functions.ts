import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const AskInput = z.object({ message: z.string().min(1).max(4000) });

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AskInput.parse(input))
  .handler(async ({ data, context }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("AI is not configured yet. Please try again later.");

    const { data: rows, error } = await context.supabase
      .from("consignments")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1000);
    if (error) throw new Error(`Could not load cargo data: ${error.message}`);

    const { buildAssistantPrompt } = await import("./ai-prompt");
    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const { streamText } = await import("ai");

    const gateway = createLovableAiGatewayProvider(key);
    try {
      const result = streamText({
        model: gateway("google/gemini-3.5-flash"),
        prompt: buildAssistantPrompt(JSON.stringify(rows ?? []), data.message),
      });
      return await result.text;
    } catch (err) {
      const status = (err as { statusCode?: number; status?: number }).statusCode ??
        (err as { status?: number }).status;
      if (status === 429) throw new Error("The assistant is busy right now. Please try again in a moment.");
      if (status === 402) throw new Error("AI credits are exhausted. Please add credits to continue using the assistant.");
      throw new Error("The assistant could not answer that. Please try again.");
    }
  });
