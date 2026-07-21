package com.omnia.platform.finance.application.port.out;

import com.omnia.platform.finance.domain.model.Entry;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EntryRepository {

    Entry save(Entry entry);

    Optional<Entry> findById(UUID id);

    List<Entry> findInPeriod(LocalDate from, LocalDate to);
}
