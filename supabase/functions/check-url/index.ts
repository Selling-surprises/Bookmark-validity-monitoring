// Edge Function: 检测URL有效性

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface CheckUrlRequest {
  url: string;
}

interface CheckUrlResponse {
  url: string;
  status: 'valid' | 'invalid';
  statusCode?: number;
  errorMessage?: string;
  responseTime: number;
}

serve(async (req) => {
  // 处理CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    const { url }: CheckUrlRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 验证URL格式
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch {
      return new Response(
        JSON.stringify({
          url,
          status: 'invalid',
          errorMessage: 'Invalid URL format',
          responseTime: 0,
        } as CheckUrlResponse),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 检测URL有效性
    const startTime = Date.now();
    let response: CheckUrlResponse;

    try {
      const fetchResponse = await fetch(parsedUrl.toString(), {
        method: 'HEAD',
        redirect: 'follow',
        signal: AbortSignal.timeout(10000), // 10秒超时
      });

      const responseTime = Date.now() - startTime;

      if (fetchResponse.ok) {
        response = {
          url,
          status: 'valid',
          statusCode: fetchResponse.status,
          responseTime,
        };
      } else {
        response = {
          url,
          status: 'invalid',
          statusCode: fetchResponse.status,
          errorMessage: `HTTP ${fetchResponse.status} ${fetchResponse.statusText}`,
          responseTime,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      response = {
        url,
        status: 'invalid',
        errorMessage,
        responseTime,
      };
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Error in check-url function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
