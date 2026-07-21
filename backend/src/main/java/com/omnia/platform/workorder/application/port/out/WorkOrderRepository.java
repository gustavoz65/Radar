package com.omnia.platform.workorder.application.port.out;

import com.omnia.platform.workorder.domain.model.WorkOrder;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WorkOrderRepository {

    WorkOrder save(WorkOrder workOrder);

    Optional<WorkOrder> findById(UUID id);

    List<WorkOrder> findAllOrdered();
}
