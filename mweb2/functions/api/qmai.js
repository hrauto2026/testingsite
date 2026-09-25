// functions/api/qmai.js
// Cloudflare Pages Functions 專用後端

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const body = await request.json();
    const { userPasscode, qimenPrompt } = body;

    // 檢查通行碼 (若有設置 VIP_PASSCODE 環境變數)
    if (env.VIP_PASSCODE && env.VIP_PASSCODE.trim() !== "") {
      if (!userPasscode || userPasscode !== env.VIP_PASSCODE) {
        return new Response(JSON.stringify({ 
          error: "未授權：請輸入正確的 VIP / 公測解鎖碼！" 
        }), { 
          status: 403, 
          headers: { "Content-Type": "application/json" } 
        });
      }
    }

    if (!qimenPrompt) {
      return new Response(JSON.stringify({ error: "缺少盤面提問資料" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const systemPrompt = "你是一位精通奇門遁甲的玄學宗師。必須嚴格使用繁體中文（香港/台灣習慣用語）回答。請針對盤面用神、五行生剋與四害（空亡、擊刑、入墓、門迫）進行條理嚴密的吉凶推演，最後給出清晰定性與行動建議。";

    // 調用 Cloudflare Workers AI
    const aiResponse = await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: qimenPrompt }
      ],
      temperature: 0.3,
      max_tokens: 1800
    });

    return new Response(JSON.stringify({ result: aiResponse.response }), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: "AI 服務暫時無法回應: " + err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}