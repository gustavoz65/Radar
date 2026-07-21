/**
 * Integration module: outbound webhooks. Tenants subscribe a URL to domain events; the dispatcher
 * posts an HMAC-signed JSON payload when those events fire (ADR-006 listeners). Foundation for the
 * public API / automations marketplace.
 */
package com.omnia.platform.integration;
