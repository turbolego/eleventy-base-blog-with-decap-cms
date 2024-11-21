import {HtmlBasePlugin, IdAttributePlugin, InputPathToUrlTransformPlugin} from "@11ty/eleventy";
import {feedPlugin} from "@11ty/eleventy-plugin-rss";
import pluginSyntaxHighlight from "@11ty/eleventy-plugin-syntaxhighlight";
import pluginNavigation from "@11ty/eleventy-navigation";
import {eleventyImageTransformPlugin} from "@11ty/eleventy-img";

import pluginFilters from "./_config/filters.js";

/** @param {import("@11ty/eleventy").UserConfig} eleventyConfig */
export default async function (eleventyConfig) {
	// Drafts, see also _data/eleventyDataSchema.js
	eleventyConfig.addPreprocessor("drafts", "*", (data, content) => {
		if (data.draft && process.env.ELEVENTY_RUN_MODE === "build") {
			return false;
		}
	});

	// Copy the contents of the `public` folder and admin folder to the output folder
	eleventyConfig
		.addPassthroughCopy({
			"./public/": "/",
			"./admin/": "/admin/", // Add this line to copy the admin folder
			"./public/img/uploads/": "/img/uploads/"  // Updated path for image uploads
		})
		.addPassthroughCopy("./content/feed/pretty-atom-feed.xsl");

	// Run Eleventy when these files change:
	// https://www.11ty.dev/docs/watch-serve/#add-your-own-watch-targets

	// Watch content images for the image pipeline.
	eleventyConfig.addWatchTarget("content/**/*.{svg,webp,png,jpeg}");
	eleventyConfig.addWatchTarget("public/img/uploads/**/*.{svg,webp,png,jpeg}"); // Add watch for uploaded images

	// Per-page bundles, see https://github.com/11ty/eleventy-plugin-bundle
	// Adds the {% css %} paired shortcode
	eleventyConfig.addBundle("css", {
		toFileDirectory: "dist",
	});
	// Adds the {% js %} paired shortcode
	eleventyConfig.addBundle("js", {
		toFileDirectory: "dist",
	});

	// Official plugins
	eleventyConfig.addPlugin(pluginSyntaxHighlight, {
		preAttributes: {tabindex: 0}
	});
	eleventyConfig.addPlugin(pluginNavigation);
	eleventyConfig.addPlugin(HtmlBasePlugin);
	eleventyConfig.addPlugin(InputPathToUrlTransformPlugin);

	eleventyConfig.addPlugin(feedPlugin, {
		type: "atom", // or "rss", "json"
		outputPath: "/feed/feed.xml",
		stylesheet: "pretty-atom-feed.xsl",
		templateData: {
			eleventyNavigation: {
				key: "Feed",
				order: 4
			}
		},
		collection: {
			name: "posts",
			limit: 10,
		},
		metadata: {
			language: "en",
			title: "Blog Title",
			subtitle: "This is a longer description about your blog.",
			base: "https://turbolego.github.io/eleventy-base-blog-with-decap-cms/", // Updated base URL
			author: {
				name: "Your Name"
			}
		}
	});

	// Image optimization: https://www.11ty.dev/docs/plugins/image/#eleventy-transform
	eleventyConfig.addPlugin(eleventyImageTransformPlugin, {
		// File extensions to process in _site folder
		extensions: "html",

		// Output formats for each image.
		formats: ["avif", "webp", "auto"],

		// widths: ["auto"],

		defaultAttributes: {
			// e.g. <img loading decoding> assigned on the HTML tag will override these values.
			loading: "lazy",
			decoding: "async",
		},
		urlPath: process.env.GITHUB_ACTIONS 
			? "/eleventy-base-blog-with-decap-cms/img/uploads/"
			: "/img/uploads/",
		outputDir: "_site/img/uploads/",
		directories: {
			source: "public/img/uploads",
			output: "_site/img/uploads"
		}
	});

	// Filters
	eleventyConfig.addPlugin(pluginFilters);

	eleventyConfig.addPlugin(IdAttributePlugin);

	// Fix image paths in markdown content
	eleventyConfig.addFilter("fixImagePath", (content) => {
		if (typeof content !== 'string') return content;
		
		return content.replace(
			/!\[([^\]]*)\]\(\/img\/uploads\/([^)]+)\)/g,
			(match, alt, imagePath) => {
				const prefix = process.env.GITHUB_ACTIONS ? "/eleventy-base-blog-with-decap-cms" : "";
				return `![${alt}](${prefix}/img/uploads/${imagePath})`; // Fixed markdown syntax
			}
		);
	});

	eleventyConfig.addShortcode("currentBuildDate", () => {
		return (new Date()).toISOString();
	});

	// Features to make your build faster (when you need them)

	// If your passthrough copy gets heavy and cumbersome, add this line
	// to emulate the file copy on the dev server. Learn more:
	// https://www.11ty.dev/docs/copy/#emulate-passthrough-copy-during-serve

	// eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

	// Optional: Add admin folder to watch targets
	eleventyConfig.addWatchTarget("admin/**/*");
	
	// Add comprehensive URL prefix filter
	eleventyConfig.addFilter("prependSitePrefix", (url) => {
	if (!url) return url;
	const prefix = process.env.GITHUB_ACTIONS ? "/eleventy-base-blog-with-decap-cms" : "";
	
	// Ensure URLs that start with / get the prefix
	if (url.startsWith('/')) {
		return `${prefix}${url}`;
	}
	return url;
    });
};

export const config = {
	pathPrefix: process.env.GITHUB_ACTIONS ? "/eleventy-base-blog-with-decap-cms/" : "/",
	// Control which files Eleventy will process
	// e.g.: *.md, *.njk, *.html, *.liquid
	templateFormats: [
		"md",
		"njk",
		"html",
		"liquid",
		"11ty.js",
	],

	// Pre-process *.md files with: (default: `liquid`)
	markdownTemplateEngine: "njk",

	// Pre-process *.html files with: (default: `liquid`)
	htmlTemplateEngine: "njk",

	// These are all optional:
	dir: {
		input: "content",          // default: "."
		includes: "../_includes",  // default: "_includes" (`input` relative)
		data: "../_data",          // default: "_data" (`input` relative)
		output: "_site"
	},

	// -----------------------------------------------------------------
	// Optional items:
	// -----------------------------------------------------------------

	// If your site deploys to a subdirectory, change `pathPrefix`.
	// Read more: https://www.11ty.dev/docs/config/#deploy-to-a-subdirectory-with-a-path-prefix

	// When paired with the HTML <base> plugin https://www.11ty.dev/docs/plugins/html-base/
	// it will transform any absolute URLs in your HTML to include this
	// folder name and does **not** affect where things go in the output folder.

	// pathPrefix: "/",
};
