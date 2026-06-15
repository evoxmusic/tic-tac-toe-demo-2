# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-06-15

### Added

- **RDE — Linear integration.** Qovery RDE is now available as an agent directly
  inside Linear. Create a task, describe what you want to achieve, and delegate the
  work to an AI coding agent running within your own infrastructure — all without
  leaving the tools your team already works in (Linear, Jira, Slack, and more).

- **DNS provider selection.** Customers can now choose the DNS provider used for
  their cluster directly within Qovery. Either let Qovery manage DNS for you, or
  grant access to your own Cloudflare or Route 53 account so Qovery can generate
  domains and issue valid certificates on your behalf. Available on the Business and
  Enterprise plans, this adds flexibility and lets Qovery integrate with the setup
  you already have.

- **AI Copilot — command confirmation.** When running in read-write mode, the AI
  Copilot now asks you to confirm every write action before it is executed. This
  gives you more control and makes write operations safer.

[1.1.0]: https://github.com/qovery/tic-tac-toe-demo/releases/tag/v1.1.0
