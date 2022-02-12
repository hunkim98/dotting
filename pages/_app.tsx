import "../styles/globals.css";
import type { AppProps } from "next/app";
import { Layout } from "../components/Layout";
import { MouseDragContextProvider } from "../context/MouseDragContext";
import { DataContextProvider } from "../context/DataContext";
import { ColorContextProvider } from "../context/ColorContext";
import { DraggableContextProvider } from "../context/DraggableContext";

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <MouseDragContextProvider>
      <DataContextProvider>
        <ColorContextProvider>
          <DraggableContextProvider>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </DraggableContextProvider>
        </ColorContextProvider>
      </DataContextProvider>
    </MouseDragContextProvider>
  );
}

export default MyApp;
