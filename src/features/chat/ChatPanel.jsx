import { useState, useRef, useEffect, useCallback } from "react";
import { useCompany } from "../../hooks/useCompany.js";
import Loading from "../../components/Loading.jsx";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import { useToast } from "../../contexts/ToastContext.jsx";
import { QUICK_ACTIONS } from "../../constants/quickActions.js";
import { SYSTEM_PROMPT } from "../../constants/systemPrompt.js";
import { getChatContext } from "../../constants/chatContexts.js";
import { sendKimiChatMessage } from "../../services/chatService.js";
// Fotoğraf + soru birlikte, mevcut Cosmos Vision proxy'sine (api/cosmos-vision.js, yalnızca
// NVIDIA_API_KEY) tek istekle gider — bkz. sendMessage. Risk analizi bu akışta YAPILMAZ.
import { analyzePhotoWithCosmos } from "../../services/cosmosVisionService.js";
import { nowLabel } from "../../utils/dateUtils.js";
import { validateImageFile } from "../../utils/fileValidation.js";
import { compressImageToDataUrl } from "../../utils/imageCompression.js";
import { HardHat, Camera, Send, Copy, Trash2, X, AlertTriangle } from "../../components/icons/index.jsx";
import QuickActionButton from "./QuickActionButton.jsx";
import MarkdownLite from "../../components/MarkdownLite.jsx";

const MAX_MESSAGE_LENGTH = 2000;

// Fotoğraf sorusunda ham sunucu/NVIDIA metni (model adı, hesap kimliği vb.) kullanıcıya
// GÖSTERİLMEZ; HTTP durumuna göre anlaşılır bir mesaj üretilir (teknik ayrıntı konsola yazılır).
function photoErrorText(err) {
  if (err?.isTimeout || err?.status === 504) return "Fotoğraf analizi çok uzun sürdü. Lütfen tekrar deneyin; daha küçük bir fotoğraf da yardımcı olabilir.";
  if (err?.status === 429) return "Şu anda çok fazla istek var. Lütfen birkaç saniye bekleyip tekrar deneyin.";
  if (err?.status === 413) return "Fotoğraf çok büyük. Lütfen daha küçük bir fotoğraf deneyin.";
  if (err?.status === 400) return "Fotoğraf ya da mesajınız işlenemedi. Fotoğrafı yeniden ekleyip tekrar deneyin.";
  return "Fotoğraf şu anda analiz edilemedi. Lütfen birazdan tekrar deneyin.";
}

// DÜZELTME (API bağlam bütünlüğü): API'ye "geçmiş" olarak gönderilen mesaj listesi,
// EKRANDA gösterilen `messages` state'iyle birebir aynı DEĞİL. İki ayrı sorun vardı:
//   1) Hata balonları (isError: true — örn. "İnternet bağlantınıza ulaşılamadı...")
//      da messages state'ine yazılıyor ve bir sonraki istekte modele "kendi önceki
//      cevabıymış" gibi geri gönderiliyordu — model kafası karışıp o hatayı gerçek bir
//      yanıtmış gibi referans alabiliyordu. Artık `isError` mesajlar API bağlamından
//      FİLTRELENİYOR (ekranda hâlâ görünüyorlar, yalnızca modele gönderilmiyorlar).
//   2) Sohbet süresince `messages` state'i sınırsız büyüyebiliyordu (yalnızca
//      localStorage'a YAZILIRKEN son 50 mesajla sınırlanıyordu, state'in kendisi
//      değil) — uzun bir oturumda her yeni mesajda tüm geçmiş yeniden API'ye
//      gönderilip token maliyetini ve gecikmeyi katlayarak artırabilirdi. Artık API'ye
//      gönderilen bağlam da son N mesajla sınırlı.
const MAX_CONTEXT_MESSAGES = 24; // ~12 karşılıklı tur — normal bir sohbet için yeterli bağlam

