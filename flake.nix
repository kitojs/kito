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
          # { arch = "i686"; os = "linux"; target = "i686-unknown-linux-gnu"; }
          { arch = "x86_64"; os = "linux"; target = "x86_64-unknown-linux-gnu"; }
          { arch = "x86_64"; os = "macos"; target = "x86_64-apple-darwin"; }
          { arch = "x86_64"; os = "windows"; target = "x86_64-pc-windows-msvc"; }
          # { arch = "i686"; os = "windows"; target = "i686-pc-windows-msvc"; }
          { arch = "aarch64"; os = "linux"; target = "aarch64-unknown-linux-gnu"; }
          { arch = "aarch64"; os = "macos"; target = "aarch64-apple-darwin"; }
          # { arch = "riscv32-gc"; os = "linux"; target = "riscv32gc-unknown-linux-gnu"; }
          { arch = "riscv64-gc"; os = "linux"; target = "riscv64gc-unknown-linux-gnu"; }
        ];

        mkDevShell = { arch, target, ... }: (craneLib target).devShell {
          packages = with pkgs; [ nodejs_23 pnpm deno ];
          shellHook = ''
            echo "DevShell for ${arch}"
          '';

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath libraries;
        };

        mkPackage = { os, target, ... }: (craneLib target).buildPackage {
          src = (craneLib target).cleanCargoSource ./.;
          strictDeps = true;
          doCheck = false;
          CARGO_BUILD_TARGET = target;

          HOST_CC = "${pkgs.stdenv.cc.nativePrefix}cc";
          TARGET_CC = lib.optionalString (os == "windows")
            "${pkgs.pkgsCross.mingwW64.stdenv.cc}/bin/${pkgs.pkgsCross.mingwW64.stdenv.cc.targetPrefix}cc"
            + lib.optionalString (os != "windows")
              "${pkgs.stdenv.cc.targetPrefix}cc";

          preBuild = lib.optionalString (os == "macos") ''
            export CC="clang"
            export CXX="clang++"
            export CFLAGS="-arch x86_64 -mmacosx-version-min=10.7"
            export CXXFLAGS="-arch x86_64 -mmacosx-version-min=10.7"
          '' + lib.optionalString (os == "windows") ''
            export AR="lib.exe"
            export CC="cl.exe"
            export CXX="cl.exe"
          '';

          buildInputs = with pkgs; [ stdenv.cc ]
          ++ lib.optionals (os == "macos") [ clang darwin.apple_sdk.frameworks.CoreFoundation ]
          ++ lib.optionals (os == "windows") [
            pkgsCross.mingwW64.stdenv.cc
            pkgsCross.mingwW64.windows.pthreads
          ];
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
