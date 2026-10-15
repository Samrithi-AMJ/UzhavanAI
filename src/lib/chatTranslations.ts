import type { Language } from './i18n';
import { chatEn } from './chatTranslations_en';
import { chatHi } from './chatTranslations_hi';
import { chatMr } from './chatTranslations_mr';
import { chatTa } from './chatTranslations_ta';
import { chatTe } from './chatTranslations_te';
import { chatBn } from './chatTranslations_bn';

export type ChatTranslations = Record<string, Record<Language, string>>;

const allLangs: Record<Language, Record<string, string>> = {
  en: chatEn,
  hi: chatHi,
  mr: chatMr,
  ta: chatTa,
  te: chatTe,
  bn: chatBn,
};

export const chatTranslations: ChatTranslations = (() => {
  const result: ChatTranslations = {};
  for (const key of Object.keys(chatEn)) {
    result[key] = {} as Record<Language, string>;
    for (const lang of Object.keys(allLangs) as Language[]) {
      result[key][lang] = allLangs[lang][key] ?? chatEn[key];
    }
  }
  return result;
})();
