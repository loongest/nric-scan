import '@/styles/globals.css'
import type { AppProps } from 'next/app'
import { createGlobalStyle } from 'styled-components';

// Define your global styles using createGlobalStyle
const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    font-family: sans-serif;
    font-size: 16px;
    line-height: 24px;
  }

  body {
    max-width: 960px;
    min-height: 100%;
    margin: 0 auto;
    padding: 3rem 1.5rem;
    background-color: #eee;
  }

  blinkid-in-browser {
     max-width: 400px;
 
     /* Customization of UI - see variables in src/components/shared/styles/_globals.scss */
     /*
     --mb-component-background: red;
     --mb-component-action-label: none;
     --mb-component-border-width: 0;
     --mb-component-action-buttons-width: 100%;
     --mb-component-action-buttons-justify-content: space-evenly;
     --mb-component-button-size: 48px;
     --mb-component-button-border-radius: 24px;
     */
  }
`;

export default function App({ Component, pageProps }: AppProps) {
  // return <Component {...pageProps} />
  return (
    <>
      {/* Apply the global styles */}
      <GlobalStyle />
      {/* Render the component */}
      <Component {...pageProps} />
    </>
  );
  
}
