// CADPOINT CRM Local Agent - Tauri 2.x Main Entry Point
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct AgentSettings {
    pub storage_folder: String,
    pub server_url: String,
    pub token: String,
    pub auto_backup: bool,
    pub backup_frequency: String,
    pub retention_count: u32,
    pub organization_id: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct LocalStorageHealth {
    pub folder_accessible: bool,
    pub read_permission: bool,
    pub write_permission: bool,
    pub available_mb: u64,
    pub path: String,
}

#[tauri::command]
fn test_storage_folder(folder_path: String) -> Result<LocalStorageHealth, String> {
    let path = Path::new(&folder_path);

    if !path.exists() {
        if let Err(e) = fs::create_dir_all(path) {
            return Err(format!("Failed to create storage directory: {}", e));
        }
    }

    let test_file = path.join(".permissions_check.tmp");
    let write_ok = match fs::write(&test_file, b"cadpoint_crm_test") {
        Ok(_) => {
            let _ = fs::remove_file(&test_file);
            true
        }
        Err(_) => false,
    };

    let read_ok = path.read_dir().is_ok();

    Ok(LocalStorageHealth {
        folder_accessible: true,
        read_permission: read_ok,
        write_permission: write_ok,
        available_mb: 256000, // 256 GB simulated available space
        path: folder_path,
    })
}

#[tauri::command]
fn initialize_directory_structure(root_path: String) -> Result<Vec<String>, String> {
    let subfolders = vec![
        "database",
        "documents",
        "customers",
        "invoices",
        "attachments",
        "imports",
        "exports",
        "backups",
        "logs",
        "metadata",
    ];

    let root = Path::new(&root_path);
    let mut created = Vec::new();

    for sub in subfolders {
        let p = root.join(sub);
        if !p.exists() {
            fs::create_dir_all(&p).map_err(|e| e.to_string())?;
        }
        created.push(p.to_string_lossy().to_string());
    }

    Ok(created)
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            test_storage_folder,
            initialize_directory_structure
        ])
        .run(tauri::generate_context!())
        .expect("error while running CADPOINT CRM Local Agent application");
}

