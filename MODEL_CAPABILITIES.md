# Azure OpenAI Model Capabilities

This document outlines the capabilities and special features of different Azure OpenAI models supported by this application.

## Standard Models (GPT-4, GPT-3.5)

- **Streaming**: ✅ Full support
- **Connection**: Direct to Azure OpenAI API
- **Use Case**: General purpose, advanced reasoning, creative content

## O1 Models

- **Streaming**: ❌ Not supported (API limitation)
- **Connection**: Direct to Azure OpenAI API
- **Special Features**: Multi-step reasoning shown in final response
- **Use Case**: Complex reasoning, step-by-step problem solving

## Phi Models

- **Streaming**: ⚠️ Limited support (through backend proxy)
- **Connection**: Through backend proxy to Azure AI Studio
- **Use Case**: Efficient responses for simpler tasks, smaller model footprint

## DeepSeek Models

- **Streaming**: ✅ Full support (through backend proxy)
- **Connection**: Through backend proxy to Azure AI Studio
- **Use Case**: Strong code generation, technical problem solving

## Streaming Support

This application supports streaming responses, which means:
- Text appears incrementally as it's generated
- You get faster initial responses
- You can see the model's thinking process in real-time

For models that don't support streaming (like O1), the application waits for the complete response before displaying it.

## Connection Methods

Models connect through two different paths:

1. **Direct Azure OpenAI API**: Standard and O1 models connect directly from your browser to the Azure OpenAI API.

2. **Backend Proxy**: Phi and DeepSeek models connect through our Express backend server, which forwards requests to Azure AI Studio and relays the responses back. This approach helps avoid CORS issues and provides better error handling.
