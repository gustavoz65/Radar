/**
 * Catalog module: sellable services and products. Services drive scheduling (duration/price);
 * products will drive inventory (Fase 3). Distinct aggregates on purpose — different lifecycles
 * and consumers (DOMAIN.md).
 *
 * <p>Public API: {@link com.omnia.platform.catalog.ServiceCatalog} (consumed by scheduling).
 */
package com.omnia.platform.catalog;
