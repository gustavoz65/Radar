package com.omnia.platform.notification.adapter.out.email;

import com.omnia.platform.notification.EmailSender;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * SMTP adapter. In local dev it targets MailHog (localhost:1025); failures are logged, not thrown,
 * so a mail outage never blocks a business operation (notifications are best-effort here).
 */
@Component
class SmtpEmailSender implements EmailSender {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailSender.class);

    private final JavaMailSender mailSender;

    SmtpEmailSender(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Override
    public void send(String to, String subject, String body) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom("no-reply@omnia.app");
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (RuntimeException exception) {
            log.warn("Failed to send e-mail to {}: {}", to, exception.getMessage());
        }
    }
}
