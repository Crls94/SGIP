package com.metroica.sgip_backend.notificaciones;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    public void enviarCorreo(String destino, String asunto, String cuerpo) {
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(destino);
            mail.setSubject(asunto);
            mail.setText(cuerpo);
            mailSender.send(mail);
            log.info("Correo enviado a {}", destino);
        } catch (Exception e) {
            log.warn("No se pudo enviar correo a {}: {}", destino, e.getMessage());
        }
    }
}