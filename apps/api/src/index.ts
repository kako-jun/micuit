export interface Env {
  AI: Ai;
}

interface AnalyzeRequest {
  dreamId: string;
  content: string;
  contentHash: string; // クライアント側で計算したハッシュ
  analysisCount: number; // 現在の分析回数
  lastContentHash?: string; // 前回分析時のハッシュ
}

const SYSTEM_PROMPT = `あなたは夢分析の専門家です。ユーザーは寝起きで入力したため、誤字脱字や断片的な記述が多いです。

以下のタスクを行ってください：
1. 誤字脱字を推測して補正
2. 断片的なキーワードからストーリーを再構成
3. 夢の象徴的な意味を簡潔に解釈
4. 感情的なテーマや内面の洞察を提供

回答は以下の形式で：
【補正後の内容】
（整形したテキスト）

【ストーリー】
（再構成した夢の流れ）

【解釈】
（象徴的意味と洞察）`;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(request.url);

    if (url.pathname === "/analyze") {
      return handleAnalyze(request, env);
    }

    return new Response("Not found", { status: 404 });
  },
};

async function handleAnalyze(request: Request, env: Env): Promise<Response> {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Content-Type": "application/json",
  };

  try {
    const body: AnalyzeRequest = await request.json();

    // 回数制限チェック
    if (body.analysisCount >= 3) {
      return new Response(
        JSON.stringify({
          error: "analysis_limit",
          message: "分析回数の上限（3回）に達しました。自分で編集してください。",
        }),
        { status: 429, headers: corsHeaders }
      );
    }

    // 同じ内容での再分析ブロック
    if (body.lastContentHash && body.contentHash === body.lastContentHash) {
      return new Response(
        JSON.stringify({
          error: "same_content",
          message: "内容が変わっていません。編集してから再分析してください。",
        }),
        { status: 400, headers: corsHeaders }
      );
    }

    // Cloudflare Workers AI で分析
    const response = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: body.content },
      ],
      max_tokens: 1024,
    });

    return new Response(
      JSON.stringify({
        success: true,
        analysis: response.response,
        newAnalysisCount: body.analysisCount + 1,
        contentHash: body.contentHash,
      }),
      { headers: corsHeaders }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "server_error",
        message: "サーバーエラーが発生しました",
      }),
      { status: 500, headers: corsHeaders }
    );
  }
}
