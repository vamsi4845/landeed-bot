import {
    CopilotRuntime,
    GoogleGenerativeAIAdapter,
    copilotRuntimeNextJSAppRouterEndpoint,
} from "@copilotkit/runtime"

const serviceAdapter = new GoogleGenerativeAIAdapter({
    model: "gemini-1.5-flash",
})

const runtime = new CopilotRuntime()

export const POST = async (req: Request) => {
    const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
        runtime,
        serviceAdapter,
        endpoint: "/api/copilotkit",
    })

    return handleRequest(req)
}

