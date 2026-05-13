package com.metroica.sgip_backend.alertas;

import com.metroica.sgip_backend.seguridad.SecurityUtils;
import com.metroica.sgip_backend.seguridad.Usuario;
import com.metroica.sgip_backend.shared.enums.EstadoAlerta;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AlertaStockService {

    private final AlertaStockRepository alertaStockRepository;
    private final AlertaStockMapper alertaStockMapper;

    @Transactional(readOnly = true)
    public List<AlertaStockResponseDTO> listarActivas() {
        return alertaStockRepository.findByEstado(EstadoAlerta.ACTIVA)
                .stream()
                .map(alertaStockMapper::toResponseDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public AlertaStockResponseDTO resolverAlerta(UUID id, EstadoAlerta nuevoEstado) {
        if (nuevoEstado == EstadoAlerta.ACTIVA) {
            throw new RuntimeException("Use RESUELTA o IGNORADA para cerrar una alerta");
        }

        AlertaStock alerta = alertaStockRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Alerta no encontrada: " + id));

        if (alerta.getEstado() != EstadoAlerta.ACTIVA) {
            throw new RuntimeException("Solo se pueden resolver alertas activas");
        }

        alerta.setEstado(nuevoEstado);
        alerta.setFechaResuelta(LocalDateTime.now());

        Usuario usuario = new Usuario();
        usuario.setId(SecurityUtils.getCurrentUserId());
        alerta.setResueltaPor(usuario);

        alertaStockRepository.save(alerta);
        return alertaStockMapper.toResponseDTO(alerta);
    }
}
