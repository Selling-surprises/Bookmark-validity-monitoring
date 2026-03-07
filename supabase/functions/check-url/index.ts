// Edge Function: 检测URL有效性（多种检测方式）

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
  method?: string; // 记录使用的检测方法
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

    // 只检测http和https协议
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      return new Response(
        JSON.stringify({
          url,
          status: 'invalid',
          errorMessage: '不支持的协议类型',
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

    const startTime = Date.now();
    let response: CheckUrlResponse;

    // 通用请求头，模拟浏览器
    const commonHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    };

    // 检测方法1: HEAD请求（最快，资源消耗最小）
    try {
      const headResponse = await fetch(parsedUrl.toString(), {
        method: 'HEAD',
        headers: commonHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;

      // 2xx和3xx状态码视为有效
      if (headResponse.status >= 200 && headResponse.status < 400) {
        return new Response(JSON.stringify({
          url,
          status: 'valid',
          statusCode: headResponse.status,
          responseTime,
          method: 'HEAD',
        } as CheckUrlResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // 如果HEAD返回405或403，尝试其他方法
      if (headResponse.status !== 405 && headResponse.status !== 403) {
        return new Response(JSON.stringify({
          url,
          status: 'invalid',
          statusCode: headResponse.status,
          errorMessage: `HTTP ${headResponse.status}`,
          responseTime,
          method: 'HEAD',
        } as CheckUrlResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (headError) {
      // HEAD请求失败，继续尝试其他方法
      console.log('HEAD request failed, trying GET:', headError);
    }

    // 检测方法2: GET请求（更通用，但消耗更多资源）
    try {
      const getResponse = await fetch(parsedUrl.toString(), {
        method: 'GET',
        headers: commonHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(15000),
      });

      const responseTime = Date.now() - startTime;

      if (getResponse.status >= 200 && getResponse.status < 400) {
        return new Response(JSON.stringify({
          url,
          status: 'valid',
          statusCode: getResponse.status,
          responseTime,
          method: 'GET',
        } as CheckUrlResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } else {
        return new Response(JSON.stringify({
          url,
          status: 'invalid',
          statusCode: getResponse.status,
          errorMessage: `HTTP ${getResponse.status}`,
          responseTime,
          method: 'GET',
        } as CheckUrlResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (getError) {
      // GET请求也失败，尝试最后的方法
      console.log('GET request failed, trying OPTIONS:', getError);
    }

    // 检测方法3: OPTIONS请求（某些服务器支持）
    try {
      const optionsResponse = await fetch(parsedUrl.toString(), {
        method: 'OPTIONS',
        headers: commonHeaders,
        redirect: 'follow',
        signal: AbortSignal.timeout(10000),
      });

      const responseTime = Date.now() - startTime;

      if (optionsResponse.status >= 200 && optionsResponse.status < 400) {
        return new Response(JSON.stringify({
          url,
          status: 'valid',
          statusCode: optionsResponse.status,
          responseTime,
          method: 'OPTIONS',
        } as CheckUrlResponse), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    } catch (optionsError) {
      console.log('OPTIONS request failed:', optionsError);
    }

    // 所有方法都失败，返回错误
    const responseTime = Date.now() - startTime;
    let errorMessage = '连接失败';

    // 尝试最后一次简单的fetch来获取具体错误
    try {
      await fetch(parsedUrl.toString(), {
        signal: AbortSignal.timeout(5000),
      });
    } catch (finalError) {
      if (finalError instanceof Error) {
        if (finalError.name === 'TimeoutError' || finalError.message.includes('timeout')) {
          errorMessage = '请求超时';
        } else if (finalError.message.includes('DNS') || finalError.message.includes('getaddrinfo')) {
          errorMessage = 'DNS解析失败';
        } else if (finalError.message.includes('connection') || finalError.message.includes('ECONNREFUSED')) {
          errorMessage = '连接被拒绝';
        } else if (finalError.message.includes('certificate') || finalError.message.includes('SSL') || finalError.message.includes('TLS')) {
          errorMessage = 'SSL证书错误';
        } else if (finalError.message.includes('network')) {
          errorMessage = '网络错误';
        } else {
          errorMessage = finalError.message.substring(0, 100); // 限制错误信息长度
        }
      }
    }

    response = {
      url,
      status: 'invalid',
      errorMessage,
      responseTime,
      method: 'ALL_FAILED',
    };

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
