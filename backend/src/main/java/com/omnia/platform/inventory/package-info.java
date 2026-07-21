/**
 * Inventory module: stock balances and append-only movements. The balance is the sum of movements
 * (never edited directly). Products are referenced by weak id + name snapshot (DOMAIN.md §3).
 */
package com.omnia.platform.inventory;
