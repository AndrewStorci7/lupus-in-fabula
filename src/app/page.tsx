import { MainPage } from "@pages";
import { Footer } from "@components";
import { SocketProvider } from "@providers";

export default function Page() {
  return (
    <SocketProvider>
      <MainPage />
      <Footer />
    </SocketProvider>
  );
}