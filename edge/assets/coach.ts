import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, ApiError } from "@google/genai";

const MAX_CONTENT_LENGTH = 50000;
const DEFAULT_TIMEOUT = 20000;
const SUPPORTED_LANGUAGES = {
  py: "Python",
  js: "JavaScript",
  jsx: "React/JavaScript",
  ts: "TypeScript",
  tsx: "React/TypeScript",
  java: "Java",
  c: "C",
  cpp: "C++",
  cc: "C++",
  cxx: "C++",
  cs: "C#",
  rb: "Ruby",
  go: "Go",
  php: "PHP",
  swift: "Swift",
  kt: "Kotlin",
  rs: "Rust",
  r: "R",
  scala: "Scala",
  sh: "Shell/Bash",
  bash: "Bash",
  ps1: "PowerShell",
  lua: "Lua",
  dart: "Dart",
  elm: "Elm",
  ex: "Elixir",
  exs: "Elixir",
  erl: "Erlang",
  hrl: "Erlang",
  fs: "F#",
  fsx: "F#",
  clj: "Clojure",
  cljs: "ClojureScript",
  hs: "Haskell",
  jl: "Julia",
  ml: "OCaml",
  nim: "Nim",
  pas: "Pascal",
  pl: "Perl",
  pm: "Perl",
  v: "V",
  vb: "Visual Basic",
  zig: "Zig",
} as const;

function detectLanguage(filename: string): string {
  if (!filename) return "";

  const extension = filename.split(".").pop()?.toLowerCase();
  return SUPPORTED_LANGUAGES[extension as keyof typeof SUPPORTED_LANGUAGES] || "";
}

function validateRequest(data: any): { isValid: boolean; error?: string } {
  if (!data.content || typeof data.content !== "string") {
    return { isValid: false, error: "محتوای کد الزامیه" };
  }

  if (!data.filename || typeof data.filename !== "string") {
    return { isValid: false, error: "نام فایل الزامیه" };
  }

  if (data.content.length > MAX_CONTENT_LENGTH) {
    return {
      isValid: false,
      error: `حجم کد نمیتونه بیش‌تر از ${MAX_CONTENT_LENGTH} کاراکتر باشه.`,
    };
  }

  return { isValid: true };
}

function generatePrompt(
  filename: string,
  content: string,
  options?: {
    includePerformance?: boolean;
    includeSecurity?: boolean;
    includeAccessibility?: boolean;
    customCriteria?: string[];
  },
): string {
  const language = detectLanguage(filename);
  const languageContext = language ? `You are a ${language} code review expert. ` : "";
  const languageSpecificNote = language
    ? `Do not flag issues that are widely used and accepted patterns in ${language} even if it violates the criteria.`
    : "";

  const baseCriteria = [
    "1) نام‌گذاری توصیفی و معنادار",
    "2) اندازه و پیچیدگی توابع",
    "3) وابستگی‌های صریح و مدیریت آن‌ها",
    "4) مدیریت خطا و استثنا",
    "5) سطح تو در تو بودن کد",
    "6) شفافیت اثرات جانبی",
    "7) استفاده از اعداد جادویی",
    "8) قابلیت خواندن و نگهداری کد",
  ];

  const additionalCriteria = [];
  if (options?.includePerformance) {
    additionalCriteria.push("9) بهینه‌سازی عملکرد و حافظه");
  }
  if (options?.includeSecurity) {
    additionalCriteria.push("10) امنیت و حفاظت از آسیب‌پذیری‌ها");
  }
  if (
    options?.includeAccessibility &&
    (language.includes("React") || language.includes("JavaScript"))
  ) {
    additionalCriteria.push("11) دسترسی‌پذیری (Accessibility)");
  }
  if (options?.customCriteria) {
    options.customCriteria.forEach((criterion, index) => {
      additionalCriteria.push(`${12 + index}) ${criterion}`);
    });
  }

  const allCriteria = [...baseCriteria, ...additionalCriteria].join("\n");

  return `${languageContext}لطفاً کد زیر رو تحلیل کرده و نتیجه رو به زبان فارسی ارائه بده، میتونی بجز مواردی که ذکر شده بررسی‌های دلخواه دیگه‌ای هم روی کد انجام داده و ارائه بدی (با خلاقیت خودت).

ارائه دهید:
1. امتیاز کلی از 100
2. خلاصه‌ای مختصر از کیفیت کد
3. پیشنهادات مشخص، مختصر و قابل اجرا برای بهبود
4. تحلیل نقاط قوت کد
5. اولویت‌بندی بهبودها بر اساس اهمیت

معیارهای ارزیابی:
${allCriteria}

${languageSpecificNote}

پاسخ دهید با فقط یک JSON object معتبر در این فرمت دقیق. تمام مقادیر string در پاسخ JSON (خلاصه، دسته‌بندی، مسئله، پیشنهاد) باید به زبان فارسی باشند.

{
  "score": number,
  "summary": "خلاصه کلی ارزیابی به زبان فارسی",
  "strengths": ["نقاط قوت کد به زبان فارسی"],
  "improvements": [
    {
      "category": "نام دسته‌بندی به زبان فارسی", 
      "issue": "شرح مختصر و دقیق مشکل به زبان فارسی",
      "suggestion": "توصیه مختصر و کاربردی برای رفع مشکل به زبان فارسی",
      "severity": "high|medium|low",
      "priority": number,
      "lineNumber": number | null,
      "codeSnippet": "the problematic code line/snippet" | null,
      "expectedBenefit": "منفعت مورد انتظار از اجرای این بهبود"
    }
  ],
  "metrics": {
    "complexity": number,
    "maintainability": number,
    "readability": number,
    "performance": number
  }
}

کد برای تحلیل:
\`\`\`${language.toLowerCase()}
${content}
\`\`\``;
}

