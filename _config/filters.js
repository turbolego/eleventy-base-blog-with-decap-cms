import { DateTime } from "luxon";

export default function(eleventyConfig) {
	eleventyConfig.addFilter("readableDate", (dateObj, format, zone) => {
		// Formatting tokens for Luxon: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
		return DateTime.fromJSDate(dateObj, { zone: zone || "utc" }).toFormat(format || "dd LLLL yyyy");
	});

	eleventyConfig.addFilter("htmlDateString", (dateObj) => {
		// dateObj input: https://html.spec.whatwg.org/multipage/common-microsyntaxes.html#valid-date-string
		return DateTime.fromJSDate(dateObj, { zone: "utc" }).toFormat('yyyy-LL-dd');
	});

	// Get the first `n` elements of a collection.
	eleventyConfig.addFilter("head", (array, n) => {
		if(!Array.isArray(array) || array.length === 0) {
			return [];
		}
		if( n < 0 ) {
			return array.slice(n);
		}

		return array.slice(0, n);
	});

	// Return the smallest number argument
	eleventyConfig.addFilter("min", (...numbers) => {
		return Math.min.apply(null, numbers);
	});

	// Return the keys used in an object
	eleventyConfig.addFilter("getKeys", target => {
		return Object.keys(target);
	});

	eleventyConfig.addFilter("filterTagList", function filterTagList(tags) {
		return (tags || []).filter(tag => ["all", "posts"].indexOf(tag) === -1);
	});

	// Add this new collection to generate posts consistently
	eleventyConfig.addCollection("posts", function(collection) {
		return collection.getFilteredByGlob("./content/blog/**/*.md")
			.filter(post => {
				// Exclude draft posts during build
				return process.env.ELEVENTY_RUN_MODE !== "build" || !post.data.draft;
			})
			.sort((a, b) => {
				// Sort posts by date, most recent first
				return (b.data.date || new Date()) - (a.data.date || new Date());
			});
	});

	// Optional: Debug filter to help diagnose collection issues
	eleventyConfig.addFilter("debugPosts", function(collection) {
		console.log("Debug: Total posts found", collection.length);
		collection.forEach(post => {
			console.log(`Post: ${post.inputPath}, Date: ${post.data.date}, Title: ${post.data.title}`);
		});
		return collection;
	});

};
