# Git Learning Session - HistoryMap Repository

## Objective
Learn about the project's original structure and evolution by examining git commands, even after removing all commits. This document will track our learning journey through various git commands.

---

## Current State

### Initial Commands Run

#### 1. Check Git Status
```bash
git status
```
**Purpose**: View working tree status - shows untracked files and directories  
**Result**: Shows `.git/`, `b.log`, `backend.log`, `backend/`, `frontend/` are untracked

---

## Files to Add and Track

Let's add the important files and explore their git history:

### 2. Add Main Files
```bash
# Add README and core files
git add README.md
git add b.log backend.log
git add frontend/
git add backend/
```

**Purpose**: Stage files for commit tracking  
**Result**: Files will be versioned under `.git/`

### 3. View All Added Files
```bash
git diff --cached --name-only
```
**Purpose**: List staged changes ready for commit

---

## Understanding the Project Structure

### 4. Explore Repository Layout
```bash
# Show directory tree structure
git ls-files | sort

# Or get a full file listing with find
find . -type f ! -path './.git/*' | grep -v '.log$'
```

**Purpose**: Understand what files will be tracked (excluding log files)

### 5. Check File Types and Sizes
```bash
# Get detailed file info for staging
git add README.md b.log backend.log frontend/ backend/
git ls-files -s

# Or view file sizes before commit
find . -type f ! -path './.git/*' -exec ls -lh {} \;
```

---

## Making the First Commit with Learning Notes

### 6. Create Initial Documentation Commit
```bash
# Add all important project files
git add README.md b.log backend.log frontend/ backend/

# Check what's being added
git diff --cached

# Create first commit with detailed message
git commit -m "Initial project structure - README and core files"

# Or use interactive editor for more details
git commit
```

### 7. View Commit History
```bash
# See recent commits
git log --oneline -10

# Detailed view with dates and authors
git log --pretty=fuller --graph

# Show commit messages only
git log --format='%s'

# Check commit statistics
git shortlog -sn --all
```

---

## Learning Git Commands for Project Management

### Understanding Branches

#### 8. Create Feature Branches for Learning
```bash
# Create branches to explore different aspects
git checkout -b learning-session-2026
git branch -a

# View all branches including remote
git branch --remotes origin/

# Switch between branches
git checkout main
git checkout learning-session-2026
```

### Tagging Milestones

#### 9. Create SemVer Tags
```bash
# Tag current state as v1.0.0
git tag -a v1.0.0 -m "Initial release of HistoryMap project"

# List all tags
git tag -l 'v*' --sort=-v:refname

# Push tags to remote (when ready)
git push origin --tags
```

---

## Exploring Untracked Files

### 10. Handle Log Files

The repository has `.log` files which are typically not tracked in version control:

#### Option A: Add Only Essential Files
```bash
# Add only code/config files, exclude logs
git add README.md b.log backend.log frontend/ backend/

# Commit with focused message
git commit -m "Add project structure documentation and core files"
```

#### Option B: Create `.gitignore` for Logs
```bash
# Create gitignore to automatically exclude log files
cat > .gitignore << 'EOF'
*.log
b.log
backend.log
EOF

# Add the gitignore
git add .gitignore

# Stage project files only (excluding logs in future)
git add README.md frontend/ backend/
git commit -m "Initial structure with gitignore for log files"
```

---

## Git Command Deep Dives for Learning

### Essential Commands to Master

#### 11. View File History When Available
```bash
# Once committed, view history of a specific file
git log --oneline -- README.md

# Show all changes to a file over time
git log -p README.md | head -100

# See when files were last modified
git ls-tree HEAD
```

#### 12. Git Status Options Explained
```bash
# Check status with options
git status --porcelain          # Output in machine-readable format
git status --short              # Compact format
git status --untracked-files=all   # Show all untracked files
```

---

## Next Steps - Learning Path

### Phase 2: Understanding Project Evolution
```bash
# TODO: After initial commit, explore what each branch/tag represents
# TODO: Create feature branches for different project aspects
# TODO: Practice making commits with conventional commit messages
```

### Phase 3: Collaboration Patterns
```bash
# TODO: Learn merge strategies
# TODO: Practice resolving conflicts
# TODO: Understand rebase vs merge workflows
```

---

## Quick Reference Commands

### Daily Git Workflow
```bash
# Start of workday - check status
git status

# Update submodules if any
git submodule update --init --recursive

# Staged changes review
git diff --cached

# All changes in working tree
git diff HEAD

# Create temporary branch for new feature
git checkout -b feat/new-feature
```

### End of Workday
```bash
# Review what you did today
git log --since="1 day ago" --oneline

# Ensure clean state before switching branches
git status
git diff

# Push to remote when ready
git push origin main
git push origin <feature-branch>
```

---

## Commands for Repository Cleanup/Understanding

### 13. Find and Remove Unwanted Files
```bash
# List all files including gitignore exclusions
find . -type f ! -path './.git/*'

# Check what's in directories
ls -la backend/ frontend/ data/

# Identify large files
find . -type f -size +1M -exec ls -lh {} \;
```

---

## Summary of Commands Used in This Session

### Basic Inspection
- `git status` - View working tree status
- `git log --oneline` - View commit history
- `git diff` - View differences
- `git ls-files` - List tracked files

### File Management
- `git add <files>` - Stage changes
- `git rm <file>` - Remove from tracking
- `git clean -fd` - Remove untracked files (use carefully!)

### Branching
- `git checkout -b <name>` - Create and switch to new branch
- `git branch -a` - List all branches
- `git push origin <branch>` - Push branch to remote

### Documentation
- `git commit -m "message"` - Commit with message
- `git tag -a <tag> -m "message"` - Create annotated tag
- `git log --graph` - Visual history view

---

## Notes on This Repository

**Special Considerations:**
- This repo contains `.log` files which may need special handling
- Initial state appears to be after commit cleanup (HEAD detached or empty history)
- Need to establish baseline before future work

**Questions to Answer During Learning:**
1. What was the original project scope?
2. Why were commits removed?
3. Should we preserve all files or clean up logs?
4. What is the target branch structure?

---

*Document created during git learning session on 2026-11-23*
