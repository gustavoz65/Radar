package com.omnia.platform.workorder.adapter.out.persistence;

import com.omnia.platform.shared.tenancy.TenantContext;
import com.omnia.platform.workorder.application.port.out.WorkOrderRepository;
import com.omnia.platform.workorder.domain.model.WorkOrder;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkOrderJpaRepository extends WorkOrderRepository, JpaRepository<WorkOrder, UUID> {

    List<WorkOrder> findByTenantIdOrderByCreatedAtDesc(UUID tenantId);

    @Override
    default List<WorkOrder> findAllOrdered() {
        return findByTenantIdOrderByCreatedAtDesc(TenantContext.require());
    }
}
