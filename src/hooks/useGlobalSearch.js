import { useState, useEffect } from "react";
import { getFineKinneyEntries } from "../services/riskService.js";
import { getRiskDetections } from "../services/riskDetectionService.js";
import { getPeriodicChecks } from "../services/periodicCheckService.js";
import { getDocuments } from "../services/documentService.js";
import { MOCK_KNOWLEDGE_DOCUMENTS } from "../constants/knowledgeCenter.js";
import { buildGlobalSearchResults } from "../constants/globalSearch.js";

const DEBOUNCE_MS = 250;

/**
 * @param {string} query - GlobalSearchBar.jsx'teki arama kutusunun ham metni
 * @returns {{ results: ReturnType<typeof buildGlobalSearchResults>, loading: boolean }}
 */
export function useGlobalSearch(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const trimmed = (query || "").trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    // Debounce: kullanıcı her tuş vuruşunda 4 servisi (IndexedDB) sorgulamayı önler.
    const timer = setTimeout(async () => {
      try {
        const [fineKinney, riskDetections, periodicChecks, documents] = await Promise.all([
          getFineKinneyEntries(),
          getRiskDetections(),
          getPeriodicChecks(),
          getDocuments(),
        ]);
        if (cancelled) return;
        setResults(buildGlobalSearchResults(query, {
          fineKinney, riskDetections, periodicChecks, documents, knowledgeDocs: MOCK_KNOWLEDGE_DOCUMENTS,
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  return { results, loading };
}
