package com.metroica.sgip_backend.notificaciones;

import com.metroica.sgip_backend.seguridad.SecurityUtils;
import com.metroica.sgip_backend.seguridad.Usuario;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificacionService {

    private final NotificacionRepository notificacionRepository;
    private final EmailService emailService;

    @Transactional
    public void crearNotificacion(UUID usuarioId, String titulo, String mensaje, String tipo, String emailDestino) {
        Notificacion notificacion = new Notificacion();
        Usuario usuario = new Usuario();
        usuario.setId(usuarioId);
        notificacion.setUsuario(usuario);
        notificacion.setTitulo(titulo);
        notificacion.setMensaje(mensaje);
        notificacion.setTipo(tipo);
        notificacionRepository.save(notificacion);

        emailService.enviarCorreo(emailDestino, titulo, mensaje);
    }

    @Transactional(readOnly = true)
    public List<NotificacionResponseDTO> listarPorUsuario(UUID usuarioId) {
        return notificacionRepository.findByUsuarioIdOrderByCreatedAtDesc(usuarioId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Transactional
    public NotificacionResponseDTO marcarLeida(UUID notificacionId, UUID usuarioId) {
        Notificacion notif = notificacionRepository.findById(notificacionId)
                .orElseThrow(() -> new RuntimeException("Notificacion no encontrada"));

        if (!notif.getUsuario().getId().equals(usuarioId)) {
            throw new RuntimeException("No tiene permiso para modificar esta notificacion");
        }

        notif.setLeida(true);
        notificacionRepository.save(notif);
        return toDTO(notif);
    }

    @Transactional(readOnly = true)
    public long contarNoLeidas(UUID usuarioId) {
        return notificacionRepository.countByUsuarioIdAndLeidaFalse(usuarioId);
    }

    private NotificacionResponseDTO toDTO(Notificacion n) {
        return new NotificacionResponseDTO(
                n.getId(),
                n.getTitulo(),
                n.getMensaje(),
                n.getLeida(),
                n.getTipo(),
                n.getCreatedAt()
        );
    }
}