function toApiMessages(messages) {
  return messages
    .filter((m) => !m.isError)
    .slice(-MAX_CONTEXT_MESSAGES)
    .map((m) => {
      const base = { role: m.role, content: m.text };
      // DÜZELTME (Kimi K3 "preserved thinking"): önceki asistan turlarına ait
      // reasoning_content/tool_calls varsa (yalnızca Kimi'den gelen gerçek cevaplarda
      // olur — karşılama mesajı, hızlı eylem cevapları gibi yerlerde yoktur) aynen
      // geri gönderiliyor. bkz. api/kimi-chat.js'teki aynı notun uzun açıklaması.
      if (m.role === "assistant" && m.kimiMeta?.reasoningContent) {
        base.reasoning_content = m.kimiMeta.reasoningContent;
      }
      if (m.role === "assistant" && m.kimiMeta?.toolCalls?.length) {
        base.tool_calls = m.kimiMeta.toolCalls;
      }
      return base;
    });
}

// Sprint 10 — Chat Geçmişi UX iyileştirmesi. Yalnızca GENEL sohbet (contextId===null,
// yani BottomTabBar'daki "AI Chat" sekmesinden doğrudan açılan sohbet) kalıcı tutulur.
// Bağlam bazlı sohbetler (örn. bir sayfadan "AI'ya Sor" ile açılan) kasıtlı olarak
// KALICI DEĞİL — bunlar o anki göreve özel, aynı `useLocalStorage` genel deseniyle
// (bkz. hooks/useLocalStorage.js, useKnowledgeFavorites.js'te de kullanılıyor) ama
// burada elle yazıldı çünkü fotoğraf mesajlarındaki base64 veri localStorage kotasını
// (~5-10MB) hızla doldurabilir — bu yüzden kaydetmeden önce `image` alanı ÇIKARILIR ve
// son N mesajla sınırlanır.

const MAX_HISTORY_MESSAGES = 50;

function loadChatHistory(historyKey) {
  try {
    const raw = localStorage.getItem(historyKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveChatHistory(messages, historyKey) {
  try {
    // DÜZELTME: `image` gibi `kimiMeta.reasoningContent` de (Kimi K3'ün "high" reasoning
    // effort'ta ürettiği düşünce metni, bazen yanıttan daha uzun olabiliyor) localStorage
    // kotasını gereksiz yere şişirir — yalnızca API bağlamı için gerekliydi, ekranda hiç
    // gösterilmiyor. Kaydetmeden önce çıkarılıyor (sayfa yenilendiğinde eski asistan
    // turları için preserved-thinking bağlamı kaybolur, yeni turlar etkilenmez).
    const trimmed = messages.slice(-MAX_HISTORY_MESSAGES).map(({ image, kimiMeta, ...rest }) => rest);
    localStorage.setItem(historyKey, JSON.stringify(trimmed));
  } catch {
    // localStorage dolu/kullanılamıyor — sessizce vazgeç, sohbetin kendisi etkilenmez
  }
}

export default function ChatPanel(props) {
  const { company, loaded } = useCompany();
  if (!loaded) return <Loading label="Sohbet yükleniyor..." />;
  const historyKey = company ? 'nobetci-chat-history:' + company.id : 'nobetci-chat-history';
  return <CompanyChatPanel key={historyKey} {...props} historyKey={historyKey} />;
}

function CompanyChatPanel({ contextId: initialContextId, historyKey }) {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();
  // contextId component state'inde tutuluyor (yalnızca prop değil) ki kullanıcı
  // "Genel sohbete dön" ile bağlamı temizleyebilsin — sayfa değişmeden.
  const [contextId, setContextId] = useState(initialContextId || null);
  const activeContext = getChatContext(contextId);
  const [messages, setMessages] = useState(() => {
    // Yalnızca genel sohbet (bağlamsız) için geçmişi geri yükle — bkz. yukarıdaki not.
    if (!initialContextId) {
      const saved = loadChatHistory(historyKey);
      if (saved && saved.length > 0) return saved;
    }
    return [
      {
        role: "assistant",
        text: activeContext ? activeContext.greeting : "İş Sağlığı ve Güvenliği ile ilgili sorularınızı yanıtlayabilirim. Bir tehlike bildirirseniz, doğru değerlendirebilmem için önce birkaç soru soracağım. Nasıl yardımcı olabilirim?",
        time: nowLabel(),
      },
    ];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState(null);
  // Eklenen fotoğraf: { dataUrl, base64, mediaType }. Seçilince otomatik HİÇBİR mesaj/analiz
  // gönderilmez; fotoğraf yazı alanının üstünde önizlenir, kullanıcı mesajını yazıp gönderince
  // fotoğraf VE soru birlikte görsel modele gider ve ek temizlenir (fotoğraf yalnızca o tek
  // mesaja aittir). Yalnızca bellekte tutulur.
  const [activePhoto, setActivePhoto] = useState(null);
  // Sohbetteki bir fotoğrafa dokunulunca tam ekran açılır.
  const [viewerImage, setViewerImage] = useState(null);
  const fileInputRef = useRef(null);
  const scrollRef = useRef(null);
  // UX FIX (AI Chat cilası): `loading` React state'i render'lar arasında güncellenir —
  // aynı anda (aynı senkron an içinde, örn. mobilde hızlı çift dokunuş) Gönder'e iki kez
  // basılırsa her iki çağrı da henüz güncellenmemiş `loading=false` değerini görüp isteği
  // iki kez gönderebilir. Uygulamanın geri kalanında bu sınıf sorun için zaten kurulu olan
  // `useSubmitGuard.js`'teki `inFlightRef` tekniğinin aynısı — yeni bir hook/mimari
  // eklemeden, yerel bir ref ile.
  const sendingRef = useRef(false);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!contextId) saveChatHistory(messages, historyKey);
  }, [messages, contextId, historyKey]);

  async function sendMessage(text) {
    if (!text.trim() || loading || sendingRef.current) return;
    if (text.length > MAX_MESSAGE_LENGTH) return; // native maxLength zaten engelliyor, bu ekstra bir güvenlik
    sendingRef.current = true;
    const photo = activePhoto;
    const attachImage = photo ? { image: photo.dataUrl } : {};
    const newMessages = [...messages, { role: "user", text, time: nowLabel(), ...attachImage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    try {
      // AI Chat metin sohbeti NVIDIA moonshotai/kimi-k3'e bağlı (bkz. services/chatService.js
      // → sendKimiChatMessage, api/kimi-chat.js). Fotoğraf + soru ise TEK istekle görsel
      // modele gider (analyzePhotoWithCosmos, api/cosmos-vision.js) — bu akışların hiçbiri
      // Fotoğraf ve soru NVIDIA proxy’sine birlikte gönderilir.
      if (photo) {
        // Fotoğraf + soru birlikte görsel modele gider (Kimi metin modeli görüntü göremez);
        // cevap doğrudan sorunun yanıtıdır, ikinci bir AI isteği yok.
        const photoAnswer = await analyzePhotoWithCosmos({
          imageBase64: photo.base64,
          mediaType: photo.mediaType,
          question: text,
        });
        // Fotoğraf yalnızca BAŞARILI gönderimde temizlenir — hata olursa ek önizlemede kalır,
        // kullanıcı yeniden seçmeden tekrar deneyebilir.
        setActivePhoto(null);
        setMessages((prev) => [...prev, { role: "assistant", text: photoAnswer || "Cevap oluşturulamadı.", time: nowLabel() }]);
        return;
      }
      const reply = await sendKimiChatMessage({
        system: activeContext ? `${SYSTEM_PROMPT}\n\n${activeContext.promptAddendum}` : SYSTEM_PROMPT,
        max_tokens: 1200,
        messages: toApiMessages(newMessages),
      });
      setMessages((prev) => [...prev, {
        role: "assistant",
        text: reply?.text || "Cevap oluşturulamadı.",
        time: nowLabel(),
        kimiMeta: reply ? { reasoningContent: reply.reasoningContent, toolCalls: reply.toolCalls } : null,
      }]);
    } catch (err) {
      // BUG FIX (Sprint 10 AI UX cilası): önceden TÜM hata türleri (ağ kopması, API
      // limiti, sunucu hatası) için tek, ayrımsız bir mesaj gösteriliyordu. chatService.js
      // HTTP durum kodunu `err.message` içinde "api_error_XXX" olarak taşıyor — burada
      // ayrıştırıp duruma uygun, eyleme geçirilebilir bir Türkçe mesaj gösteriyoruz.
      // `isError: true` de eklendi ki mesaj balonu görsel olarak normal bir AI cevabından
      // AYIRT EDİLEBİLSİN (kullanıcı bunun gerçek bir yanıt değil, bir hata olduğunu
      // ilk bakışta anlasın) — bkz. aşağıdaki render bloğu.
      // UX FIX (hata yönetimi cilası): geri kalan tüm servis/hook catch bloklarında olduğu
      // gibi teknik hata artık konsola da yazılıyor (önceden yalnızca kullanıcı mesajı
      // üretiliyordu, hiçbir teknik iz bırakılmıyordu).
      console.error("AI chat isteği başarısız:", err);
      const statusMatch = /^api_error_(\d+)$/.exec(err.message || "");
      const status = statusMatch ? Number(statusMatch[1]) : null;
      let errorText;
      if (status === 429) {
        errorText = "Şu anda çok fazla istek var. Lütfen birkaç saniye bekleyip tekrar deneyin.";
      } else if (status === 504) {
        errorText = "AI yanıtı çok uzun sürdü. Lütfen tekrar deneyin.";
      } else if (status && status >= 500) {
        errorText = "Sunucu tarafında geçici bir sorun oluştu. Lütfen birazdan tekrar deneyin.";
      } else if (status) {
        errorText = "İsteğiniz işlenemedi. Lütfen tekrar deneyin.";
      } else if (photo && !(err instanceof TypeError)) {
        errorText = photoErrorText(err);
      } else {
        errorText = "İnternet bağlantınıza ulaşılamadı. Bağlantınızı kontrol edip tekrar deneyin.";
      }
      setMessages((prev) => [...prev, { role: "assistant", text: `${errorText} Acil bir durum varsa 112'yi arayın.`, time: nowLabel(), isError: true }]);
    } finally {
      setLoading(false);
      sendingRef.current = false;
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
    setActivePhoto(null);
    setMessages([{ role: "assistant", text: activeContext ? activeContext.greeting : "Sohbet temizlendi. Nasıl yardımcı olabilirim?", time: nowLabel() }]);
    if (!contextId) {
      try { localStorage.removeItem(historyKey); } catch { /* no-op */ }
    }
  }

  function clearContext() {
    // UX FIX (AI Chat cilası — kalıcı geçmiş bütünlüğü): önceden burada mesaj listesi
    // sabit tek bir karşılama mesajına sıfırlanıyordu. Aşağıdaki `useEffect` (`if
    // (!contextId) saveChatHistory(messages)`) bu YENİ, tek mesajlık listeyi hemen
    // localStorage'a yazıyordu — kullanıcının bu oturumdan önce biriktirdiği GERÇEK genel
    // sohbet geçmişi (bağlam bazlı sohbete hiç yüklenmemişti, bkz. yukarıdaki `useState`
    // başlatıcısı) sessizce ÜZERİNE YAZILIP kayboluyordu. Artık genel sohbete dönüşte
    // kayıtlı geçmiş varsa o geri yükleniyor; yoksa eskisi gibi karşılama mesajı gösteriliyor.
    setContextId(null);
    setActivePhoto(null);
    navigate("/chat", { replace: true, state: {} });
    const saved = loadChatHistory(historyKey);
    setMessages(saved && saved.length > 0 ? saved : [{ role: "assistant", text: "Genel sohbete döndük. Nasıl yardımcı olabilirim?", time: nowLabel() }]);
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    // DÜZELTME: metin gönderimindeki AYNI çift-tıklama koruması (yukarıdaki sendingRef
    // notuna bkz.) fotoğraf analizinde eksikti — yalnızca `loading` state'ine güvenmek
    // aynı senkron-an yarış durumuna açıktı. Kamera butonu zaten `disabled={loading}`
    // ile korunuyor ama state güncellemesi bir sonraki render'a kadar yansımıyor.
    if (sendingRef.current) return;

    const { valid, error } = await validateImageFile(file);
    if (!valid) {
      showToast(error, "error");
      return;
    }

    try {
      // Telefon fotoğrafları sunucu sınırını (~8MB) aşabildiği ve her soruda yeniden gönderildiği
      // için eklerken sıkıştırılıyor (Cosmos Vision Test sayfasındaki aynı yardımcı).
      const dataUrl = await compressImageToDataUrl(file);
      // DÜZELTME: seçilen fotoğraf artık otomatik bir mesaj/analiz TETİKLEMİYOR — yalnızca
      // önizleme olarak eklenir; kullanıcı mesajını yazıp gönderince fotoğrafla birlikte gider
      // (bkz. sendMessage). Risk tespiti yalnızca Risk Tespiti sayfasından yapılır.
      setActivePhoto({ dataUrl, base64: dataUrl.split(",")[1], mediaType: "image/jpeg" });
    } catch (err) {
      console.error("Fotoğraf hazırlanamadı:", err);
      showToast("Dosya okunamadı, tekrar deneyin.", "error");
    }
  }

  // Sohbet, üst ve alt gezinmeden kalan içerik alanını doldurur.
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
                  className="rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-snug whitespace-pre-wrap break-words"
                  style={m.role === "user"
                    ? { background: theme.accent, color: theme.onAccent, borderBottomRightRadius: "0.25rem", fontWeight: 500 }
                    : m.isError
                      ? { background: theme.warnBg, color: theme.warnText, border: `1px solid ${theme.warnText}33`, borderBottomLeftRadius: "0.25rem" }
                      : { background: theme.bubbleAssistantBg, color: theme.bubbleAssistantText, border: `1px solid ${theme.border}`, borderBottomLeftRadius: "0.25rem" }}
                >
                  {m.image && <img src={m.image} alt="Fotoğraf — büyütmek için dokunun" onClick={() => setViewerImage(m.image)} className="rounded-lg mb-2 max-h-40 w-full object-cover cursor-pointer" />}
                  {m.isError && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold mb-1">
                      <AlertTriangle style={{ fontSize: "12px" }} /> Bir sorun oluştu
                    </span>
                  )}
                  {/* Sprint 10: AI cevapları artık markdown-lite ile render ediliyor
                      (kalın, listeler, kod blokları) — bkz. MarkdownLite.jsx. Kullanıcının
                      kendi yazdığı mesajlar ve hata mesajları düz metin kalır; markdown
                      yorumlaması yalnızca gerçek AI cevaplarına uygulanır. */}
                  {m.role === "assistant" && !m.isError ? <MarkdownLite text={m.text} theme={theme} /> : m.text}
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
      <div className="flex flex-col gap-1 px-3 pt-3 pb-3 border-t shrink-0 max-w-3xl mx-auto w-full" style={{ borderColor: theme.border, background: theme.header }}>
        {input.length > MAX_MESSAGE_LENGTH - 200 && (
          <p className="text-[10px] text-right pr-1" style={{ color: input.length >= MAX_MESSAGE_LENGTH ? theme.highRiskText : theme.textFaint }}>
            {input.length}/{MAX_MESSAGE_LENGTH}
          </p>
        )}
        {activePhoto && (
          <div className="flex items-center gap-2.5 px-1 pb-1">
            <img
              src={activePhoto.dataUrl}
              alt="Eklenen fotoğraf — büyütmek için dokunun"
              onClick={() => setViewerImage(activePhoto.dataUrl)}
              className="w-16 h-16 rounded-lg object-cover shrink-0 cursor-pointer"
              style={{ border: `1px solid ${theme.border}` }}
            />
            <p className="flex-1 text-[11px]" style={{ color: theme.textMuted }}>Fotoğraf eklendi. Aşağıya mesajınızı yazıp gönderin.</p>
            <button onClick={() => setActivePhoto(null)} aria-label="Fotoğrafı kaldır" className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
              <X style={{ fontSize: "12px", color: theme.textMuted }} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button onClick={() => fileInputRef.current?.click()} disabled={loading} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: theme.surfaceAlt, border: `1px solid ${theme.border}` }}>
            <Camera style={{ fontSize: "16px", color: theme.textMuted }} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder={activePhoto ? "Fotoğrafla ilgili mesaj yazın..." : "Sorunuzu yazın..."}
            maxLength={MAX_MESSAGE_LENGTH}
            className="flex-1 text-sm rounded-full px-4 py-2.5 outline-none border"
            style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }}
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-40" style={{ background: theme.accent }}>
            <Send style={{ fontSize: "16px", color: theme.onAccent }} sw={2.5} />
          </button>
        </div>
      </div>
      {viewerImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setViewerImage(null)} role="dialog" aria-label="Fotoğraf önizleme">
          <button className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)" }} aria-label="Kapat" onClick={() => setViewerImage(null)}>
            <X style={{ fontSize: "16px", color: "#fff" }} />
          </button>
          <img src={viewerImage} alt="Fotoğraf" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  );
}