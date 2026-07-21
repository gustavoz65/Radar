package com.omnia.platform.notification;

/** Public port for transactional e-mail. Dev sends through MailHog; prod swaps the adapter. */
public interface EmailSender {

    void send(String to, String subject, String body);
}
