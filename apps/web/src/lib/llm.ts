// Cloudflare Workers AI 経由でLLM呼び出し

const API_URL = import.meta.env.VITE_API_URL || 'https://yumicuit-api.your-subdomain.workers.dev';

interface AnalyzeResponse {
  success: boolean;
  analysis?: string;
  newAnalysisCount?: number;
  contentHash?: string;
  error?: string;
  message?: string;
}

interface GenerateImageResponse {
  success: boolean;
  image?: string;  // Base64 data URL
  error?: string;
  message?: string;
}

// シンプルなハッシュ関数
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(36);
}

export async function analyzeDream(
  dreamId: string,
  content: string,
  analysisCount: number,
  lastContentHash?: string
): Promise<AnalyzeResponse> {
  const contentHash = hashContent(content);

  // 同じ内容での再分析をクライアント側でもブロック
  if (lastContentHash && contentHash === lastContentHash) {
    return {
      success: false,
      error: 'same_content',
      message: '内容が変わっていません。編集してから再分析してください。',
    };
  }

  // 回数制限をクライアント側でもチェック
  if (analysisCount >= 3) {
    return {
      success: false,
      error: 'analysis_limit',
      message: '分析回数の上限（3回）に達しました。自分で編集してください。',
    };
  }

  try {
    const response = await fetch(`${API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dreamId,
        content,
        contentHash,
        analysisCount,
        lastContentHash,
      }),
    });

    const data: AnalyzeResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'unknown',
        message: data.message || 'エラーが発生しました',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'network_error',
      message: 'ネットワークエラー。接続を確認してください。',
    };
  }
}

// 分析と画像生成を一緒に行う（1回分としてカウント）
interface AnalyzeWithImageResponse {
  success: boolean;
  analysis?: string;
  image?: string;
  newAnalysisCount?: number;
  contentHash?: string;
  error?: string;
  message?: string;
}

export async function analyzeDreamWithImage(
  dreamId: string,
  content: string,
  analysisCount: number,
  lastContentHash?: string
): Promise<AnalyzeWithImageResponse> {
  const contentHash = hashContent(content);

  // 同じ内容での再分析をクライアント側でもブロック
  if (lastContentHash && contentHash === lastContentHash) {
    return {
      success: false,
      error: 'same_content',
      message: '内容が変わっていません。編集してから再分析してください。',
    };
  }

  // 回数制限をクライアント側でもチェック
  if (analysisCount >= 3) {
    return {
      success: false,
      error: 'analysis_limit',
      message: '分析回数の上限（3回）に達しました。',
    };
  }

  try {
    // 分析と画像生成を並列実行
    const [analyzeResponse, imageResponse] = await Promise.all([
      fetch(`${API_URL}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dreamId,
          content,
          contentHash,
          analysisCount,
          lastContentHash,
        }),
      }),
      fetch(`${API_URL}/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content }),
      }),
    ]);

    const analyzeData: AnalyzeResponse = await analyzeResponse.json();
    const imageData: GenerateImageResponse = await imageResponse.json();

    // 分析が失敗した場合はエラーを返す
    if (!analyzeResponse.ok || !analyzeData.success) {
      return {
        success: false,
        error: analyzeData.error || 'unknown',
        message: analyzeData.message || 'エラーが発生しました',
      };
    }

    // 画像生成は失敗しても分析結果は返す
    return {
      success: true,
      analysis: analyzeData.analysis,
      image: imageData.success ? imageData.image : undefined,
      newAnalysisCount: analyzeData.newAnalysisCount,
      contentHash: analyzeData.contentHash,
    };
  } catch (error) {
    return {
      success: false,
      error: 'network_error',
      message: 'ネットワークエラー。接続を確認してください。',
    };
  }
}

export async function generateDreamImage(prompt: string): Promise<GenerateImageResponse> {
  try {
    const response = await fetch(`${API_URL}/generate-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data: GenerateImageResponse = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'unknown',
        message: data.message || '画像生成に失敗しました',
      };
    }

    return data;
  } catch (error) {
    return {
      success: false,
      error: 'network_error',
      message: 'ネットワークエラー。接続を確認してください。',
    };
  }
}
