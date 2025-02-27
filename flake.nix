{
  inputs = {
    crane.url = "github:ipetkov/crane";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    rust-overlay = {
      url = "github:oxalica/rust-overlay";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { crane, nixpkgs, flake-utils, rust-overlay, ... }:
    flake-utils.lib.eachDefaultSystem (system:
      let
        lib = pkgs.lib;
        overlays = [ (import rust-overlay) ];
        pkgs = import nixpkgs { inherit system overlays; };

        toolchain = target: (pkgs.rust-bin.fromRustupToolchainFile ./rust-toolchain.toml).override {
          targets = [ hostTarget target ];
        };
        craneLib = target: (crane.mkLib pkgs).overrideToolchain (toolchain target);
        systemToTarget = system:
          let
            arch = builtins.elemAt (lib.splitString "-" system) 0;
            os = builtins.elemAt (lib.splitString "-" system) 1;
          in
            if os == "darwin" then
              "${arch}-apple-darwin"
            else if os == "linux" then
              "${arch}-unknown-linux-gnu"
            else if os == "windows" then
              "${arch}-pc-windows-msvc"
            else
              throw "Unsupported system: ${system}";

        hostTarget = systemToTarget system;

        architectures = [
          { arch = "x86_64"; os = "linux"; target = "x86_64-unknown-linux-gnu"; }
          { arch = "x86_64"; os = "macos"; target = "x86_64-apple-darwin"; }
          { arch = "x86_64"; os = "windows"; target = "x86_64-pc-windows-msvc"; }
          { arch = "aarch64"; os = "linux"; target = "aarch64-unknown-linux-gnu"; }
          { arch = "aarch64"; os = "macos"; target = "aarch64-apple-darwin"; }
          { arch = "riscv64-imac"; os = "linux"; target = "riscv64imac-unknown-none-elf"; }
          { arch = "riscv64-gc"; os = "linux"; target = "riscv64gc-unknown-none-elf"; }
        ];

        mkDevShell = { arch, target, ... }: (craneLib target).devShell {
          packages = with pkgs; [ nodejs_23 pnpm deno ];
          shellHook = ''
            echo "DevShell for ${arch}"
          '';

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath libraries;
        };

        mkPackage = { target, ... }: (craneLib target).buildPackage {
          src = (craneLib target).cleanCargoSource ./.;
          strictDeps = true;
          doCheck = false;
          CARGO_BUILD_TARGET = target;
        };

        libraries = with pkgs; [ libuuid ];

        generatedMatrixJson = builtins.toJSON (map ({ arch, os, ... }: {
          arch = arch;
          os = os;
        }) architectures);
      in
      {
        devShells = lib.listToAttrs (map ({ arch, ... }@args: {
          name = arch;
          value = mkDevShell args;
        }) architectures) // {
          # Default Devshell
          default = mkDevShell {
            arch = "x86_64";
            target = "x86_64-unknown-linux-gnu";
          };
        };

        packages = lib.listToAttrs (map ({ arch, os, target, ... }@args: {
          name = "${os}-${arch}";
          value = mkPackage args;
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
