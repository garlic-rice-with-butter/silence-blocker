# What is this?

This is a browser-side content moderation tool for social media sites.

It's primary purpose is to improve your social media experience by:
- Maintaining a blocklist across social media sitse
  and
- Filtering unwanted content from the client side

At the moment, it only does filtering by sentiment analysis. It is a work in progress.

# Compiling

This section is for modifying the extension or building it yourself.

## Requirements
To get this to work, you'll need `node` installed.
Then you'll need to get the packages `webpack` and `os-browserify`.

## Building
Running `npx webpack` in the main project directory should output the packed javascript files into `dist\src\`.
You'll need to zip the `dist\` subdirectory and that should be your extension.

# Using the Extension

You should be able to install the extension locally from Firefox or Chrome browsers.
