use std::io::Write;

use agnos::{config::Config, main_logic::create_restricted_file};
use clap::{Arg, ArgAction};

fn main() -> anyhow::Result<()> {
    let mut stdin_lines = std::io::stdin().lines();
    let cli_ops = clap::command!()
        .about("Generate non existing private accounts keys from agnos' configuration.")
        .arg_required_else_help(true)
        .arg(
            Arg::new("config")
                .required(true)
                .action(ArgAction::Set)
                .value_name("config.toml")
                .help("Path to the configuration file."),
        )
        .arg(
            Arg::new("key-size")
                .long("key-size")
                .action(ArgAction::Set)
                .default_value("4096")
                .help("Size in bits of the RSA private key.")
                .value_parser(clap::value_parser!(u32)),
        )
        .arg(
            Arg::new("no-confirm")
                .long("no-confirm")
                .action(ArgAction::SetTrue)
                .help("Do not prompt user and create all non-existing keys."),
        )
        .get_matches();
    let key_size = cli_ops.get_one("key-size").unwrap();
    let no_confirm = cli_ops.get_flag("no-confirm");
    let config_file = std::fs::read_to_string(cli_ops.get_one::<String>("config").unwrap())?;
    let config: Config = toml::from_str(&config_file)?;
    'accounts_loop: for account in config.accounts {
        if !account.private_key_path.exists() {
            println!(
                "Private key for account <{}> expected to be located at {} does not exist.",
                account.email,
                account.private_key_path.display()
            );
            if !no_confirm {
                'input_loop: loop {
                    print!("Do you want to create it? (y(es) | n(o) -- default: yes)? ");
                    std::io::stdout().flush()?;
                    let l = match stdin_lines.next() {
                        None => return Ok(()),
                        Some(l) => l?,
                    };
                    match l.trim() {
                        "" | "y" | "yes" | "Y" | "YES" => break 'input_loop,
                        "n" | "no" | "N" | "NO" => continue 'accounts_loop,
                        _ => continue 'input_loop,
                    }
                }
            }
            print!("Generating private key... ");
            std::io::stdout().flush()?;
            let key = openssl::rsa::Rsa::generate(*key_size)?;
            let pem = key.private_key_to_pem()?;
            let mut key_file: std::fs::File = create_restricted_file(account.private_key_path)?;
            key_file.write_all(&pem)?;
            println!("Private key generated!")
        }
    }
    Ok(())
}
