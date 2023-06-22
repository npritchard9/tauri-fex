import { createEffect, createSignal, For, onMount } from "solid-js";
import { invoke } from "@tauri-apps/api/tauri";
import { Fex } from "../src-tauri/bindings/Fex";
import { FexFile } from "../src-tauri/bindings/FexFile";

const [dir, setDir] = createSignal<String[]>([""]);
function App() {
  const [files, setFiles] = createSignal<FexFile[]>([]);

  async function get_files() {
    let fex: Fex = await invoke("send_dir", { dir: dir().join("/") });
    console.log(fex);
    setFiles(fex.files);
  }

  onMount(() => get_files());

  createEffect(() => {
    get_files();
  });

  return (
    <div class="h-screen">
      <div class="flex border-b-gray-600 border-b-2 p-2 items-center justify-between">
        <div>{dir().join("/")}</div>
        <div class="text-4xl">Fex</div>
        <div
          class="text-xl"
          onclick={() => setDir((d) => d.filter((p) => p !== dir().at(-1)))}
        >
          &larr;
        </div>
      </div>
      <For each={files()}>{(f) => <File {...f} />}</For>
    </div>
  );
}

const File = (f: FexFile) => {
  return (
    <div
      class="flex items-center justify-start gap-4 ml-2 p-1 w-screen"
      onclick={() =>
        (f.file_type === "Dir" || f.file_type === "HiddenDir") &&
        setDir((d) => [...d, f.name])
      }
    >
      <span class="font-bold overflow-x-scroll w-1/3">{f.name}</span>
      <span class="text-amber-300 w-16">{f.len as unknown as number}</span>
      <span class="text-blue-300">
        {f.date} {f.time}
      </span>
    </div>
  );
};

export default App;
