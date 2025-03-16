{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { nixpkgs, flake-utils, rust-overlay, ... }:
    flake-utils.lib.eachDefaultSystem (baseSystem:
      let
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs {
          system = baseSystem;
          inherit overlays;
        };
        lib = pkgs.lib;

        mkCrossPkgs = { arch, os }: let
          cross = arch + "-" + os;
          crossSystem = lib.systems.elaborate cross;
        in import nixpkgs {
          inherit overlays;
          crossSystem = if cross != "x86_64-linux" then crossSystem else null;
          localSystem = baseSystem;
        };

        architectures = [
          # { arch = "i686"; os = "linux"; target = "i686-unknown-linux-gnu"; }
          { arch = "x86_64"; os = "linux"; target = "x86_64-unknown-linux-gnu"; }
          { arch = "x86_64"; os = "macos"; target = "x86_64-apple-darwin"; }
          { arch = "x86_64"; os = "windows"; target = "x86_64-pc-windows-msvc"; }
          # { arch = "i686"; os = "windows"; target = "i686-pc-windows-msvc"; }
          { arch = "aarch64"; os = "linux"; target = "aarch64-unknown-linux-gnu"; }
          { arch = "aarch64"; os = "macos"; target = "aarch64-apple-darwin"; }
          # { arch = "riscv32-gc"; os = "linux"; target = "riscv32gc-unknown-linux-gnu"; }
          { arch = "riscv64"; os = "linux"; target = "riscv64gc-unknown-linux-gnu"; }
        ];

        mkDevShell = { arch, os, ... }: pkgs.mkShell {
          packages = with pkgs; [ rustc cargo ];
          shellHook = ''
            echo "DevShell for ${arch}-${os}"
          '';
        };

        mkPackage = { arch, os, target }: let
          crossPkgs = mkCrossPkgs { inherit arch os; };
        in pkgs.rustPlatform.buildRustPackage {
          pname = "my-rust-project";
          version = "0.1.0";
          src = ./.;
          cargoLock.lockFile = ./Cargo.lock;

          CARGO_BUILD_TARGET = target;
          HOST_CC = lib.optionalString (os != "windows") "${pkgs.stdenv.cc.nativePrefix}cc";
          TARGET_CC = lib.optionalString (os != "windows") "${crossPkgs.stdenv.cc.targetPrefix}cc";

          buildInputs = with pkgs; [ ]
            ++ lib.optionals (os == "linux") [ stdenv.cc  glibc ]
            ++ lib.optionals (os == "macos") [ clang darwin.apple_sdk.frameworks.CoreFoundation ];
        };

        generatedMatrixJson = builtins.toJSON (map ({ arch, os, ... }: {
          arch = arch;
          os = os;
        }) architectures);
      in
      {
        devShells = lib.listToAttrs (map ({ arch, os, target }: {
          name = "${os}-${arch}";
          value = mkDevShell { inherit arch os target; };
        }) architectures) // {
          # Default Devshell
          default = mkDevShell {
            arch = "x86_64";
            os = "linux";
            target = "x86_64-unknown-linux-gnu";
          };
        };

        packages = lib.listToAttrs (map ({ arch, os, target }: {
          name = "${os}-${arch}";
          value = mkPackage { inherit arch os target; };
        }) architectures);

        apps = {
          help = {
            type = "app";
            program = toString (pkgs.writeScript "help" ''
              #!/bin/sh
              echo ""
              echo "Welcome to Kito!"
              echo ""
              echo -e "\033[0;33mAvailable architectures:\033[0m"
              ${lib.concatMapStringsSep "\n" (arch: ''echo "  - ${arch}"'') (lib.lists.unique (map ({ arch, ... }: arch) architectures))}
              echo ""
              echo -e "\033[0;35mAvailable OS:\033[0m"
              ${lib.concatMapStringsSep "\n" (os: ''echo "  - ${os}"'') (lib.lists.unique (map ({ os, ... }: os) architectures))}
              echo ""
              echo -e "\033[0;32mTo build a specific variant, use:\033[0m"
              echo "  nix build .#<os>-<arch>"
              echo ""
              echo -e "\033[0;32mExample:\033[0m"
              echo "  nix build .#linux-x86_64"
            '');
          };

          matrix = {
            type = "app";
            program = toString (pkgs.writeScript "generate-matrix" ''
              #!/bin/sh
              echo '${generatedMatrixJson}'
            '');
          };
        };
      });
}
