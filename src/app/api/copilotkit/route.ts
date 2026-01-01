import {
    CopilotRuntime,
    OpenAIAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime"
import OpenAI from "openai"

const copilotKit = new CopilotRuntime()

if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set")
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
})

const serviceAdapter = new OpenAIAdapter({
    // @ts-expect-error - CopilotKit has internal OpenAI v4/v5 type conflicts. The adapter works correctly at runtime.
    openai
})

export const POST = async (req: Request) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime: copilotKit,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    })

    return handleRequest(req)
}

