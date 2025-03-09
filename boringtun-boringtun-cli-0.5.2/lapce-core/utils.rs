#![windows_subsystem = "windows"]
#[macro_use]
extern crate log;

use crate::core::utils::setup_uad_dir;
use fern::{
    FormatCallback,
    colors::{Color, ColoredLevelConfig},
};
use log::Record;
use std::sync::LazyLock;
use std::{fmt::Arguments, fs::OpenOptions, path::PathBuf};

mod core;
mod gui;

static CONFIG_DIR: LazyLock<PathBuf> =
    LazyLock::new(|| setup_uad_dir(&dirs::config_dir().expect("Can't detect config dir")));
static CACHE_DIR: LazyLock<PathBuf> =
    LazyLock::new(|| setup_uad_dir(&dirs::cache_dir().expect("Can't detect cache dir")));

fn main() -> iced::Result {
    // Safety: This function is safe to call in a single-threaded program.
    // The exact requirement is: you must ensure that there are no other threads concurrently writing or
    // reading(!) the environment through functions or global variables other than the ones in this module.
    unsafe {
        // Force WGPU/Iced to use discrete GPU to prevent crashes on PCs with two GPUs.
        // See #848 and related pull 850.
        std::env::set_var("WGPU_POWER_PREF", "high");
    }

    setup_logger().expect("setup logging");
    gui::UadGui::start()
}

/// Sets up logging to a new file in `CACHE_DIR/UAD`_{time}.log
/// Also attaches the terminal on Windows machines
/// '''
/// match `setup_logger().expect("Error` setting up logger")
/// '''
fn setup_logger() -> Result<(), fern::InitError> {
    /// Attach Windows terminal, only on Windows
    #[cfg(target_os = "windows")]
    {
        attach_windows_console();
    }

    let colors = ColoredLevelConfig::new().info(Color::Green);

    let make_formatter = |use_colors: bool| {
        move |out: FormatCallback, message: &Arguments, record: &Record| {
            out.finish(format_args!(
                "{} {} [{}:{}] {}",
                chrono::Local::now().format("%Y-%m-%d %H:%M:%S"),
                if use_colors {
                    format!("{:5}", colors.color(record.level()))
                } else {
                    format!("{:5}", record.level().to_string())
                },
                record.file().unwrap_or("?"),
                record.line().map(|l| l.to_string()).unwrap_or_default(),
                message
            ));
        }
    };

    let default_log_level = log::LevelFilter::Warn;
    let log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .truncate(false)
        .open(CACHE_DIR.join(format!("UAD_{}.log", chrono::Local::now().format("%Y%m%d"))))?;

    let file_dispatcher = fern::Dispatch::new()
        .format(make_formatter(false))
        .level(default_log_level)
        // Rust compiler makes module names use _ instead of -
        .level_for("uad_ng", log::LevelFilter::Debug)
        .chain(log_file);

    let stdout_dispatcher = fern::Dispatch::new()
        .format(make_formatter(true))
        .level(default_log_level)
        // Rust compiler makes module names use _ instead of -
        .level_for("uad_ng", log::LevelFilter::Warn)
        .chain(std::io::stdout());

    fern::Dispatch::new()
        .chain(stdout_dispatcher)
        .chain(file_dispatcher)
        .apply()?;

    Ok(())
}

/// (Windows) Allow the application to display logs to the terminal
/// regardless if it was compiled with `windows_subsystem = "windows"`.
///
/// This is excluded on non-Windows targets.
#[cfg(target_os = "windows")]
fn attach_windows_console() {
    use win32console::console::WinConsole;

    const ATTACH_PARENT_PROCESS: u32 = 0xFFFFFFFF;
    let _ = WinConsole::attach_console(ATTACH_PARENT_PROCESS);
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn init_logger() {
        match setup_logger() {
            Ok(()) => (),
            Err(error) => panic!("Error: {error}"),
        }
    }
}

use crate::core::{
    adb::{ACommand as AdbCommand, PmListPacksFlag},
    sync::User,
    theme::Theme,
    uad_lists::{PackageHashMap, PackageState, Removal, UadList},
};
use crate::gui::widgets::package_row::PackageRow;
use chrono::{DateTime, offset::Utc};
use csv::Writer;
use std::{
    collections::HashSet,
    fmt, fs,
    path::{Path, PathBuf},
};

/// Canonical shortened name of the application
pub const NAME: &str = "UAD-ng";
pub const EXPORT_FILE_NAME: &str = "selection_export.txt";

// Takes a time-stamp parameter,
// for purity and testability.
//
// The TZ is generic, because testing requires UTC,
// while users get the local-aware version.
#[expect(
    clippy::needless_pass_by_value,
    reason = "Timestamps should be fresh, no need to borrow"
)]
#[must_use]
pub fn generate_backup_name<T>(t: DateTime<T>) -> String
where
    T: chrono::TimeZone,
    T::Offset: std::fmt::Display,
{
    t.format("uninstalled_packages_%Y%m%d.csv").to_string()
}

#[derive(Debug, Clone, Copy)]
pub enum Error {
    DialogClosed,
}

