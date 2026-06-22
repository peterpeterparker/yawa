// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import remarkGfm from "remark-gfm";

const title = "Yet Another Web Analytics";
const description = "A self-hostable web analytics with MCP.";

export default defineConfig({
  site: "https://yetanotherwebanalytics.dev",
  output: "static",
  outDir: "dist",
  markdown: {
    remarkPlugins: [remarkGfm],
  },
  devToolbar: {
    enabled: false,
  },
  integrations: [
    starlight({
      title,
      description,
      head: [
        { tag: "meta", attrs: { property: "og:title", content: title } },
        { tag: "meta", attrs: { property: "og:description", content: description } },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: "https://yetanotherwebanalytics.dev/social-image-1.jpg",
          },
        },
        { tag: "meta", attrs: { property: "og:type", content: "website" } },
        { tag: "meta", attrs: { name: "twitter:card", content: "summary_large_image" } },
        { tag: "meta", attrs: { name: "twitter:title", content: title } },
        { tag: "meta", attrs: { name: "twitter:description", content: description } },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: "https://yetanotherwebanalytics.dev/social-image-1.jpg",
          },
        },
        {
          tag: "script",
          attrs: {
            type: "module",
            async: true,
            src: `${import.meta.env.PROD ? "https://analytics.fluster.io" : "http://localhost:3000"}/static/yawa.js`,
          },
        },
      ],
      logo: {
        light: "./src/assets/logo-light.svg",
        dark: "./src/assets/logo-dark.svg",
        replacesTitle: true,
      },
      lastUpdated: true,
      favicon: "/favicon.svg",
      customCss: [
        "@fontsource-variable/nunito-sans/wght.css",
        "./src/styles/font.css",
        "./src/styles/colors.css",
        "./src/styles/layout.css",
        "./src/styles/code.css",
        "./src/styles/search.css",
        "./src/styles/sidebar.css",
        "./src/styles/nav.css",
        "./src/styles/header.css",
        "./src/styles/button.css",
        "./src/styles/scrollbar.css",
        "./src/styles/selection.css",
      ],
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/peterpeterparker/yawa" },
      ],
      expressiveCode: {
        themes: ["dracula"],
      },
      sidebar: [
        {
          label: "Start Here",
          items: [{ slug: "getting-started" }, { slug: "how-it-works" }],
        },
        {
          label: "Guides",
          items: [{ slug: "guides/connect-mcp-client" }, { slug: "guides/deploy" }],
        },
        {
          label: "Reference",
          items: [
            { slug: "reference/tracker" },
            { slug: "reference/mcp-tools" },
            { slug: "reference/configuration" },
          ],
        },
        { slug: "examples" },
        { slug: "privacy" },
      ],
      components: {
        Hero: "./src/components/landing/Hero.astro",
        Footer: "./src/components/landing/Footer.astro",
        MarkdownContent: "./src/components/landing/MarkdownContent.astro",
        SiteTitle: "./src/components/SiteTitle.astro",
        SocialIcons: "./src/components/SocialIcons.astro",
      },
    }),
  ],
});
