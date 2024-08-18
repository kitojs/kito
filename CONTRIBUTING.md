<div align="center">

[🇺🇸 English](./CONTRIBUTING.md) `‖` [🇪🇸 Español](./docs/español/CONTRIBUTING.md) `‖` [🇵🇹 Português](./docs/portugues/CONTRIBUTING.md) `‖` [🇫🇷 Français](./docs/francais/CONTRIBUTING.md) `‖` [🇮🇹 Italiano](./docs/italiano/CONTRIBUTING.md)

<hr />

<img src="./public/static/banners/kito_banner_en.png" alt="Kito Banner" />

<hr />

</div>

## 🙌🏼 Welcome

Welcome to the Kito contribution guide! This guide will provide you with important information to keep in mind when contributing to the project.

## 🌸 How to Contribute

1. **Report issues or bugs.**
   If you find or experience an issue or bug with Kito, you can report it by opening an issue on this repository with the `bug` tag. Make sure to describe it clearly and concisely, explaining what needs to be resolved and why you believe it is a valid issue.

2. **Request new features and improvements.**  
   Do you have an idea or improvement in mind? Feel free to share it! Open an issue on this repository with the `feat` tag, and it will be reviewed. Provide a detailed description of what you want to add and the potential benefits.

3. **Contribute code.**  
   If you want to contribute directly to the code, follow these steps:

- Fork the repository.
- Create a new branch (`git checkout -b feature/new-feature`).
- Make your changes on your branch.
- Commit your changes (see [Commit Guide](#-commit-guide)).
- Push your branch (`git push origin feature/new-feature`).
- Open a Pull Request detailing the changes you made.

## 📕 Commit Guide

To maintain a well-organized and clear commit history, it is recommended to follow these guidelines when writing commits. The described guidelines improve the quality of contributions and can enhance review relevance.

#### Convention

Follow the [Conventional Commits](https://conventionalcommits.org) convention. The use of emojis is recommended but not mandatory.

#### Length

- The first line should not exceed 50 characters and should be brief yet descriptive enough to understand the change made.

- After the first line, add a blank line, and if necessary, include a more detailed description in a paragraph not exceeding 72 characters per line.

- In the extended description, include the "why" and "how" not just the "what."

**Example:**

`✨ feat(user-auth): Add JWT-based authentication`

Implemented a JWT-based authentication mechanism for users. This replaces the previous session-based approach, improving scalability and security in distributed environments. Tests and documentation have been updated accordingly.

#### Focus

Each commit should focus on a single task or purpose. Avoid making too many changes in one commit and do not mix modifications of different scopes or types.

**Example:**

_Commit 1:_ `📦 build(deps): Update dependency X to version Y.`

_Commit 2:_ `✨ feat(user-auth): Add password recovery feature.`

#### Documentation

If your commit also modifies documentation (e.g., adding a feature), include the documentation changes in the same commit. This helps maintain coherence between the commit and the project documentation.

#### WIP Commits

WIP (Work in Progress) commits are for changes that are still under development and are not ready to be merged into the main branch. Instead of committing WIP changes and disrupting the workflow, you can use `git stash` to keep them in a temporary state without committing to the history.

#### References

Whenever a commit is related to an issue or ticket, include a reference to it in the commit message. This helps maintain a clear history and facilitates issue tracking.

**Example:**

```
✨ feat(user-auth): Add password recovery feature

Closes #123
```

#### Squash

The term "squash" refers to a method of combining commits. When you have more than one commit for the same purpose, use this method to reduce the number of commits and improve readability.

Use `git rebase -i` to squash commits.

💡 **Additional tip:** When you need to fix something in a recent commit (and before pushing), use the `fixup!` format to indicate that you are fixing or adjusting a previous commit. These commits are useful before performing a squash.

## 👷 Pull Request Guide

Please ensure your Pull Request meets the following requirements:

-**Clear description:** Explain the purpose of your contribution and how it improves the project.

-**Updated documentation:** If you add new functionalities, update the documentation accordingly.

-**Included tests:** If you make significant changes to the code, ensure that you add tests to verify the functionality.

After opening a Pull Request, other collaborators can review your code and suggest changes before it is accepted.

## 🚧 Testing

It is crucial to ensure that all changes pass the current tests of the project. If your modifications are significant, you should write your own tests for the feature you are implementing.

## 🎩 Standards

It is essential to follow Kito's standards. This includes commit message formatting, code formatting, folder structuring, documentation, testing, and all other aspects of the project.

Be consistent with the defined style and follow best practices.

## 🎉 Thank You!

Thank you for reading, and we hope this guide helps you get started with contributing!