pub fn fetch_packages(
    uad_lists: &PackageHashMap,
    device_serial: &str,
    user_id: Option<u16>,
) -> Vec<PackageRow> {
    let all_sys_packs = AdbCommand::new()
        .shell(device_serial)
        .pm()
        .list_packages_sys(Some(PmListPacksFlag::IncludeUninstalled), user_id)
        .unwrap_or_default();
    let enabled_sys_packs: HashSet<String> = AdbCommand::new()
        .shell(device_serial)
        .pm()
        .list_packages_sys(Some(PmListPacksFlag::OnlyEnabled), user_id)
        .unwrap_or_default()
        .into_iter()
        .collect();
    let disabled_sys_packs: HashSet<String> = AdbCommand::new()
        .shell(device_serial)
        .pm()
        .list_packages_sys(Some(PmListPacksFlag::OnlyDisabled), user_id)
        .unwrap_or_default()
        .into_iter()
        .collect();

    let mut description;
    let mut uad_list;
    let mut state;
    let mut removal;
    let mut user_package: Vec<PackageRow> = Vec::new();

    for pack_name in all_sys_packs {
        let p_name = &pack_name;
        state = PackageState::Uninstalled;
        description = "[No description]: CONTRIBUTION WELCOMED";
        uad_list = UadList::Unlisted;
        removal = Removal::Unlisted;

        if let Some(package) = uad_lists.get(p_name) {
            if !package.description.is_empty() {
                description = &package.description;
            }
            uad_list = package.list;
            removal = package.removal;
        }

        if enabled_sys_packs.contains(p_name) {
            state = PackageState::Enabled;
        } else if disabled_sys_packs.contains(p_name) {
            state = PackageState::Disabled;
        }

        let package_row =
            PackageRow::new(p_name, state, description, uad_list, removal, false, false);
        user_package.push(package_row);
    }
    user_package.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    user_package
}

pub fn string_to_theme(theme: &str) -> Theme {
    match theme {
        "Dark" => Theme::Dark,
        "Light" => Theme::Light,
        "Lupin" => Theme::Lupin,
        // Auto uses `Display`, so it doesn't have a canonical repr
        t if t.starts_with("Auto") => Theme::Auto,
        _ => Theme::default(),
    }
}

pub fn setup_uad_dir(dir: &Path) -> PathBuf {
    let dir = dir.join("uad");
    if let Err(e) = fs::create_dir_all(&dir) {
        error!("Can't create directory: {dir:?}");
        panic!("{e}");
    };
    dir
}

pub fn open_url(dir: PathBuf) {
    const OPENER: &str = match std::env::consts::OS.as_bytes() {
        b"windows" => "explorer",
        b"macos" => "open",
        // "linux"
        _ => "xdg-open",
    };
    match std::process::Command::new(OPENER).arg(dir).output() {
        Ok(o) => {
            if !o.status.success() {
                // does Windows print UTF-16?
                let stderr = String::from_utf8(o.stderr).unwrap().trim_end().to_string();
                error!("Can't open the following URL: {}", stderr);
            }
        }
        Err(e) => error!("Failed to run command to open the file explorer: {}", e),
    }
}

#[rustfmt::skip]
pub fn last_modified_date(file: PathBuf) -> DateTime<Utc> {
    fs::metadata(file).map_or_else(|_| Utc::now(), |metadata| match metadata.modified() {
        Ok(time) => time.into(),
        Err(_) => Utc::now(),
    })
}

pub fn format_diff_time_from_now(date: DateTime<Utc>) -> String {
    let now: DateTime<Utc> = Utc::now();
    let last_update = now - date;
    if last_update.num_days() == 0 {
        if last_update.num_hours() == 0 {
            last_update.num_minutes().to_string() + " min(s) ago"
        } else {
            last_update.num_hours().to_string() + " hour(s) ago"
        }
    } else {
        last_update.num_days().to_string() + " day(s) ago"
    }
}

/// Export selected packages.
/// File will be saved in same directory where UAD-ng is located.
pub async fn export_selection(packages: Vec<PackageRow>) -> Result<bool, String> {
    let selected = packages
        .iter()
        .filter(|p| p.selected)
        .map(|p| p.name.clone())
        .collect::<Vec<String>>()
        .join("\n");

    match fs::write(EXPORT_FILE_NAME, selected) {
        Ok(()) => Ok(true),
        Err(err) => Err(err.to_string()),
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DisplayablePath {
    pub path: PathBuf,
}

impl fmt::Display for DisplayablePath {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let stem = self.path.file_stem().map_or_else(
            || {
                error!("[PATH STEM]: No file stem found");
                "[File steam not found]".to_string()
            },
            |p| match p.to_os_string().into_string() {
                Ok(stem) => stem,
                Err(e) => {
                    error!("[PATH ENCODING]: {:?}", e);
                    "[PATH ENCODING ERROR]".to_string()
                }
            },
        );

        write!(f, "{stem}")
    }
}

/// Can be used to choose any folder.
pub async fn open_folder() -> Result<PathBuf, Error> {
    let picked_folder = rfd::AsyncFileDialog::new()
        .pick_folder()
        .await
        .ok_or(Error::DialogClosed)?;

    Ok(picked_folder.path().to_owned())
}

/// Export uninstalled packages in a csv file.
/// Exported information will contain package name and description.
pub async fn export_packages(
    user: User,
    phone_packages: Vec<Vec<PackageRow>>,
) -> Result<bool, String> {
    let backup_file = generate_backup_name(chrono::Local::now());

    let file = fs::File::create(backup_file).map_err(|err| err.to_string())?;
    let mut wtr = Writer::from_writer(file);

    wtr.write_record(["Package Name", "Description"])
        .map_err(|err| err.to_string())?;

    let uninstalled_packages: Vec<&PackageRow> = phone_packages[user.index]
        .iter()
        .filter(|p| p.state == PackageState::Uninstalled)
        .collect();

    for package in uninstalled_packages {
        wtr.write_record([&package.name, &package.description.replace('\n', " ")])
            .map_err(|err| err.to_string())?;
    }

    wtr.flush().map_err(|err| err.to_string())?;

    Ok(true)
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn backup_name() {
        assert_eq!(
            generate_backup_name(chrono::Utc.timestamp_millis_opt(0).unwrap()),
            "uninstalled_packages_19700101.csv".to_string()
        );
    }
}
