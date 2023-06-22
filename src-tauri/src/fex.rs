use colored::Colorize;
use serde::Serialize;
use std::{
    fmt::Display,
    fs::{read_dir, DirEntry},
    time::UNIX_EPOCH,
};
use tauri::api::path::home_dir;
use ts_rs::TS;

use chrono::{Datelike, Month, TimeZone, Timelike};

#[derive(Serialize, TS, Clone)]
#[ts(export)]
pub struct Fex {
    files: Vec<FexFile>,
    dir: String,
}

impl Fex {
    pub fn new() -> Self {
        Fex {
            files: Vec::new(),
            dir: String::from(""),
        }
    }

    pub fn read_dir(&mut self, dir: &str) {
        let dir = format!("{}/{}", home_dir().unwrap().to_str().unwrap(), dir);
        self.files = read_dir(dir)
            .expect("to be able to read the current directory")
            .map(|e| FexFile::from(e.expect("the entry to exist")))
            .collect();
    }

    pub fn files(&mut self, dir: &str) -> Vec<FexFile> {
        if self.dir != dir || dir == "" {
            self.dir = dir.to_string();
            self.read_dir(dir);
        }
        self.files.clone()
    }
}

#[derive(Serialize, Clone, TS)]
#[ts(export)]
pub enum FileType {
    File,
    Dir,
    HiddenFile,
    HiddenDir,
}

#[derive(Serialize, Clone, TS)]
#[ts(export)]
pub struct FexFile {
    pub name: String,
    pub date: String,
    pub time: String,
    pub len: u64,
    pub file_type: FileType,
}

impl Display for FexFile {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        use FileType::*;
        let name = match self.file_type {
            File | HiddenFile => self.name.white(),
            Dir | HiddenDir => self.name.blue(),
        };
        writeln!(
            f,
            "{} {} {} {}",
            name,
            self.date.green(),
            self.time.green(),
            self.len.to_string().blue()
        )
    }
}

impl From<DirEntry> for FexFile {
    fn from(entry: DirEntry) -> Self {
        if let Ok(meta) = entry.metadata() {
            let secs = meta
                .modified()
                .expect("to be able to read modified")
                .duration_since(UNIX_EPOCH)
                .expect("to be able to read duration since")
                .as_secs();
            let date = chrono::Utc.timestamp_opt(secs as i64, 0).unwrap();
            let month = Month::try_from(u8::try_from(date.month()).unwrap())
                .ok()
                .unwrap();
            let day = date.day();
            let hours = date.hour();
            let mins = date.minute();
            let time = format!("{}:{}", hours, mins);
            let date = format!("{} {}", day, month.name());
            let name = entry
                .file_name()
                .to_str()
                .expect("to be able to read the name")
                .to_string();
            let file_type = if name.starts_with(".") {
                if meta.is_file() {
                    FileType::HiddenFile
                } else {
                    FileType::HiddenDir
                }
            } else {
                if meta.is_file() {
                    FileType::File
                } else {
                    FileType::Dir
                }
            };
            FexFile {
                name,
                date,
                time,
                len: entry.metadata().unwrap().len(),
                file_type,
            }
        } else {
            FexFile {
                name: String::from(""),
                date: String::from(""),
                time: String::from(""),
                len: 0,
                file_type: FileType::File,
            }
        }
    }
}
