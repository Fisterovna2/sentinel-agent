# 🔒 Sentinel Agent v2.0

**[Русский](README.md) | English**

A local Zero-Trust AI agent for game automation and computer vision tasks — completely safe, transparent, and under full user control.

> **Simple phrase**: It's an "intelligent bot" that plans and executes actions without making anything without your permission. Architecture leverages EDR paradigms, isolation, integrity verification and security journaling — all for safety and predictability.

## 🎯 What it can do (briefly and in human-readable terms)

- 🧠 **Intelligent Planning**
  - Uses Google Gemini via proxy for plan generation.
  - Breaks down tasks into steps, evaluates risks and corrects behavior on errors.

- 🎮 **Game Automation**
  - Mouse/keyboard control, game state detection, action scripting for scouting/quests and similar.

- 👁️ **Computer Vision** (in plans)
  - OpenCV integration for object detection on screen.

- 🎓 **Replay Log Learning** (in plans)
  - Training on user-recorded gameplay for plan optimization.

- 🌐 **Web Version** (planned)
  - Restricted web interface for remote access.

- 🤖 **Multi-Agent Coordination** (planned)
  - Multi-agent sync for complex scenarios.

## ⚙️ Why this architecture matters

- **Full user control** — the model never gets extra rights.
- **All actions are logged and auditable for review.**
- **Critical operations require live human-in-the-loop approval.**
- **The agent was designed to minimize systemic risk to the user.**

## 🔐 Disclaimer (read carefully)

Use Sentinel only on **your own computer** and in **legal contexts**:
- Do not use in games or services where bots are banned (ToS).
- Do not use for malicious actions.
- Do not distribute modified versions without attribution.
- **Full responsibility for use lies with you.**

The project has an educational and demonstration character and demonstrates approaches to secure automation.

## 🛠️ Setup & Usage

### Requirements
- Node.js 18+
- Python 3.9+ (for CV components)
- Google Gemini API key

### Installation

```bash
git clone https://github.com/Fisterovna2/sentinel-agent
cd sentinel-agent
npm install
```

### Configuration

1. Copy `.env.example` to `.env`
2. Add your Google Gemini API key
3. Configure game settings in `config/games.json`

### Running

```bash
node src/index.js
```

## 📋 Monitoring and Logs

Logs are stored in `sandbox/`:
- `audit.log` — all agent actions (immutable)
- `security.log` — security violations and warnings

View in real time:
```bash
tail -f sandbox/audit.log
```

## 🗺️ Roadmap (what's planned)

- ✅ Fully-functional React UI (navigation, analytics, rule management)
- ✅ Support for more games / platforms
- ✅ OpenCV integration for distributed and tracking
- ✅ Training on replay logs for better planning
- ✅ Web version of agent (limited)
- ✅ Multi-agent coordination (multi-agent sync)

## 📄 License

MIT License — free to use and modify with attribution.

## 👤 Author

**Fisterovna2** — student researcher, interested in AI/ML and game automation.
GitHub: [@Fisterovna2](https://github.com/Fisterovna2)

If you find bugs or want to suggest improvements — open an issue or PR.

---

The project has an educational character and demonstrates approaches to secure automation.
