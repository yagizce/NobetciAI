import { useState, useMemo } from "react";
import { MOCK_KNOWLEDGE_DOCUMENTS, KNOWLEDGE_CATEGORIES, matchesDocumentSearch } from "../../constants/knowledgeCenter.js";

/**
 * Sprint 6: Knowledge Center için arama + kategori + doküman türü filtrelemesini yönetir.
 * Şimdilik tamamen mock veri üzerinde çalışır (services/dataProvider'a bağlı değildir) —
 * gerçek bir doküman deposu eklendiğinde yalnızca bu hook'un veri kaynağı değişecek,
 * bileşenler (KnowledgeCenterPage, CategoryCard, DocumentCard, DocumentDetailDrawer)
 * etkilenmeyecek şekilde tasarlandı.
 */
export function useKnowledgeDocuments(initialSearch = "") {
  const [search, setSearch] = useState(initialSearch);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const doc of MOCK_KNOWLEDGE_DOCUMENTS) counts[doc.category] = (counts[doc.category] || 0) + 1;
    return counts;
  }, []);

  const filteredDocuments = useMemo(() => {
    return MOCK_KNOWLEDGE_DOCUMENTS.filter((doc) => {
      const matchesCategory = categoryFilter === "all" || doc.category === categoryFilter;
      const matchesType = typeFilter === "all" || doc.type === typeFilter;
      return matchesCategory && matchesType && matchesDocumentSearch(doc, search);
    });
  }, [search, categoryFilter, typeFilter]);

  return {
    categories: KNOWLEDGE_CATEGORIES,
    categoryCounts,
    documents: filteredDocuments,
    totalCount: MOCK_KNOWLEDGE_DOCUMENTS.length,
    search, setSearch,
    categoryFilter, setCategoryFilter,
    typeFilter, setTypeFilter,
  };
}
