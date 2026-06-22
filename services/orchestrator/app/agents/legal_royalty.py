from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal, ROUND_HALF_UP

from schemas import (
    CopyrightChecklistFinding,
    CopyrightEligibilityAnalysis,
    LegalRoyaltyRequest,
    LegalRoyaltyResponse,
    NormalizedSplitLineItem,
    ParticipantRecoupmentPayout,
    RecoupmentModel,
    SplitSheetAnalysis,
    SplitSheetValidationIssue
)

AGENT_BLUEPRINT = {
    "id": "legal-royalty",
    "name": "Legal & Royalty Administration Agent",
    "workflow_style": "langgraph state machine",
    "status": "implemented",
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

PERCENT_QUANTUM = Decimal("0.00001")
CURRENCY_QUANTUM = Decimal("0.01")


def _quantize_percent(value: Decimal) -> Decimal:
    return value.quantize(PERCENT_QUANTUM, rounding=ROUND_HALF_UP)


def _quantize_currency(value: Decimal) -> Decimal:
    return value.quantize(CURRENCY_QUANTUM, rounding=ROUND_HALF_UP)


def _normalize_party_name(name: str) -> str:
    return " ".join(name.strip().lower().split())


def _allocate_by_weight(
    total_amount: Decimal,
    weights: list[tuple[int, Decimal]]
) -> dict[int, Decimal]:
    if not weights:
        return {}

    total_weight = sum((weight for _, weight in weights), start=Decimal("0"))
    if total_weight <= 0:
        return {key: Decimal("0.00") for key, _ in weights}

    allocations: dict[int, Decimal] = {}
    running_total = Decimal("0.00")

    for index, (key, weight) in enumerate(weights):
        if index == len(weights) - 1:
            amount = _quantize_currency(total_amount - running_total)
        else:
            amount = _quantize_currency(total_amount * (weight / total_weight))
            running_total += amount

        allocations[key] = amount

    return allocations


def _analyze_split_sheet(payload: LegalRoyaltyRequest) -> SplitSheetAnalysis:
    issues: list[SplitSheetValidationIssue] = []
    duplicate_parties: list[str] = []
    seen_names: dict[str, str] = {}
    total_declared_percent = sum(
        (line.ownership_percent for line in payload.split_sheet),
        start=Decimal("0")
    )

    for line in payload.split_sheet:
        normalized_name = _normalize_party_name(line.party_name)
        if normalized_name in seen_names and seen_names[normalized_name] not in duplicate_parties:
            duplicate_parties.append(seen_names[normalized_name])
        else:
            seen_names[normalized_name] = line.party_name

    if not payload.split_sheet:
        issues.append(
            SplitSheetValidationIssue(
                severity="error",
                message="At least one split sheet line item is required."
            )
        )

    if total_declared_percent != Decimal("100"):
        issues.append(
            SplitSheetValidationIssue(
                severity="warning",
                message=(
                    "Declared ownership percentages do not total 100 percent. "
                    "The workflow normalized shares deterministically for modeling."
                )
            )
        )

    if duplicate_parties:
        issues.append(
            SplitSheetValidationIssue(
                severity="warning",
                message=(
                    "Duplicate party names were detected and should be reviewed by a human operator: "
                    + ", ".join(duplicate_parties)
                )
            )
        )

    recoupable_party_count = sum(1 for line in payload.split_sheet if line.recoupable)
    if recoupable_party_count == 0 and (
        payload.advance_amount > 0 or payload.prior_unrecouped_balance > 0
    ):
        issues.append(
            SplitSheetValidationIssue(
                severity="warning",
                message=(
                    "No recoupable parties were marked even though an advance or prior unrecouped "
                    "balance exists. Recoupment withholding will resolve to zero."
                )
            )
        )

    normalized_denominator = total_declared_percent if total_declared_percent > 0 else Decimal("100")
    normalized_split_sheet = [
        NormalizedSplitLineItem(
            party_name=line.party_name,
            role=line.role,
            declared_ownership_percent=_quantize_percent(line.ownership_percent),
            normalized_ownership_percent=_quantize_percent(
                (line.ownership_percent / normalized_denominator) * Decimal("100")
            ),
            recoupable=line.recoupable,
            contact_email=line.contact_email
        )
        for line in payload.split_sheet
    ]

    return SplitSheetAnalysis(
        total_declared_percent=_quantize_percent(total_declared_percent),
        normalized_split_sheet=normalized_split_sheet,
        duplicate_parties=duplicate_parties,
        validation_issues=issues,
        requires_human_review=len(issues) > 0,
        recoupable_party_count=recoupable_party_count
    )


def _build_recoupment_model(
    payload: LegalRoyaltyRequest,
    split_sheet_analysis: SplitSheetAnalysis
) -> RecoupmentModel:
    gross_revenue = payload.gross_revenue
    distribution_fee_amount = _quantize_currency(gross_revenue * payload.distribution_fee_rate)
    net_receipts = _quantize_currency(gross_revenue - distribution_fee_amount)
    royalty_pool_amount = _quantize_currency(net_receipts * payload.royalty_pool_rate)
    total_recoupable_balance = _quantize_currency(
        payload.advance_amount + payload.prior_unrecouped_balance
    )

    recoupment_capacity = _quantize_currency(royalty_pool_amount * payload.recoupment_rate)
    recoupment_withheld = min(total_recoupable_balance, recoupment_capacity)

    pre_recoupment_allocations = _allocate_by_weight(
        royalty_pool_amount,
        [
            (index, line.normalized_ownership_percent)
            for index, line in enumerate(split_sheet_analysis.normalized_split_sheet)
        ]
    )
    recoupment_allocations = _allocate_by_weight(
        _quantize_currency(recoupment_withheld),
        [
            (index, line.normalized_ownership_percent)
            for index, line in enumerate(split_sheet_analysis.normalized_split_sheet)
            if line.recoupable
        ]
    )

    participant_payouts: list[ParticipantRecoupmentPayout] = []
    for index, line in enumerate(split_sheet_analysis.normalized_split_sheet):
        pre_recoupment_amount = pre_recoupment_allocations.get(index, Decimal("0.00"))
        withheld_amount = recoupment_allocations.get(index, Decimal("0.00"))

        payout_amount = _quantize_currency(pre_recoupment_amount - withheld_amount)
        participant_payouts.append(
            ParticipantRecoupmentPayout(
                party_name=line.party_name,
                role=line.role,
                ownership_percent=line.normalized_ownership_percent,
                pre_recoupment_amount=pre_recoupment_amount,
                recoupment_withheld_amount=withheld_amount,
                payout_amount=payout_amount,
                recoupable=line.recoupable
            )
        )

    total_distributable_amount = _quantize_currency(
        sum((line.payout_amount for line in participant_payouts), start=Decimal("0"))
    )
    remaining_unrecouped_balance = _quantize_currency(total_recoupable_balance - recoupment_withheld)

    return RecoupmentModel(
        gross_revenue=_quantize_currency(gross_revenue),
        distribution_fee_amount=distribution_fee_amount,
        net_receipts=net_receipts,
        royalty_pool_amount=royalty_pool_amount,
        total_recoupable_balance=total_recoupable_balance,
        recoupment_withheld=_quantize_currency(recoupment_withheld),
        remaining_unrecouped_balance=remaining_unrecouped_balance,
        total_distributable_amount=total_distributable_amount,
        participant_payouts=participant_payouts
    )


def _analyze_copyright_eligibility(
    payload: LegalRoyaltyRequest
) -> CopyrightEligibilityAnalysis:
    checklist = payload.copyright_checklist
    findings: list[CopyrightChecklistFinding] = []
    filing_guidance: list[str] = []
    ai_disclosure_required = (
        checklist.ai_generated_lyrics
        or checklist.ai_generated_melody
        or checklist.ai_generated_master_audio
        or checklist.ai_generated_artwork
    )
    requires_human_review = False
    eligibility_status = "eligible"

    findings.append(
        CopyrightChecklistFinding(
            criterion="source_material_rights_cleared",
            passed=checklist.source_material_rights_cleared,
            severity="error" if not checklist.source_material_rights_cleared else "info",
            message=(
                "Underlying source material rights are documented."
                if checklist.source_material_rights_cleared
                else "Underlying source material rights are not cleared."
            )
        )
    )
    findings.append(
        CopyrightChecklistFinding(
            criterion="contributor_agreements_collected",
            passed=checklist.contributor_agreements_collected,
            severity="warning" if not checklist.contributor_agreements_collected else "info",
            message=(
                "Contributor agreements are collected."
                if checklist.contributor_agreements_collected
                else "Contributor agreements are missing or incomplete."
            )
        )
    )
    findings.append(
        CopyrightChecklistFinding(
            criterion="splits_confirmed_by_all_parties",
            passed=checklist.splits_confirmed_by_all_parties,
            severity="warning" if not checklist.splits_confirmed_by_all_parties else "info",
            message=(
                "All parties have confirmed the declared splits."
                if checklist.splits_confirmed_by_all_parties
                else "Split confirmations from all parties are still outstanding."
            )
        )
    )

    human_authorship_present = (
        checklist.has_human_written_lyrics
        or checklist.has_human_composed_melody
        or checklist.has_human_arranged_structure
    )
    findings.append(
        CopyrightChecklistFinding(
            criterion="human_authorship_present",
            passed=human_authorship_present,
            severity="error" if not human_authorship_present else "info",
            message=(
                "Human authorship is documented in the composition or arrangement."
                if human_authorship_present
                else "No qualifying human authorship is currently documented."
            )
        )
    )

    if ai_disclosure_required:
        findings.append(
            CopyrightChecklistFinding(
                criterion="ai_material_disclosure",
                passed=checklist.human_edited_ai_material or human_authorship_present,
                severity="warning",
                message=(
                    "AI-assisted material was detected; filing should disclose the human-authored "
                    "elements and any AI-assisted portions."
                )
            )
        )
        filing_guidance.append(
            "Document which expressive elements were authored by humans versus generated or expanded by AI."
        )

    if not checklist.source_material_rights_cleared:
        eligibility_status = "ineligible-pending-clearance"
        requires_human_review = True
        filing_guidance.append(
            "Do not file until source material or sample-chain clearance is documented."
        )
    elif ai_disclosure_required:
        eligibility_status = "eligible-with-limitations"
        requires_human_review = True
        filing_guidance.append(
            "Prepare a human-authorship memo before filing and exclude purely machine-generated expression from the claim."
        )

    if not checklist.contributor_agreements_collected or not checklist.splits_confirmed_by_all_parties:
        requires_human_review = True
        if eligibility_status == "eligible":
            eligibility_status = "human-review-required"
        filing_guidance.append(
            "Collect missing contributor approvals and countersigned split confirmations before final registration or payout release."
        )

    if not human_authorship_present:
        eligibility_status = "human-review-required"
        requires_human_review = True
        filing_guidance.append(
            "Escalate to counsel to verify whether sufficient human authorship exists for protectable registration."
        )

    if not filing_guidance:
        filing_guidance.append(
            "Proceed with ordinary registration preparation and retain split confirmations with the contract packet."
        )

    return CopyrightEligibilityAnalysis(
        eligibility_status=eligibility_status,
        requires_human_review=requires_human_review,
        ai_disclosure_required=ai_disclosure_required,
        checklist_findings=findings,
        filing_guidance=filing_guidance
    )


def run_legal_royalty_workflow(payload: LegalRoyaltyRequest) -> LegalRoyaltyResponse:
    split_sheet_analysis = _analyze_split_sheet(payload)
    recoupment_model = _build_recoupment_model(payload, split_sheet_analysis)
    copyright_eligibility = _analyze_copyright_eligibility(payload)
    requires_human_review = (
        split_sheet_analysis.requires_human_review or copyright_eligibility.requires_human_review
    )

    legal_summary = (
        f"Split sheet for {payload.artist_name} - {payload.track_title} was normalized to "
        f"{split_sheet_analysis.total_declared_percent}% declared ownership across "
        f"{len(split_sheet_analysis.normalized_split_sheet)} parties. "
        f"Recoupment modeled {_quantize_currency(recoupment_model.recoupment_withheld)} against "
        f"{_quantize_currency(recoupment_model.total_recoupable_balance)} of total recoupable balance. "
        f"Copyright status: {copyright_eligibility.eligibility_status}."
    )

    return LegalRoyaltyResponse(
        thread_id=payload.thread_id or f"legal-royalty-{int(datetime.now(timezone.utc).timestamp())}",
        artist_name=payload.artist_name,
        track_title=payload.track_title,
        contract_reference=payload.contract_reference,
        requires_human_review=requires_human_review,
        legal_summary=legal_summary,
        split_sheet_analysis=split_sheet_analysis,
        recoupment_model=recoupment_model,
        copyright_eligibility=copyright_eligibility,
        generated_at=datetime.now(timezone.utc)
    )
