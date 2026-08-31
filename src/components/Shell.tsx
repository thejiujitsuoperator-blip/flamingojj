"use client";

import { useStore } from "@/lib/store";
import Sidebar from "./Sidebar";
import Toast from "./Toast";
import Dashboard from "./pages/Dashboard";
import Sessions from "./pages/Sessions";
import Register from "./pages/Register";
import Approval from "./pages/Approval";
import Signoff from "./pages/Signoff";
import Members from "./pages/Members";
import Library from "./pages/Library";
import MyTraining from "./pages/MyTraining";
import Book from "./pages/Book";
import SessionModal from "./modals/SessionModal";
import BookingModal from "./modals/BookingModal";
import TechModal from "./modals/TechModal";
import type { PageKey } from "@/lib/data";

const PAGES: Record<PageKey, React.ComponentType> = {
  dashboard: Dashboard,
  sessions: Sessions,
  register: Register,
  approval: Approval,
  signoff: Signoff,
  members: Members,
  library: Library,
  "my-training": MyTraining,
  book: Book,
};

export default function Shell() {
  const { page, modal } = useStore();
  const Page = PAGES[page];

  return (
    <div className="shell">
      <Sidebar />
      <main className="main">
        <div className="page">
          <Page />
        </div>
      </main>

      {modal?.kind === "session" && <SessionModal editId={modal.editId} />}
      {modal?.kind === "booking" && <BookingModal sid={modal.sid} />}
      {modal?.kind === "tech" && <TechModal id={modal.id} />}

      <Toast />
    </div>
  );
}
