import {
  createEffect,
  createSignal,
  For,
  Match,
  onMount,
  Show,
  Switch,
} from "solid-js";
import { createMutable } from "solid-js/store";
import { invoke } from "@tauri-apps/api/tauri";
import { Fex } from "../src-tauri/bindings/Fex";
import { FexFile } from "../src-tauri/bindings/FexFile";
import {
  ChevronIcon,
  DeleteIcon,
  DocumentIcon,
  FavoriteIcon,
  FolderIcon,
  HiddenIcon,
  VisibleIcon,
} from "./assets/svgs";

type QuickAccessItem = {
  name: string;
  path: string;
};

const [file, setFile] = createSignal<string>("");
const dir = createMutable<{ path: string[] }>({ path: [] });
const [filePath, setFilePath] = createSignal<string[]>([]);
const [showHidden, setShowHidden] = createSignal(false);
const [search, setSearch] = createSignal<string>("");
const [quickAccess, setQuickAccess] = createSignal<QuickAccessItem[]>([]);

const cd = () => dir.path.at(-1) ?? "Home";
const pwd = () => dir.path.join("/");

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
    let fex: Fex = await invoke("send_dir", { dir: pwd() });
    setFiles(fex.files);
  }

  onMount(() => get_files());

  createEffect(() => {
    get_files();
  });

  createEffect(() => {
    console.log(dir);
  });

  return (
    <div class="h-screen w-screen">
      <div class="flex border-b-gray-800 border-b p-2 items-center justify-between">
        <div class="flex items-center gap-4">
          <button
            class="text-xl disabled:text-gray-600"
            onclick={() => {
              setFilePath([]);
              setFile("");
              setSearch("");
              dir.path.pop();
            }}
            disabled={dir.path.length === 0}
          >
            &larr;
          </button>
          <div class="flex items-center">
            <div
              class="p-2 rounded-xl hover:bg-gray-800"
              onclick={() => (dir.path = [])}
            >
              {"Home"}
            </div>
            <div class="flex items-center">
              <For each={dir.path}>
                {(d, i) => (
                  <span
                    class="flex items-center p-2 rounded-xl hover:bg-gray-800"
                    onclick={() => {
                      dir.path = dir.path.slice(0, i() + 1);
                    }}
                  >
                    <ChevronIcon />
                    {d}
                  </span>
                )}
              </For>
            </div>
          </div>
        </div>
        <div class="flex gap-4">
          <input
            type="text"
            placeholder={`Search ${cd()}`}
            value={search()}
            oninput={(e) => setSearch(e.currentTarget.value)}
            class="bg-gray-800 text-white placeholder-white rounded-xl p-2"
          />
          <button onclick={() => setShowHidden((p) => !p)}>
            {showHidden() ? HiddenIcon() : VisibleIcon()}
          </button>
        </div>
      </div>
      <div class="flex h-full w-full">
        <div class="w-1/5 flex flex-col justify-start gap-2 border-r p-2 border-gray-800">
          <div class="text-2xl">Quick Access</div>
          <For each={quickAccess()}>{(q) => <SidebarItem d={q} />}</For>
        </div>
        <div class="flex flex-col w-full">
          <Show
            when={file() === ""}
            fallback={
              <pre class="m-4">
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
      </div>
    </div>
  );
}

const SidebarItem = (props: { d: QuickAccessItem }) => {
  return (
    <div
      class="flex justify-between group"
      ondblclick={() => (dir.path = props.d.path.split("/"))}
    >
      <div class="flex gap-2">
        <FolderIcon />
        {props.d.name}
      </div>
      <button
        class="invisible group-hover:visible"
        onclick={() =>
          setQuickAccess((p) => p.filter((q) => q.path != props.d.path))
        }
      >
        <DeleteIcon />
      </button>
    </div>
  );
};

function handle_click_entry(f: FexFile) {
  setSearch("");
  if (f.file_type === "Dir" || f.file_type === "HiddenDir") {
    dir.path = [...dir.path, f.name];
  } else {
    setFilePath([...dir.path, f.name]);
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
          ondblclick={() => handle_click_entry(f)}
        >
          <span>{icon}</span>
          <span class="font-bold overflow-x-scroll w-1/3">{f.name}</span>
          <span>
            {f.date} {f.time}
          </span>
          <span>{f.file_type}</span>
        </div>
      </Match>
      <Match when={!showHidden()}>
        <Show when={f.file_type === "File" || f.file_type === "Dir"}>
          <div
            class="group flex items-center justify-between mx-2 p-2 hover:bg-gray-800 hover:rounded-xl"
            ondblclick={() => handle_click_entry(f)}
          >
            <div class="grid grid-cols-3 w-3/4">
              <div class="flex items-center gap-4">
                <span>{icon}</span>
                <span class="font-bold overflow-x-scroll">{f.name}</span>
              </div>
              <span class="flex justify-start">
                {f.date} {f.time}
              </span>
              <span>{f.file_type}</span>
            </div>
            <Show when={f.file_type === "Dir"}>
              <button
                class="invisible group-hover:visible"
                onclick={() => {
                  let path = pwd() === "" ? f.name : pwd() + "/" + f.name;
                  if (
                    (f.file_type === "Dir" || f.file_type === "HiddenDir") &&
                    !quickAccess().includes({
                      name: f.name,
                      path: path,
                    })
                  ) {
                    setQuickAccess((p) => [...p, { name: f.name, path: path }]);
                  }
                }}
              >
                <FavoriteIcon />
              </button>
            </Show>
          </div>
        </Show>
      </Match>
    </Switch>
  );
};

export default App;
