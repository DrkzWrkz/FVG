AGENT_BLUEPRINT = {
    "id": "legal-royalty",
    "name": "Legal & Royalty Administration Agent",
    "workflow_style": "langgraph state machine",
    "status": "planned",
    "core_logic": "Run deterministic split, recoupment, and copyright workflows with explicit human checkpoints.",
    "responsibilities": [
        "Parse split sheets and contract states.",
        "Model non-recourse recoupment and fractional royalty distribution.",
        "Evaluate copyright eligibility checklists for AI-assisted works."
    ],
    "planned_tools": [
        "split-sheet-parser",
        "recoupment-calculator",
        "copyright-checklist"
    ]
}
