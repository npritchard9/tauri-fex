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

const [file, setFile] = createSignal<string>("");
const [dir, setDir] = createSignal<String[]>([""]);
const [filePath, setFilePath] = createSignal<String[]>([]);
const [showHidden, setShowHidden] = createSignal(false);

async function read_file() {
  let f: string = await invoke("send_file", { path: filePath().join("/") });
  setFile(f);
}

function App() {
  const [files, setFiles] = createSignal<FexFile[]>([]);

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
            setDir((d) => d.filter((p) => p !== dir().at(-1)));
          }}
          disabled={dir().length === 1}
        >
          &larr;
        </button>
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
        <For each={files()}>{(f) => <File {...f} />}</For>
      </Show>
    </div>
  );
}

function handle_click_entry(f: FexFile) {
  if (f.file_type === "Dir" || f.file_type === "HiddenDir") {
    setDir((d) => [...d, f.name]);
  } else {
    setFilePath([...dir(), f.name]);
    read_file();
  }
}

const File = (f: FexFile) => {
  return (
    <Switch>
      <Match when={showHidden()}>
        <div
          class="flex items-center justify-start gap-4 mx-2 p-2 hover:bg-gray-800 hover:rounded-xl"
          onclick={() => handle_click_entry(f)}
        >
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
