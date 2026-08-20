import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getEquipment, saveEquipment } from "../services/documentService.js";
import { getNotificationRecords, saveNotificationRecord } from "../services/notificationRecordService.js";
import { useToast } from "./ToastContext.jsx";

const IsgDataContext = createContext(null);

export function IsgDataProvider({ children }) {
  const [equipmentList, setEquipmentList] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    Promise.all([getEquipment(), getNotificationRecords()]).then(([eq, notif]) => {
      setEquipmentList(eq);
      setNotifications(notif);
      setLoaded(true);
    }).catch((err) => {
      console.error("İSG verileri yüklenemedi:", err);
      setLoaded(true);
      showToast("Yerel İSG verileri yüklenemedi. Sayfayı yenileyip tekrar deneyin.", "error");
    });
  }, [showToast]);

  // REFACTOR: bu üç fonksiyon "optimistic update" yapıyor (önce UI'ı güncelle, sonra
  // arka planda kaydet) — ama daha önce saveEquipment/saveNotificationRecord'un dönen
  // Promise'i hiç beklenmiyor/yakalanmıyordu. db.js artık gerçek yazma hatalarında
  // (örn. IndexedDB kotası dolu, tarayıcı gizli modda depolamayı engelliyor) reject
  // ediyor (bkz. services/db.js) — bu, önceden sessizce yutulan bir hatayı artık
  // yakalayıp kullanıcıya göstermemiz VE ekrandaki "kaydedilmiş gibi görünen" veriyi
  // geri almamız gerektiği anlamına geliyor. Aksi halde kullanıcı, aslında diskte
  // olmayan bir kaydı ekranda görmeye devam eder (bkz. proje kuralı: sessiz/sahte veri yok).
  const addEquipment = useCallback((eq) => {
    setEquipmentList((prev) => [...prev, eq]);
    saveEquipment(eq).catch((err) => {
      console.error("Ekipman kaydedilemedi:", err);
      setEquipmentList((prev) => prev.filter((e) => e.id !== eq.id));
      showToast("Ekipman kaydedilemedi, lütfen tekrar deneyin.", "error");
    });
  }, [showToast]);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => [notif, ...prev]);
    saveNotificationRecord(notif).catch((err) => {
      console.error("Bildirim kaydedilemedi:", err);
      setNotifications((prev) => prev.filter((n) => n.id !== notif.id));
      showToast("Bildirim kaydedilemedi, lütfen tekrar deneyin.", "error");
    });
  }, [showToast]);

  const updateNotification = useCallback((id, patch) => {
    let previous;
    setNotifications((prev) => {
      previous = prev;
      const updated = prev.map((n) => (n.id === id ? { ...n, ...patch } : n));
      const changed = updated.find((n) => n.id === id);
      if (changed) {
        saveNotificationRecord(changed).catch((err) => {
          console.error("Bildirim güncellenemedi:", err);
          setNotifications(previous);
          showToast("Bildirim güncellenemedi, lütfen tekrar deneyin.", "error");
        });
      }
      return updated;
    });
  }, [showToast]);

  return (
    <IsgDataContext.Provider value={{ equipmentList, notifications, loaded, addEquipment, addNotification, updateNotification }}>
      {children}
    </IsgDataContext.Provider>
  );
}

export function useIsgData() {
  const ctx = useContext(IsgDataContext);
  if (!ctx) throw new Error("useIsgData must be used within an IsgDataProvider");
  return ctx;
}
