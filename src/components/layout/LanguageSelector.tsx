import { Check, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "react-i18next";

const languages = [
  { name: "English", value: "en", dir: "ltr" },
  { name: "עברית", value: "he", dir: "rtl" },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleLanguageChange = (languageValue: string) => {
    const language = languages.find((lang) => lang.value === languageValue);
    if (!language) return;

    i18n.changeLanguage(languageValue);
    document.documentElement.dir = language.dir;
    document.documentElement.lang = languageValue;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Languages className="h-5 w-5" />
          <span className="sr-only">{i18n.t('common.selectLanguage')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.value}
            onClick={() => handleLanguageChange(language.value)}
            className="flex items-center justify-between"
          >
            <span>{language.name}</span>
            {i18n.language === language.value && (
              <Check className="h-4 w-4 ml-2" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
