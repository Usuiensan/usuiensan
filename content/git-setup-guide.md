---
layout: default
title: Git 環境構築ガイド
---

# Git 環境構築ガイド

このガイドでは、Gitを使い始めるためのインストールと初期設定の手順を説明します。

## 1. Gitのインストール

Gitは、お使いのオペレーティングシステム（OS）に応じてインストール方法が異なります。

### 1.1 Windowsの場合

1.  **Git for Windows** をダウンロードします。
    * [Git for Windows 公式サイト](https://git-scm.com/download/win) にアクセスします。
2.  最新版のインストーラーをダウンロードし、実行します。
3.  インストール中のオプションは、基本的にデフォルト設定のままで問題ありません。
    * **`Git Bash`** (Git専用のコマンドラインツール) が含まれていることを確認してください。今後のGit操作はこの `Git Bash` を使うと便利です。

### 1.2 macOSの場合

いくつかの方法がありますが、以下のいずれかが一般的です。

1.  **Xcode Command Line Tools をインストール:**
    * ターミナルを開き、以下のコマンドを実行します。
        ```bash
        xcode-select --install
        ```
    * 画面の指示に従ってインストールを完了します。Gitも一緒にインストールされます。
2.  **Homebrew を使用してインストール:**
    * Homebrewがインストールされていない場合は、先にHomebrewをインストールします。
    * ターミナルで以下のコマンドを実行します。
        ```bash
        brew install git
        ```

### 1.3 Linuxの場合

お使いのディストリビューションのパッケージマネージャーを使用してインストールします。

* **Debian/Ubuntu系:**
    ```bash
    sudo apt update
    sudo apt install git
    ```
* **Fedora系:**
    ```bash
    sudo dnf install git
    ```

## 2. Gitの初期設定

Gitをインストールしたら、コミット（変更履歴の記録）に表示されるあなたの情報を設定します。これは一度だけ行えば大丈夫です。

### 2.1 ユーザー名とメールアドレスの設定

ターミナル（Windowsの場合は `Git Bash`）を開き、以下のコマンドを実行します。

```bash
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメールアドレス"