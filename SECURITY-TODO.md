# SECURITY TODO — before making this repo public

- artifacts/dokandar-mama/dokandar-mama-release.keystore is committed
  to this repo. It is the Android app-signing keystore. Intentionally
  kept in a PRIVATE repo for the Aug 2026 defense to save time.
  BEFORE making this repo public or adding outside collaborators:
    1. Rotate/regenerate the Android signing key, OR
    2. Remove it from git history entirely (git filter-repo / BFG),
       not just delete the file in a new commit (old commits still
       have it).
  Do not skip this step.
