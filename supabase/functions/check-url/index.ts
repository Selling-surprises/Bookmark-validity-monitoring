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
          errorMessage: '无效的URL格式',
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

    // 通用请求头，模拟浏览器
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    };

    try {
      // 首先尝试HEAD请求
      let fetchResponse = await fetch(parsedUrl.toString(), {
        method: 'HEAD',
        headers,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000), // 15秒超时
      });

      // 如果HEAD请求失败（405 Method Not Allowed等），尝试GET请求
      if (!fetchResponse.ok && (fetchResponse.status === 405 || fetchResponse.status === 403)) {
        fetchResponse = await fetch(parsedUrl.toString(), {
          method: 'GET',
          headers,
          redirect: 'follow',
          signal: AbortSignal.timeout(15000),
        });
      }

      const responseTime = Date.now() - startTime;

      // 2xx和3xx状态码都视为有效
      if (fetchResponse.ok || (fetchResponse.status >= 200 && fetchResponse.status < 400)) {
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
      let errorMessage = '未知错误';
      
      if (error instanceof Error) {
        if (error.name === 'TimeoutError') {
          errorMessage = '请求超时';
        } else if (error.message.includes('DNS')) {
          errorMessage = 'DNS解析失败';
        } else if (error.message.includes('connection')) {
          errorMessage = '连接失败';
        } else if (error.message.includes('certificate') || error.message.includes('SSL')) {
          errorMessage = 'SSL证书错误';
        } else {
          errorMessage = error.message;
        }
      }

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
