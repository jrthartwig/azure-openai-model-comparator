import { RagConfig, RagSearchResult, RagRequestOptions } from '../types';

// Search for documents in the index through the backend proxy
export async function searchDocuments(
  ragConfig: RagConfig, 
  options: RagRequestOptions
): Promise<RagSearchResult> {
  const { indexEndpoint, indexName, apiKey, apiVersion = '2023-11-01' } = ragConfig;
  
  if (!indexEndpoint || !indexName || !apiKey) {
    throw new Error('RAG configuration is incomplete');
  }
  
  try {
    // Use the backend proxy endpoint instead of calling Azure directly
    const proxyUrl = '/api/rag/search';
    
    // Default to simple search (which doesn't require semantic configuration)
    const queryType = options.queryType || 'simple';
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // Pass all the configuration and search parameters to the backend
        endpoint: indexEndpoint,
        indexName: indexName,
        apiKey: apiKey,
        apiVersion: apiVersion,
        query: options.query,
        top: options.top || 3,
        queryType: queryType,
        // Only include semanticConfiguration if doing semantic search
        semanticConfiguration: queryType === 'semantic' ? (options.semanticConfiguration || null) : null,
        filter: options.filter
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Search Error: ${response.status} - ${errorText}`);
    }
    
    const searchResult = await response.json();
    
    // Transform to our format
    return {
      documents: searchResult.value.map((item: any) => ({
        id: item.id || item['@search.score'] || '',
        content: item.content || item.text || JSON.stringify(item),
        title: item.title || '',
        url: item.url || '',
        source: item.source || ''
      })),
      query: options.query
    };
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
}

// Generate RAG prompt with retrieved documents and citation instructions
export function generateRagPrompt(query: string, searchResults: RagSearchResult): string {
  const documents = searchResults.documents.map((doc, index) => {
    const sourceInfo = doc.title ? ` (${doc.title})` : '';
    return `[Document ${index + 1}${sourceInfo}]\n${doc.content}\n`;
  }).join('\n');
  
  return `
You are an AI assistant answering questions based on the provided documents.
Use only the information in the documents to answer the question.
If the documents don't contain the answer, say "I don't have enough information to answer that question."

Important Instructions:
1. When you use information from the documents, cite the source like this: [Document X]
2. Include multiple citations if you use information from multiple documents
3. Don't make up information that isn't in the documents
4. Answer in a clear, concise manner

DOCUMENTS:
${documents}

QUESTION: ${query}

ANSWER (with citations):
  `.trim();
}

// Helper to enhance a prompt with RAG
export async function enhancePromptWithRag(
  ragConfig: RagConfig,
  userQuery: string
): Promise<string> {
  if (!ragConfig.enabled) {
    return userQuery;
  }
  
  try {
    const searchResults = await searchDocuments(ragConfig, {
      query: userQuery,
      top: 3,
      queryType: 'simple', // Use simple search as default for compatibility
    });
    
    return generateRagPrompt(userQuery, searchResults);
  } catch (error) {
    console.error('Failed to enhance prompt with RAG:', error);
    throw error;
  }
}
