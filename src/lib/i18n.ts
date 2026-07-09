import { createContext, createElement, useContext, useState, type ReactNode } from "react";

// Lightweight UI i18n. Only the app CHROME is translated (nav, buttons, section
// titles, settings, hints). Practice CONTENT stays English on purpose — this is
// an English speaking coach, so topics / AI coaching / golden lines are English.

export type Lang = "en" | "zh";
const KEY = "speakspark.lang";

export function getStoredLang(): Lang {
  try {
    const v = window.localStorage.getItem(KEY) as Lang | null;
    if (v === "en" || v === "zh") return v;
    return (navigator.language || "").toLowerCase().startsWith("zh") ? "zh" : "en";
  } catch {
    return "en";
  }
}

type Entry = { en: string; zh: string };
const T: Record<string, Entry> = {
  // ── Bottom nav ──
  "nav.start": { en: "Start", zh: "开始" },
  "nav.practice": { en: "Practice", zh: "练习" },
  "nav.takeaway": { en: "Takeaway", zh: "复盘" },
  "nav.my": { en: "My", zh: "我的" },

  // ── Home ──
  "home.hey": { en: "Hey", zh: "嗨，" },
  "home.readyFirst": { en: "Ready for your first challenge?", zh: "准备好今天的挑战了吗？" },
  "home.weekSuffix": { en: "this week · nice work", zh: "本周 · 干得好" },
  "home.practicesN": { en: "practices", zh: "次练习" },
  "home.practiceN": { en: "practice", zh: "次练习" },
  "home.scenario": { en: "Practice scenario", zh: "练习场景" },
  "home.another": { en: "Another", zh: "换一个" },
  "home.topicHint": { en: "Speak on this — or just talk about your own.", zh: "就这个说 —— 或者说你自己的。" },
  "home.freeHint": { en: "Talk about anything on your mind — the coach will follow your idea.", zh: "想到什么说什么 —— 教练会跟着你的思路。" },
  "home.lastHighlight": { en: "Last Highlight", zh: "上次高光" },
  "home.library": { en: "Library", zh: "收藏库" },
  "home.noHighlights": { en: "No highlights yet", zh: "还没有高光" },
  "home.noHighlightsSub": { en: "Finish your first practice and your best phrases show up here.", zh: "完成第一次练习，你最好的表达就会出现在这里。" },
  "home.phrasesSaved": { en: "phrases saved", zh: "句已存" },
  "home.runSaved": { en: "Run saved", zh: "已保存" },
  "home.start": { en: "Start Practice", zh: "开始练习" },

  // ── Scenarios (labels + blurbs + "today's X" line) ──
  "scenario.debate": { en: "Debate", zh: "辩论" },
  "scenario.science": { en: "Science Talk", zh: "科普演讲" },
  "scenario.exam": { en: "Exam Prep", zh: "考试备考" },
  "scenario.free": { en: "Free Talk", zh: "自由说" },
  "blurb.debate": { en: "Claim, evidence, rebuttal", zh: "立论、举证、反驳" },
  "blurb.science": { en: "Explain an idea clearly", zh: "把一个道理讲清楚" },
  "blurb.exam": { en: "TOEFL / IELTS structure", zh: "托福 / 雅思 结构" },
  "blurb.free": { en: "Talk about anything", zh: "随便说什么都行" },
  "today.debate": { en: "Today's debate motion", zh: "今日辩题" },
  "today.science": { en: "Today's science topic", zh: "今日科普话题" },
  "today.exam": { en: "Today's exam question", zh: "今日考题" },
  "today.free": { en: "Today's topic", zh: "今日话题" },

  // ── My page ──
  "my.title": { en: "My Page", zh: "我的" },
  "my.growthMap": { en: "growth map", zh: "的成长地图" },
  "my.feedbackOnly": { en: "Practice feedback only", zh: "仅练习反馈" },
  "my.tryingPoint": { en: "Trying Point", zh: "本周尝试点" },
  "my.tryingPointSub": { en: "This week's visible upgrade", zh: "这周看得见的进步" },
  "my.growth": { en: "Practice growth", zh: "练习成长" },
  "my.vocabBank": { en: "Vocab bank", zh: "词汇库" },
  "my.vocabEmpty": { en: "No saved words yet — in a Takeaway, tap the bookmark on a word to save it here.", zh: "还没有存词 —— 在复盘页点词条上的书签就能存到这里。" },
  "my.history": { en: "Practice history", zh: "练习历史" },
  "my.allDays": { en: "All days", zh: "全部" },
  "my.blueDots": { en: "Blue dots mean practice days.", zh: "蓝点是练习过的日子。" },
  "my.clear": { en: "Clear", zh: "清除" },
  "my.noRunsYet": { en: "No practice runs saved yet. Finish a practice and it shows up here.", zh: "还没有练习记录。完成一次练习就会出现在这里。" },
  "my.noRunsDate": { en: "No runs on this date. Pick a day with a blue dot, or clear the date.", zh: "这天没有练习。选一个带蓝点的日子，或清除日期。" },
  "my.settings": { en: "Settings", zh: "设置" },
  "my.coachMode": { en: "Coach mode", zh: "教练模式" },
  "my.savedPhraseBank": { en: "Saved phrase bank", zh: "短语库" },
  "my.savedPhraseEmpty": { en: "No saved phrases yet — finish a practice and your highlighted words show up here.", zh: "还没有短语 —— 完成一次练习，高亮的词就会出现在这里。" },
  "my.coachingPrompt": { en: "Coaching prompt", zh: "教练指令" },
  "my.custom": { en: "Custom", zh: "自定义" },
  "my.default": { en: "Default", zh: "默认" },
  "my.language": { en: "Language", zh: "语言" },
  "my.phrases": { en: "phrases", zh: "个短语" },
  "my.phrase": { en: "phrase", zh: "个短语" },
};

export function tr(key: string, lang: Lang): string {
  const e = T[key];
  return e ? e[lang] : key;
}

interface I18nValue { lang: Lang; setLang: (l: Lang) => void; t: (k: string) => string }
const Ctx = createContext<I18nValue>({ lang: "en", setLang: () => {}, t: (k) => k });

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => getStoredLang());
  const setLang = (l: Lang) => {
    setLangState(l);
    try { window.localStorage.setItem(KEY, l); } catch { /* ignore */ }
  };
  const t = (k: string) => tr(k, lang);
  return createElement(Ctx.Provider, { value: { lang, setLang, t } }, children);
}

export function useI18n(): I18nValue {
  return useContext(Ctx);
}
