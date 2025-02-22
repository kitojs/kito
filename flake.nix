{
  inputs = {
    crane.url = "github:ipetkov/crane";
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
    fenix-src.url = "github:nix-community/fenix";
  };

  outputs = { nixpkgs, flake-utils, fenix-src, ... }@inputs:
    flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        fenix = fenix-src.packages.${system};
        crane = inputs.crane.mkLib pkgs;
        toolchain = fenix.fromToolchainFile {
          file = ./rust-toolchain.toml;
          sha256 = "sha256-yMuSb5eQPO/bHv+Bcf/US8LVMbf/G/0MSfiPwBhiPpk=";
        };
        craneLib = crane.overrideToolchain toolchain;

        libraries = with pkgs; [ libuuid ];
      in
      {
        devShells.default = craneLib.devShell {
          packages = with pkgs; [ nodejs_23 pnpm deno ];

          LD_LIBRARY_PATH = pkgs.lib.makeLibraryPath libraries;
        };
      });
}
