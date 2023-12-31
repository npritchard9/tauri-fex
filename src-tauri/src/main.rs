// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;

use fex::*;
use tauri::State;

mod fex;

struct FexState(pub Mutex<Fex>);

#[tauri::command]
fn send_dir(fex_state: State<FexState>, dir: &str) -> Fex {
    fex_state.0.lock().unwrap().files(dir);
    fex_state.0.lock().unwrap().clone()
}

#[tauri::command]
fn send_file(fex_state: State<FexState>, path: &str) -> String {
    fex_state.0.lock().unwrap().get_file(path)
}

fn main() {
    tauri::Builder::default()
        .manage(FexState(Mutex::new(Fex::new())))
        .invoke_handler(tauri::generate_handler![send_dir, send_file])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
