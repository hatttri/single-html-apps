import { mkdir, stat, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, normalize, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

type TreeNode = {
  children: Map<string, TreeNode>;
  filePath?: string;
  isFile: boolean;
  name: string;
};

type FileRecord = {
  absolutePath: string;
  relativePath: string;
};

/**
 * CLI 引数を解釈する。
 * @param argv コマンドライン引数
 * @returns ルートディレクトリと出力先
 */
function parseArguments(argv: string[]): {
  outputPath: string;
  rootDirectory: string;
} {
  const [rootDirectoryArg, outputPathArg] = argv;

  if (!rootDirectoryArg || !outputPathArg) {
    throw new Error(
      "Usage: node scripts/concat-all.ts <root-directory> <output-markdown>",
    );
  }

  return {
    outputPath: resolve(outputPathArg),
    rootDirectory: resolve(rootDirectoryArg),
  };
}

/**
 * Git 管理対象ファイルと未追跡ファイルを取得する。
 * @param rootDirectory ルートディレクトリ
 * @returns 対象ファイル一覧
 */
function collectTrackedFiles(rootDirectory: string): FileRecord[] {
  const outputPath = resolve(rootDirectory, "generated/concat.txt");
  const result = spawnSync(
    "git",
    [
      "-C",
      rootDirectory,
      "ls-files",
      "-z",
      "--cached",
      "--others",
      "--exclude-standard",
    ],
    {
      encoding: "buffer",
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      result.stderr.toString("utf8").trim() ||
        "Failed to collect tracked files from git.",
    );
  }

  return result.stdout
    .toString("utf8")
    .split("\0")
    .filter((relativePath) => relativePath !== "")
    .map((relativePath) => ({
      absolutePath: resolve(rootDirectory, relativePath),
      relativePath: normalize(relativePath),
    }))
    .filter((file) => file.absolutePath !== outputPath)
    .sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

/**
 * ファイル一覧からツリーを構築する。
 * @param rootName ルート名
 * @param files 対象ファイル一覧
 * @returns ツリーノード
 */
function buildTree(rootName: string, files: FileRecord[]): TreeNode {
  const root: TreeNode = {
    children: new Map<string, TreeNode>(),
    isFile: false,
    name: rootName,
  };

  for (const file of files) {
    const segments = file.relativePath.split(/[\\/]+/u).filter(Boolean);
    let current = root;

    for (let index = 0; index < segments.length; index += 1) {
      const segment = segments[index];
      const isLastSegment = index === segments.length - 1;
      let child = current.children.get(segment);

      if (!child) {
        child = {
          children: new Map<string, TreeNode>(),
          isFile: isLastSegment,
          name: segment,
        };
        current.children.set(segment, child);
      }

      if (isLastSegment) {
        child.isFile = true;
        child.filePath = file.relativePath;
      }

      current = child;
    }
  }

  return root;
}

/**
 * ツリーを Markdown 用の文字列に変換する。
 * @param tree ツリー
 * @returns ツリー文字列
 */
function renderTree(tree: TreeNode): string {
  const lines: string[] = ["Directory structure:"];
  const children = [...tree.children.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  children.forEach((child, index) => {
    const isLast = index === children.length - 1;
    renderTreeNode(child, "", isLast, lines);
  });

  return lines.join("\n");
}

/**
 * ツリーの各ノードを再帰的に描画する。
 * @param node 対象ノード
 * @param prefix インデントプレフィックス
 * @param isLast 最後の要素かどうか
 * @param lines 出力先
 */
function renderTreeNode(
  node: TreeNode,
  prefix: string,
  isLast: boolean,
  lines: string[],
): void {
  const connector = isLast ? "└── " : "├── ";
  lines.push(`${prefix}${connector}${node.name}`);

  const nextPrefix = `${prefix}${isLast ? "    " : "│   "}`;
  const children = [...node.children.values()].sort((left, right) =>
    left.name.localeCompare(right.name),
  );

  children.forEach((child, index) => {
    const childIsLast = index === children.length - 1;
    renderTreeNode(child, nextPrefix, childIsLast, lines);
  });
}

/**
 * Markdown 用にファイル内容を整形する。
 * @param relativePath 相対パス
 * @param absolutePath 絶対パス
 * @returns Markdown ブロック
 */
async function renderFileBlock(
  relativePath: string,
  absolutePath: string,
): Promise<string> {
  const buffer = await readFile(absolutePath);
  const body = decodeTextOrBinary(buffer);

  return [
    "================================================",
    `FILE: ${relativePath}`,
    "================================================",
    body,
  ].join("\n");
}

/**
 * Markdown 全体を組み立てる。
 * @param rootDirectory ルートディレクトリ
 * @param files 対象ファイル一覧
 * @returns Markdown 文字列
 */
async function buildMarkdown(
  rootDirectory: string,
  files: FileRecord[],
): Promise<string> {
  const tree = buildTree(basename(rootDirectory), files);
  const sections: string[] = [renderTree(tree)];

  for (const file of files) {
    sections.push(await renderFileBlock(file.relativePath, file.absolutePath));
  }

  return sections.join("\n\n\n");
}

/**
 * 出力先へ Markdown を書き込む。
 * @param outputPath 出力先
 * @param markdown Markdown 文字列
 */
async function writeMarkdown(
  outputPath: string,
  markdown: string,
): Promise<void> {
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${markdown}\n`, "utf8");
}

/**
 * バッファをテキストとして復号し、失敗したらバイナリ扱いにする。
 * @param buffer ファイルバッファ
 * @returns テキストまたはバイナリ表記
 */
function decodeTextOrBinary(buffer: Buffer): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
  } catch {
    return "[Binary file]";
  }
}

/**
 * パスを正規化する。
 * @param pathValue パス文字列
 * @returns 正規化済みパス
 */
function normalizePath(pathValue: string): string {
  return normalize(pathValue).split(sep).join("/");
}

/**
 * ルートディレクトリが存在するか確認する。
 * @param rootDirectory ルートディレクトリ
 */
async function verifyRootDirectory(rootDirectory: string): Promise<void> {
  const rootPath = resolve(rootDirectory);
  const rootStats = await stat(rootPath);

  if (!rootStats.isDirectory()) {
    throw new Error(`Not a directory: ${rootDirectory}`);
  }
}

/**
 * CLI の本体処理を実行する。
 * @param argv コマンドライン引数
 */
async function main(argv: string[]): Promise<void> {
  const { outputPath, rootDirectory } = parseArguments(argv);
  await verifyRootDirectory(rootDirectory);

  const files = collectTrackedFiles(rootDirectory).map((file) => ({
    absolutePath: file.absolutePath,
    relativePath: normalizePath(file.relativePath),
  }));
  const markdown = await buildMarkdown(rootDirectory, files);
  await writeMarkdown(outputPath, markdown);
}

main(process.argv.slice(2)).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
