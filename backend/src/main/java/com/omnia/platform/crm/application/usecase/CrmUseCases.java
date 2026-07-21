package com.omnia.platform.crm.application.usecase;

import com.omnia.platform.crm.application.port.out.LeadRepository;
import com.omnia.platform.crm.domain.model.Lead;
import com.omnia.platform.crm.domain.model.LeadStage;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CrmUseCases {

    private final LeadRepository leads;

    public CrmUseCases(LeadRepository leads) {
        this.leads = leads;
    }

    @Transactional
    public Lead capture(String name, String contact, String source, String notes) {
        return leads.save(Lead.capture(TenantContext.require(), name, contact, source, notes));
    }

    @Transactional
    public Lead move(UUID id, LeadStage stage) {
        Lead lead = require(id);
        lead.moveTo(stage);
        return leads.save(lead);
    }

    @Transactional
    public Lead markLost(UUID id, String reason) {
        Lead lead = require(id);
        lead.markLost(reason);
        return leads.save(lead);
    }

    @Transactional(readOnly = true)
    public List<Lead> list() {
        return leads.findAllOrdered();
    }

    @Transactional(readOnly = true)
    public Lead get(UUID id) {
        return require(id);
    }

    private Lead require(UUID id) {
        return leads.findById(id).orElseThrow(() -> new NotFoundException("lead.not-found", "Lead not found"));
    }
}
