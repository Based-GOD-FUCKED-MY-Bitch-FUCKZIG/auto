# Slack Plugin

Post your release notes to a slack channel

## Installation

This plugin is not included with the `auto` CLI. To install:

```sh
npm i --save-dev @auto-it/slack
# or
yarn add -D @auto-it/slack
```

## Usage

To use the plugin include it in your `.autorc`

```json
{
  "plugins": [
    ["slack", { "url": "https://url-to-your-slack-hook.com" }],
    // or
    ["slack", "https://url-to-your-slack-hook.com"],
    // or
    [
      "slack",
      { "url": "https://url-to-your-slack-hook.com", "atTarget": "here" }
    ]
  ]
}
```

This URL should be to you webhook. If you require a token to post to a slack hook, make sure you have a SLACK_TOKEN variable available on your environment. This token will be added to eh URL as a query string parameter.