const createResponseSchema = () => ({
  type: Type.OBJECT,
  properties: {
    score: { type: Type.NUMBER },
    summary: { type: Type.STRING },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    improvements: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          issue: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          severity: { type: Type.STRING },
          priority: { type: Type.NUMBER },
          lineNumber: { type: Type.NUMBER, nullable: true },
          codeSnippet: { type: Type.STRING, nullable: true },
          expectedBenefit: { type: Type.STRING },
        },
        required: ["category", "issue", "suggestion", "severity", "priority", "expectedBenefit"],
      },
    },
    metrics: {
      type: Type.OBJECT,
      properties: {
        complexity: { type: Type.NUMBER },
        maintainability: { type: Type.NUMBER },
        readability: { type: Type.NUMBER },
        performance: { type: Type.NUMBER },
      },
      required: ["complexity", "maintainability", "readability", "performance"],
    },
  },
  required: ["score", "summary", "strengths", "improvements", "metrics"],
});

class CodeAnalysisError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any,
  ) {
    super(message);
    this.name = "CodeAnalysisError";
  }
}

async function analyzeWithGemini(prompt: string, retries: number = 2): Promise<any> {
  const ai = new GoogleGenAI({});

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            responseMimeType: "application/json",
            responseSchema: createResponseSchema(),
            temperature: 0.5,
          },
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timeout")), DEFAULT_TIMEOUT),
        ),
      ]);

      if (!result?.candidates?.[0]?.content?.parts?.[0]?.text) {
        throw new CodeAnalysisError("پاسخ نامعتبر از API دریافت شد", 500, {
          attempt: attempt + 1,
          result,
        });
      }

      const jsonText = result.candidates[0].content.parts[0].text;
      return JSON.parse(jsonText);
    } catch (error) {
      console.warn(`تلاش ${attempt + 1} ناموفق:`, error);

      if (attempt === retries) {
        if (error instanceof ApiError) {
          throw new CodeAnalysisError("خطا در تحلیل کد از طرف Gemini API", 500, error.message);
        }
        throw new CodeAnalysisError(
          "خطا در تحلیل کد",
          500,
          error instanceof Error ? error.message : "Unknown error",
        );
      }

      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new CodeAnalysisError("GEMINI_API_KEY تنظیم نشده است", 500);
    }

    const requestData = await request.json();

    const validation = validateRequest(requestData);
    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: validation.error,
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      );
    }

    const { filename, content, options } = requestData;
    const prompt = generatePrompt(filename, content, options);
    const analysisResult = await analyzeWithGemini(prompt);

    const response = {
      ...analysisResult,
      metadata: {
        filename,
        language: detectLanguage(filename),
        contentLength: content.length,
        analysisTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        version: "2.0",
      },
    };

    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Content-Type": "application/json; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("خطا در تحلیل کد:", error);

    if (error instanceof CodeAnalysisError) {
      return NextResponse.json(
        {
          error: error.message,
          details: error.details,
          timestamp: new Date().toISOString(),
        },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "خطای داخلی سرور",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
