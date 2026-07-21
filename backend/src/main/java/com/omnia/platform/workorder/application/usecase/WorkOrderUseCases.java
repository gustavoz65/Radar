package com.omnia.platform.workorder.application.usecase;

import com.omnia.platform.customer.Customers;
import com.omnia.platform.shared.domain.NotFoundException;
import com.omnia.platform.shared.tenancy.TenantContext;
import com.omnia.platform.workorder.application.port.out.WorkOrderRepository;
import com.omnia.platform.workorder.domain.model.WorkOrder;
import com.omnia.platform.workorder.domain.model.WorkOrderStatus;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkOrderUseCases {

    private final WorkOrderRepository workOrders;
    private final Customers customers;

    public WorkOrderUseCases(WorkOrderRepository workOrders, Customers customers) {
        this.workOrders = workOrders;
        this.customers = customers;
    }

    @Transactional
    public WorkOrder open(UUID customerId, String title, String description) {
        var customer = customers
                .findById(customerId)
                .orElseThrow(() -> new NotFoundException("customer.not-found", "Customer not found"));
        return workOrders.save(
                WorkOrder.open(TenantContext.require(), customer.id(), customer.name(), title, description));
    }

    @Transactional
    public WorkOrder addItem(UUID id, String description, int quantity, BigDecimal unitPrice) {
        WorkOrder order = require(id);
        order.addItem(description, quantity, unitPrice);
        return workOrders.save(order);
    }

    @Transactional
    public WorkOrder transition(UUID id, WorkOrderStatus status) {
        WorkOrder order = require(id);
        order.transitionTo(status);
        return workOrders.save(order);
    }

    @Transactional(readOnly = true)
    public WorkOrder get(UUID id) {
        return require(id);
    }

    @Transactional(readOnly = true)
    public List<WorkOrder> list() {
        return workOrders.findAllOrdered();
    }

    private WorkOrder require(UUID id) {
        return workOrders
                .findById(id)
                .orElseThrow(() -> new NotFoundException("workorder.not-found", "Work order not found"));
    }
}
