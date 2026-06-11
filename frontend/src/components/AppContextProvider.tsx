import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { HelmetProvider } from 'react-helmet-async';
import { useMemo, type PropsWithChildren } from "react";
import { IntlProvider } from 'react-intl';
import translations from '../translations/en.json';
import { useAppStore } from "../store/useAppStore";


export const AppContextProvider = ({ children }: PropsWithChildren) => {
  const mode = useAppStore((s) => s.theme);
  const theme = useMemo(() => createTheme({
    palette: {
      mode,
      primary: {
        main: "#00e980",
      },
      background: {
        default: "#011926",
      },
    },
    typography: {
      fontFamily: "JetBrains Mono",
      button: {
        textTransform: "none",
      },
    },
  }), [mode]);

  const locale = 'en';

  /* TODO: Introduce Header, Footer */
  return (
    <HelmetProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline>
          <IntlProvider
            locale={locale}
            messages={translations}
            fallbackOnEmptyString
            defaultLocale="en"
          >
            {children}
          </IntlProvider>
        </CssBaseline>
      </ThemeProvider>
    </HelmetProvider>
  )
}

AppContextProvider.displayName = 'AppContextProvider';
