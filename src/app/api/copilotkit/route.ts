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

