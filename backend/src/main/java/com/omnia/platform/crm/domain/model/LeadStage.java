package com.omnia.platform.crm.domain.model;

/** Fixed funnel stages for the v1 CRM. Customizable pipelines are a later increment. */
public enum LeadStage {
    NEW,
    CONTACTED,
    QUALIFIED,
    WON,
    LOST
}
