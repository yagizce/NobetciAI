import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { QUICK_ACTIONS } from "../../constants/quickActions.js";
import { SYSTEM_PROMPT } from "../../constants/systemPrompt.js";
import { getChatContext } from "../../constants/chatContexts.js";
import { sendChatMessage, sendPhotoAnalysis } from "../../services/chatService.js";
import { nowLabel } from "../../utils/dateUtils.js";
import { validateImageFile } from "../../utils/fileValidation.js";
import { HardHat, Camera, Send, Copy, Trash2, X } from "../../components/icons/index.jsx";
import QuickActionButton from "./QuickActionButton.jsx";

export default function ChatPanel({ contextId: initialContextId }) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  // contextId component state'inde tutuluyor (yalnızca prop değil) ki kullanıcı
  // "Genel sohbete dön" ile bağlamı temizleyebilsin — sayfa değişmeden.
  const [contextId, setContextId] = useState(initialContextId || null);
  const activeContext = getChatContext(contextId);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: activeContext ? activeContext.greeting : "İş Sağlığı ve Güvenliği ile ilgili sorularınızı yanıtlayabilirim. Bir tehlike bildirirseniz, doğru değerlendirebilmem için önce birkaç soru soracağım. Nasıl yardımcı olabilirim?",
      time: nowLabel(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text) {
    if (!text.trim() || loading) return;
    const newMessages = [...messages, { role: "user", text, time: nowLabel() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendChatMessage({
        system: activeContext ? `${SYSTEM_PROMPT}\n\n${activeContext.promptAddendum}` : SYSTEM_PROMPT,
        max_tokens: 1200,
        messages: newMessages.map((m) => ({ role: m.role, content: m.text })),
      });
      setMessages((prev) => [...prev, { role: "assistant", text: reply || "Cevap oluşturulamadı.", time: nowLabel() }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", text: "Bağlantı hatası. Acil durum varsa 112'yi arayın.", time: nowLabel() }]);
    } finally {
      setLoading(false);
    }
  }

  const askQuickAction = useCallback((qa) => {
    setMessages((prev) => [...prev, { role: "user", text: qa.prompt, time: nowLabel() }, { role: "assistant", text: qa.answer, time: nowLabel() }]);
  }, []);

  const copyMessage = useCallback((text, idx) => {
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 1500);
    });
  }, []);

  function clearChat() {
    setMessages([{ role: "assistant", text: activeContext ? activeContext.greeting : "Sohbet temizlendi. Nasıl yardımcı olabilirim?", time: nowLabel() }]);
  }

  function clearContext() {
    setContextId(null);
    navigate("/chat", { replace: true, state: {} });
    setMessages([{ role: "assistant", text: "Genel sohbete döndük. Nasıl yardımcı olabilirim?", time: nowLabel() }]);
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const { valid, error } = await validateImageFile(file);
    if (!valid) {
      showToast(error, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result;
      const base64 = dataUrl.split(",")[1];
      setMessages((prev) => [...prev, { role: "user", text: "Bu fotoğrafta tehlike var mı?", image: dataUrl, time: nowLabel() }]);
      setLoading(true);
      try {
        const reply = await sendPhotoAnalysis({
          system: SYSTEM_PROMPT,
          imageBase64: base64,
          mediaType: file.type || "image/jpeg",
          instruction: "Saha fotoğrafı — tehlike analizi yap ve risk seviyesini gerekçeli belirt.",
          max_tokens: 1200,
        });
        setMessages((prev) => [...prev, { role: "assistant", text: reply || "Analiz yapılamadı.", time: nowLabel() }]);
      } catch (err) {
        setMessages((prev) => [...prev, { role: "assistant", text: "Fotoğraf analiz edilemedi.", time: nowLabel() }]);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  // ÖNCEDEN: h-[calc(100vh-64px)] — tüm tarayıcı yüksekliğini varsayıyordu. PhoneFrame
  // içinde (bkz. PhoneFrame.jsx) bu, çerçeve ~800px olsa bile sohbet panelinin tam
  // tarayıcı boyu kadar taşmasına, dolayısıyla mesaj kutusunun ekran dışına çıkmasına
  // yol açardı. Layout.jsx'teki <main>, Header/BottomTabBar arasında kalan alanı zaten
  // flex-1 ile TANIMLI bir yükseklik olarak veriyor (hem mobilde hem çerçevede) —
  // h-full bu alanı birebir dolduruyor, taşma riski yok.
  return (
    <div className="flex flex-col h-full" style={{ background: theme.bg }}>
      <div className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ borderColor: theme.border, background: theme.header }}>
        {activeContext ? (
          <div className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-full" style={{ background: theme.surfaceAlt, color: theme.accent, border: `1px solid ${theme.accent}` }}>
            🤖 {activeContext.label}
            <button onClick={clearContext} className="ml-0.5" aria-label="Genel sohbete dön">
              <X style={{ fontSize: "11px" }} />
            </button>
          </div>
        ) : (
          <p className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: theme.textFaint }}>Sık Sorulanlar</p>
        )}
        <button onClick={clearChat} className="flex items-center gap-1 text-[10.5px] font-semibold" style={{ color: theme.textMuted }}>
          <Trash2 style={{ fontSize: "12px" }} /> Sohbeti Temizle
        </button>
      </div>

      {activeContext ? (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto shrink-0 border-b" style={{ background: theme.bg, borderColor: theme.border }}>
          {activeContext.quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => sendMessage(p)}
              disabled={loading}
              className="whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] shrink-0 disabled:opacity-50"
              style={{ border: `1px solid ${theme.border}`, background: theme.surfaceAlt, color: theme.textPrimary }}
            >
              {p}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 px-4 py-2 overflow-x-auto shrink-0 border-b" style={{ background: theme.bg, borderColor: theme.border }}>
          {QUICK_ACTIONS.map((qa) => (
            <QuickActionButton key={qa.label} qa={qa} onSelect={askQuickAction} disabled={loading} theme={theme} />
          ))}
        </div>
      )}

      {/* HARDENING (AI uyarı konumlandırması): önceden bu ekranda hiçbir görünür
          uyarı yoktu — systemPrompt.js modele "uydurma" talimatı veriyordu ama bu,
          KULLANICININ gördüğü bir şey değildi. Bu, en açık uçlu AI yüzeyi olduğu için
          (serbest metinle her şey sorulabiliyor) kalıcı, mesaj listesinin üstünde
          sabit duran (her mesajda tekrarlanmayan) bir uyarı eklendi — Mevzuat
          sayfasındaki/LegislationImpactCard'daki dille tutarlı. */}
      <div className="px-4 py-1.5 text-[10.5px] text-center shrink-0 border-b" style={{ color: theme.textFaint, borderColor: theme.border, background: theme.bg }}>
        AI yanıtları bilgilendirme amaçlıdır; bir İSG uzmanının onayı ve nihai kararı yerine geçmez.
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5 max-w-3xl mx-auto w-full">
        {messages.map((m, i) => (
          <div key={i} className="flex flex-col">
            <div className={`flex items-end gap-2 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mb-3.5" style={{ background: theme.accent }}>
                  <HardHat style={{ fontSize: "14px", color: theme.onAccent }} sw={2.5} />
                </div>
              )}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className="rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug whitespace-pre-wrap"
                  style={m.role === "user"
                    ? { background: theme.accent, color: theme.onAccent, borderBottomRightRadius: "0.25rem", fontWeight: 500 }
                    : { background: theme.bubbleAssistantBg, color: theme.bubbleAssistantText, border: `1px solid ${theme.border}`, borderBottomLeftRadius: "0.25rem" }}
                >
                  {m.image && <img src={m.image} alt="Fotoğraf" className="rounded-lg mb-2 max-h-40 w-full object-cover" />}
                  {m.text}
                </div>
                <div className={`flex items-center gap-2 mt-1 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px]" style={{ color: theme.textFaint }}>{m.time}</span>
                  {m.role === "assistant" && (
                    <button onClick={() => copyMessage(m.text, i)} className="text-[10px] flex items-center gap-0.5" style={{ color: copiedIdx === i ? theme.successText : theme.textFaint }}>
                      <Copy style={{ fontSize: "10px" }} /> {copiedIdx === i ? "Kopyalandı" : "Kopyala"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.accent }}>
              <HardHat style={{ fontSize: "14px", color: theme.onAccent }} sw={2.5} />
            </div>
            <div className="rounded-2xl px-3 py-2" style={{ background: theme.bubbleAssistantBg, border: `1px solid ${theme.border}`, borderBottomLeftRadius: "0.25rem" }}>
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: theme.textFaint }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: theme.textFaint, animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: theme.textFaint, animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelected} style={{ display: "none" }} />
      <div className="flex items-center gap-2 px-3 py-3 border-t shrink-0 max-w-3xl mx-auto w-full" style={{ borderColor: theme.border, background: theme.header }}>
        <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
          <Camera style={{ fontSize: "16px", color: theme.textMuted }} />
        </button>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          placeholder="Sorunuzu yazın..."
          className="flex-1 text-sm rounded-full px-4 py-2.5 outline-none border"
          style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
        />
        <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: theme.accent }}>
          <Send style={{ fontSize: "16px", color: theme.onAccent }} sw={2.5} />
        </button>
      </div>
    </div>
  );
}
