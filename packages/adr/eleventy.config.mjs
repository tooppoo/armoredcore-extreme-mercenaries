import syntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import markdownItAnchor from "markdown-it-anchor";

export default function(eleventyConfig) {
  // プラグインを追加
  eleventyConfig.addPlugin(syntaxHighlight);

  // Markdownエンジンの設定
  eleventyConfig.amendLibrary("md", mdLib => {
    mdLib.use(markdownItAnchor, {
      // permalink: markdownItAnchor.per.ariaHidden({
      //   placement: "after",
      //   class: "direct-link",
      //   symbol: "#",
      // }),
      level: [1,2,3,4],
      slugify: eleventyConfig.getFilter("slugify")
    });
  });

  // パススルーコピー
  eleventyConfig.addPassthroughCopy("**/*.png");
  eleventyConfig.addPassthroughCopy("**/*.jpg");
  eleventyConfig.addPassthroughCopy("**/*.gif");
  eleventyConfig.addPassthroughCopy("**/*.svg");

  // コレクションの作成（ADRファイルを日付順にソート）
  eleventyConfig.addCollection("adrsByDate", function(collectionApi) {

    const adrItems = collectionApi.getAll()
      .filter(item => {
        /** @type {String} */
        const path = item.inputPath;
        return path.match(/\d{8}-[a-z0-9-]+\.md/); // 日付パターンを含む
      })
      .sort((a, b) => {
        // ファイル名から日付を抽出してソート（新しい順）
        const dateA = a.inputPath.match(/(\d{8})/)?.[1] || "00000000";
        const dateB = b.inputPath.match(/(\d{8})/)?.[1] || "00000000";
        return dateB.localeCompare(dateA);
      });

    return adrItems;
  });

  // フィルターの追加
  eleventyConfig.addFilter("formatDate", function(dateStr) {
    if (!dateStr) return "";
    const year = dateStr.substr(0, 4);
    const month = dateStr.substr(4, 2);
    const day = dateStr.substr(6, 2);
    return `${year}-${month}-${day}`;
  });

  eleventyConfig.addFilter("extractTitleFromItem", function(item) {
    if (!item || !item.rawInput) return "ADR";

    const rawInput = typeof item.rawInput === "string" ? item.rawInput : "";
    const firstLine = rawInput.split(/\r?\n/, 1)[0] ?? "";
    const title = firstLine.replace(/^#+\s*/, "").trim();

    return title || "ADR";
  });

  eleventyConfig.addFilter("extractDateFromPath", function(inputPath) {
    const match = inputPath.match(/(\d{8})/);
    return match ? match[1] : "00000000";
  });

  return {
    dir: {
      input: "../../docs/adr",
      includes: "_includes",
      data: "_data",
      output: "_site"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: [
      "md",
      "njk",
      "html",
      "liquid"
    ]
  };
};