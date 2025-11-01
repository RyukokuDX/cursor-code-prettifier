# 対応記号一覧

このドキュメントでは、Cursor Code Prettifierで対応しているすべての記号とLaTeXコマンドの一覧を提供します。

## 🔢 記号グループ（symbols）

### 論理記号

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\forall` | ∀ |
| `\exists` | ∃ |

### 数学記号

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\partial` | ∂ |
| `\infty` | ∞ |
| `\leq` | ≤ |
| `\geq` | ≥ |
| `\times` | × |
| `\prime` | ′ |
| `\|` | ‖ |

### ギリシャ文字（小文字）

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\alpha` | α |
| `\beta` | β |
| `\gamma` | γ |
| `\delta` | δ |
| `\epsilon` | ϵ |
| `\varepsilon` | ε |
| `\zeta` | ζ |
| `\eta` | η |
| `\theta` | θ |
| `\iota` | ι |
| `\kappa` | κ |
| `\lambda` | λ |
| `\mu` | μ |
| `\nu` | ν |
| `\xi` | ξ |
| `\pi` | π |
| `\rho` | ρ |
| `\sigma` | σ |
| `\tau` | τ |
| `\upsilon` | υ |
| `\phi` | ϕ |
| `\varphi` | φ |
| `\chi` | χ |
| `\psi` | ψ |
| `\omega` | ω |

### ギリシャ文字（大文字）

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\Delta` | Δ |
| `\Gamma` | Γ |
| `\Theta` | Θ |
| `\Lambda` | Λ |
| `\Xi` | Ξ |
| `\Pi` | Π |
| `\Sigma` | Σ |
| `\Phi` | Φ |
| `\Psi` | Ψ |
| `\Omega` | Ω |

### 積分・和・積

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\int` | ∫ |
| `\iint` | ∬ |
| `\iiint` | ∭ |
| `\iiiint` | ⨌ |
| `\oint` | ∮ |
| `\oiint` | ∯ |
| `\oiiint` | ∰ |
| `\sum` | ∑ |
| `\prod` | ∏ |
| `\coprod` | ∐ |
| `\bigcup` | ⋃ |
| `\bigcap` | ⋂ |
| `\bigvee` | ⋁ |
| `\bigwedge` | ⋀ |

### 矢印類

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\to` | → |
| `\leftarrow` | ← |
| `\rightarrow` | → |
| `\leftrightarrow` | ↔ |
| `\Leftarrow` | ⇐ |
| `\Rightarrow` | ⇒ |
| `\Leftrightarrow` | ⇔ |
| `\mapsto` | ↦ |
| `\hookleftarrow` | ↩ |
| `\hookrightarrow` | ↪ |
| `\uparrow` | ↑ |
| `\downarrow` | ↓ |
| `\updownarrow` | ↕ |
| `\nearrow` | ↗ |
| `\searrow` | ↘ |
| `\swarrow` | ↙ |
| `\nwarrow` | ↖ |
| `\longleftarrow` | ⟵ |
| `\longrightarrow` | ⟶ |
| `\longleftrightarrow` | ⟷ |

### 集合演算

| LaTeXコマンド | 表示記号 |
|--------------|---------|
| `\in` | ∈ |
| `\notin` | ∉ |
| `\ni` | ∋ |
| `\notni` | ∌ |
| `\subset` | ⊂ |
| `\supset` | ⊃ |
| `\subseteq` | ⊆ |
| `\supseteq` | ⊇ |
| `\cap` | ∩ |
| `\cup` | ∪ |
| `\emptyset` | ∅ |
| `\setminus` | ∖ |
| `\oplus` | ⊕ |
| `\ominus` | ⊖ |
| `\otimes` | ⊗ |
| `\odot` | ⊙ |

### 特殊文字

| LaTeXコマンド | 表示記号 | 説明 |
|--------------|---------|------|
| `\mathbb{A}` ～ `\mathbb{Z}` | 𝔸 ～ ℤ | 二重線文字（Blackboard Bold） |
| `\mathfrak{A}` ～ `\mathfrak{Z}` | 𝔄 ～ ℨ | フラクトゥール文字（Fraktur） |

## 🧮 数学コマンドグループ（math_commands）

| LaTeXコマンド | 表示 |
|--------------|------|
| `\left` | ◀️ |
| `\right` | ▶️ |
| `\frac` | 〓 |
| `\sqrt` | ⟦√⟧ |
| `\bigg` | 🌲 |

## 📄 TeXコマンドグループ（tex_commands）

### セクションコマンド

| LaTeXコマンド | 表示 |
|--------------|------|
| `\section` | 🟥 |
| `\subsection` | 🟨 |
| `\subsubsection` | 🟩 |

### 環境コマンド

| LaTeXコマンド | 表示 |
|--------------|------|
| `\begin` | ⏩ |
| `\end` | ⏪ |

### 参照コマンド

| LaTeXコマンド | 表示（emojiモード） | 表示（counterモード） |
|--------------|-------------------|---------------------|
| `\label` | 🏷️ | 🏷️ |
| `\ref` | 🔗 | 実際の番号（例: `1.2`） |
| `\eqref` | 🔢 | 実際の番号（例: `(3)`） |

### その他のTeXコマンド

| LaTeXコマンド | 表示 |
|--------------|------|
| `\cite` | 📖 |
| `\usepackage` | 📦 |
| `\documentclass` | ☃️ |
| `\title` | 📘 |
| `\author` | 😎 |
| `\date` | 📅 |
| `\bibliography` | 📚 |

## カスタム変換の追加

これらのデフォルト記号に加えて、独自の変換ルールを追加できます。詳細は[設定リファレンス](configuration.md#カスタム変換ルール)を参照してください。

## 注意事項

- 記号グループは300以上の記号をサポートしています
- 長いコマンドが優先されるため、`\mathbb{R}`は`\mathbb`より優先されます
- カスタム変換ルールはデフォルト値と組み合わせて使用できます

