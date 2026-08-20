import { useState } from "react";
import Button from "../../../../../components/ui/Button.jsx";
import EmptyState from "../../../../../components/EmptyState.jsx";
import { StickyNote } from "../../../../../components/icons/index.jsx";

/**
 * @param {{ entry: object, theme: object, onAdd: (text: string) => void }} props
 */
export default function NotesTab({ entry, theme, onAdd }) {
  const [text, setText] = useState("");
  const notes = [...(entry.notes || [])].sort((a, b) => new Date(b.at) - new Date(a.at));

  function submit() {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Not ekle..."
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          className="flex-1 text-sm rounded-lg px-3 py-2 outline-none border" style={{ background: theme.surfaceAlt, borderColor: theme.border, color: theme.textPrimary }} />
        <Button size="sm" onClick={submit} disabled={!text.trim()}>Ekle</Button>
      </div>

      {notes.length === 0 ? (
        <EmptyState icon={StickyNote} title="Henüz not yok" description="Bu risk hakkında ilk notu ekleyin." />
      ) : (
        <div className="space-y-2">
          {notes.map((n) => (
            <div key={n.id} className="rounded-lg border px-3 py-2.5" style={{ borderColor: theme.border, background: theme.surface }}>
              <p className="text-sm mb-1" style={{ color: theme.textPrimary }}>{n.text}</p>
              <p className="text-[10.5px]" style={{ color: theme.textFaint }}>{n.author} • {new Date(n.at).toLocaleString("tr-TR")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
