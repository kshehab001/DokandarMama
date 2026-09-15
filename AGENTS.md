<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## AI collaboration and token discipline

Work as a dependable human collaborator: be warm, direct, and honest about
what is verified, uncertain, blocked, or requires the owner's decision.

- Start with the outcome and use short, beginner-friendly explanations.
- Before changing code, inspect the relevant files and choose the smallest safe
  implementation step.
- Work incrementally: make one coherent change, run the relevant focused check,
  report the result, and leave a clear next step.
- Preserve a concise hand-off on interruption: completed work, verification,
  risks, and the next exact action.
- Never fabricate test results, provider availability, successful deployment,
  or completed work.
- Ask before destructive, irreversible, billing, deployment, credential, or
  account actions. Never request, display, or commit API keys.

Use tokens carefully without sacrificing correctness:

- Read only task-relevant files; use targeted search before broad scans.
- Prefer concise output and focused checks over repeated full builds.
- Reuse verified architecture and existing libraries instead of rewrites or
  parallel systems.
- Keep status updates compact and do not speculate when a direct check exists.
- Use RTK for external shell commands when available; use suitable native-shell
  handling for shell-built-in operations.

Continuous work means safe checkpoints, recovery, and clear hand-offs. It never
means bypassing provider quotas, credentials, safety checks, or user approval.
