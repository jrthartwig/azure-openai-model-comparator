# Retrieval Augmented Generation (RAG) Guide

This guide explains how to set up and use the Retrieval Augmented Generation (RAG) feature in the Azure OpenAI Model Comparator.

## What is RAG?

Retrieval Augmented Generation (RAG) enhances AI model responses by retrieving relevant information from your own document collection and incorporating it into the prompt. This helps models provide more accurate, context-aware answers based on your specific data.

## Requirements

The RAG implementation requires:

1. **Azure AI Search (formerly Azure Cognitive Search) service**
   - A search service endpoint (e.g., `https://your-service.search.windows.net`)
   - An API key with query permissions
   - A properly configured index containing your documents

## Setting Up Azure AI Search

1. **Create an Azure AI Search resource** in the Azure portal
   - Go to [Azure Portal](https://portal.azure.com)
   - Search for "Azure AI Search" and create a new service
   - Choose an appropriate pricing tier (Basic or above recommended)

2. **Create a search index**
   - Create an index containing your documents
   - Each document should have at least these fields:
     - `id` (string): A unique identifier
     - `content` (string): The main text content of the document
     - Optional fields: `title` (recommended for citations), `url`, `source`, etc.

3. **Enable semantic search** (optional)
   - For simple keyword search, no additional configuration is needed
   - For enhanced semantic search:
     - Go to your search service in the Azure portal
     - Under "Semantic search", configure a semantic configuration
     - Update the application code to use this configuration (see Advanced Settings)

4. **CORS Settings** (NOT required for this application)
   - Since this application uses a backend proxy, you don't need to configure CORS in Azure
   - All requests are routed through the Express backend server, avoiding CORS issues

## Configuring RAG in the Application

1. **Expand the RAG Configuration panel**
   - Click on the "Retrieval Augmented Generation (RAG)" section to expand it

2. **Configure your Azure AI Search connection**:
   - **Endpoint**: Your Azure AI Search service URL (e.g., `https://your-service.search.windows.net`)
   - **Index Name**: The name of your search index
   - **API Key**: Your Azure AI Search query key
   - **API Version**: Leave as default (`2023-11-01`) unless you need a specific version

3. **Enable RAG**
   - After configuring, toggle the switch to enable RAG
   - When enabled, all queries will be enhanced with search results

## Advanced Settings

For semantic search support (more contextually aware but requires additional configuration):

1. **Create a semantic configuration in Azure AI Search**:
   - Go to your search service in the Azure portal
   - Enable semantic search under the "Semantic search" section
   - Create a configuration with a name (e.g., "default" or "my-config")

2. **Modify the code** to use semantic search:
   - In `src/services/ragService.ts`, find the `enhancePromptWithRag` function
   - Change `queryType: 'simple'` to `queryType: 'semantic'`
   - Add `semanticConfiguration: 'your-config-name'` (use the name you created)

## How It Works

1. When you submit a query with RAG enabled:
   - The application sends the query to the backend server
   - The backend server searches your Azure AI Search index for relevant documents
   - The top 3 most relevant documents are retrieved
   - The documents are formatted into a special prompt that instructs the model to answer based on the provided information
   - This enhanced prompt is sent to the model(s)

2. The models generate responses based on both:
   - The user's original query
   - The retrieved document content
   - **Citations**: The model will include document references like [Document 1] when using information from specific sources

## Citation Format

The RAG implementation is configured to have models cite their sources:

- When the model uses information from a document, it will add a citation like `[Document 1]`
- If document titles are available in your index, they will be included: `[Document 1 (Title)]`
- Multiple citations may appear when information comes from multiple documents

This citation feature helps:
- Verify the accuracy of information
- Understand which parts of the answer come from which sources
- Trace back to original documents for further investigation

## Troubleshooting

If you encounter issues:

- **Make sure the backend server is running** - All RAG requests are routed through the backend
- **Check your Azure AI Search endpoint URL** - It should be in the format `https://your-service.search.windows.net` without a trailing slash
- **Verify your API key** - Make sure you're using a query key with appropriate permissions
- **Check your index name** - The index must exist in your search service
- **Ensure your documents are properly indexed** - They should contain text in a field named `content` or `text`

### Semantic Search Errors

If you see errors like "Unknown semantic configuration":
- The application now defaults to simple search, which should work with any Azure AI Search service
- For semantic search, verify that:
  1. Your search service has semantic search enabled (requires Standard tier or above)
  2. You've created a semantic configuration in the Azure portal
  3. You've correctly specified the configuration name in the code
  
### No Results Returned

If no documents are returned:
- Check that your index has documents with text content
- Your query may not match any documents using simple search
- Try more general search terms
- Verify field names match what the code expects (content/text)