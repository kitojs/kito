# Contributing to the Project

Thank you for considering contributing to this project! Your help is greatly appreciated. Please follow the guidelines below to ensure a smooth collaboration.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Setting Up the Development Environment](#setting-up-the-development-environment)
- [Submitting Changes](#submitting-changes)
- [Issue Reporting](#issue-reporting)
- [Pull Request Guidelines](#pull-request-guidelines)

## Code of Conduct

Please follow our [Code of Conduct](./CODE_OF_CONDUCT.md) to maintain a welcoming and inclusive community.

## How to Contribute

1. **Fork the repository** to your own GitHub account.
2. **Clone the forked repository** to your local machine.
3. **Create a new branch** for your feature or fix.
4. **Make your changes** following the coding standards.
5. **Test your changes** to ensure they work correctly.
6. **Submit a pull request** following the guidelines below.

## Setting Up the Development Environment

This project consists of a **Rust cdylib** core and a **TypeScript API**. Ensure you set up both environments correctly:

### Rust

1. Install Rust and Cargo (See the [official installation guide](https://www.rust-lang.org/tools/install)):
   ```sh
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```
2. Install dependencies and build the cdylib:
   ```sh
   cargo build --release
   ```
3. Run tests to ensure correctness:
   ```sh
   cargo test
   ```

### TypeScript

1. Install dependencies:
   ```sh
   pnpm install
   ```
2. Run TypeScript tests:
   ```sh
   pnpm test
   ```

## Submitting Changes

- Keep your changes focused and avoid mixing multiple unrelated changes in a single pull request.
- Ensure your code follows the project's coding style.
- Update documentation and tests as needed.
- If your changes impact performance, you must run the [benchmarks](./bench/README.md) included in the repository and document the results in your pull request.

## Issue Reporting

If you find a bug or want to request a new feature, please open an issue and include:

- A clear description of the problem.
- Steps to reproduce the issue (if applicable).
- Expected behavior vs. actual behavior.
- Environment details (e.g., OS, software versions).

## Pull Request Guidelines

- Ensure your PR has a descriptive title and a clear explanation.
- Reference any related issues in the PR description (e.g., "Fixes #123").
- Rebase your branch with the latest changes from the main branch before submitting.
- Wait for code review and address any requested changes.

Thank you for contributing! ❤️
