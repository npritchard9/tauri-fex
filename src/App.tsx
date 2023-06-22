import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { Fex } from "../src-tauri/bindings/Fex";
import { FexFile } from "../src-tauri/bindings/FexFile";
import FolderIcon from "./assets/folder";
import DocumentIcon from "./assets/document";

const [file, setFile] = createSignal<string>("");
const [dir, setDir] = createSignal<String[]>([""]);
const [filePath, setFilePath] = createSignal<String[]>([]);
const [showHidden, setShowHidden] = createSignal(false);
const [search, setSearch] = createSignal<string>("");

const cd = () => dir().at(-1);

async function read_file() {
  let f: string = await invoke("send_file", { path: filePath().join("/") });
  setFile(f);
}

function App() {
  const [files, setFiles] = createSignal<FexFile[]>([]);

  const filtered_files = () =>
    files().filter((f) =>
      f.name.toLowerCase().includes(search().toLowerCase())
    );

  async function get_files() {
    let fex: Fex = await invoke("send_dir", { dir: dir().join("/") });
    setFiles(fex.files);
  }

  onMount(() => get_files());

  createEffect(() => {
    get_files();
  });

  createEffect(() => {
    console.log(dir());
  });

  return (
    <div class="h-screen w-screen">
      <div class="flex border-b-gray-600 border-b-2 p-2 items-center justify-between">
        <button
          class="text-xl disabled:text-gray-600"
          onclick={() => {
            setFilePath([]);
            setFile("");
            setSearch("");
            setDir((d) => d.filter((p) => p !== cd()));
          }}
          disabled={dir().length === 1}
        >
          &larr;
        </button>
        <input
          type="text"
          placeholder={`Search ${cd() === "" ? "Home" : cd()}`}
          value={search()}
          oninput={(e) => setSearch(e.currentTarget.value)}
          class="bg-gray-600 text-white placeholder-white rounded-xl p-2"
        />
        <div>{dir().join("/")}</div>
        <div class="text-4xl">Fex</div>
        <div class="flex items-center justify-center gap-2">
          <input
            type="checkbox"
            onclick={() => setShowHidden((p) => !p)}
            id="show-hidden"
          />
          <label for="show-hidden">Show hidden items</label>
        </div>
      </div>
      <Show
        when={file() === ""}
        fallback={
          <pre>
            <code>{file()}</code>
          </pre>
        }
      >
        <Show
          when={search()}
          fallback={<For each={files()}>{(f) => <File {...f} />}</For>}
        >
          <For each={filtered_files()}>{(f) => <File {...f} />}</For>
        </Show>
      </Show>
    </div>
  );
}

function handle_click_entry(f: FexFile) {
  setSearch("");
  if (f.file_type === "Dir" || f.file_type === "HiddenDir") {
    setDir((d) => [...d, f.name]);
  } else {
    setFilePath([...dir(), f.name]);
    read_file();
  }
}

const File = (f: FexFile) => {
  let icon =
    f.file_type === "File" || f.file_type === "HiddenFile" ? (
      <DocumentIcon />
    ) : (
      <FolderIcon />
    );
  return (
    <Switch>
      <Match when={showHidden()}>
        <div
          class="flex items-center justify-start gap-4 mx-2 p-2 hover:bg-gray-800 hover:rounded-xl"
          onclick={() => handle_click_entry(f)}
        >
          <span>{icon}</span>
          <span class="font-bold overflow-x-scroll w-1/3">{f.name}</span>
          <span class="text-amber-300 w-16">{f.len as unknown as number}</span>
          <span class="text-blue-300">
            {f.date} {f.time}
          </span>
        </div>
      </Match>
      <Match when={!showHidden()}>
        <Show when={f.file_type === "File" || f.file_type === "Dir"}>
          <div
            class="flex items-center justify-start gap-4 mx-2 p-2 hover:bg-gray-800 hover:rounded-xl"
            onclick={() => handle_click_entry(f)}
          >
            <span>{icon}</span>
            <span class="font-bold overflow-x-scroll w-1/3">{f.name}</span>
            <span class="text-amber-300 w-16">
              {f.len as unknown as number}
            </span>
            <span class="text-blue-300">
              {f.date} {f.time}
            </span>
          </div>
        </Show>
      </Match>
    </Switch>
  );
};

export default App;
