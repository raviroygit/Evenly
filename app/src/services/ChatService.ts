import { ENV } from '../config/env';

export interface AgentInfo {
  agent_config: {
    agent_name: string;
    agent_welcome_message: string;
    agent_type: string;
    assistant_status: string;
  };
}

export interface ChatMessage {
  message: string;
  agent_id: string;
}

export interface ChatChunk {
  chunk: string;
  complete: boolean;
}

export class ChatService {
  private static baseUrl = ENV.VOAGENTS_API_URL;
  private static agentId = ENV.VOAGENTS_AGENT_ID;


  /**
   * Fetch agent information including name and welcome message
   */
  static async getAgentInfo(): Promise<AgentInfo> {
    try {
      const url = `${this.baseUrl}/agents/${this.agentId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching agent info:', error);
      throw error;
    }
  }

  /**
   * Send a message to the chat API and get streaming response
   */
  static async sendMessage(message: string): Promise<ReadableStream<Uint8Array> | null> {
    try {
      const url = `${this.baseUrl}/chat/stream`;
      const requestBody = {
        message,
        agent_id: this.agentId,
      };
      
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });


      if (!response.ok) {
        const errorText = await response.text();
        // console.error('ChatService: Error response body:', errorText);
        // throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }
      
      const responseText = await response.text();
      
      // Parse the streaming data from the text response
      const lines = responseText.split('\n');
      const chunks: string[] = [];
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          try {
            const parsed = JSON.parse(data);
            if (parsed.chunk) {
              chunks.push(parsed.chunk);
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE line:', data, parseError);
          }
        }
      }
      
      // Create a mock stream that simulates streaming
      const mockStream = new ReadableStream({
        start(controller) {
          let chunkIndex = 0;
          
          const streamInterval = setInterval(() => {
            if (chunkIndex < chunks.length) {
              // Send each individual chunk
              const chunkData = {
                chunk: chunks[chunkIndex],
                complete: chunkIndex === chunks.length - 1
              };
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(chunkData)}\n\n`));
              
              chunkIndex++;
            } else {
              clearInterval(streamInterval);
              controller.close();
            }
          }, 100); // 100ms delay between chunks
        }
      });
      
      return mockStream;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Parse streaming response chunks with callback
   */
  static async parseStreamingResponse(
    stream: ReadableStream<Uint8Array>, 
    onChunk: (chunk: ChatChunk) => void
  ): Promise<void> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6); // Remove 'data: ' prefix
              if (jsonStr.trim() === '') continue;
              
              const parsed = JSON.parse(jsonStr);
              if (parsed.chunk !== undefined) {
                onChunk(parsed);
              }
            } catch (parseError) {
              console.warn('Failed to parse chunk:', parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
