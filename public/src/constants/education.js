import { TRAINING_COURSES } from "./trainingCourses.js";

// Tek kaynak artık trainingCourses.js'tir — bu liste yalnızca geriye dönük uyumluluk
// için başlıkları türetir (Dashboard widget'ları gibi yalnızca başlığa ihtiyaç duyan
// tüketiciler için).
export const EDUCATION_MODULES = TRAINING_COURSES.map((c) => c.title);
