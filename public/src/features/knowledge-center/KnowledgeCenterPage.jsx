import { useState, useMemo } from "react";
import { useTheme } from "../../contexts/ThemeContext.jsx";
import EmptyState from "../../components/EmptyState.jsx";
import { BookOpen, Star } from "../../components/icons/index.jsx";

import { useKnowledgeDocuments } from "./useKnowledgeDocuments.js";
import { useKnowledgeFavorites } from "./useKnowledgeFavorites.js";
import { MOCK_KNOWLEDGE_DOCUMENTS } from "../../constants/knowledgeCenter.js";
import CategoryCard from "./CategoryCard.jsx";
import DocumentFilters from "./DocumentFilters.jsx";
import DocumentCard from "./DocumentCard.jsx";
import DocumentDetailDrawer from "./DocumentDetailDrawer.jsx";
import KnowledgeAIAssistant from "./KnowledgeAIAssistant.jsx";

// Sprint 6: Knowledge Center — tamamen mock veri üzerinde çalışan, salt-okunur kurumsal
// Bilgi Kütüphanesi. Mevcut Dokümanlar (/documents) ve Mevzuat (/legislation) sayfalarına
// hiç dokunulmadı; bu yeni ve bağımsız bir modüldür.
// Sprint 7.3: AI'ya Sor, Favoriler ve İlgili Dokümanlar eklendi.
export default function KnowledgeCenterPage({ initialSearch } = {}) {
  const { theme, mode } = useTheme();
  const {
    categories, categoryCounts, documents, totalCount,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    typeFilter, setTypeFilter,
  } = useKnowledgeDocuments(initialSearch);
  const { isFavorite, toggleFavorite } = useKnowledgeFavorites();

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const visibleDocuments = useMemo(
    () => (favoritesOnly ? documents.filter((d) => isFavorite(d.id)) : documents),
    [documents, favoritesOnly, isFavorite]
  );

  function handleCategoryClick(key) {
    setCategoryFilter((current) => (current === key ? "all" : key));
  }

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <p className="font-[Oswald] text-xl uppercase tracking-wide mb-1" style={{ color: theme.textPrimary }}>Bilgi Kütüphanesi</p>
      <p className="text-xs mb-4" style={{ color: theme.textFaint }}>
        Mevzuat, risk analizi ve İSG dokümanlarına tek yerden ulaşın. ({totalCount} doküman)
      </p>

      <KnowledgeAIAssistant theme={theme} documents={MOCK_KNOWLEDGE_DOCUMENTS} onOpenDocument={setSelectedDoc} />

      <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 mb-5">
        {categories.map((cat) => (
          <CategoryCard
            key={cat.key}
            category={cat}
            count={categoryCounts[cat.key] || 0}
            active={categoryFilter === cat.key}
            theme={theme}
            onClick={() => handleCategoryClick(cat.key)}
          />
        ))}
      </div>

      <DocumentFilters
        theme={theme}
        search={search}
        onSearchChange={setSearch}
        typeFilter={typeFilter}
        onTypeFilterChange={setTypeFilter}
        categoryFilter={categoryFilter}
        onClearCategory={() => setCategoryFilter("all")}
      />

      <button
        onClick={() => setFavoritesOnly((v) => !v)}
        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full mb-3"
        style={favoritesOnly ? { background: theme.accent, color: theme.onAccent } : { background: theme.surfaceAlt, color: theme.textMuted, border: `1px solid ${theme.border}` }}
      >
        <Star style={{ fontSize: "12px", fill: favoritesOnly ? theme.onAccent : "none" }} /> Yalnızca Favoriler
      </button>

      {visibleDocuments.length === 0 ? (
        <EmptyState
          icon={favoritesOnly ? Star : BookOpen}
          title={favoritesOnly ? "Henüz favori doküman yok" : "Eşleşen doküman yok"}
          description={favoritesOnly ? "Bir dokümanı favorilere eklemek için yıldız simgesine dokun." : "Arama veya filtre kriterlerini değiştirmeyi deneyin."}
        />
      ) : (
        <div className="grid gap-2.5 sm:grid-cols-2">
          {visibleDocuments.map((doc) => (
            <DocumentCard
              key={doc.id}
              doc={doc}
              theme={theme}
              onClick={() => setSelectedDoc(doc)}
              isFavorite={isFavorite(doc.id)}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <DocumentDetailDrawer
        doc={selectedDoc}
        theme={theme}
        onClose={() => setSelectedDoc(null)}
        allDocuments={MOCK_KNOWLEDGE_DOCUMENTS}
        onOpenDocument={setSelectedDoc}
        isFavorite={selectedDoc ? isFavorite(selectedDoc.id) : false}
        onToggleFavorite={toggleFavorite}
      />
    </div>
  );
}
