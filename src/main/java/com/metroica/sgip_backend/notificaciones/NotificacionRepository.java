package com.metroica.sgip_backend.notificaciones;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificacionRepository extends JpaRepository<Notificacion, UUID> {

    List<Notificacion> findByUsuarioIdOrderByCreatedAtDesc(UUID usuarioId);

    List<Notificacion> findByUsuarioIdAndLeidaFalseOrderByCreatedAtDesc(UUID usuarioId);

    long countByUsuarioIdAndLeidaFalse(UUID usuarioId);
}